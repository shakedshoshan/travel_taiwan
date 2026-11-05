import type { PhilippinesStatus } from "@/lib/data/philippines/types";
import { statusBadgeStyle } from "@/lib/data/philippines/statusBadge";

export function PhilippinesStatusBadge({ status }: { status: PhilippinesStatus }) {
  const style = statusBadgeStyle(status);
  return (
    <span
      data-testid={style.dataTestId}
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${style.className}`}
    >
      {style.label}
    </span>
  );
}
