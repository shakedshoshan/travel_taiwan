"use client";

import Link from "next/link";
import {
  Heart,
  Navigation,
  AlertCircle,
  Clock,
  Trees,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  formatDisplayPriceText,
  HOTEL_TIER_META,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import { getPlaceImage } from "@/lib/data/placeImages";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

interface PlaceCardProps {
  place: EnrichedPlace;
  distanceKm?: number | null;
  compact?: boolean;
  showHotelBudgetAction?: boolean;
}

export function PlaceCard({
  place,
  distanceKm = null,
  compact = false,
  showHotelBudgetAction = false,
}: PlaceCardProps) {
  const store = useTripStore();
  const isFav = store.favorites.includes(place.id);
  const isDone = store.donePlaces.includes(place.id);
  const imageMeta = getPlaceImage(place);
  const googleMapsUrl = buildGoogleMapsUrl(place);

  const isChosenHotel =
    place.kind === "hotel" && store.selectedHotels[place.cityId] === place.id;

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
      className={`overflow-hidden rounded-3xl border transition-all ${
        isDone
          ? "border-emerald-500/40 bg-emerald-500/5 opacity-85"
          : isChosenHotel
            ? "border-emerald-500 bg-white shadow-md dark:bg-slate-900"
            : "border-slate-200/90 bg-white shadow-sm hover:border-orange-400/60 dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {/* Photo Banner with Credit Badge */}
      <Link
        href={`/place/${place.id}`}
        className={`relative block w-full overflow-hidden bg-slate-900 ${
          compact ? "h-28" : "h-36"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageMeta.src}
          alt={
            imageMeta.match === "representative"
              ? `${place.name} (תמונה מייצגת)`
              : place.name
          }
          title={imageMeta.attribution}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

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
              <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                {HOTEL_TIER_META[place.tier].labelHe}
              </span>
            )}

            <span className="rounded-full bg-slate-950/75 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
              {place.cityNameHe}
            </span>

            {typeof distanceKm === "number" && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} מ׳`
                  : `${distanceKm.toFixed(1)} ק״מ`}
              </span>
            )}
          </div>

          {"importance" in place && (
            <span className="rounded-full bg-slate-950/75 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-xs">
              {"★".repeat(place.importance)}
            </span>
          )}
        </div>

        {/* Photo Credit Pill */}
        <span
          title={imageMeta.attribution}
          className="absolute bottom-1.5 left-2.5 max-w-[85%] truncate rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] text-slate-200 backdrop-blur-xs"
        >
          {imageMeta.creditHe}
        </span>
      </Link>

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

          <button
            type="button"
            onClick={() => tripActions.toggleDone(place.id)}
            aria-label={isDone ? "בטל סימון בוצע" : "סמן כבוצע"}
            title={isDone ? "בוצע" : "סמן כבוצע"}
            className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl transition-colors ${
              isDone
                ? "bg-emerald-500/15 text-emerald-600"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
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
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Clock className="h-3 w-3 text-orange-500" />
                <span>{place.hours}</span>
              </span>
            )}
            {isUnverified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-3 w-3" />
                <span>לא מאומת</span>
              </span>
            )}
          </div>
        )}

        {/* Primary Two Actions: "נווט" and "♥" (>=44x44px) */}
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="toy-button inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 px-4 text-xs font-black text-white shadow-sm"
          >
            <Navigation className="h-4 w-4" />
            <span>נווט</span>
          </a>

          <button
            type="button"
            onClick={() => tripActions.toggleFavorite(place.id)}
            aria-label={isFav ? "הסר ממועדפים" : "שמור למועדפים"}
            className={`toy-button inline-flex min-h-[44px] min-w-[48px] items-center justify-center rounded-2xl border px-3 text-sm font-black transition-colors ${
              isFav
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-slate-200 bg-slate-50 text-rose-500 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {showHotelBudgetAction && place.kind === "hotel" && (
            <button
              type="button"
              onClick={() =>
                tripActions.selectHotelForCity(place.cityId, place.id)
              }
              className={`min-h-[44px] rounded-2xl px-3 text-xs font-black transition-colors ${
                isChosenHotel
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {isChosenHotel ? "נבחר לתקציב ✓" : "בחר לתקציב"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
