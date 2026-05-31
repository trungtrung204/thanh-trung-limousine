import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  authCookieName,
  createAuthToken,
  getAuthCookieOptions,
  normalizeRole,
  toPublicUser
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const demoAdminEmail = process.env.ADMIN_EMAIL || "admin@thanhtrung.local";

function normalizeIdentifier(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawIdentifier = normalizeIdentifier(
      body.identifier ?? body.emailOrPhone ?? body.email ?? body.username
    );
    const password = normalizeIdentifier(body.password);
    const expectedRole = normalizeRole(body.role);

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tài khoản và mật khẩu." },
        { status: 400 }
      );
    }

    const emailIdentifier =
      rawIdentifier.toLowerCase() === "admin" ? demoAdminEmail : rawIdentifier.toLowerCase();
    const phoneIdentifier = normalizePhone(rawIdentifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailIdentifier }, { phone: phoneIdentifier }]
      }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu." }, { status: 401 });
    }

    const passwordMatched = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatched) {
      return NextResponse.json({ error: "Sai tài khoản hoặc mật khẩu." }, { status: 401 });
    }

    if (expectedRole && user.role !== expectedRole) {
      return NextResponse.json(
        { error: "Tài khoản không có quyền truy cập khu vực này." },
        { status: 403 }
      );
    }

    const publicUser = toPublicUser(user);
    const token = await createAuthToken(publicUser);
    const remember = body.remember !== false;
    const response = NextResponse.json({ user: publicUser });
    response.cookies.set(authCookieName, token, getAuthCookieOptions(remember ? undefined : 60 * 60 * 12));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Không thể đăng nhập. Vui lòng kiểm tra kết nối database." },
      { status: 500 }
    );
  }
}
