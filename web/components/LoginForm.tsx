"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, t } from "@/lib/i18n";

export default function LoginForm({ locale }: { locale: Locale }) {
  const d = t(locale);
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenant: f.get("tenant"), email: f.get("email"), password: f.get("password") }),
    });
    setBusy(false);
    if (!res.ok) return setError(true);
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  const label = "block text-sm font-medium text-slate-700";
  const field = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className={label}>{d.login.tenant}<input name="tenant" required autoComplete="organization" placeholder="atlas-shop" className={field} dir="ltr" /></label>
      <label className={label}>{d.login.email}<input name="email" type="email" required autoComplete="username" className={field} dir="ltr" /></label>
      <label className={label}>{d.login.password}<input name="password" type="password" required autoComplete="current-password" className={field} dir="ltr" /></label>
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{d.login.error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60">{d.login.submit}</button>
    </form>
  );
}
