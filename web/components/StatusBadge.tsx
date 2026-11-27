import { Locale, t } from "@/lib/i18n";
import { BADGE, Status } from "@/lib/status";

export default function StatusBadge({ status, locale }: { status: Status; locale: Locale }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[status]}`}>{t(locale).status[status]}</span>;
}
