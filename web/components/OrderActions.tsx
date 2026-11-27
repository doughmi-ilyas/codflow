"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toCents } from "@/lib/format";
import { Locale, t } from "@/lib/i18n";
import { NEXT, Status, Target } from "@/lib/status";

export default function OrderActions({ id, status, couriers, locale }: { id: string; status: Status; couriers: { id: string; full_name: string }[]; locale: Locale }) {
  const d = t(locale);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const options = NEXT[status];
  if (options.length === 0) return null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) return;
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { status: target, note: f.get("note") || undefined };
    if (target === "shipped") body.courierId = f.get("courier");
    if (target === "delivered") {
      const c = toCents(String(f.get("cash")));
      if (c === null) return setError(d.errors.generic);
      body.cashCollectedCents = c;
    }
    const res = await fetch("/api/proxy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: `/orders/${id}/status`, method: "PATCH", body }) });
    if (!res.ok) return setError(res.status === 403 ? d.errors.forbidden : d.errors.generic);
    setTarget(null);
    setError(null);
    router.refresh();
  }

  const input = "rounded border px-2 py-1.5 text-sm";
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button key={s} onClick={() => setTarget(s)} className={`rounded border px-3 py-1.5 text-sm ${target === s ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>{d.action[s]}</button>
        ))}
      </div>
      {target && (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
          {target === "shipped" && (
            <select name="courier" required className={input} defaultValue="">
              <option value="" disabled>{d.orders.chooseCourier}</option>
              {couriers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          )}
          {target === "delivered" && <input name="cash" required inputMode="decimal" placeholder={d.orders.cash} className={input} dir="ltr" />}
          <input name="note" placeholder={d.orders.note} className={input} />
          <button className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white">{d.orders.apply}</button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
