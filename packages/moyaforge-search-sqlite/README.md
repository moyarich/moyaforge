# @moyarich/moyaforge-search-sqlite

Independent SQLite-backed search primitives for documentation playgrounds.

No dependency on `@moyarich/moyaforge`, `@moyarich/moyaforge-mdx`, or `@moyarich/console`. Applications own source discovery, MDX extraction, Vite HMR, asset serving, Web Workers, and search UI.

```ts
import initSqlJs from "sql.js";
import { buildSearchDatabase, querySearchDatabase } from "@moyarich/moyaforge-search-sqlite";

const SQL = await initSqlJs();
const bytes = buildSearchDatabase(SQL, [
  { key: "/guide", title: "Guide", description: "Overview", body: "Hello SQLite" },
]);
const db = new SQL.Database(bytes);
try {
  console.log(querySearchDatabase(db, "sqlite")); // ["/guide"]
} finally {
  db.close();
}
```

The API preserves Console's prefix matching and fuzzy-title semantics. The database is generated in memory; the consuming build integration decides where or whether to emit it.
