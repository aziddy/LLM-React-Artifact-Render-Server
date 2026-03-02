import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getArtifactBySlug } from "@/lib/artifacts";
import { generateRenderHTML } from "@/lib/render-template";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const artifact = await getArtifactBySlug(slug);

  if (!artifact) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (artifact.visibility === "private") {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const html = generateRenderHTML(artifact.code);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
