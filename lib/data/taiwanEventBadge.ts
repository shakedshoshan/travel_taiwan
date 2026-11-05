import type { TaiwanEventStatusKind } from "@/lib/data/taiwanEvents";

export function taiwanEventBadge(status: TaiwanEventStatusKind): {
  className: string;
  dataTestId: string;
} {
  switch (status) {
    case "verified":
      return {
        className:
          "bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200",
        dataTestId: "tw-event-verified",
      };
    case "sold_out":
      return {
        className:
          "bg-rose-500/15 text-rose-900 ring-1 ring-rose-500/35 dark:bg-rose-500/20 dark:text-rose-200",
        dataTestId: "tw-event-sold-out",
      };
    case "after_flight":
      return {
        className:
          "bg-slate-500/15 text-slate-800 ring-1 ring-slate-500/25 dark:bg-slate-700/40 dark:text-slate-200",
        dataTestId: "tw-event-after-flight",
      };
    case "not_in_city":
      return {
        className:
          "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/35 dark:bg-amber-500/20 dark:text-amber-200",
        dataTestId: "tw-event-not-in-city",
      };
    case "tbc":
      return {
        className:
          "bg-violet-500/15 text-violet-900 ring-1 ring-violet-500/30 dark:bg-violet-500/20 dark:text-violet-200",
        dataTestId: "tw-event-tbc",
      };
    default:
      return {
        className:
          "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/35 dark:bg-amber-500/20 dark:text-amber-200",
        dataTestId: "tw-event-unverified",
      };
  }
}
