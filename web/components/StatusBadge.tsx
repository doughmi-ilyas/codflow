import { Locale, t } from "@/lib/i18n";
import { BADGE, DOT, Status } from "@/lib/status";

export default function StatusBadge({ status, locale }: { status: Status; locale: Locale }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {t(locale).status[status]}
    </span>
  );
}
