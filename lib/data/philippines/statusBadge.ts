import type { PhilippinesStatus } from "./types";

export interface StatusBadgeStyle {
  label: PhilippinesStatus;
  className: string;
  dataTestId: string;
}

export function statusBadgeStyle(status: PhilippinesStatus): StatusBadgeStyle {
  switch (status) {
    case "אומת":
      return {
        label: status,
        className:
          "bg-emerald-500/15 text-emerald-900 ring-1 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200",
        dataTestId: "ph-status-verified",
      };
    case "לא אומת":
      return {
        label: status,
        className:
          "bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/35 dark:bg-amber-500/20 dark:text-amber-200",
        dataTestId: "ph-status-unverified",
      };
    case "תאריך לא סופי":
      return {
        label: status,
        className:
          "bg-violet-500/15 text-violet-900 ring-1 ring-violet-500/30 dark:bg-violet-500/20 dark:text-violet-200",
        dataTestId: "ph-status-tbc",
      };
    default:
      return {
        label: status,
        className: "bg-slate-500/15 text-slate-800",
        dataTestId: "ph-status-other",
      };
  }
}

export function isHttpSource(source: string): boolean {
  return /^https?:\/\//i.test(source.trim());
}

export function sourceLinkLabel(source: string): string {
  if (isHttpSource(source)) {
    try {
      const host = new URL(source).hostname.replace(/^www\./, "");
      return host.length > 28 ? `${host.slice(0, 26)}…` : host;
    } catch {
      return "מקור";
    }
  }
  const tail = source.split("/").pop() ?? source;
  return tail.length > 32 ? `${tail.slice(0, 30)}…` : tail;
}
