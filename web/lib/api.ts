import { cookies } from "next/headers";
import type { Status } from "./status";

const API = process.env.API_URL ?? "http://localhost:3001";
export const COOKIE = "codflow_token";

export interface Order {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  total_cents: number;
  currency: string;
  status: Status;
  courier_id: string | null;
  cash_collected_cents: number | null;
  created_at: string;
}
export interface OrderEvent { from_status: Status | null; to_status: Status; note: string | null; created_at: string }

/** Server-side call to the API with the session cookie. The token never reaches browser JavaScript. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const token = (await cookies()).get(COOKIE)?.value;
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export const apiBase = API;
