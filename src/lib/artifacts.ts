import { prisma } from "./db";
import { nanoid } from "nanoid";
import type { Tag } from "./tags";
import { setArtifactTags } from "./tags";
import type { Artifact as PrismaArtifact } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

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

function toArtifact(p: PrismaArtifact): Artifact {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? "",
    code: p.code,
    visibility: p.visibility as "public" | "private",
    live_version: p.liveVersion,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export async function createArtifact(
  input: CreateArtifactInput
): Promise<Artifact> {
  const slug = nanoid(10);
  const desc = input.description || "";

  const artifact = await prisma.$transaction(async (tx) => {
    const created = await tx.artifact.create({
      data: {
        slug,
        title: input.title,
        description: desc,
        code: input.code,
        visibility: input.visibility,
        liveVersion: 1,
        versions: {
          create: {
            versionNumber: 1,
            title: input.title,
            description: desc,
            code: input.code,
          },
        },
      },
    });

    if (input.tagIds?.length) {
      await tx.artifactTag.createMany({
        data: input.tagIds.map((tagId) => ({
          artifactId: created.id,
          tagId,
        })),
      });
    }

    return created;
  });

  return toArtifact(artifact);
}

export async function getArtifactBySlug(
  slug: string
): Promise<Artifact | undefined> {
  const row = await prisma.artifact.findUnique({ where: { slug } });
  return row ? toArtifact(row) : undefined;
}

export async function getArtifactById(
  id: number
): Promise<Artifact | undefined> {
  const row = await prisma.artifact.findUnique({ where: { id } });
  return row ? toArtifact(row) : undefined;
}

export async function listArtifacts(opts: {
  includePrivate: boolean;
  search?: string;
}): Promise<ArtifactListItem[]> {
  const where: Prisma.ArtifactWhereInput = {};

  if (!opts.includePrivate) {
    where.visibility = "public";
  }

  if (opts.search) {
    where.OR = [
      { title: { contains: opts.search } },
      { description: { contains: opts.search } },
    ];
  }

  const rows = await prisma.artifact.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      visibility: true,
      liveVersion: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { versions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    visibility: r.visibility as "public" | "private",
    live_version: r.liveVersion,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    version_count: r._count.versions,
  }));
}

export async function updateArtifact(
  id: number,
  input: Partial<CreateArtifactInput> & { tagIds?: number[] }
): Promise<Artifact | undefined> {
  const data: Prisma.ArtifactUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.code !== undefined) data.code = input.code;
  if (input.visibility !== undefined) data.visibility = input.visibility;

  if (input.tagIds !== undefined) {
    await setArtifactTags(id, input.tagIds);
  }

  if (Object.keys(data).length === 0) return getArtifactById(id);

  data.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

  const row = await prisma.artifact.update({ where: { id }, data });
  return toArtifact(row);
}

export async function deleteArtifact(id: number): Promise<boolean> {
  try {
    await prisma.artifact.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function listArtifactsWithTags(opts: {
  includePrivate: boolean;
  search?: string;
  tagId?: number;
}): Promise<ArtifactListItemWithTags[]> {
  const where: Prisma.ArtifactWhereInput = {};

  if (!opts.includePrivate) {
    where.visibility = "public";
  }

  if (opts.search) {
    where.OR = [
      { title: { contains: opts.search } },
      { description: { contains: opts.search } },
    ];
  }

  if (opts.tagId) {
    where.artifactTags = { some: { tagId: opts.tagId } };
  }

  const rows = await prisma.artifact.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      visibility: true,
      liveVersion: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { versions: true } },
      artifactTags: {
        select: {
          tag: true,
        },
        orderBy: [{ tag: { sortOrder: "asc" } }, { tag: { name: "asc" } }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description ?? "",
    visibility: r.visibility as "public" | "private",
    live_version: r.liveVersion,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    version_count: r._count.versions,
    tags: r.artifactTags.map((at) => ({
      id: at.tag.id,
      name: at.tag.name,
      color: at.tag.color,
      parent_id: at.tag.parentId,
      sort_order: at.tag.sortOrder,
      created_at: at.tag.createdAt,
      updated_at: at.tag.updatedAt,
    })),
  }));
}
