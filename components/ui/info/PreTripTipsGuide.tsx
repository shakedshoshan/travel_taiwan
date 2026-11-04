"use client";

import {
  AppWindow,
  Banknote,
  ChevronDown,
  ExternalLink,
  Globe,
  Plane,
  ShieldAlert,
  Smartphone,
  Train,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import tipsData from "@/data/tips.json";

type TipsSection = (typeof tipsData.sections)[number];

const SECTION_ICONS: Record<string, LucideIcon> = {
  entry: Plane,
  money: Banknote,
  sim: Smartphone,
  transport: Train,
  apps: AppWindow,
  general: ShieldAlert,
};

function UnverifiedBadge() {
  return (
    <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:bg-amber-400/25 dark:text-amber-100">
      לא אומת
    </span>
  );
}

function TipsTable({
  headersHe,
  rows,
}: {
  headersHe: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
      <table className="min-w-full text-right text-xs">
        <thead>
          <tr className="bg-slate-100/90 dark:bg-slate-800/80">
            {headersHe.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2 font-extrabold text-slate-800 dark:text-slate-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-t border-slate-100 odd:bg-white even:bg-slate-50/80 dark:border-slate-800 dark:odd:bg-slate-900/40 dark:even:bg-slate-800/30"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 align-top leading-relaxed text-slate-700 dark:text-slate-200"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionBody({ section }: { section: TipsSection }) {
  const table = "table" in section ? section.table : undefined;
  const items = "items" in section ? section.items : undefined;
  const links = "links" in section ? section.links : undefined;
  const introHe = "introHe" in section ? section.introHe : undefined;

  return (
    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {introHe ? (
        <p className="text-xs leading-relaxed font-semibold text-slate-600 dark:text-slate-300">
          {introHe}
        </p>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              <span className="min-w-0 flex-1">{item.textHe}</span>
              {"unverified" in item && item.unverified ? (
                <UnverifiedBadge />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {table ? (
        <TipsTable headersHe={table.headersHe} rows={table.rows} />
      ) : null}

      {links && links.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 text-xs font-bold text-sky-900 underline-offset-2 hover:underline dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-100"
            >
              <span>{link.labelHe}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PreTripTipsGuide() {
  return (
    <section
      id="pretrip-guide"
      aria-label={tipsData.titleHe}
      className="scroll-mt-28 space-y-3 rounded-3xl border-2 border-orange-500/35 bg-gradient-to-br from-orange-500/10 via-white to-emerald-500/5 p-4 shadow-xs md:p-5 dark:border-orange-400/30 dark:from-orange-500/10 dark:via-slate-900 dark:to-emerald-500/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-orange-700 dark:text-amber-300">
            <Globe className="h-4 w-4" />
            <span>{tipsData.titleHe}</span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-700 dark:text-slate-200">
            {tipsData.subtitleHe}
          </p>
        </div>
        <span className="rounded-full bg-slate-900/5 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
          עודכן {tipsData.updatedHe}
        </span>
      </div>

      <div className="space-y-2">
        {tipsData.sections.map((section, index) => {
          const Icon = SECTION_ICONS[section.id] ?? Globe;
          const defaultOpen = index === 0;
          return (
            <details
              key={section.id}
              open={defaultOpen}
              className="group rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900/90"
            >
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 text-xs font-extrabold text-slate-900 dark:text-white">
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-orange-500" />
                  <span className="truncate">{section.titleHe}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <SectionBody section={section} />
            </details>
          );
        })}
      </div>
    </section>
  );
}
