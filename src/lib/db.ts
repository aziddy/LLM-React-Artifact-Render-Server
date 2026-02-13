import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const globalForDb = globalThis as unknown as {
  db: Database.Database | undefined;
};

function getDb(): Database.Database {
  if (!globalForDb.db) {
    const dbPath = path.join(process.cwd(), "data", "artifacts.db");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    initializeSchema(db);
    globalForDb.db = db;
  }
  return globalForDb.db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      code TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('public', 'private')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_artifacts_slug ON artifacts(slug);
    CREATE INDEX IF NOT EXISTS idx_artifacts_visibility ON artifacts(visibility);
    CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at DESC);

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT,
      parent_id INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES tags(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_tags_parent_id ON tags(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tags_sort_order ON tags(sort_order);

    CREATE TABLE IF NOT EXISTS artifact_tags (
      artifact_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (artifact_id, tag_id),
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_artifact_tags_tag_id ON artifact_tags(tag_id);
  `);
}

export const db = getDb();
