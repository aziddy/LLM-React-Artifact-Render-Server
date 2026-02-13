import { db } from "./db";

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children?: Tag[];
  artifact_count?: number;
}

export interface CreateTagInput {
  name: string;
  color?: string | null;
  parent_id?: number | null;
  sort_order?: number;
}

export interface UpdateTagInput {
  name?: string;
  color?: string | null;
  parent_id?: number | null;
  sort_order?: number;
}

export interface FlatTag {
  id: number;
  name: string;
  color: string | null;
  depth: number;
}

// --- CRUD ---

export function createTag(input: CreateTagInput): Tag {
  const stmt = db.prepare(`
    INSERT INTO tags (name, color, parent_id, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.name,
    input.color ?? null,
    input.parent_id ?? null,
    input.sort_order ?? 0
  );
  return getTagById(result.lastInsertRowid as number)!;
}

export function getTagById(id: number): Tag | undefined {
  const stmt = db.prepare("SELECT * FROM tags WHERE id = ?");
  return stmt.get(id) as Tag | undefined;
}

export function getAllTags(): Tag[] {
  const stmt = db.prepare(
    "SELECT * FROM tags ORDER BY sort_order ASC, name ASC"
  );
  return stmt.all() as Tag[];
}

export function updateTag(id: number, input: UpdateTagInput): Tag | undefined {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    fields.push("name = ?");
    params.push(input.name);
  }
  if (input.color !== undefined) {
    fields.push("color = ?");
    params.push(input.color);
  }
  if (input.parent_id !== undefined) {
    fields.push("parent_id = ?");
    params.push(input.parent_id);
  }
  if (input.sort_order !== undefined) {
    fields.push("sort_order = ?");
    params.push(input.sort_order);
  }

  if (fields.length === 0) return getTagById(id);

  fields.push("updated_at = datetime('now')");
  params.push(id);

  const stmt = db.prepare(
    `UPDATE tags SET ${fields.join(", ")} WHERE id = ?`
  );
  stmt.run(...params);
  return getTagById(id);
}

export function deleteTag(id: number): boolean {
  const stmt = db.prepare("DELETE FROM tags WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// --- Tree building ---

export function buildTagTree(flatTags: Tag[]): Tag[] {
  const map = new Map<number, Tag>();
  const roots: Tag[] = [];

  for (const tag of flatTags) {
    map.set(tag.id, { ...tag, children: [] });
  }

  for (const tag of map.values()) {
    if (tag.parent_id && map.has(tag.parent_id)) {
      map.get(tag.parent_id)!.children!.push(tag);
    } else {
      roots.push(tag);
    }
  }

  return roots;
}

export function getTagTree(): Tag[] {
  return buildTagTree(getAllTags());
}

export function getTagTreeWithCounts(): Tag[] {
  const stmt = db.prepare(`
    SELECT t.*, COALESCE(c.cnt, 0) as artifact_count
    FROM tags t
    LEFT JOIN (
      SELECT tag_id, COUNT(*) as cnt FROM artifact_tags GROUP BY tag_id
    ) c ON t.id = c.tag_id
    ORDER BY t.sort_order ASC, t.name ASC
  `);
  const tags = stmt.all() as Tag[];
  return buildTagTree(tags);
}

// --- Artifact-tag associations ---

export function getTagsForArtifact(artifactId: number): Tag[] {
  const stmt = db.prepare(`
    SELECT t.* FROM tags t
    INNER JOIN artifact_tags at ON t.id = at.tag_id
    WHERE at.artifact_id = ?
    ORDER BY t.sort_order ASC, t.name ASC
  `);
  return stmt.all(artifactId) as Tag[];
}

export function setArtifactTags(artifactId: number, tagIds: number[]): void {
  const txn = db.transaction(() => {
    db.prepare("DELETE FROM artifact_tags WHERE artifact_id = ?").run(
      artifactId
    );
    const insert = db.prepare(
      "INSERT INTO artifact_tags (artifact_id, tag_id) VALUES (?, ?)"
    );
    for (const tagId of tagIds) {
      insert.run(artifactId, tagId);
    }
  });
  txn();
}

export function addTagToArtifact(artifactId: number, tagId: number): void {
  db.prepare(
    "INSERT OR IGNORE INTO artifact_tags (artifact_id, tag_id) VALUES (?, ?)"
  ).run(artifactId, tagId);
}

export function removeTagFromArtifact(
  artifactId: number,
  tagId: number
): boolean {
  const result = db
    .prepare("DELETE FROM artifact_tags WHERE artifact_id = ? AND tag_id = ?")
    .run(artifactId, tagId);
  return result.changes > 0;
}

// --- Helpers ---

export function flattenTags(tags: Tag[], depth = 0): FlatTag[] {
  const result: FlatTag[] = [];
  for (const tag of tags) {
    result.push({ id: tag.id, name: tag.name, color: tag.color, depth });
    if (tag.children?.length) {
      result.push(...flattenTags(tag.children, depth + 1));
    }
  }
  return result;
}

export function collectDescendantIds(tagId: number, allTags: Tag[]): Set<number> {
  const ids = new Set<number>();
  function walk(id: number) {
    ids.add(id);
    for (const t of allTags) {
      if (t.parent_id === id && !ids.has(t.id)) {
        walk(t.id);
      }
    }
  }
  walk(tagId);
  return ids;
}
