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
  `);
}

export const db = getDb();
