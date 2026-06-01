import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAuthToken, getAuthCookieOptions, authCookieName, toPublicUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, "").trim() : "";
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = normalizeText(body.name);
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const password = normalizeText(body.password);

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin đăng ký." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu cần ít nhất 6 ký tự." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 });
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      });

      if (existingPhone) {
        return NextResponse.json({ error: "Số điện thoại này đã được đăng ký." }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        phone: phone || null,
        role: "USER"
      },
      select: {
        email: true,
        id: true,
        name: true,
        phone: true,
        role: true
      }
    });

    const token = await createAuthToken(user);
    const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    response.cookies.set(authCookieName, token, getAuthCookieOptions());
    return response;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Không thể tạo tài khoản. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
