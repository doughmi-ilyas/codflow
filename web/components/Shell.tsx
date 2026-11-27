import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { api } from "@/lib/api";
import { Locale, t } from "@/lib/i18n";
import { IconDashboard, IconOrders } from "./icons";
import LocaleSwitcher from "./LocaleSwitcher";
import LogoutButton from "./LogoutButton";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">C</span>
      CODFlow
    </span>
  );
}

export default async function Shell({ locale, title, actions, children }: { locale: Locale; title: string; actions?: ReactNode; children: ReactNode }) {
  const d = t(locale);
  const me = await api<{ role?: keyof typeof d.role }>("/auth/me");
  const role = me.ok && me.data.role ? d.role[me.data.role] : null;
  const nav = [
    { href: `/${locale}/dashboard`, label: d.nav.dashboard, icon: <IconDashboard /> },
    { href: `/${locale}/orders`, label: d.nav.orders, icon: <IconOrders /> },
  ];
  return (
    <div className="min-h-screen md:flex">
      <aside className="flex flex-col gap-6 bg-slate-900 px-4 py-4 text-slate-200 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:py-6">
        <div className="flex items-center justify-between">
          <Logo className="text-white" />
          <div className="md:hidden"><Suspense fallback={null}><LocaleSwitcher locale={locale} /></Suspense></div>
        </div>
        <nav className="flex gap-1 md:flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
              {n.icon}
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden flex-col gap-3 md:flex">
          <Suspense fallback={null}><LocaleSwitcher locale={locale} /></Suspense>
          {role && <p className="px-1 text-xs text-slate-400">{role}</p>}
          <LogoutButton label={d.nav.logout} locale={locale} />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-4 md:px-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <div className="ms-auto flex items-center gap-2">{actions}</div>
          <div className="flex w-full items-center justify-between md:hidden">
            {role && <p className="text-xs text-slate-500">{role}</p>}
            <LogoutButton label={d.nav.logout} locale={locale} />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
