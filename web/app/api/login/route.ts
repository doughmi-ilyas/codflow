import { NextResponse } from "next/server";
import { COOKIE, apiBase } from "@/lib/api";

/** Backend-for-frontend login: the JWT goes into an httpOnly cookie, not into localStorage. */
export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${apiBase}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) return NextResponse.json({ error: "invalid" }, { status: 401 });
  const { token, user } = (await res.json()) as { token: string; user: unknown };
  const out = NextResponse.json({ user });
  out.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
  return out;
}
