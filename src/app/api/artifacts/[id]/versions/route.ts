import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getArtifactById } from "@/lib/artifacts";
import {
  getVersionsForArtifact,
  getVersion,
  createVersion,
} from "@/lib/versions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const artifact = getArtifactById(Number(id));
  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = getVersionsForArtifact(Number(id));
  return NextResponse.json({
    live_version: artifact.live_version,
    versions,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const artifact = getArtifactById(Number(id));
  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let title: string;
  let description: string;
  let code: string;

  try {
    const body = await request.json();

    if (body.copyFrom !== undefined) {
      // Copy from an existing version
      const source = getVersion(Number(id), Number(body.copyFrom));
      if (!source) {
        return NextResponse.json(
          { error: "Source version not found" },
          { status: 404 }
        );
      }
      title = source.title;
      description = source.description;
      code = source.code;
    } else if (body.title && body.code) {
      // Explicit content provided
      title = body.title;
      description = body.description || "";
      code = body.code;
    } else {
      // Snapshot current artifact content
      title = artifact.title;
      description = artifact.description;
      code = artifact.code;
    }
  } catch {
    // No body or invalid JSON — snapshot current artifact content
    title = artifact.title;
    description = artifact.description;
    code = artifact.code;
  }

  const version = createVersion(Number(id), title, description, code);
  return NextResponse.json(version, { status: 201 });
}
