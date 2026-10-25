"use client";

import Link from "next/link";
import { Navigation } from "lucide-react";
import { placeCategoryLabel, placeImportance } from "@/lib/data/cityCategory";
import {
  buildGoogleMapsUrl,
  formatDisplayPriceText,
  getPlaceById,
} from "@/lib/data/selectors";

export function CityPlacePeekCard({ placeId }: { placeId: string }) {
  const place = getPlaceById(placeId);
  if (!place) return null;
  const price =
    place.kind === "attraction" ? "" : formatDisplayPriceText(place.priceText);

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center gap-1 px-3 pb-1">
      <div className="flex items-baseline gap-2">
        <h2 className="min-w-0 flex-1 truncate text-sm font-black">{place.name}</h2>
        <span className="shrink-0 text-xs font-black text-amber-600">
          ★ {placeImportance(place)}
        </span>
      </div>
      <p className="truncate text-[11px] font-bold text-slate-600 dark:text-slate-300">
        {placeCategoryLabel(place)}
        {place.nameZh ? <bdi dir="ltr"> · {place.nameZh}</bdi> : null}
        {price ? <bdi dir="ltr"> · {price}</bdi> : null}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={buildGoogleMapsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center gap-1 rounded-xl bg-orange-500 text-xs font-black text-white"
        >
          <Navigation className="h-4 w-4" />
          נווט ↗
        </a>
        <Link
          href={`/place/${place.id}`}
          className="flex h-11 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white dark:bg-amber-400 dark:text-slate-950"
        >
          פרטים
        </Link>
      </div>
    </div>
  );
}
