import { prisma } from "./db";
import type { Tag as PrismaTag } from "@/generated/prisma/client";

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

function toTag(p: PrismaTag): Tag {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    parent_id: p.parentId,
    sort_order: p.sortOrder,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

// --- CRUD ---

export async function createTag(input: CreateTagInput): Promise<Tag> {
  const row = await prisma.tag.create({
    data: {
      name: input.name,
      color: input.color ?? null,
      parentId: input.parent_id ?? null,
      sortOrder: input.sort_order ?? 0,
    },
  });
  return toTag(row);
}

export async function getTagById(id: number): Promise<Tag | undefined> {
  const row = await prisma.tag.findUnique({ where: { id } });
  return row ? toTag(row) : undefined;
}

export async function getAllTags(): Promise<Tag[]> {
  const rows = await prisma.tag.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toTag);
}

export async function updateTag(
  id: number,
  input: UpdateTagInput
): Promise<Tag | undefined> {
  const data: {
    name?: string;
    color?: string | null;
    parentId?: number | null;
    sortOrder?: number;
    updatedAt?: string;
  } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.color !== undefined) data.color = input.color;
  if (input.parent_id !== undefined) data.parentId = input.parent_id;
  if (input.sort_order !== undefined) data.sortOrder = input.sort_order;

  if (Object.keys(data).length === 0) return getTagById(id);

  data.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

  const row = await prisma.tag.update({ where: { id }, data });
  return toTag(row);
}

export async function deleteTag(id: number): Promise<boolean> {
  try {
    await prisma.tag.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
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

export async function getTagTree(): Promise<Tag[]> {
  return buildTagTree(await getAllTags());
}

export async function getTagTreeWithCounts(): Promise<Tag[]> {
  const rows = await prisma.tag.findMany({
    include: {
      _count: { select: { artifactTags: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const tags: Tag[] = rows.map((r) => ({
    ...toTag(r),
    artifact_count: r._count.artifactTags,
  }));

  return buildTagTree(tags);
}

// --- Artifact-tag associations ---

export async function getTagsForArtifact(artifactId: number): Promise<Tag[]> {
  const rows = await prisma.artifactTag.findMany({
    where: { artifactId },
    include: { tag: true },
    orderBy: [{ tag: { sortOrder: "asc" } }, { tag: { name: "asc" } }],
  });
  return rows.map((r) => toTag(r.tag));
}

export async function setArtifactTags(
  artifactId: number,
  tagIds: number[]
): Promise<void> {
  await prisma.$transaction([
    prisma.artifactTag.deleteMany({ where: { artifactId } }),
    ...(tagIds.length
      ? [
          prisma.artifactTag.createMany({
            data: tagIds.map((tagId) => ({ artifactId, tagId })),
          }),
        ]
      : []),
  ]);
}

export async function addTagToArtifact(
  artifactId: number,
  tagId: number
): Promise<void> {
  await prisma.artifactTag.upsert({
    where: { artifactId_tagId: { artifactId, tagId } },
    create: { artifactId, tagId },
    update: {},
  });
}

export async function removeTagFromArtifact(
  artifactId: number,
  tagId: number
): Promise<boolean> {
  try {
    await prisma.artifactTag.delete({
      where: { artifactId_tagId: { artifactId, tagId } },
    });
    return true;
  } catch {
    return false;
  }
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

export function collectDescendantIds(
  tagId: number,
  allTags: Tag[]
): Set<number> {
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
