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

  const field = "mt-1 w-full rounded border px-3 py-2";
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">{d.login.tenant}<input name="tenant" required className={field} dir="ltr" /></label>
      <label className="block text-sm">{d.login.email}<input name="email" type="email" required className={field} dir="ltr" /></label>
      <label className="block text-sm">{d.login.password}<input name="password" type="password" required className={field} dir="ltr" /></label>
      {error && <p role="alert" className="text-sm text-rose-700">{d.login.error}</p>}
      <button disabled={busy} className="w-full rounded bg-slate-900 py-2 text-white disabled:opacity-60">{d.login.submit}</button>
    </form>
  );
}
