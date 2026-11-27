"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toCents } from "@/lib/format";
import { Locale, t } from "@/lib/i18n";
import { NEXT, Status, Target } from "@/lib/status";

const TONE: Record<Target, string> = {
  confirmed: "bg-brand-600 text-white hover:bg-brand-700",
  shipped: "bg-amber-500 text-white hover:bg-amber-600",
  delivered: "bg-emerald-600 text-white hover:bg-emerald-700",
  refused: "bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50",
  returned: "bg-white text-purple-700 ring-1 ring-purple-200 hover:bg-purple-50",
};

export default function OrderActions({ id, status, couriers, locale }: { id: string; status: Status; couriers: { id: string; full_name: string }[]; locale: Locale }) {
  const d = t(locale);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    const res = await fetch("/api/proxy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: `/orders/${id}/status`, method: "PATCH", body }) });
    setBusy(false);
    if (!res.ok) return setError(res.status === 403 ? d.errors.forbidden : d.errors.generic);
    setTarget(null);
    setError(null);
    router.refresh();
  }

  const input = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button key={s} onClick={() => { setTarget(s); setError(null); }} className={`rounded-lg px-3.5 py-2 text-sm font-semibold shadow-sm transition ${TONE[s]} ${target && target !== s ? "opacity-50" : ""}`}>{d.action[s]}</button>
        ))}
      </div>
      {target && (
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
          {target === "shipped" && (
            <select name="courier" required className={input} defaultValue="">
              <option value="" disabled>{d.orders.chooseCourier}</option>
              {couriers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          )}
          {target === "delivered" && <input name="cash" required inputMode="decimal" placeholder={d.orders.cash} className={input} dir="ltr" />}
          <input name="note" placeholder={d.orders.note} className={`${input} min-w-0 flex-1`} />
          <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{d.orders.apply}</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
