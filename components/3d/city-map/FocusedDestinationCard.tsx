"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ExternalLink, MapPin } from "lucide-react";
import { buildGoogleMapsUrl } from "@/lib/data/selectors";
import { getPlaceImage } from "@/lib/data/placeImages";
import type { CityMapNode } from "./cityMapLayout";

interface FocusedDestinationCardProps {
  focusedNode: CityMapNode;
  cityNameHe: string;
}

export function FocusedDestinationCard({
  focusedNode,
  cityNameHe,
}: FocusedDestinationCardProps) {
  const imageMeta = getPlaceImage(focusedNode.place);

  return (
    <div className="glass-panel pointer-events-auto w-full rounded-3xl border-2 border-amber-400/70 p-4 shadow-2xl md:w-96">
      <div className="relative mb-3 h-32 w-full overflow-hidden rounded-2xl bg-slate-900">
        <Image
          src={imageMeta.src}
          alt={focusedNode.place.name}
          title={imageMeta.attribution}
          fill
          sizes="384px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <span className="absolute bottom-1.5 left-2 max-w-[90%] truncate rounded bg-slate-950/65 px-1.5 py-0.5 text-[9px] text-slate-200">
          {imageMeta.creditHe}
        </span>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
              style={{ backgroundColor: focusedNode.color }}
            >
              {focusedNode.badgeText}
            </span>
            <span className="text-xs font-bold text-amber-500">
              {"★".repeat(focusedNode.importance)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              ~{focusedNode.approxDistanceKm} ק״מ ממרכז {cityNameHe}
            </span>
          </div>
          <h3 className="mt-1 font-display text-lg font-black text-slate-900 dark:text-white">
            {focusedNode.place.name}
          </h3>
          {focusedNode.place.nameZh && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {focusedNode.place.nameZh}
            </div>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
        {focusedNode.place.description}
      </p>

      {/* Verbatim price & hours + unverified badges */}
      {(focusedNode.place.kind === "food" ||
        focusedNode.place.kind === "hotel") && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-900/5 p-2.5 text-xs dark:bg-white/5">
          {focusedNode.place.priceText && (
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {focusedNode.place.priceText}
            </span>
          )}
          {!focusedNode.place.verified && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-3 w-3" />
              לא מאומת
            </span>
          )}
          {focusedNode.place.kind === "food" && focusedNode.place.hours && (
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              • שעות: {focusedNode.place.hours}
            </span>
          )}
          {focusedNode.place.kind === "food" &&
            !focusedNode.place.hoursVerified && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                שעות: לא מאומת
              </span>
            )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-900/10 pt-2.5 text-xs dark:border-white/10">
        <Link
          href={`/place/${focusedNode.place.id}`}
          className="rounded-xl bg-orange-500 px-3 py-1.5 font-bold text-white hover:bg-orange-600"
        >
          לעמוד המקום המלא ←
        </Link>
        <a
          href={buildGoogleMapsUrl(focusedNode.place)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>נווט</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
