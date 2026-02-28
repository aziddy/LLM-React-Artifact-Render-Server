import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "artifacts.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

interface ArtifactRow {
  id: number;
  title: string;
  description: string;
  code: string;
  created_at: string;
}

const txn = db.transaction(() => {
  // 1. Find artifacts with no versions
  const missing = db
    .prepare(
      `SELECT a.id, a.title, a.description, a.code, a.created_at
       FROM artifacts a
       LEFT JOIN artifact_versions v ON v.artifact_id = a.id
       WHERE v.id IS NULL`
    )
    .all() as ArtifactRow[];

  // 2. Insert v1 for each, set live_version = 1
  const insertVersion = db.prepare(
    `INSERT INTO artifact_versions (artifact_id, version_number, title, description, code, created_at)
     VALUES (?, 1, ?, ?, ?, ?)`
  );
  const setLive = db.prepare(
    `UPDATE artifacts SET live_version = 1 WHERE id = ?`
  );

  for (const a of missing) {
    insertVersion.run(a.id, a.title, a.description, a.code, a.created_at);
    setLive.run(a.id);
  }

  // 3. Fix artifacts that have versions but live_version = 0
  const fixedLive = db
    .prepare(
      `UPDATE artifacts SET live_version = 1
       WHERE live_version = 0
         AND id IN (SELECT DISTINCT artifact_id FROM artifact_versions)`
    )
    .run();

  console.log(`Created v1 for ${missing.length} artifact(s)`);
  console.log(
    `Fixed live_version on ${fixedLive.changes} additional artifact(s)`
  );
});

txn();
db.close();
console.log("Done.");
