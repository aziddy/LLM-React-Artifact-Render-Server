import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getArtifactById } from "@/lib/artifacts";
import {
  getTagById,
  addTagToArtifact,
  removeTagFromArtifact,
} from "@/lib/tags";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const artifactId = Number(id);

  const artifact = getArtifactById(artifactId);
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: "tagId is required" },
        { status: 400 }
      );
    }

    const tag = getTagById(Number(tagId));
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    addTagToArtifact(artifactId, Number(tagId));
    return NextResponse.json(
      { artifact_id: artifactId, tag_id: Number(tagId) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const artifactId = Number(id);

  try {
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: "tagId is required" },
        { status: 400 }
      );
    }

    removeTagFromArtifact(artifactId, Number(tagId));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
