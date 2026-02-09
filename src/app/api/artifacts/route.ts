import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createArtifact, listArtifacts } from "@/lib/artifacts";

export async function GET(request: NextRequest) {
  const authed = await isAuthenticated();
  const search = request.nextUrl.searchParams.get("search") || undefined;

  const artifacts = listArtifacts({
    includePrivate: authed,
    search,
  });

  return NextResponse.json(artifacts);
}

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, code, visibility } = body;

    if (!title || !code) {
      return NextResponse.json(
        { error: "Title and code are required" },
        { status: 400 }
      );
    }

    if (visibility && !["public", "private"].includes(visibility)) {
      return NextResponse.json(
        { error: "Visibility must be 'public' or 'private'" },
        { status: 400 }
      );
    }

    const artifact = createArtifact({
      title,
      description: description || "",
      code,
      visibility: visibility || "private",
    });

    return NextResponse.json(artifact, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
