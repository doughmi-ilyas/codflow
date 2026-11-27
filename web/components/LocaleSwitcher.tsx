"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALES, Locale } from "@/lib/i18n";

const NAMES: Record<Locale, string> = { fr: "FR", en: "EN", ar: "ع" };

/** Same page, other language: swaps the first path segment and keeps the query string. */
export default function LocaleSwitcher({ locale }: { locale: Locale }) {
  const path = usePathname();
  const qs = useSearchParams().toString();
  const rest = path.split("/").slice(2).join("/");
  return (
    <div className="inline-flex rounded-lg bg-white/10 p-0.5 text-xs">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ""}${qs ? `?${qs}` : ""}`}
          className={`rounded-md px-2.5 py-1 font-medium transition ${l === locale ? "bg-white text-slate-900" : "text-slate-300 hover:text-white"}`}
        >
          {NAMES[l]}
        </Link>
      ))}
    </div>
  );
}
