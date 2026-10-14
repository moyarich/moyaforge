import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { querySearchDatabase } from "@moyarich/moyaforge-search-sqlite";
import { databaseUrl } from "virtual:moyaforge-search/database";

let SQL;
let database;
let pending;
async function openDatabase() {
  if (!SQL) SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const response = await fetch(databaseUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load search index (${response.status})`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const next = new SQL.Database(bytes);
  database?.close();
  database = next;
  return next;
}

export async function searchPages(query) {
  if (!query.trim()) return [];
  if (!database) {
    pending ??= openDatabase().finally(() => { pending = undefined; });
    await pending;
  }
  return querySearchDatabase(database, query);
}

export async function reloadSearch() {
  database?.close();
  database = undefined;
  if (pending) await pending;
}

if (import.meta.hot) {
  import.meta.hot.on("moyaforge-search:updated", () => {
    void reloadSearch().then(() => window.dispatchEvent(new Event("moyaforge-search:updated")));
  });
}
