import { Star } from "lucide-react";
import type { PhilippinesListRow } from "@/lib/data/philippines/types";
import { PhilippinesStatusBadge } from "./PhilippinesStatusBadge";
import { PhilippinesSourceLink } from "./PhilippinesSourceLink";

function isNatureRow(row: PhilippinesListRow): boolean {
  return row.category === "nature" || Boolean(row.isNature);
}

function extraLines(row: PhilippinesListRow): string[] {
  const lines: string[] = [];
  if (row.dates) lines.push(`📅 ${row.dates}`);
  if (row.hours) lines.push(`🕐 ${row.hours}`);
  if (row.priceText) lines.push(`💰 ${row.priceText}`);
  if (row.tierHe) lines.push(`🏷️ ${row.tierHe}`);
  if (row.typeHe) lines.push(`🍽️ ${row.typeHe}`);
  return lines;
}

export function PhilippinesRowCard({ row }: { row: PhilippinesListRow }) {
  const nature = isNatureRow(row);
  const extras = extraLines(row);
  const subtitle =
    row.category === "practical" ? row.groupLabel : (row.city ?? row.groupLabel);

  return (
    <article
      className={`rounded-2xl border p-3.5 shadow-xs transition-colors ${
        nature
          ? "border-emerald-400/50 bg-gradient-to-br from-emerald-50/90 to-green-50/40 dark:border-emerald-500/35 dark:from-emerald-950/40 dark:to-slate-900/80"
          : "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/90"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display text-sm font-black leading-snug text-slate-900 dark:text-white">
              {row.name}
            </h3>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              {row.importance}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        <PhilippinesStatusBadge status={row.status} />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {row.description}
      </p>

      {extras.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          {extras.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PhilippinesSourceLink source={row.source} />
      </div>
    </article>
  );
}

export function PhilippinesGroupHeader({
  id,
  label,
  count,
}: {
  id: string;
  label: string;
  count: number;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-36 flex items-center justify-between gap-2 pt-2 pb-1"
    >
      <h2 className="font-display text-base font-black text-slate-900 dark:text-white">
        {label}
      </h2>
      <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
        {count}
      </span>
    </div>
  );
}
