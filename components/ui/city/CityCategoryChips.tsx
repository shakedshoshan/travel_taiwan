"use client";

import { useEffect, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import { snapChipRow, syncChipClip } from "@/components/ui/snapChips";
import { cityCategoryCounts } from "@/lib/data/cityCategory";
import type { CityBundle } from "@/lib/data/selectors";
import {
  tripActions,
  useTripStore,
  type CityCategory,
} from "@/lib/store/useTripStore";

const CHIPS: Array<{ id: CityCategory; label: string }> = [
  { id: "all", label: "הכל" },
  { id: "attractions", label: "אטרקציות" },
  { id: "food", label: "אוכל" },
  { id: "hotels", label: "מלונות" },
  { id: "nature", label: "טבע" },
];

export function CityCategoryChips({
  bundle,
  onOpenInfo,
}: {
  bundle: CityBundle;
  onOpenInfo: () => void;
}) {
  const active = useTripStore().cityCategory;
  const counts = cityCategoryCounts(bundle);
  const countKey = CHIPS.map((chip) => counts[chip.id]).join(".");
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const align = () => snapChipRow(row);
    align();
    const frame = window.requestAnimationFrame(align);
    const onScroll = () => syncChipClip(row);
    row.addEventListener("scroll", onScroll, { passive: true });
    row.addEventListener("scrollend", align);
    return () => {
      window.cancelAnimationFrame(frame);
      row.removeEventListener("scroll", onScroll);
      row.removeEventListener("scrollend", align);
    };
  }, [bundle.city.id, countKey]);

  return (
    <div className="flex items-center gap-1.5 px-2 pb-1">
      <div
        ref={rowRef}
        data-sheet-no-drag
        className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain"
      >
        {CHIPS.map((chip) => {
          const selected = active === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              data-chip-id={chip.id}
              onClick={() => tripActions.setCityCategory(chip.id)}
              className={`flex h-11 shrink-0 items-center rounded-full px-3 text-xs font-black whitespace-nowrap ${
                selected
                  ? "bg-orange-500 text-white"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              {chip.label}
              <span className="ms-1 font-bold opacity-80">{counts[chip.id]}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="מידע על העיר"
        onClick={onOpenInfo}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}
