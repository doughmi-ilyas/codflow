import { Locale } from "./i18n";

const TAG: Record<Locale, string> = { fr: "fr-MA", en: "en-GB", ar: "ar-MA-u-nu-latn" };

/** Amounts are integers in cents (centimes) end to end; only the display divides by 100. */
export function formatMoney(cents: number, locale: Locale, currency = "MAD"): string {
  return new Intl.NumberFormat(TAG[locale], { style: "currency", currency }).format(cents / 100);
}

export function toCents(input: string): number | null {
  const n = Number(input.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
