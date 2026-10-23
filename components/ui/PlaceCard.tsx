"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Navigation,
  AlertCircle,
  Clock,
  Trees,
  Sparkles,
  BedDouble,
  Gem,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  formatDisplayPriceText,
  HOTEL_TIER_META,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import { formatDistanceAndWalk } from "@/lib/data/foodAndPlaceMeta";
import { getPlaceImage } from "@/lib/data/placeImages";
import { PhotoCreditPopover } from "./PhotoCreditPopover";

interface PlaceCardProps {
  place: EnrichedPlace;
  distanceKm?: number | null;
  compact?: boolean;
  /** Hotel cards without their own photo use a tier icon instead. */
  showPhoto?: boolean;
}

const TIER_ICON = {
  cheap: BedDouble,
  quality: Sparkles,
  splurge: Gem,
} as const;

export function PlaceCard({
  place,
  distanceKm = null,
  compact = false,
  showPhoto = true,
}: PlaceCardProps) {
  const useTierIcon = !showPhoto && place.kind === "hotel";
  const imageMeta = useTierIcon ? null : getPlaceImage(place);
  const googleMapsUrl = buildGoogleMapsUrl(place);
  const TierIcon = place.kind === "hotel" ? TIER_ICON[place.tier] : BedDouble;

  const isUnverified =
    (place.kind === "food" &&
      (!place.verified || !place.priceVerified || !place.hoursVerified)) ||
    (place.kind === "hotel" && !place.verified);

  const cleanPrice =
    place.kind === "food" || place.kind === "hotel"
      ? formatDisplayPriceText(place.priceText)
      : "";

  return (
    <article
      dir="rtl"
      className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all hover:border-orange-400/60 dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Photo Banner with "ⓘ" Credit Popover */}
      <div
        className={`relative w-full overflow-hidden bg-slate-900 ${
          compact ? "h-28" : "h-36"
        }`}
      >
        <Link href={`/place/${place.id}`} className="relative block h-full w-full">
          {useTierIcon && place.kind === "hotel" ? (
            <div
              className={`flex h-full w-full flex-col items-center justify-center gap-1 ${HOTEL_TIER_META[place.tier].bgClass}`}
            >
              <TierIcon className="h-8 w-8" />
              <span className="text-xs font-black">
                {HOTEL_TIER_META[place.tier].labelHe}
              </span>
            </div>
          ) : (
            imageMeta && (
              <Image
                src={imageMeta.src}
                alt={
                  imageMeta.match === "representative"
                    ? `${place.name} (תמונה מייצגת של ${place.cityNameHe})`
                    : place.name
                }
                title={imageMeta.attribution}
                fill
                sizes={
                  compact
                    ? "(max-width: 640px) 92vw, 320px"
                    : "(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 360px"
                }
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            )
          )}
          {!useTierIcon && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
          )}

          {/* Top Badges over Photo */}
          <div className="absolute top-2.5 right-2.5 left-2.5 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
              {place.kind === "attraction" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-slate-950 shadow-xs">
                  {place.isNature ? (
                    <>
                      <Trees className="h-3 w-3" />
                      <span>טבע ונוף</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      <span>אטרקציה</span>
                    </>
                  )}
                </span>
              )}
              {place.kind === "food" && (
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                  {FOOD_TYPE_META[place.type].labelHe}
                </span>
              )}
              {place.kind === "hotel" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                  <BedDouble className="h-3 w-3" />
                  <span>{HOTEL_TIER_META[place.tier].labelHe}</span>
                </span>
              )}

              <span className="rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                {place.cityNameHe}
              </span>

              {typeof distanceKm === "number" && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                  {formatDistanceAndWalk(distanceKm)}
                </span>
              )}
            </div>

            {"importance" in place && (
              <span className="rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-xs">
                {"★".repeat(place.importance)}
              </span>
            )}
          </div>
        </Link>

        {/* "ⓘ" Photo Credit Popover instead of text over the image */}
        {imageMeta && <PhotoCreditPopover image={imageMeta} />}
      </div>

      {/* Card Content */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/place/${place.id}`}
              className="block font-display text-base font-black leading-snug text-slate-900 hover:text-orange-600 dark:text-white dark:hover:text-amber-300"
            >
              {place.name}
            </Link>
            {place.nameZh && (
              <div className="mt-0.5 text-xs font-semibold text-orange-700 dark:text-amber-300">
                {place.nameZh}
              </div>
            )}
          </div>
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
          {place.description}
        </p>

        {/* Price, Hours & Unverified Badge */}
        {(cleanPrice ||
          (place.kind === "food" && place.hours) ||
          isUnverified) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
            {cleanPrice && (
              <span className="rounded-lg bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {cleanPrice}
              </span>
            )}
            {place.kind === "food" && place.hours && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>{place.hours}</span>
              </span>
            )}
            {isUnverified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
                <AlertCircle className="h-3 w-3" />
                <span>לא מאומת</span>
              </span>
            )}
          </div>
        )}

        <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="toy-button inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 px-4 text-xs font-black text-white shadow-sm"
          >
            <Navigation className="h-4 w-4" />
            <span>נווט</span>
          </a>
        </div>
      </div>
    </article>
  );
}
