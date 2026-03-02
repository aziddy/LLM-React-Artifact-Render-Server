import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getArtifactBySlug } from "@/lib/artifacts";
import { getTagsForArtifact } from "@/lib/tags";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const artifact = await getArtifactBySlug(slug);

  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (artifact.visibility === "private") {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const tags = await getTagsForArtifact(artifact.id);
  return NextResponse.json({ ...artifact, tags });
}
