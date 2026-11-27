import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { IconCash, IconCheck, IconChevron, IconScale, IconTruck } from "@/components/icons";
import { Order, api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { isLocale, t } from "@/lib/i18n";
import { DOT, STATUSES } from "@/lib/status";

interface Stats {
  counts: Record<string, number>;
  cash: { deliveredTotalCents: number; collectedCents: number; differenceCents: number; onTheRoadCents: number; onTheRoadOrders: number };
}

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  const [stats, recent] = await Promise.all([api<Stats>("/stats"), api<{ items: Order[] }>("/orders?pageSize=6")]);
  if (stats.status === 401 || recent.status === 401) redirect(`/${locale}/login`);

  const kpis = stats.ok
    ? [
        { label: d.stats.collected, value: formatMoney(stats.data.cash.collectedCents, locale), icon: <IconCash />, tone: "bg-emerald-50 text-emerald-600" },
        { label: d.stats.delivered, value: formatMoney(stats.data.cash.deliveredTotalCents, locale), icon: <IconCheck />, tone: "bg-blue-50 text-blue-600" },
        { label: d.stats.difference, value: formatMoney(stats.data.cash.differenceCents, locale), icon: <IconScale />, tone: stats.data.cash.differenceCents < 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600" },
        { label: d.stats.onTheRoad, value: formatMoney(stats.data.cash.onTheRoadCents, locale), sub: `${stats.data.cash.onTheRoadOrders} ${d.stats.orders}`, icon: <IconTruck />, tone: "bg-amber-50 text-amber-600" },
      ]
    : [];
  const counts = stats.ok ? stats.data.counts : {};
  const total = STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);

  return (
    <Shell locale={locale} title={d.stats.title}>
      {!stats.ok && !recent.ok && <p className="rounded-xl border bg-white p-6 text-slate-600">{stats.status === 403 ? d.errors.forbidden : d.errors.generic}</p>}
      {stats.ok && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{k.label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}>{k.icon}</span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{k.value}</p>
                {"sub" in k && <p className="mt-1 text-xs text-slate-500">{k.sub}</p>}
              </div>
            ))}
          </div>
          <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-slate-700">{d.stats.distribution}</h2>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
              {total > 0 && STATUSES.map((s) => (counts[s] ?? 0) > 0 && <div key={s} className={DOT[s]} style={{ width: `${((counts[s] ?? 0) / total) * 100}%` }} title={`${d.status[s]}: ${counts[s]}`} />)}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STATUSES.map((s) => (
                <li key={s} className="flex flex-col gap-1">
                  <StatusBadge status={s} locale={locale} />
                  <span className="ps-1 text-xl font-semibold">{counts[s] ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {recent.ok && (
        <section className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-medium text-slate-700">{d.stats.recent}</h2>
            <Link href={`/${locale}/orders`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">{d.stats.viewAll}<IconChevron width={16} height={16} /></Link>
          </div>
          <ul className="divide-y">
            {recent.data.items.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-500">{d.orders.empty}</li>}
            {recent.data.items.map((o) => (
              <li key={o.id}>
                <Link href={`/${locale}/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3 transition hover:bg-slate-50">
                  <span className="font-mono text-sm text-brand-700">{o.reference}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{o.customer_name} · <span className="text-slate-500">{o.city}</span></span>
                  <span className="hidden text-sm font-medium sm:block">{formatMoney(o.total_cents, locale, o.currency)}</span>
                  <StatusBadge status={o.status} locale={locale} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
