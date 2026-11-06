"use client";

import type { ReactNode } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { LIVE_GUIDE_STATUS_BUCKETS } from "@/lib/data/liveGuideFilter";

export interface LiveGuideFiltersProps {
  query: string;
  onQueryChange: (v: string) => void;
  area: string;
  areas: string[];
  onAreaChange: (v: string) => void;
  type: string;
  types: string[];
  onTypeChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  source: string;
  onSourceChange: (v: string) => void;
  statusBucket: string;
  onStatusBucketChange: (v: string) => void;
  onReset: () => void;
}

const SOURCE_OPTIONS: { value: string; labelHe: string }[] = [
  { value: "", labelHe: "כל המקורות" },
  { value: "mizrahnik", labelHe: "מזרחניק" },
  { value: "app", labelHe: "מאגר האפליקציה" },
  { value: "shaked", labelHe: "העדפות Shaked" },
];

const PRIORITY_OPTIONS: { value: string; labelHe: string }[] = [
  { value: "", labelHe: "כל העדיפויות" },
  { value: "5", labelHe: "עדיפות 5 (חובה / בחירה מפורשת)" },
  { value: "3", labelHe: "עדיפות 3 (מומלץ)" },
  { value: "1", labelHe: "עדיפות 1 (רק במקרה מיוחד)" },
];

function SelectShell({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1 sm:min-w-[140px]">
      <label
        htmlFor={id}
        className="mb-1 block text-[11px] font-extrabold text-slate-600 dark:text-slate-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function LiveGuideFilters(props: LiveGuideFiltersProps) {
  const selectClass =
    "w-full min-h-11 rounded-xl border border-slate-200/90 bg-white/95 px-2.5 py-2 text-xs font-bold text-slate-900 shadow-xs dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100";

  return (
    <section
      aria-label="סינון והחיפוש בטבלת ההמלצות"
      className="surface-card rounded-3xl p-3.5 md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-display text-sm font-black text-slate-900 dark:text-white">
          <Filter className="h-4 w-4 text-orange-500" />
          <span>חיפוש וסינון</span>
        </div>
        <button
          type="button"
          onClick={props.onReset}
          className="toy-button flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold text-slate-700 dark:text-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          איפוס מסננים
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectShell id="live-guide-q" label="חיפוש חופשי">
          <input
            id="live-guide-q"
            data-testid="live-guide-search"
            type="search"
            dir="rtl"
            value={props.query}
            onChange={(ev) => props.onQueryChange(ev.target.value)}
            placeholder="שם, אזור, הערה, סוג..."
            className={selectClass}
          />
        </SelectShell>

        <SelectShell id="live-guide-area" label="אזור / עיר">
          <select
            id="live-guide-area"
            data-testid="live-guide-area"
            className={selectClass}
            value={props.area}
            onChange={(ev) => props.onAreaChange(ev.target.value)}
          >
            <option value="">כל האזורים ({props.areas.length})</option>
            {props.areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </SelectShell>

        <SelectShell id="live-guide-type" label="סוג פעילות">
          <select
            id="live-guide-type"
            data-testid="live-guide-type"
            className={selectClass}
            value={props.type}
            onChange={(ev) => props.onTypeChange(ev.target.value)}
          >
            <option value="">כל הסוגים</option>
            {props.types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </SelectShell>

        <SelectShell id="live-guide-priority" label="עדיפות">
          <select
            id="live-guide-priority"
            data-testid="live-guide-priority"
            className={selectClass}
            value={props.priority}
            onChange={(ev) => props.onPriorityChange(ev.target.value)}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.labelHe}
              </option>
            ))}
          </select>
        </SelectShell>

        <SelectShell id="live-guide-source" label="מקור">
          <select
            id="live-guide-source"
            data-testid="live-guide-source"
            className={selectClass}
            value={props.source}
            onChange={(ev) => props.onSourceChange(ev.target.value)}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value || "all-src"} value={o.value}>
                {o.labelHe}
              </option>
            ))}
          </select>
        </SelectShell>

        <SelectShell id="live-guide-status" label="סטטוס (קבוצה)">
          <select
            id="live-guide-status"
            data-testid="live-guide-status"
            className={selectClass}
            value={props.statusBucket}
            onChange={(ev) => props.onStatusBucketChange(ev.target.value)}
          >
            <option value="">כל הסטטוסים</option>
            {LIVE_GUIDE_STATUS_BUCKETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.labelHe}
              </option>
            ))}
          </select>
        </SelectShell>
      </div>
    </section>
  );
}
