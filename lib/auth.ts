import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const authCookieName = "tt_auth_token";
export const authMaxAge = 60 * 60 * 24 * 7;

export type CurrentUser = Pick<User, "email" | "id" | "name" | "phone" | "role">;

function getJwtSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "development-only-change-this-jwt-secret-before-production"
  );
}

export function toPublicUser(user: CurrentUser): CurrentUser {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role
  };
}

export function getAuthCookieOptions(maxAge = authMaxAge) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export async function createAuthToken(user: CurrentUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${authMaxAge}s`)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  return payload;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyAuthToken(token);
    const userId = typeof payload.sub === "string" ? payload.sub : "";

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        name: true,
        phone: true,
        role: true
      },
      where: { id: userId }
    });

    return user ? toPublicUser(user) : null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return user;
}

export function normalizeRole(value: unknown): Role | null {
  return value === "ADMIN" || value === "USER" || value === "DRIVER" ? value : null;
}
