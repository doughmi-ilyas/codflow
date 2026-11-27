import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderActions from "@/components/OrderActions";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { Order, OrderEvent, api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { isLocale, t } from "@/lib/i18n";

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  const r = await api<Order & { events: OrderEvent[] }>(`/orders/${id}`);
  if (r.status === 401) redirect(`/${locale}/login`);
  if (r.status === 404) notFound();
  if (!r.ok) return <Shell locale={locale}><p>{r.status === 403 ? d.errors.forbidden : d.errors.generic}</p></Shell>;
  const o = r.data;
  const couriers = o.status === "confirmed" ? (await api<{ id: string; full_name: string }[]>("/users/couriers")).data : [];
  return (
    <Shell locale={locale}>
      <Link href={`/${locale}/orders`} className="text-sm text-blue-700 hover:underline">← {d.orders.back}</Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-mono text-xl font-semibold">{o.reference}</h1>
        <StatusBadge status={o.status} locale={locale} />
      </div>
      <dl className="mt-4 grid gap-3 rounded-lg border bg-white p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">{d.orders.customer}</dt><dd>{o.customer_name}</dd></div>
        <div><dt className="text-slate-500">{d.orders.phone}</dt><dd dir="ltr" className="text-start">{o.phone}</dd></div>
        <div><dt className="text-slate-500">{d.orders.city}</dt><dd>{o.city}</dd></div>
        <div><dt className="text-slate-500">{d.orders.address}</dt><dd>{o.address}</dd></div>
        <div><dt className="text-slate-500">{d.orders.total}</dt><dd>{formatMoney(o.total_cents, locale, o.currency)}</dd></div>
        {o.cash_collected_cents !== null && <div><dt className="text-slate-500">{d.orders.cash}</dt><dd>{formatMoney(o.cash_collected_cents, locale, o.currency)}</dd></div>}
      </dl>
      <div className="mt-4"><OrderActions id={o.id} status={o.status} couriers={couriers} locale={locale} /></div>
      <h2 className="mb-2 mt-6 font-medium">{d.orders.history}</h2>
      <ol className="space-y-1 text-sm">
        {o.events.map((e, i) => (
          <li key={i} className="flex items-center gap-2">
            <StatusBadge status={e.to_status} locale={locale} />
            <time className="text-slate-500" dateTime={e.created_at}>{new Date(e.created_at).toLocaleString(locale)}</time>
            {e.note && <span className="text-slate-600">· {e.note}</span>}
          </li>
        ))}
      </ol>
    </Shell>
  );
}
