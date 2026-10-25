"use client";

import { useCallback, useEffect, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { PlaceCard } from "@/components/ui/PlaceCard";
import type { PlaceImageMeta } from "@/lib/data/placeImages";
import type { EnrichedFood } from "@/lib/data/selectors";

export interface FoodRow {
  place: EnrichedFood;
  distanceKm: number | null;
  image: PlaceImageMeta | null;
  anchorId?: string;
}

export function FoodResultsList({
  rows,
  scrollToId,
  onActiveId,
}: {
  rows: FoodRow[];
  scrollToId: string | null;
  onActiveId: (id: string) => void;
}) {
  const [scrollMargin, setScrollMargin] = useState(0);
  const parentRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const top = node.offsetTop;
    setScrollMargin((current) => (current === top ? current : top));
  }, []);
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 340,
    overscan: 4,
    scrollMargin,
    measureElement: (element) => element.getBoundingClientRect().height,
  });
  const items = virtualizer.getVirtualItems();
  const firstIndex = items[0]?.index ?? 0;

  useEffect(() => {
    if (!scrollToId) return;
    const index = rows.findIndex((row) => row.anchorId === scrollToId);
    if (index >= 0) {
      virtualizer.scrollToIndex(index, { align: "start" });
    }
  }, [scrollToId, rows, virtualizer]);

  useEffect(() => {
    let anchor: string | undefined;
    for (let index = firstIndex; index < rows.length; index++) {
      if (rows[index]?.anchorId) {
        anchor = rows[index].anchorId;
        break;
      }
    }
    if (anchor) onActiveId(anchor);
  }, [firstIndex, rows, onActiveId]);

  return (
    <div
      ref={parentRef}
      className="relative w-full"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {items.map((item) => {
        const row = rows[item.index];
        if (!row) return null;
        return (
          <div
            key={row.place.id}
            data-index={item.index}
            ref={virtualizer.measureElement}
            id={row.anchorId}
            className="absolute inset-x-0 pb-3.5"
            style={{
              transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <PlaceCard
              place={row.place}
              distanceKm={row.distanceKm}
              image={row.image}
            />
          </div>
        );
      })}
    </div>
  );
}
