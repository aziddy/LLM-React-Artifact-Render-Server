import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyCredentials, isConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ configured: isConfigured });
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!verifyCredentials(username, password)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
