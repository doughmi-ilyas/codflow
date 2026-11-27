import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NewOrderForm from "@/components/NewOrderForm";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { Order, api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { isLocale, t } from "@/lib/i18n";
import { STATUSES } from "@/lib/status";

interface Page { items: Order[]; total: number; page: number; pageSize: number }

export default async function Orders({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const d = t(locale);
  const qs = new URLSearchParams();
  for (const k of ["status", "q", "page"]) if (sp[k]) qs.set(k, sp[k]!);
  const r = await api<Page>(`/orders?${qs}`);
  if (r.status === 401) redirect(`/${locale}/login`);
  if (!r.ok) return <Shell locale={locale}><p>{r.status === 403 ? d.errors.forbidden : d.errors.generic}</p></Shell>;
  const { items, total, page, pageSize } = r.data;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const link = (over: Record<string, string>) => `/${locale}/orders?${new URLSearchParams({ ...Object.fromEntries(qs), ...over })}`;

  return (
    <Shell locale={locale}>
      <h1 className="mb-4 text-xl font-semibold">{d.orders.title}</h1>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/${locale}/orders`} className={!sp.status ? "font-semibold" : "text-slate-500"}>{d.orders.all}</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={link({ status: s, page: "1" })} className={sp.status === s ? "font-semibold" : "text-slate-500"}>{d.status[s]}</Link>
        ))}
        <form className="ms-auto">
          <input name="q" defaultValue={sp.q} placeholder={d.orders.search} className="rounded border px-2 py-1" />
        </form>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-start text-slate-600">
            <tr>
              {[d.orders.reference, d.orders.customer, d.orders.city, d.orders.total, d.orders.status].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">{d.orders.empty}</td></tr>}
            {items.map((o) => (
              <tr key={o.id} className="border-t hover:bg-slate-50">
                <td className="px-3 py-2"><Link className="font-mono text-blue-700 hover:underline" href={`/${locale}/orders/${o.id}`}>{o.reference}</Link></td>
                <td className="px-3 py-2">{o.customer_name}</td>
                <td className="px-3 py-2">{o.city}</td>
                <td className="px-3 py-2">{formatMoney(o.total_cents, locale, o.currency)}</td>
                <td className="px-3 py-2"><StatusBadge status={o.status} locale={locale} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <span>{d.orders.page} {page} {d.orders.of} {pages}</span>
        <span className="flex gap-3">
          {page > 1 && <Link href={link({ page: String(page - 1) })}>‹</Link>}
          {page < pages && <Link href={link({ page: String(page + 1) })}>›</Link>}
        </span>
      </div>
      <div className="mt-6"><NewOrderForm locale={locale} /></div>
    </Shell>
  );
}
