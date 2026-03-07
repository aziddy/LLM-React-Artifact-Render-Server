import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  // CVE-2025-29927: strip header that can bypass middleware
  request.headers.delete("x-middleware-subrequest");

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", request.url))
    );
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return applySecurityHeaders(NextResponse.next());
  } catch {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", request.url))
    );
  }
}

export const config = {
  matcher: [
    "/((?!login|api|artifact|render|_next/static|_next/image|favicon.ico).*)",
  ],
};
