"use client";

import Link from "next/link";
import {
  Heart,
  CheckCircle2,
  ExternalLink,
  MapPin,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trees,
  Clock,
  Wallet,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  HOTEL_TIER_META,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import { MiniTaiwanMap } from "@/components/3d/MiniTaiwanMap";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

interface PlaceDetailClientProps {
  place: EnrichedPlace;
  nearbyPlaces: EnrichedPlace[];
}

export function PlaceDetailClient({
  place,
  nearbyPlaces,
}: PlaceDetailClientProps) {
  const store = useTripStore();
  const isFav = store.favorites.includes(place.id);
  const isDone = store.donePlaces.includes(place.id);

  const googleMapsUrl = buildGoogleMapsUrl(place);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-6xl px-4 pt-28 pb-20 md:px-6 md:pt-24"
    >
      {/* Breadcrumb Back Navigation */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
          <Link
            href="/"
            onClick={() => tripActions.selectCity(place.cityId)}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900/5 px-3 py-1.5 hover:bg-slate-900/10 dark:bg-white/10"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>חזרה למפת 3D ({place.cityNameHe})</span>
          </Link>
          {place.kind === "food" && (
            <Link
              href="/food"
              className="rounded-xl bg-rose-500/15 px-3 py-1.5 text-rose-700 dark:text-rose-300"
            >
              כל מקומות האוכל
            </Link>
          )}
          {place.kind === "hotel" && (
            <Link
              href="/hotels"
              className="rounded-xl bg-sky-500/15 px-3 py-1.5 text-sky-700 dark:text-sky-300"
            >
              השוואת מלונות
            </Link>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Right Column: Place Details */}
        <div className="space-y-6 lg:col-span-7">
          <div className="glass-panel rounded-3xl p-6 md:p-8">
            {/* Category & Verification Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {place.kind === "attraction" && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-extrabold text-amber-800 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    אטרקציה
                  </span>
                  {place.isNature && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      <Trees className="h-3.5 w-3.5" />
                      טבע ונוף
                    </span>
                  )}
                </>
              )}

              {place.kind === "food" && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-extrabold ${FOOD_TYPE_META[place.type].bgClass}`}
                >
                  {FOOD_TYPE_META[place.type].labelHe}
                </span>
              )}

              {place.kind === "hotel" && (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-extrabold ${HOTEL_TIER_META[place.tier].bgClass}`}
                >
                  מלון • {HOTEL_TIER_META[place.tier].labelHe}
                </span>
              )}

              <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-300">
                {place.cityNameHe} ({place.cityNameEn})
              </span>

              {"importance" in place && (
                <span className="text-sm font-bold text-amber-500">
                  {"★".repeat(place.importance)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="mt-4 font-display text-3xl font-black text-slate-900 md:text-4xl dark:text-white">
              {place.name}
            </h1>
            {place.nameZh && (
              <div className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                שם בסינית: {place.nameZh} • אזור: {place.city}
              </div>
            )}

            {/* Full Description */}
            <p className="mt-4 text-base leading-relaxed text-slate-800 dark:text-slate-200">
              {place.description}
            </p>

            {/* Price & Hours Box for Food / Hotel */}
            {(place.kind === "food" || place.kind === "hotel") && (
              <div className="mt-6 space-y-3 rounded-2xl border border-slate-900/10 bg-slate-900/5 p-4 dark:border-white/10 dark:bg-white/5">
                {place.priceText && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold">מחיר:</span>
                    <span className="font-mono font-bold">
                      {place.priceText}
                    </span>
                    {((place.kind === "food" && !place.priceVerified) ||
                      (place.kind === "hotel" && !place.verified)) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        לא מאומת
                      </span>
                    )}
                  </div>
                )}

                {place.kind === "food" && place.hours && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-bold">שעות פעילות:</span>
                    <span>{place.hours}</span>
                    {!place.hoursVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-3.5 w-3.5" />
                        לא מאומת
                      </span>
                    )}
                  </div>
                )}

                {place.kind === "hotel" && place.source && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    מקור בדיקה: {place.source}
                  </div>
                )}
              </div>
            )}

            {/* Coordinate Note (approxLocation) */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              <span>
                {place.approxLocation
                  ? `מיקום משוער סביב מרכז ${place.cityNameHe} (${place.lat.toFixed(4)}, ${place.lng.toFixed(4)})`
                  : `קואורדינטות מדויקות (${place.lat.toFixed(4)}, ${place.lng.toFixed(4)})`}
              </span>
            </div>

            {/* Action Buttons: Favorite, Done, Google Maps */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-900/10 pt-5 dark:border-white/10">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="toy-button inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md"
              >
                <MapPin className="h-4 w-4" />
                <span>פתח ב-Google Maps ({place.name})</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={() => tripActions.toggleFavorite(place.id)}
                className={`toy-button inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold ${
                  isFav
                    ? "border-rose-500 bg-rose-500 text-white"
                    : "border-slate-900/15 bg-white/80 text-slate-800 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                <span>{isFav ? "שמור במועדפים ♥" : "שמור למועדפים"}</span>
              </button>

              <button
                type="button"
                onClick={() => tripActions.toggleDone(place.id)}
                className={`toy-button inline-flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-bold ${
                  isDone
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-900/15 bg-white/80 text-slate-800 dark:border-white/15 dark:bg-slate-800 dark:text-white"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isDone ? "בוצע ✓" : "סמן כבוצע"}</span>
              </button>
            </div>
          </div>

          {/* Nearby Places in the Same City */}
          {nearbyPlaces.length > 0 && (
            <div className="glass-panel rounded-3xl p-6">
              <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
                עוד ב{place.cityNameHe} ({nearbyPlaces.length} מובילים)
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {nearbyPlaces.map((other) => (
                  <Link
                    key={other.id}
                    href={`/place/${other.id}`}
                    className="rounded-2xl border border-slate-900/10 bg-white/75 p-3 transition-all hover:border-orange-500 dark:border-white/10 dark:bg-slate-900/60"
                  >
                    <div className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      {other.name}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {other.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Left Column: 3D Map Focused on Place */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-3">
            <div className="glass-panel h-[440px] overflow-hidden rounded-3xl p-2 md:h-[520px]">
              <MiniTaiwanMap
                activeCityId={place.cityId}
                focusedPlaceId={place.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
