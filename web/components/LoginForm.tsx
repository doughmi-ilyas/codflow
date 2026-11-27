"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, t } from "@/lib/i18n";

export interface DemoAccount { tenant: string; email: string; password: string }

export default function LoginForm({ locale, demo }: { locale: Locale; demo?: DemoAccount }) {
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

  const fill = (f: HTMLFormElement | null) => {
    if (!f || !demo) return;
    for (const [k, v] of Object.entries(demo)) (f.elements.namedItem(k) as HTMLInputElement).value = v;
  };
  const label = "block text-sm font-medium text-slate-700";
  const field = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
  return (
    <form id="login-form" onSubmit={submit} className="space-y-4">
      <label className={label}>{d.login.tenant}<input name="tenant" required autoComplete="organization" placeholder="atlas-shop" className={field} dir="ltr" /></label>
      <label className={label}>{d.login.email}<input name="email" type="email" required autoComplete="username" className={field} dir="ltr" /></label>
      <label className={label}>{d.login.password}<input name="password" type="password" required autoComplete="current-password" className={field} dir="ltr" /></label>
      {demo && (
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm">
          <p className="font-medium text-brand-700">{d.demo.title}</p>
          <p className="mt-1 text-slate-600">{d.demo.hint}</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs" dir="ltr">
            <dt className="text-slate-500">shop</dt><dd>{demo.tenant}</dd>
            <dt className="text-slate-500">email</dt><dd>{demo.email}</dd>
            <dt className="text-slate-500">password</dt><dd>{demo.password}</dd>
          </dl>
          <p className="mt-1 text-xs text-slate-500">{d.demo.role}</p>
          <button type="button" onClick={(e) => fill(e.currentTarget.closest("form"))} className="mt-2 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">{d.demo.use}</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{d.login.error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60">{d.login.submit}</button>
    </form>
  );
}
