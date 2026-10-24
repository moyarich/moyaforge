import assert from "node:assert/strict";
import { test } from "vitest";
import initSqlJs from "sql.js";
import { buildSearchDatabase, querySearchDatabase } from "../../dist/src/index.js";

test("indexes documents and ranks title matches", async () => {
  const SQL = await initSqlJs();
  const bytes = buildSearchDatabase(SQL, [
    { key: "body", title: "Other", description: "", body: "sqlite" },
    { key: "title", title: "SQLite Guide", description: "", body: "" },
  ]);
  const db = new SQL.Database(bytes);
  try {
    assert.deepEqual(querySearchDatabase(db, "sqlite"), ["title", "body"]);
    assert.deepEqual(querySearchDatabase(db, "sqlit"), ["title", "body"]);
    assert.deepEqual(querySearchDatabase(db, "sqlite missing"), []);
    assert.deepEqual(querySearchDatabase(db, ""), []);
  } finally {
    db.close();
  }
});

test("build is deterministic regardless of input ordering", async () => {
  const SQL = await initSqlJs();
  const docs = [
    { key: "z", title: "Z", description: "", body: "last" },
    { key: "a", title: "A", description: "", body: "first" },
  ];
  assert.deepEqual(
    buildSearchDatabase(SQL, docs),
    buildSearchDatabase(SQL, docs.slice().reverse()),
  );
});
