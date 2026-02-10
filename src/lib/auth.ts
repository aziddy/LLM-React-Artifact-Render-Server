import crypto from "crypto";
import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const envOrRandom = (val: string | undefined) =>
  val && val.length >= 5 ? val : crypto.randomUUID();

const ADMIN_USERNAME = envOrRandom(process.env.ADMIN_USERNAME);
const ADMIN_PASSWORD = envOrRandom(process.env.ADMIN_PASSWORD);
const JWT_SECRET = envOrRandom(process.env.JWT_SECRET);

export const isConfigured =
  !!process.env.ADMIN_USERNAME &&
  process.env.ADMIN_USERNAME.length >= 5 &&
  !!process.env.ADMIN_PASSWORD &&
  process.env.ADMIN_PASSWORD.length >= 5 &&
  !!process.env.JWT_SECRET &&
  process.env.JWT_SECRET.length >= 5;

export function signToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, {
    expiresIn: "1y",
  });
}

export function verifyCredentials(
  username: string,
  password: string
): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return false;

    const secret = new TextEncoder().encode(JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
