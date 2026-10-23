"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Calendar,
  Compass,
  ExternalLink,
  Navigation,
  Sparkles,
  Train,
  Utensils,
  X,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  formatDisplayPriceText,
  getCityBundle,
  getTimelineDays,
} from "@/lib/data/selectors";
import {
  computeDistanceKm,
  formatDistanceAndWalk,
} from "@/lib/data/foodAndPlaceMeta";
import practicalData from "@/data/practical.json";
import { getTripSpan } from "@/lib/data/tripSpan";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";

type LegTransportMap = typeof practicalData.legTransport;

export interface TripTodayStatus {
  phase: "before" | "during" | "after";
  inTrip: boolean;
  dayIndex: number;
  daysUntilStart: number;
  statusTextHe: string;
  chipLabelHe: string;
}

/**
 * Computes whether today's date (in Taiwan UTC+8, or overridden via ?today=YYYY-MM-DD)
 * falls within 6.11.2026 – 8.12.2026, or how many days remain until the trip starts.
 */
function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function getTripTodayStatus(overrideDateStr?: string | null): TripTodayStatus {
  const span = getTripSpan();
  const startUtcMs = isoToUtcMs(span.startIso);
  const endUtcMs = isoToUtcMs(span.endIso);
  const lastIndex = Math.max(0, span.dayCount - 1);

  let currentMidnightUtcMs: number;
  if (overrideDateStr && /^\d{4}-\d{2}-\d{2}$/.test(overrideDateStr)) {
    currentMidnightUtcMs = isoToUtcMs(overrideDateStr);
  } else {
    const twNow = new Date(Date.now() + 8 * 3600 * 1000);
    currentMidnightUtcMs = Date.UTC(
      twNow.getUTCFullYear(),
      twNow.getUTCMonth(),
      twNow.getUTCDate()
    );
  }

  if (currentMidnightUtcMs >= startUtcMs && currentMidnightUtcMs <= endUtcMs) {
    const dayIndex = Math.min(
      lastIndex,
      Math.max(0, Math.round((currentMidnightUtcMs - startUtcMs) / 86400000))
    );
    return {
      phase: "during",
      inTrip: true,
      dayIndex,
      daysUntilStart: 0,
      statusTextHe: "היום",
      chipLabelHe: "היום",
    };
  }

  if (currentMidnightUtcMs < startUtcMs) {
    const daysUntilStart = Math.max(
      1,
      Math.ceil((startUtcMs - currentMidnightUtcMs) / 86400000)
    );
    return {
      phase: "before",
      inTrip: false,
      dayIndex: 0,
      daysUntilStart,
      statusTextHe: `הטיול מתחיל בעוד ${daysUntilStart} ימים`,
      chipLabelHe: `עוד ${daysUntilStart} ימים`,
    };
  }

  return {
    phase: "after",
    inTrip: false,
    dayIndex: lastIndex,
    daysUntilStart: 0,
    statusTextHe: "הטיול הסתיים",
    chipLabelHe: "סיכום",
  };
}

export function TodayCardModal() {
  const store = useTripStore();
  const [todayOverride, setTodayOverride] = useState<string | null>(null);
  useEffect(() => {
    setTodayOverride(new URLSearchParams(window.location.search).get("today"));
  }, []);
  if (!store.isTodayCardOpen) return null;

  const days = getTimelineDays();
  const status = getTripTodayStatus(todayOverride);
  const activeDay = days[store.currentDayIndex] ?? days[status.dayIndex] ?? days[0];
  const bundle = getCityBundle(activeDay.cityId);

  // Tonight's recommended hotel
  const tonightHotel =
    bundle.hotels
      .filter((h) => h.tier === "cheap")
      .sort((a, b) => Number(b.verified) - Number(a.verified))[0] ??
    bundle.hotels[0] ??
    null;

  // Next transport from practical.json
  const nextLegKey = `leg-${String(Math.min(10, activeDay.legOrder + 1)).padStart(2, "0")}` as keyof LegTransportMap;
  const currentLegKey = activeDay.legId as keyof LegTransportMap;
  const transport =
    practicalData.legTransport[currentLegKey] ??
    practicalData.legTransport[nextLegKey];

  // Reference coordinates for 3 nearest must-eats
  const refLat =
    store.userCoords?.lat ??
    tonightHotel?.resolvedCoords.lat ??
    bundle.city.lat;
  const refLng =
    store.userCoords?.lng ??
    tonightHotel?.resolvedCoords.lng ??
    bundle.city.lng;

  const nearestMustEats = [...bundle.food]
    .sort((a, b) => {
      const impDiff = Math.min(5, b.importance) - Math.min(5, a.importance);
      if (impDiff !== 0 && a.importance < 4 && b.importance >= 4) return 1;
      if (impDiff !== 0 && a.importance >= 4 && b.importance < 4) return -1;
      const dA = computeDistanceKm(
        refLat,
        refLng,
        a.resolvedCoords.lat,
        a.resolvedCoords.lng
      );
      const dB = computeDistanceKm(
        refLat,
        refLng,
        b.resolvedCoords.lat,
        b.resolvedCoords.lng
      );
      return dA - dB;
    })
    .slice(0, 3);

  return (
    <div
      dir="rtl"
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-2.5 backdrop-blur-xs sm:items-center"
      onClick={() => tripActions.setTodayCardOpen(false)}
    >
      <div
        role="dialog"
        aria-label="כרטיס היום במסלול"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[86dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-black text-white">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {status.phase === "during"
                    ? `היום · יום ${activeDay.dayNumber}/${days.length}`
                    : status.chipLabelHe}
                </span>
              </span>
            </div>
            <h3 className="mt-1 font-display text-lg font-black text-slate-900 dark:text-white">
              {status.phase === "during"
                ? `${activeDay.dateShort} (${activeDay.weekdayHe}) · ${activeDay.cityNameHe}`
                : status.statusTextHe}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => tripActions.setTodayCardOpen(false)}
            aria-label="סגור כרטיס היום"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          {status.phase === "before" && (
            <div className="rounded-2xl bg-amber-400/15 p-3 text-slate-900 dark:text-amber-50">
              <p className="font-display text-base font-black">{status.statusTextHe}</p>
              <p className="mt-2 font-extrabold text-orange-700 dark:text-amber-300">
                המקטע הראשון: {days[0].legFocus} ({days[0].legDates})
              </p>
              <p className="mt-1 leading-relaxed">{days[0].legAnchor}</p>
            </div>
          )}
          {status.phase === "after" && <TripRecap />}
          {status.phase === "during" && (
          <>
          {/* 1. Today's Plan */}
          <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
            <div className="flex items-center gap-1.5 font-extrabold text-orange-600 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
              <span>תוכנית היום (מקטע {activeDay.legOrder}: {activeDay.legFocus})</span>
            </div>
            <p className="mt-1 leading-relaxed text-slate-800 dark:text-slate-100">
              {activeDay.legAnchor}
            </p>
            {activeDay.legNotes && (
              <p className="mt-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                דגש: {activeDay.legNotes}
              </p>
            )}
          </div>

          {/* 2. Tonight's Hotel */}
          {tonightHotel && (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-extrabold text-sky-800 dark:text-sky-300">
                  <BedDouble className="h-4 w-4" />
                  <span>המלון המומלץ להלילה ב{activeDay.cityNameHe}</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {formatDisplayPriceText(tonightHotel.priceText)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <Link
                  href={`/place/${tonightHotel.id}`}
                  onClick={() => tripActions.setTodayCardOpen(false)}
                  className="font-bold text-slate-900 hover:underline dark:text-white"
                >
                  {tonightHotel.name}
                </Link>
                <a
                  href={buildGoogleMapsUrl(tonightHotel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-xl bg-sky-600 px-2.5 text-[11px] font-bold text-white"
                >
                  <Navigation className="h-3 w-3" />
                  <span>נווט</span>
                </a>
              </div>
            </div>
          )}

          {/* 3. Next Transport with Booking Link */}
          {transport && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-extrabold text-emerald-800 dark:text-emerald-300">
                  <Train className="h-4 w-4" />
                  <span>תחבורה ומעבר הבא</span>
                </span>
                <a
                  href={transport.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-xl bg-emerald-600 px-2.5 text-[11px] font-bold text-white"
                >
                  <span>{transport.bookingLabelHe}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {transport.modeHe} · {transport.durationHe} ({transport.priceHe})
              </p>
            </div>
          )}

          {/* 4. 3 Nearest Must-Eats */}
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-3">
            <div className="mb-2 flex items-center gap-1.5 font-extrabold text-rose-700 dark:text-rose-300">
              <Utensils className="h-4 w-4" />
              <span>3 מקומות אוכל חובה הקרובים ביותר</span>
            </div>
            <div className="space-y-2">
              {nearestMustEats.map((food) => {
                const distKm = computeDistanceKm(
                  refLat,
                  refLng,
                  food.resolvedCoords.lat,
                  food.resolvedCoords.lng
                );
                return (
                  <div
                    key={food.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-2.5 py-2 dark:bg-slate-900/90"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/place/${food.id}`}
                        onClick={() => tripActions.setTodayCardOpen(false)}
                        className="block truncate font-bold text-slate-900 hover:underline dark:text-white"
                      >
                        {food.name}
                      </Link>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-300">
                        {formatDistanceAndWalk(distKm)}
                        {food.priceText
                          ? ` · ${formatDisplayPriceText(food.priceText)}`
                          : ""}
                      </div>
                    </div>
                    <a
                      href={buildGoogleMapsUrl(food)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg bg-orange-500 px-2.5 text-[10.5px] font-bold text-white"
                    >
                      נווט
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}

          <button
            type="button"
            onClick={() => {
              tripActions.setTodayCardOpen(false);
              tripActions.selectCity(activeDay.cityId, "half");
            }}
            className="toy-button flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-900 text-xs font-black text-white dark:bg-amber-400 dark:text-slate-950"
          >
            <Compass className="h-4 w-4" />
            <span>פתח את {activeDay.cityNameHe} במפה</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TripRecap() {
  const span = getTripSpan();
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
      <p className="font-display text-base font-black text-slate-900 dark:text-white">
        סיכום הטיול
      </p>
      <p className="mt-1 font-bold text-slate-700 dark:text-slate-200">
        {span.dayCount} ימים · {span.legCount} מקטעים · {span.dateRange}
      </p>
      <p className="mt-2 leading-relaxed text-slate-800 dark:text-slate-100">
        {span.routeCityNamesHe.join(" · ")}
      </p>
    </div>
  );
}
