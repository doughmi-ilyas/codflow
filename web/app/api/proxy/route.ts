import { NextResponse } from "next/server";
import { api } from "@/lib/api";

const ALLOWED = [/^\/orders$/, /^\/orders\/[0-9a-f-]{36}\/status$/];

/** Narrow write proxy for client forms: only the two mutations the UI needs, never arbitrary API paths. */
export async function POST(req: Request) {
  const { path, method, body } = (await req.json()) as { path: string; method: "POST" | "PATCH"; body: unknown };
  if (!ALLOWED.some((r) => r.test(path))) return NextResponse.json({ error: "not allowed" }, { status: 400 });
  const r = await api<unknown>(path, { method, body: JSON.stringify(body) });
  return NextResponse.json(r.data, { status: r.status });
}
