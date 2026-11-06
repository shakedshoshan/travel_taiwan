"use client";

import { ExternalLink } from "lucide-react";
import type { LiveGuideEntry } from "@/lib/data/liveGuide";
import {
  getLiveGuideDisplayName,
  isMizrahnikSource,
} from "@/lib/data/liveGuideFilter";

function PriorityStars({ n }: { n: number }) {
  return (
    <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-300">
      {"★".repeat(n)}
    </span>
  );
}

function MizrahnikTag() {
  return (
    <span className="shrink-0 rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-black text-orange-900 dark:bg-orange-500/25 dark:text-amber-200">
      מזרחניק
    </span>
  );
}

function SourceLine({ entry }: { entry: LiveGuideEntry }) {
  if (isMizrahnikSource(entry.source)) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <MizrahnikTag />
        {entry.sourceUrl ? (
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[11px] font-bold text-orange-700 underline-offset-2 hover:underline dark:text-amber-300"
          >
            מזרחניק
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : (
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            מזרחניק
          </span>
        )}
      </div>
    );
  }
  return (
    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
      {entry.source}
    </span>
  );
}

function RowCells({ entry }: { entry: LiveGuideEntry }) {
  const { primary, secondary } = getLiveGuideDisplayName(entry);
  return (
    <>
      <td className="sticky right-0 z-[1] min-w-[160px] max-w-[220px] bg-white/98 px-3 py-2 align-top font-display text-sm font-black text-slate-900 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] dark:bg-slate-900/98 dark:text-white min-[900px]:static min-[900px]:max-w-none min-[900px]:bg-transparent min-[900px]:shadow-none">
        <div className="leading-snug">{primary}</div>
        {secondary ? (
          <div dir="ltr" className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {secondary}
          </div>
        ) : null}
      </td>
      <td className="min-w-[120px] px-3 py-2 align-top text-xs font-bold text-slate-700 dark:text-slate-200">
        {entry.area}
      </td>
      <td className="min-w-[180px] max-w-[280px] px-3 py-2 align-top text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        {entry.note ? (
          entry.note
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
      <td className="min-w-[100px] px-3 py-2 align-top">
        <SourceLine entry={entry} />
      </td>
      <td className="min-w-[72px] px-3 py-2 align-top">
        <PriorityStars n={entry.priority} />
      </td>
      <td className="min-w-[120px] px-3 py-2 align-top">
        <div className="flex flex-wrap gap-1">
          {(entry.types ?? []).map((t) => (
            <span
              key={t}
              className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            >
              {t}
            </span>
          ))}
        </div>
      </td>
      <td className="min-w-[140px] px-3 py-2 align-top text-[11px] text-slate-600 dark:text-slate-300">
        {entry.status ? (
          entry.status
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
    </>
  );
}

export function LiveGuideTable({ entries }: { entries: LiveGuideEntry[] }) {
  return (
    <>
      {/* Desktop / wide: table */}
      <div
        className="hidden min-[900px]:block"
        data-testid="live-guide-table-desktop"
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-700">
          <table className="min-w-full border-collapse text-right text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90">
                <th className="sticky right-0 z-[2] min-w-[160px] px-3 py-2 text-xs font-black text-slate-900 dark:text-white">
                  שם
                </th>
                <th className="px-3 py-2 text-xs font-black">אזור</th>
                <th className="px-3 py-2 text-xs font-black">הסבר קצר</th>
                <th className="px-3 py-2 text-xs font-black">מקור</th>
                <th className="px-3 py-2 text-xs font-black">עדיפות</th>
                <th className="px-3 py-2 text-xs font-black">סוג</th>
                <th className="px-3 py-2 text-xs font-black">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  data-testid="live-guide-row"
                  data-entry-id={entry.id}
                  className="border-t border-slate-100 odd:bg-white even:bg-slate-50/80 dark:border-slate-800 dark:odd:bg-slate-900/40 dark:even:bg-slate-800/30"
                >
                  <RowCells entry={entry} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile / narrow: cards */}
      <ul
        className="space-y-3 min-[900px]:hidden"
        data-testid="live-guide-cards"
      >
        {entries.map((entry) => {
          const { primary, secondary } = getLiveGuideDisplayName(entry);
          return (
            <li key={entry.id}>
              <article
                data-testid="live-guide-row"
                data-entry-id={entry.id}
                className="surface-card rounded-2xl border border-slate-200/80 p-3.5 dark:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-black leading-snug text-slate-900 dark:text-white">
                      {primary}
                    </h2>
                    {secondary ? (
                      <p
                        dir="ltr"
                        className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400"
                      >
                        {secondary}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                      {entry.area}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <PriorityStars n={entry.priority} />
                    <SourceLine entry={entry} />
                  </div>
                </div>
                {entry.note ? (
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {entry.note}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(entry.types ?? []).map((t) => (
                    <span
                      key={t}
                      className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {entry.status ? (
                  <p className="mt-2 rounded-xl bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
                    סטטוס (מקור היסטורי): {entry.status}
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}
