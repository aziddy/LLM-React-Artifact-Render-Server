import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getTagById,
  updateTag,
  deleteTag,
  getAllTags,
  collectDescendantIds,
  getTagsForArtifact,
} from "@/lib/tags";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tag = await getTagById(Number(id));

  if (!tag) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get children
  const childRows = await prisma.tag.findMany({
    where: { parentId: Number(id) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const children = childRows.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    parent_id: c.parentId,
    sort_order: c.sortOrder,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }));

  // Get artifacts assigned to this tag
  const artifactRows = await prisma.artifact.findMany({
    where: { artifactTags: { some: { tagId: Number(id) } } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Attach tags to each artifact
  const artifactsWithTags = await Promise.all(
    artifactRows.map(async (a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      description: a.description,
      visibility: a.visibility,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
      tags: await getTagsForArtifact(a.id),
    }))
  );

  return NextResponse.json({ ...tag, children, artifacts: artifactsWithTags });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tagId = Number(id);
  const existing = await getTagById(tagId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, color, parent_id, sort_order } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 100)) {
      return NextResponse.json(
        { error: "Name must be 1-100 characters" },
        { status: 400 }
      );
    }

    if (color !== undefined && color !== null && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: "Color must be a valid hex color (e.g. #3B82F6)" },
        { status: 400 }
      );
    }

    // Prevent circular references
    if (parent_id !== undefined && parent_id !== null) {
      const newParentId = Number(parent_id);
      if (newParentId === tagId) {
        return NextResponse.json(
          { error: "A tag cannot be its own parent" },
          { status: 400 }
        );
      }
      const parent = await getTagById(newParentId);
      if (!parent) {
        return NextResponse.json(
          { error: "Parent tag not found" },
          { status: 404 }
        );
      }
      // Check if newParentId is a descendant of this tag
      const descendants = collectDescendantIds(tagId, await getAllTags());
      if (descendants.has(newParentId)) {
        return NextResponse.json(
          { error: "Cannot set a descendant as parent (circular reference)" },
          { status: 400 }
        );
      }
    }

    const updated = await updateTag(tagId, {
      name: name?.trim(),
      color,
      parent_id: parent_id !== undefined ? (parent_id != null ? Number(parent_id) : null) : undefined,
      sort_order: sort_order != null ? Number(sort_order) : undefined,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteTag(Number(id));

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
