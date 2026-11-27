import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { isLocale, t } from "@/lib/i18n";
import { STATUSES } from "@/lib/status";
import StatusBadge from "@/components/StatusBadge";

interface Stats {
  counts: Record<string, number>;
  cash: { deliveredTotalCents: number; collectedCents: number; differenceCents: number; onTheRoadCents: number; onTheRoadOrders: number };
}

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  const r = await api<Stats>("/stats");
  if (r.status === 401) redirect(`/${locale}/login`);
  if (!r.ok) {
    return <Shell locale={locale}><p className="text-slate-600">{r.status === 403 ? d.errors.forbidden : d.errors.generic}</p></Shell>;
  }
  const { counts, cash } = r.data;
  const card = "rounded-lg border bg-white p-4";
  return (
    <Shell locale={locale}>
      <h1 className="mb-4 text-xl font-semibold">{d.stats.title}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}><p className="text-sm text-slate-500">{d.stats.collected}</p><p className="text-xl font-semibold">{formatMoney(cash.collectedCents, locale)}</p></div>
        <div className={card}><p className="text-sm text-slate-500">{d.stats.delivered}</p><p className="text-xl font-semibold">{formatMoney(cash.deliveredTotalCents, locale)}</p></div>
        <div className={card}><p className="text-sm text-slate-500">{d.stats.difference}</p><p className="text-xl font-semibold">{formatMoney(cash.differenceCents, locale)}</p></div>
        <div className={card}><p className="text-sm text-slate-500">{d.stats.onTheRoad}</p><p className="text-xl font-semibold">{formatMoney(cash.onTheRoadCents, locale)}</p><p className="text-xs text-slate-500">{cash.onTheRoadOrders} {d.stats.orders}</p></div>
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {STATUSES.map((s) => (
          <li key={s} className={`${card} flex items-center justify-between`}><StatusBadge status={s} locale={locale} /><span className="text-lg font-semibold">{counts[s] ?? 0}</span></li>
        ))}
      </ul>
    </Shell>
  );
}
