# @moyarich/moyaforge-search-sqlite

Independent SQLite-backed search primitives for documentation playgrounds.

No dependency on `@moyarich/moyaforge`, `@moyarich/moyaforge-mdx`, or `@moyarich/console`. Applications own source discovery, MDX extraction, Vite HMR, asset serving, Web Workers, and search UI.

```ts
import initSqlJs from "sql.js";
import {
  buildSearchDatabase,
  querySearchDatabase,
} from "@moyarich/moyaforge-search-sqlite";

const SQL = await initSqlJs();
const bytes = buildSearchDatabase(SQL, [
  {
    key: "/guide",
    title: "Guide",
    description: "Overview",
    body: "Hello SQLite",
  },
]);
const db = new SQL.Database(bytes);
try {
  console.log(querySearchDatabase(db, "sqlite")); // ["/guide"]
} finally {
  db.close();
}
```

The API preserves Console's prefix matching and fuzzy-title semantics. The database is generated in memory; the consuming build integration decides where or whether to emit it.

## Optional Vite integration

The standalone `@moyarich/moyaforge-search-sqlite/vite` entry point handles
registry-driven SQLite indexing, development middleware, file watching, and
production asset emission. It does not import any other moyaForge package.

```js
import { sqliteSearchPlugin } from "@moyarich/moyaforge-search-sqlite/vite";
import registry from "./registry.config";

// In vite.config.js:
sqliteSearchPlugin({ registry, root: import.meta.dirname });
```

The Vite virtual module `virtual:moyaforge-search/database` exports
`databaseUrl`, which resolves to the development endpoint or a hashed
production asset with Vite's base path applied. Search UIs may subscribe to
the `moyaforge-search:updated` custom HMR event and reload their databases.
Vite is an optional peer dependency and is not required to use core indexing
or querying functions.
