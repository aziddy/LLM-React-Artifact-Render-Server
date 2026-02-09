import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export function signToken(): string {
  return jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
    expiresIn: "1y",
  });
}

export function verifyCredentials(
  username: string,
  password: string
): boolean {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return false;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
