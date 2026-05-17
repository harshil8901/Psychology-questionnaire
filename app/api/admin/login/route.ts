import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import { verifyAdminCredentials } from "@/lib/admin-auth";
import { getAdminSessionToken } from "@/lib/admin-session-token";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await getAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
