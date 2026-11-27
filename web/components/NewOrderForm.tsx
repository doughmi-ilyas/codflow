"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toCents } from "@/lib/format";
import { Locale, t } from "@/lib/i18n";

export default function NewOrderForm({ locale }: { locale: Locale }) {
  const d = t(locale);
  const router = useRouter();
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
      body: JSON.stringify({
        path: "/orders",
        method: "POST",
        body: { customerName: f.get("customer"), phone: f.get("phone"), city: f.get("city"), address: f.get("address"), totalCents },
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return setError(res.status === 403 ? d.errors.forbidden : j?.issues?.[0]?.message ?? d.errors.generic);
    }
    form.reset();
    router.refresh();
  }

  const input = "w-full rounded border px-2 py-1.5 text-sm";
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-lg border bg-white p-4 sm:grid-cols-2">
      <h2 className="font-medium sm:col-span-2">{d.orders.new}</h2>
      <input name="customer" required placeholder={d.orders.customer} className={input} />
      <input name="phone" required placeholder="06 12 34 56 78" aria-label={d.orders.phone} className={input} dir="ltr" />
      <input name="city" required placeholder={d.orders.city} className={input} />
      <input name="total" required inputMode="decimal" placeholder={d.orders.total} className={input} dir="ltr" />
      <input name="address" required placeholder={d.orders.address} className={`${input} sm:col-span-2`} />
      {error && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{error}</p>}
      <button disabled={busy} className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60 sm:col-span-2">{d.orders.create}</button>
    </form>
  );
}
