import { db } from "./db";
import { nanoid } from "nanoid";
import { Tag, getTagsForArtifact, setArtifactTags } from "./tags";

export interface Artifact {
  id: number;
  slug: string;
  title: string;
  description: string;
  code: string;
  visibility: "public" | "private";
  live_version: number;
  created_at: string;
  updated_at: string;
}

export type ArtifactListItem = Omit<Artifact, "code"> & {
  version_count: number;
};

export type ArtifactListItemWithTags = ArtifactListItem & { tags: Tag[] };

export interface CreateArtifactInput {
  title: string;
  description?: string;
  code: string;
  visibility: "public" | "private";
  tagIds?: number[];
}

export function createArtifact(input: CreateArtifactInput): Artifact {
  const slug = nanoid(10);
  const desc = input.description || "";
  const stmt = db.prepare(`
    INSERT INTO artifacts (slug, title, description, code, visibility, live_version)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  const result = stmt.run(
    slug,
    input.title,
    desc,
    input.code,
    input.visibility
  );
  const id = result.lastInsertRowid as number;

  // Create v1 and set it as live
  db.prepare(
    `INSERT INTO artifact_versions (artifact_id, version_number, title, description, code)
     VALUES (?, 1, ?, ?, ?)`
  ).run(id, input.title, desc, input.code);

  if (input.tagIds?.length) {
    setArtifactTags(id, input.tagIds);
  }
  return getArtifactById(id)!;
}

export function getArtifactBySlug(slug: string): Artifact | undefined {
  const stmt = db.prepare("SELECT * FROM artifacts WHERE slug = ?");
  return stmt.get(slug) as Artifact | undefined;
}

export function getArtifactById(id: number): Artifact | undefined {
  const stmt = db.prepare("SELECT * FROM artifacts WHERE id = ?");
  return stmt.get(id) as Artifact | undefined;
}

export function listArtifacts(opts: {
  includePrivate: boolean;
  search?: string;
}): ArtifactListItem[] {
  let query =
    "SELECT id, slug, title, description, visibility, live_version, created_at, updated_at, (SELECT COUNT(*) FROM artifact_versions WHERE artifact_id = artifacts.id) as version_count FROM artifacts";
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (!opts.includePrivate) {
    conditions.push("visibility = 'public'");
  }

  if (opts.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    const term = `%${opts.search}%`;
    params.push(term, term);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY created_at DESC";

  const stmt = db.prepare(query);
  return stmt.all(...params) as ArtifactListItem[];
}

export function updateArtifact(
  id: number,
  input: Partial<CreateArtifactInput> & { tagIds?: number[] }
): Artifact | undefined {
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
  if (input.visibility !== undefined) {
    fields.push("visibility = ?");
    params.push(input.visibility);
  }

  if (input.tagIds !== undefined) {
    setArtifactTags(id, input.tagIds);
  }

  if (fields.length === 0) return getArtifactById(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const stmt = db.prepare(
    `UPDATE artifacts SET ${fields.join(", ")} WHERE id = ?`
  );
  stmt.run(...params);
  return getArtifactById(id);
}

export function deleteArtifact(id: number): boolean {
  const stmt = db.prepare("DELETE FROM artifacts WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export function listArtifactsWithTags(opts: {
  includePrivate: boolean;
  search?: string;
  tagId?: number;
}): ArtifactListItemWithTags[] {
  let query =
    "SELECT a.id, a.slug, a.title, a.description, a.visibility, a.live_version, a.created_at, a.updated_at, (SELECT COUNT(*) FROM artifact_versions WHERE artifact_id = a.id) as version_count FROM artifacts a";
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.tagId) {
    query += " INNER JOIN artifact_tags at ON a.id = at.artifact_id";
    conditions.push("at.tag_id = ?");
    params.push(opts.tagId);
  }

  if (!opts.includePrivate) {
    conditions.push("a.visibility = 'public'");
  }

  if (opts.search) {
    conditions.push("(a.title LIKE ? OR a.description LIKE ?)");
    const term = `%${opts.search}%`;
    params.push(term, term);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY a.created_at DESC";

  const artifacts = db.prepare(query).all(...params) as ArtifactListItem[];

  if (artifacts.length === 0) return [];

  // Batch-load tags for all artifacts in one query
  const ids = artifacts.map((a) => a.id);
  const placeholders = ids.map(() => "?").join(",");
  const tagRows = db
    .prepare(
      `SELECT at.artifact_id, t.* FROM artifact_tags at
       INNER JOIN tags t ON at.tag_id = t.id
       WHERE at.artifact_id IN (${placeholders})
       ORDER BY t.sort_order ASC, t.name ASC`
    )
    .all(...ids) as (Tag & { artifact_id: number })[];

  const tagMap = new Map<number, Tag[]>();
  for (const row of tagRows) {
    const { artifact_id, ...tag } = row;
    if (!tagMap.has(artifact_id)) tagMap.set(artifact_id, []);
    tagMap.get(artifact_id)!.push(tag);
  }

  return artifacts.map((a) => ({
    ...a,
    tags: tagMap.get(a.id) || [],
  }));
}
