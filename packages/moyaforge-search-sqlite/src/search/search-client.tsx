import { querySearchDatabase } from "../database.js";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { databaseUrl } from "virtual:moyaforge-search/database";

let SQL: SqlJsStatic | undefined;
let database: Database | undefined;
let pending: Promise<Database> | undefined;
async function openDatabase() {
  if (!SQL) SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const response = await fetch(databaseUrl, { cache: "no-store" });
  if (!response.ok)
    throw new Error(`Unable to load search index (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const next = new SQL.Database(bytes);
  database?.close();
  database = next;
  return next;
}

/** Query the Vite-generated SQLite database, lazily loading SQL.js on demand. */
export async function searchPages(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  const activeDatabase =
    database ??
    (await (pending ??= openDatabase().finally(() => {
      pending = undefined;
    })));
  return querySearchDatabase(activeDatabase, query);
}

/** Discard the cached browser database after any pending initial load completes. */
export async function reloadSearch() {
  // A pending fetch can install a database after the initial close.
  // Wait for it before discarding the cache so the next query loads fresh data.
  if (pending) {
    try {
      await pending;
    } catch {
      // A failed initial load still needs to clear any cached database.
    }
  }
  database?.close();
  database = undefined;
}

if (import.meta.hot) {
  import.meta.hot.on("moyaforge-search:updated", () => {
    void reloadSearch().then(() =>
      window.dispatchEvent(new Event("moyaforge-search:updated")),
    );
  });
}
