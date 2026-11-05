import { ExternalLink } from "lucide-react";
import {
  isHttpSource,
  sourceLinkLabel,
} from "@/lib/data/philippines/statusBadge";

export function PhilippinesSourceLink({ source }: { source: string }) {
  const label = sourceLinkLabel(source);
  const http = isHttpSource(source);

  if (http) {
    return (
      <a
        href={source}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="ph-source-link"
        className="inline-flex min-h-11 min-w-11 items-center gap-1 rounded-xl bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-800 underline decoration-sky-500/40 underline-offset-2 hover:bg-sky-500/20 dark:text-sky-200"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="max-w-[10rem] truncate">{label}</span>
      </a>
    );
  }

  return (
    <span
      data-testid="ph-source-local"
      title={source}
      className="inline-flex max-w-full items-center rounded-xl bg-slate-500/10 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300"
    >
      מקור: {label}
    </span>
  );
}
