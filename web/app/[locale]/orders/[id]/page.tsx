import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderActions from "@/components/OrderActions";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { IconBack } from "@/components/icons";
import { Order, OrderEvent, api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { isLocale, t } from "@/lib/i18n";
import { DOT } from "@/lib/status";

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const d = t(locale);
  const r = await api<Order & { events: OrderEvent[] }>(`/orders/${id}`);
  if (r.status === 401) redirect(`/${locale}/login`);
  if (r.status === 404) notFound();
  if (!r.ok) return <Shell locale={locale} title={d.orders.title}><p className="rounded-xl border bg-white p-6 text-slate-600">{r.status === 403 ? d.errors.forbidden : d.errors.generic}</p></Shell>;
  const o = r.data;
  const couriers = o.status === "confirmed" ? (await api<{ id: string; full_name: string }[]>("/users/couriers")).data : [];
  const item = (label: string, value: string, dir?: "ltr") => (
    <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm" dir={dir}>{value}</dd></div>
  );
  return (
    <Shell locale={locale} title={o.reference} actions={<StatusBadge status={o.status} locale={locale} />}>
      <Link href={`/${locale}/orders`} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"><IconBack width={16} height={16} />{d.orders.back}</Link>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-slate-700">{d.orders.details}</h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              {item(d.orders.customer, o.customer_name)}
              {item(d.orders.phone, o.phone, "ltr")}
              {item(d.orders.city, o.city)}
              {item(d.orders.address, o.address)}
              {item(d.orders.total, formatMoney(o.total_cents, locale, o.currency))}
              {o.cash_collected_cents !== null && item(d.orders.cash, formatMoney(o.cash_collected_cents, locale, o.currency))}
            </dl>
          </section>
          {OrderActionsVisible(o.status) && (
            <section className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-medium text-slate-700">{d.orders.actions}</h2>
              <OrderActions id={o.id} status={o.status} couriers={couriers} locale={locale} />
            </section>
          )}
        </div>
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-slate-700">{d.orders.history}</h2>
          <ol className="relative space-y-5 border-s border-slate-200 ps-5">
            {o.events.map((e, i) => (
              <li key={i} className="relative">
                <span className={`absolute -start-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${DOT[e.to_status]}`} />
                <StatusBadge status={e.to_status} locale={locale} />
                <time className="mt-1 block text-xs text-slate-500" dateTime={e.created_at}>{new Date(e.created_at).toLocaleString(locale)}</time>
                {e.note && <p className="mt-1 text-sm text-slate-600">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Shell>
  );
}

const OrderActionsVisible = (s: string) => s !== "delivered" && s !== "returned";
