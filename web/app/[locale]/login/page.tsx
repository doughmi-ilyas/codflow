import { Suspense } from "react";
import { notFound } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { Logo } from "@/components/Shell";
import { IconCash, IconOrders, IconScale } from "@/components/icons";
import { isLocale, t } from "@/lib/i18n";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  const points = [
    { icon: <IconOrders />, text: d.brand.p1 },
    { icon: <IconScale />, text: d.brand.p2 },
    { icon: <IconCash />, text: d.brand.p3 },
  ];
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -start-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <Logo className="relative text-xl" />
        <div className="relative">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">{d.brand.tagline}</h2>
          <ul className="mt-8 space-y-4 text-slate-300">
            {points.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-slate-400">Next.js · NestJS · PostgreSQL</p>
      </section>
      <section className="flex flex-col px-6 py-6">
        <div className="flex items-center justify-between lg:justify-end">
          <Logo className="lg:hidden" />
          <div className="rounded-lg bg-slate-900 p-0.5"><Suspense fallback={null}><LocaleSwitcher locale={locale} /></Suspense></div>
        </div>
        <div className="m-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{d.login.title}</h1>
          <div className="mt-6"><LoginForm locale={locale} /></div>
        </div>
      </section>
    </main>
  );
}
