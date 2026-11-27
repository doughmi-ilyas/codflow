"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toCents } from "@/lib/format";
import { Locale, t } from "@/lib/i18n";
import { IconClose, IconPlus } from "./icons";

/** "New order" button that opens a modal form. */
export default function NewOrderForm({ locale }: { locale: Locale }) {
  const d = t(locale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const totalCents = toCents(String(f.get("total")));
    if (totalCents === null) return setError(d.errors.generic);
    setBusy(true);
    setError(null);
    const res = await fetch("/api/proxy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "/orders", method: "POST", body: { customerName: f.get("customer"), phone: f.get("phone"), city: f.get("city"), address: f.get("address"), totalCents } }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return setError(res.status === 403 ? d.errors.forbidden : j?.issues?.[0]?.message ?? d.errors.generic);
    }
    form.reset();
    setOpen(false);
    router.refresh();
  }

  const field = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
  const label = "block text-sm font-medium text-slate-700";
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
        <IconPlus width={16} height={16} />
        {d.orders.new}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label={d.orders.new} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{d.orders.new}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={d.orders.close} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><IconClose /></button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={label}>{d.orders.customer}<input name="customer" required autoFocus className={field} /></label>
              <label className={label}>{d.orders.phone}<input name="phone" required placeholder="06 12 34 56 78" className={field} dir="ltr" /></label>
              <label className={label}>{d.orders.city}<input name="city" required className={field} /></label>
              <label className={label}>{d.orders.total}<input name="total" required inputMode="decimal" placeholder="249" className={field} dir="ltr" /></label>
              <label className={`${label} sm:col-span-2`}>{d.orders.address}<input name="address" required className={field} /></label>
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">{d.orders.close}</button>
              <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{d.orders.create}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
