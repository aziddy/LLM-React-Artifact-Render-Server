import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getArtifactById,
  updateArtifact,
  deleteArtifact,
} from "@/lib/artifacts";
import { getTagsForArtifact } from "@/lib/tags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artifact = await getArtifactById(Number(id));

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (artifact.visibility === "private") {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const tags = await getTagsForArtifact(Number(id));
  return NextResponse.json({ ...artifact, tags });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getArtifactById(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { title, description, code, visibility, tagIds } = body;

    if (visibility && !["public", "private"].includes(visibility)) {
      return NextResponse.json(
        { error: "Visibility must be 'public' or 'private'" },
        { status: 400 }
      );
    }

    const updated = await updateArtifact(Number(id), {
      title,
      description,
      code,
      visibility,
      tagIds: Array.isArray(tagIds) ? tagIds.map(Number) : undefined,
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
  const deleted = await deleteArtifact(Number(id));

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
