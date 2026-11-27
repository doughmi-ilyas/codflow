import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NewOrderForm from "@/components/NewOrderForm";
import Shell from "@/components/Shell";
import StatusBadge from "@/components/StatusBadge";
import { IconBack, IconBox, IconChevron, IconSearch } from "@/components/icons";
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
  if (!r.ok) return <Shell locale={locale} title={d.orders.title}><p className="rounded-xl border bg-white p-6 text-slate-600">{r.status === 403 ? d.errors.forbidden : d.errors.generic}</p></Shell>;
  const { items, total, page, pageSize } = r.data;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const link = (over: Record<string, string>) => `/${locale}/orders?${new URLSearchParams({ ...Object.fromEntries(qs), ...over })}`;
  const chip = (active: boolean) => `rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`;
  const th = "px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <Shell locale={locale} title={d.orders.title} actions={<NewOrderForm locale={locale} />}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/${locale}/orders`} className={chip(!sp.status)}>{d.orders.all}</Link>
        {STATUSES.map((s) => <Link key={s} href={link({ status: s, page: "1" })} className={chip(sp.status === s)}>{d.status[s]}</Link>)}
        <form className="relative ms-auto w-full sm:w-64">
          <IconSearch className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" width={16} height={16} />
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <input name="q" defaultValue={sp.q} placeholder={d.orders.search} className="w-full rounded-lg border border-slate-300 bg-white py-2 ps-9 pe-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100" />
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-slate-500">
            <IconBox className="text-slate-300" />
            <p>{d.orders.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className={th}>{d.orders.reference}</th>
                  <th className={th}>{d.orders.customer}</th>
                  <th className={`${th} hidden sm:table-cell`}>{d.orders.city}</th>
                  <th className={th}>{d.orders.total}</th>
                  <th className={th}>{d.orders.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((o) => (
                  <tr key={o.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3"><Link className="font-mono text-brand-700 hover:underline" href={`/${locale}/orders/${o.id}`}>{o.reference}</Link></td>
                    <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{o.city}</td>
                    <td className="px-4 py-3 tabular-nums">{formatMoney(o.total_cents, locale, o.currency)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} locale={locale} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>{total} {d.orders.results} · {d.orders.page} {page} {d.orders.of} {pages}</span>
          <span className="flex gap-2">
            {page > 1 && <Link href={link({ page: String(page - 1) })} className="rounded-lg border bg-white p-1.5 hover:bg-slate-50" aria-label="previous"><IconBack width={16} height={16} /></Link>}
            {page < pages && <Link href={link({ page: String(page + 1) })} className="rounded-lg border bg-white p-1.5 hover:bg-slate-50" aria-label="next"><IconChevron width={16} height={16} /></Link>}
          </span>
        </div>
      </div>
    </Shell>
  );
}
