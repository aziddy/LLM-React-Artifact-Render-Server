import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createTag, getTagById, getTagTreeWithCounts } from "@/lib/tags";

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tree = await getTagTreeWithCounts();
  return NextResponse.json(tree);
}

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color, parent_id, sort_order } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: "Name is required (1-100 characters)" },
        { status: 400 }
      );
    }

    if (color !== undefined && color !== null && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json(
        { error: "Color must be a valid hex color (e.g. #3B82F6)" },
        { status: 400 }
      );
    }

    if (parent_id !== undefined && parent_id !== null) {
      const parent = await getTagById(Number(parent_id));
      if (!parent) {
        return NextResponse.json(
          { error: "Parent tag not found" },
          { status: 404 }
        );
      }
    }

    const tag = await createTag({
      name: name.trim(),
      color: color || null,
      parent_id: parent_id != null ? Number(parent_id) : null,
      sort_order: sort_order != null ? Number(sort_order) : 0,
    });

    return NextResponse.json(tag, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
