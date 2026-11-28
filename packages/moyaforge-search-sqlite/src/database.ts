import type { Database, SqlJsStatic } from "sql.js";
import { words, nearWord } from "./tokens.js";

/** Searchable text and stable identifier for a documentation page. */
export interface IndexedDocument {
  /** Unique document key returned by search queries. */
  key: string;
  /** Page title, weighted most strongly in search ranking. */
  title: string;
  /** Short page summary, weighted above body text. */
  description: string;
  /** Searchable document body text. */
  body: string;
}

/**
 * Build a SQLite search index from documentation text.
 * Indexes unique tokens per field and closes the temporary database after export.
 * @param SQL - Initialized sql.js runtime.
 * @param documents - Documents with unique keys.
 * @returns Serialized SQLite database bytes.
 * @throws If database creation or insertion fails, including duplicate keys.
 */
export function buildSearchDatabase(
  SQL: SqlJsStatic,
  documents: Iterable<IndexedDocument>,
): Uint8Array {
  const db = new SQL.Database();
  try {
    db.run("PRAGMA foreign_keys = ON");
    db.run(`CREATE TABLE documents (id INTEGER PRIMARY KEY, key TEXT UNIQUE NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, body TEXT NOT NULL);
      CREATE TABLE tokens (doc_id INTEGER NOT NULL REFERENCES documents(id), word TEXT NOT NULL, field TEXT NOT NULL, PRIMARY KEY(doc_id, word, field)) WITHOUT ROWID;
      CREATE INDEX token_prefix ON tokens(word, doc_id);
      CREATE INDEX title_tokens ON tokens(field, word, doc_id);`);
    db.run("BEGIN");
    for (const document of [...documents].sort((a, b) =>
      a.key.localeCompare(b.key),
    )) {
      db.run(
        "INSERT INTO documents (key, title, description, body) VALUES (?, ?, ?, ?)",
        [document.key, document.title, document.description, document.body],
      );
      const documentId = Number(
        db.exec("SELECT last_insert_rowid()")[0]!.values[0]![0],
      );
      for (const [field, text] of [
        ["title", document.title],
        ["description", document.description],
        ["content", document.body],
      ]) {
        for (const word of new Set(words(text!)))
          db.run("INSERT INTO tokens VALUES (?, ?, ?)", [
            documentId,
            word,
            field!,
          ]);
      }
    }
    db.run("COMMIT");
    return db.export();
  } finally {
    db.close();
  }
}

/**
 * Search an open documentation index using token prefixes and near-title matches.
 * Every query token must match. Title matches receive higher scores than
 * description or body matches; equal scores are ordered by document key.
 * @param db - Open database built by buildSearchDatabase.
 * @param query - Search text; punctuation-only or empty input returns no results.
 * @returns Matching document keys in descending relevance order.
 */
export function querySearchDatabase(db: Database, query: string): string[] {
  const terms = words(query);
  if (!terms.length) return [];
  db.create_function("near_word", (term, word) =>
    Number(nearWord(String(term), String(word))),
  );
  let scores: Map<string, number> | undefined;
  for (const term of terms) {
    const result = db.exec(
      `SELECT documents.key, MAX(CASE
        WHEN word = ? AND field = 'title' THEN 8
        WHEN field = 'title' AND word >= ? AND word < ? THEN 6
        WHEN word = ? AND field = 'description' THEN 4
        WHEN field = 'description' THEN 3
        WHEN word = ? THEN 2
        WHEN field = 'content' THEN 1
        ELSE 0 END) AS score
      FROM tokens JOIN documents ON documents.id = tokens.doc_id
      WHERE (word >= ? AND word < ?)
        OR (field = 'title' AND near_word(?, word) = 1)
      GROUP BY documents.key`,
      [term, term, `${term}\uffff`, term, term, term, `${term}\uffff`, term],
    );
    const matches = new Map(
      (result[0]?.values ?? []).map(([key, score]) => [
        String(key),
        Number(score),
      ]),
    );
    scores = scores
      ? new Map(
          [...scores].flatMap(([key, score]) =>
            matches.has(key) ? [[key, score + matches.get(key)!]] : [],
          ),
        )
      : matches;
    if (!scores.size) break;
  }
  return [...(scores ?? [])]
    .sort(([a, aScore], [b, bScore]) => bScore - aScore || a.localeCompare(b))
    .map(([key]) => key);
}
