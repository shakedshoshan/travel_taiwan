"use client";

import { useMemo, useState } from "react";
import type { LiveGuideEntry } from "@/lib/data/liveGuide";
import {
  collectUniqueAreas,
  collectUniqueTypes,
  filterAndSortLiveGuide,
  LIVE_GUIDE_DEFAULT_FILTERS,
  type LiveGuideFilterState,
} from "@/lib/data/liveGuideFilter";
import { LiveGuideFilters } from "./LiveGuideFilters";
import { LiveGuideTable } from "./LiveGuideTable";

export function LiveGuidePageClient({
  entries,
  totalCount,
  excludedCount,
  disclaimerHe,
  routeHighlightsHe,
}: {
  entries: LiveGuideEntry[];
  totalCount: number;
  excludedCount: number;
  disclaimerHe: string;
  routeHighlightsHe: string;
}) {
  const [filters, setFilters] = useState<LiveGuideFilterState>(
    LIVE_GUIDE_DEFAULT_FILTERS
  );

  const areas = useMemo(() => collectUniqueAreas(entries), [entries]);
  const types = useMemo(() => collectUniqueTypes(entries), [entries]);

  const filtered = useMemo(
    () => filterAndSortLiveGuide(entries, filters),
    [entries, filters]
  );

  const showEmpty = filtered.length === 0;

  return (
    <div className="space-y-4">
      <div className="surface-card rounded-3xl p-4 md:p-6">
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {disclaimerHe}
        </p>
        <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          {routeHighlightsHe}
        </p>
        {excludedCount > 0 ? (
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            הוסרו מהרשימה {excludedCount} רשומות (תערוכות/מוזיאונים בשם, לפי העדפת
            Shaked).
          </p>
        ) : null}
      </div>

      <LiveGuideFilters
        query={filters.query}
        onQueryChange={(query) => setFilters((f) => ({ ...f, query }))}
        area={filters.area}
        areas={areas}
        onAreaChange={(area) => setFilters((f) => ({ ...f, area }))}
        type={filters.type}
        types={types}
        onTypeChange={(type) => setFilters((f) => ({ ...f, type }))}
        priority={filters.priority}
        onPriorityChange={(priority) =>
          setFilters((f) => ({ ...f, priority }))
        }
        source={filters.source}
        onSourceChange={(source) => setFilters((f) => ({ ...f, source }))}
        statusBucket={filters.statusBucket}
        onStatusBucketChange={(statusBucket) =>
          setFilters((f) => ({ ...f, statusBucket }))
        }
        onReset={() => setFilters(LIVE_GUIDE_DEFAULT_FILTERS)}
      />

      <div className="surface-card rounded-3xl p-3.5 md:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
            טבלת ההמלצות
          </h2>
          <p
            className="text-xs font-bold text-slate-600 dark:text-slate-300"
            data-testid="live-guide-count"
          >
            מציג {filtered.length} מתוך {totalCount}
          </p>
        </div>

        {showEmpty ? (
          <div
            data-testid="live-guide-empty"
            className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center dark:border-slate-600 dark:bg-slate-800/40"
          >
            <p className="font-display text-base font-black text-slate-800 dark:text-slate-100">
              אין תוצאות שמתאימות למסננים
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              נסו לאפס את המסננים או לרחב את החיפוש.
            </p>
          </div>
        ) : (
          <LiveGuideTable entries={filtered} />
        )}
      </div>
    </div>
  );
}
