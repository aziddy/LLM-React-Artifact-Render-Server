import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getArtifactById } from "@/lib/artifacts";
import { getVersion, updateVersion, setLiveVersion } from "@/lib/versions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version } = await params;
  const ver = await getVersion(Number(id), Number(version));
  if (!ver) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(ver);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version } = await params;

  try {
    const body = await request.json();
    const { title, description, code } = body;

    const updated = await updateVersion(Number(id), Number(version), {
      title,
      description,
      code,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version } = await params;
  const success = await setLiveVersion(Number(id), Number(version));
  if (!success) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const updated = await getArtifactById(Number(id));
  return NextResponse.json(updated);
}
