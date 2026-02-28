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

    CREATE TABLE IF NOT EXISTS artifact_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artifact_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      code TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(artifact_id, version_number),
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact_id ON artifact_versions(artifact_id);
    CREATE INDEX IF NOT EXISTS idx_artifact_versions_lookup ON artifact_versions(artifact_id, version_number);
  `);

  // Migration: add live_version column to artifacts (idempotent)
  try {
    db.exec(`ALTER TABLE artifacts ADD COLUMN live_version INTEGER NOT NULL DEFAULT 0`);
  } catch {
    // Column already exists
  }

  // Migration: backfill v1 for any artifact missing versions
  db.transaction(() => {
    db.prepare(
      `INSERT INTO artifact_versions (artifact_id, version_number, title, description, code, created_at)
       SELECT a.id, 1, a.title, a.description, a.code, a.created_at
       FROM artifacts a
       LEFT JOIN artifact_versions v ON v.artifact_id = a.id
       WHERE v.id IS NULL`
    ).run();

    db.prepare(
      `UPDATE artifacts SET live_version = 1
       WHERE live_version = 0
         AND id IN (SELECT DISTINCT artifact_id FROM artifact_versions)`
    ).run();
  })();
}

export const db = getDb();
