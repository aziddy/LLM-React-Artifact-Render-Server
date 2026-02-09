import { db } from "./db";
import { nanoid } from "nanoid";

export interface Artifact {
  id: number;
  slug: string;
  title: string;
  description: string;
  code: string;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

export type ArtifactListItem = Omit<Artifact, "code">;

export interface CreateArtifactInput {
  title: string;
  description?: string;
  code: string;
  visibility: "public" | "private";
}

export function createArtifact(input: CreateArtifactInput): Artifact {
  const slug = nanoid(10);
  const stmt = db.prepare(`
    INSERT INTO artifacts (slug, title, description, code, visibility)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    slug,
    input.title,
    input.description || "",
    input.code,
    input.visibility
  );
  return getArtifactById(result.lastInsertRowid as number)!;
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
    "SELECT id, slug, title, description, visibility, created_at, updated_at FROM artifacts";
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
  input: Partial<CreateArtifactInput>
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
