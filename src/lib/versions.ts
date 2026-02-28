import { db } from "./db";

export interface ArtifactVersion {
  id: number;
  artifact_id: number;
  version_number: number;
  title: string;
  description: string;
  code: string;
  created_at: string;
}

export type ArtifactVersionListItem = Omit<ArtifactVersion, "code">;

export function getVersionsForArtifact(
  artifactId: number
): ArtifactVersionListItem[] {
  const stmt = db.prepare(
    `SELECT id, artifact_id, version_number, title, description, created_at
     FROM artifact_versions WHERE artifact_id = ? ORDER BY version_number DESC`
  );
  return stmt.all(artifactId) as ArtifactVersionListItem[];
}

export function getVersion(
  artifactId: number,
  versionNumber: number
): ArtifactVersion | undefined {
  const stmt = db.prepare(
    `SELECT * FROM artifact_versions WHERE artifact_id = ? AND version_number = ?`
  );
  return stmt.get(artifactId, versionNumber) as ArtifactVersion | undefined;
}

export function getVersionById(id: number): ArtifactVersion | undefined {
  const stmt = db.prepare("SELECT * FROM artifact_versions WHERE id = ?");
  return stmt.get(id) as ArtifactVersion | undefined;
}

export function createVersion(
  artifactId: number,
  title: string,
  description: string,
  code: string
): ArtifactVersion {
  const maxRow = db
    .prepare(
      "SELECT COALESCE(MAX(version_number), 0) as max_v FROM artifact_versions WHERE artifact_id = ?"
    )
    .get(artifactId) as { max_v: number };

  const nextVersion = maxRow.max_v + 1;

  const stmt = db.prepare(
    `INSERT INTO artifact_versions (artifact_id, version_number, title, description, code)
     VALUES (?, ?, ?, ?, ?)`
  );
  const result = stmt.run(artifactId, nextVersion, title, description, code);
  return getVersionById(result.lastInsertRowid as number)!;
}

export function updateVersion(
  artifactId: number,
  versionNumber: number,
  input: { title?: string; description?: string; code?: string }
): ArtifactVersion | undefined {
  const version = getVersion(artifactId, versionNumber);
  if (!version) return undefined;

  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.title !== undefined) {
    fields.push("title = ?");
    params.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push("description = ?");
    params.push(input.description);
  }
  if (input.code !== undefined) {
    fields.push("code = ?");
    params.push(input.code);
  }

  if (fields.length === 0) return version;

  params.push(artifactId, versionNumber);

  const txn = db.transaction(() => {
    db.prepare(
      `UPDATE artifact_versions SET ${fields.join(", ")} WHERE artifact_id = ? AND version_number = ?`
    ).run(...params);

    // Auto-sync to artifacts table if this is the live version
    const artifact = db
      .prepare("SELECT live_version FROM artifacts WHERE id = ?")
      .get(artifactId) as { live_version: number } | undefined;

    if (artifact && artifact.live_version === versionNumber) {
      const updated = db
        .prepare(
          "SELECT * FROM artifact_versions WHERE artifact_id = ? AND version_number = ?"
        )
        .get(artifactId, versionNumber) as ArtifactVersion;

      db.prepare(
        `UPDATE artifacts
         SET title = ?, description = ?, code = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(updated.title, updated.description, updated.code, artifactId);
    }
  });
  txn();

  return getVersion(artifactId, versionNumber);
}

export function setLiveVersion(
  artifactId: number,
  versionNumber: number
): boolean {
  const version = getVersion(artifactId, versionNumber);
  if (!version) return false;

  const txn = db.transaction(() => {
    db.prepare(
      `UPDATE artifacts
       SET title = ?, description = ?, code = ?, live_version = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      version.title,
      version.description,
      version.code,
      versionNumber,
      artifactId
    );
  });
  txn();
  return true;
}
