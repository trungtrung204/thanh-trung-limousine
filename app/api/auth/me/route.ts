import { NextResponse } from "next/server";
import { authCookieName, createAuthToken, getAuthCookieOptions, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const response = NextResponse.json({ user });
  response.cookies.set(authCookieName, await createAuthToken(user), getAuthCookieOptions());
  return response;
}
