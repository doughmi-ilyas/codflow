import Link from "next/link";
import type { ReactNode } from "react";
import { LOCALES, Locale, t } from "@/lib/i18n";
import LogoutButton from "./LogoutButton";

export default function Shell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const d = t(locale);
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-semibold">{d.appName}</span>
          <nav className="flex gap-4 text-sm">
            <Link href={`/${locale}/dashboard`} className="hover:underline">{d.nav.dashboard}</Link>
            <Link href={`/${locale}/orders`} className="hover:underline">{d.nav.orders}</Link>
          </nav>
          <div className="ms-auto flex items-center gap-3 text-sm">
            {LOCALES.map((l) => (
              <Link key={l} href={`/${l}/orders`} className={l === locale ? "font-semibold" : "text-slate-500 hover:underline"}>{l.toUpperCase()}</Link>
            ))}
            <LogoutButton label={d.nav.logout} locale={locale} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
