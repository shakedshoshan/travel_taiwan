"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  countPhilippinesByCategory,
  getPhilippinesRowsForCategory,
} from "@/lib/data/philippines/loaders";
import {
  PHILIPPINES_CATEGORIES,
  type PhilippinesCategoryMeta,
} from "@/lib/data/philippines/categories";
import type { PhilippinesCategoryId, PhilippinesListRow } from "@/lib/data/philippines/types";
import { BackToTop, CityJumpBar } from "@/components/ui/CityJumpBar";
import {
  PhilippinesGroupHeader,
  PhilippinesRowCard,
} from "./PhilippinesRowCard";

const counts = countPhilippinesByCategory();

export function PhilippinesExplorer() {
  const [category, setCategory] = useState<PhilippinesCategoryId>("attractions");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeJumpId, setActiveJumpId] = useState("");

  const categoryMeta: PhilippinesCategoryMeta = useMemo(
    () => PHILIPPINES_CATEGORIES.find((c) => c.id === category)!,
    [category]
  );

  const filteredRows = useMemo(() => {
    const base = getPhilippinesRowsForCategory(category);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((row) => {
      const haystack = [
        row.name,
        row.description,
        row.groupLabel,
        "city" in row ? row.city : "",
        row.source,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [category, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; rows: PhilippinesListRow[] }>();
    for (const row of filteredRows) {
      const entry = map.get(row.groupKey) ?? {
        label: row.groupLabel,
        rows: [],
      };
      entry.rows.push(row);
      map.set(row.groupKey, entry);
    }
    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [filteredRows]);

  const jumpItems = useMemo(
    () =>
      grouped.map((g) => ({
        id: `ph-${category}-${g.key}`,
        label: g.label,
        meta: `(${g.rows.length})`,
      })),
    [grouped, category]
  );

  return (
    <div
      dir="rtl"
      className="app-scroll-page mx-auto max-w-6xl px-3.5 md:px-6"
      data-testid="philippines-page"
    >
      <div className="mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-[var(--surface)] p-4 shadow-xs dark:border-slate-800">
        <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white">
          פיליפינים — מדריך הטיול
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          רשימה לפי עיר וקטגוריה · סטטוס אימות ומקור לכל פריט
        </p>
      </div>

      <div
        style={{ top: "calc(3.4rem + env(safe-area-inset-top))" }}
        className="sticky z-30 -mx-3.5 mb-3 border-b border-slate-200/80 bg-background/95 px-3.5 py-2 backdrop-blur-md md:mx-0 md:rounded-3xl md:border dark:border-slate-800"
      >
        <div className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
          <Search className="h-4 w-4 shrink-0 text-teal-600" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש בשם, עיר, תיאור או מקור..."
            className="min-h-11 w-full bg-transparent text-base font-medium outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="נקה חיפוש"
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="fade-edge-scroll no-scrollbar mt-2 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-3">
          {PHILIPPINES_CATEGORIES.map((cat) => {
            const active = cat.id === category;
            const count = counts[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  setActiveJumpId("");
                }}
                className={`flex min-h-11 shrink-0 snap-start items-center gap-1 rounded-full px-3 text-xs font-bold whitespace-nowrap ${
                  active
                    ? `bg-gradient-to-r ${cat.accentClass} text-white shadow-xs`
                    : "bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <span aria-hidden>{cat.emoji}</span>
                <span>
                  {cat.labelHe} ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {jumpItems.length > 1 && (
        <div className="sticky top-[10.5rem] z-20 -mx-3.5 mb-3 hidden bg-background/95 px-3.5 py-1 lg:block md:top-[11rem]">
          <CityJumpBar
            items={jumpItems}
            activeId={activeJumpId}
            onJump={(id) => {
              setActiveJumpId(id);
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>
      )}

      {searchQuery ? (
        <p className="mb-3 text-xs font-bold text-slate-600 dark:text-slate-400">
          {filteredRows.length} תוצאות · {categoryMeta.labelHe}
        </p>
      ) : null}

      <div className="space-y-4">
        {grouped.map((group) => {
          const sectionId = `ph-${category}-${group.key}`;
          return (
            <section key={sectionId}>
              <PhilippinesGroupHeader
                id={sectionId}
                label={group.label}
                count={group.rows.length}
              />
              <div className="space-y-3">
                {group.rows.map((row) => (
                  <PhilippinesRowCard key={row.id} row={row} />
                ))}
              </div>
            </section>
          );
        })}
        {filteredRows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400">
            לא נמצאו תוצאות — נסו חיפוש אחר או קטגוריה אחרת.
          </p>
        )}
      </div>

      <BackToTop />
    </div>
  );
}
