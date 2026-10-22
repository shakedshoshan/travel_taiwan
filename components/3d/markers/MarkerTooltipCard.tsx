"use client";

import Image from "next/image";
import Link from "next/link";
import { WorldHtml } from "../WorldHtml";
import { buildGoogleMapsUrl } from "@/lib/data/selectors";
import { getPlaceImage } from "@/lib/data/placeImages";
import { tripActions } from "@/lib/store/useTripStore";
import type { MarkerEntry } from "./markerConfig";

interface MarkerTooltipCardProps {
  activeEntry: MarkerEntry;
  isFocused: boolean;
}

export function MarkerTooltipCard({
  activeEntry,
  isFocused,
}: MarkerTooltipCardProps) {
  const imageMeta = getPlaceImage(activeEntry.place);

  return (
    <WorldHtml
      position={[
        activeEntry.place.resolvedCoords.worldX,
        activeEntry.place.resolvedCoords.worldY + 0.42,
        activeEntry.place.resolvedCoords.worldZ,
      ]}
      center
      distanceFactor={15}
      zIndexRange={[35, 0]}
    >
      <div
        dir="rtl"
        className={`${
          isFocused
            ? "pointer-events-auto border-amber-300 ring-2 ring-amber-400"
            : "pointer-events-none border-white/40"
        } w-64 rounded-2xl border bg-slate-950/95 p-3 text-right text-xs text-white shadow-2xl backdrop-blur-md`}
      >
        <div className="relative mb-2 h-24 w-full overflow-hidden rounded-xl bg-slate-900">
          <Image
            src={imageMeta.src}
            alt={activeEntry.place.name}
            fill
            sizes="256px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <span className="absolute bottom-1 left-1.5 max-w-[90%] truncate text-[8.5px] text-slate-300">
            {imageMeta.creditHe}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {activeEntry.place.kind === "attraction"
              ? activeEntry.place.isNature
                ? "טבע ונוף"
                : "אטרקציה"
              : activeEntry.place.kind === "food"
                ? activeEntry.place.typeHe
                : `מלון • ${activeEntry.place.tierHe}`}
          </span>
          <span className="text-[10px] text-amber-400">
            {"★".repeat(activeEntry.importance)}
          </span>
        </div>
        <div className="mt-1 font-bold text-white">
          {activeEntry.place.name}
        </div>
        {activeEntry.place.nameZh && (
          <div className="text-[10px] text-amber-200/90">
            {activeEntry.place.nameZh}
          </div>
        )}
        <div className="text-[10px] text-slate-400">
          {activeEntry.place.cityNameHe}
        </div>
        <div className="mt-1 line-clamp-2 text-[11px] text-slate-300">
          {activeEntry.place.description}
        </div>
        {(activeEntry.place.kind === "food" ||
          activeEntry.place.kind === "hotel") &&
          activeEntry.place.priceText && (
            <div className="mt-1 font-mono text-[10.5px] font-bold text-emerald-300">
              {activeEntry.place.priceText}
            </div>
          )}
        {(activeEntry.place.kind === "food" ||
          activeEntry.place.kind === "hotel") &&
          !activeEntry.place.verified && (
            <div className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300">
              לא מאומת
            </div>
          )}

        {isFocused && (
          <div className="mt-2.5 flex flex-col gap-1.5 border-t border-white/15 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                tripActions.enterCityZoomMap(activeEntry.place.cityId);
                tripActions.focusPlace(
                  activeEntry.place.id,
                  activeEntry.place.cityId
                );
              }}
              className="min-h-[38px] w-full rounded-xl bg-amber-400 py-1.5 text-[11px] font-black text-slate-950 hover:bg-amber-300"
            >
              🔍 זום למפת יעד 3D ({activeEntry.place.cityNameHe})
            </button>
            <div className="flex items-center justify-between text-[11px]">
              <Link
                href={`/place/${activeEntry.place.id}`}
                className="font-bold text-orange-400 hover:underline"
              >
                לעמוד המקום המלא ←
              </Link>
              <a
                href={buildGoogleMapsUrl(activeEntry.place)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-300 hover:text-white"
              >
                נווט ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </WorldHtml>
  );
}
