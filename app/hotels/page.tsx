"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wallet,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  getAllCities,
  getHotels,
  HOTEL_TIER_META,
} from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { HotelTier } from "@/data/types";

const TIERS: readonly HotelTier[] = ["cheap", "quality", "splurge"];

export default function HotelsPage() {
  const store = useTripStore();
  const cities = getAllCities();
  const allHotels = getHotels();
  const [onlyVerified, setOnlyVerified] = useState(false);

  // Cities that have hotels in hotels.json
  const citiesWithHotels = useMemo(() => {
    const cityMap = new Map(cities.map((c) => [c.id, c]));
    const uniqueCityIds = Array.from(new Set(allHotels.map((h) => h.cityId)));
    return uniqueCityIds
      .map((id) => cityMap.get(id)!)
      .sort((a, b) => b.days - a.days);
  }, [cities, allHotels]);

  // Compute total trip stay estimate across all route cities
  const tripStaySummary = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;
    let totalNightsWithHotels = 0;

    for (const city of citiesWithHotels) {
      const nights = city.days;
      if (nights <= 0) continue;
      const chosenId = store.selectedHotels[city.id];
      const cityHotels = allHotels.filter((h) => h.cityId === city.id);
      const chosen =
        cityHotels.find((h) => h.id === chosenId) ?? cityHotels[0];
      if (chosen) {
        totalNightsWithHotels += nights;
        const pMin = chosen.priceMin ?? 0;
        const pMax = chosen.priceMax ?? pMin;
        minTotal += pMin * nights;
        maxTotal += pMax * nights;
      }
    }

    return { minTotal, maxTotal, totalNightsWithHotels };
  }, [citiesWithHotels, allHotels, store.selectedHotels]);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-6 md:pt-24"
    >
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-extrabold text-sky-600 dark:text-sky-300">
            <BedDouble className="h-3.5 w-3.5" />
            השוואת לינה בטייוואן • 37 מלונות והוסטלים
          </span>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-white">
            מלונות לפי עיר: זול מול איכותי מול פינוק
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            19 זולים • 14 איכותיים • 4 פינוק (מתוכם 7 עם מחירים חיים מאומתים לתאריכי הטיול).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyVerified(!onlyVerified)}
            className={`toy-button flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold ${
              onlyVerified
                ? "bg-emerald-600 text-white shadow-md"
                : "glass-panel text-slate-700 dark:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>הצג רק מחירים מאומתים (7)</span>
          </button>

          <button
            type="button"
            onClick={() => tripActions.setBudgetOpen(true)}
            className="toy-button flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md dark:bg-amber-400 dark:text-slate-950"
          >
            <Wallet className="h-4 w-4" />
            <span>פתח מחשבון תקציב מלא</span>
          </button>
        </div>
      </div>

      {/* Trip Stay Total Banner */}
      <div className="glass-panel mb-8 grid grid-cols-1 gap-4 rounded-3xl bg-gradient-to-l from-sky-600/15 via-emerald-500/10 to-amber-500/15 p-5 md:grid-cols-3">
        <div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            לילות במסלול עם מלונות בטבלה
          </div>
          <div className="mt-1 font-display text-2xl font-black text-slate-900 dark:text-white">
            {tripStaySummary.totalNightsWithHotels} לילות
          </div>
          <div className="text-[11px] text-slate-500">
            מחושב אוטומטית לפי ימי השהייה בכל עיר מ-cities.json
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            עלות לינה משוערת לכל הטיול (לפי הבחירה שלכם)
          </div>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300">
            NT${tripStaySummary.minTotal.toLocaleString()}–
            {tripStaySummary.maxTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            המספרים מבוססים על הטווח הראשון ב-priceText (ייתכן למיטה או לחדר)
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="rounded-2xl bg-amber-500/15 p-3 text-xs text-amber-900 dark:text-amber-200">
            <strong>שימו לב:</strong> מחירים המסומנים ב-
            <span className="mx-1 rounded bg-amber-500/25 px-1.5 py-0.5 font-bold">
              לא מאומת
            </span>
            הם הערכה בלבד; תמיד מוצג הטקסט המלא מתוך הקובץ המקורי.
          </div>
        </div>
      </div>

      {/* Per-City 3-Column Comparison (Cheap vs Quality vs Splurge) */}
      <div className="space-y-10">
        {citiesWithHotels.map((city) => {
          const cityHotels = allHotels.filter(
            (h) => h.cityId === city.id && (!onlyVerified || h.verified)
          );
          if (cityHotels.length === 0) return null;

          const chosenId = store.selectedHotels[city.id];
          const chosenHotel =
            allHotels.find((h) => h.id === chosenId) ?? cityHotels[0];
          const cityStayMin =
            chosenHotel && chosenHotel.priceMin !== null
              ? chosenHotel.priceMin * city.days
              : 0;
          const cityStayMax =
            chosenHotel && chosenHotel.priceMax !== null
              ? chosenHotel.priceMax * city.days
              : cityStayMin;

          return (
            <section
              key={city.id}
              className="glass-panel rounded-3xl p-5 md:p-6"
            >
              {/* City Header & Stay Calculator */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-900/10 pb-4 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                      {city.nameHe} ({city.nameEn})
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-extrabold text-orange-700 dark:text-orange-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {city.days} לילות ({city.dates.join(" • ")})
                    </span>
                  </div>
                </div>

                {chosenHotel && city.days > 0 && (
                  <div className="rounded-2xl bg-emerald-500/15 px-4 py-2 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      סה״כ שהייה משוער ב{city.nameHe} ({city.days} לילות ב-
                      {chosenHotel.name.split(" ")[0]}):{" "}
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-800 dark:text-emerald-300">
                      NT${cityStayMin.toLocaleString()}
                      {cityStayMax !== cityStayMin
                        ? `–${cityStayMax.toLocaleString()}`
                        : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* 3 Tier Columns */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {TIERS.map((tier) => {
                  const tierMeta = HOTEL_TIER_META[tier];
                  const tierHotels = cityHotels.filter((h) => h.tier === tier);

                  return (
                    <div
                      key={tier}
                      className="flex flex-col rounded-2xl border border-slate-900/10 bg-slate-900/[0.02] p-3.5 dark:border-white/10 dark:bg-white/[0.02]"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-extrabold ${tierMeta.bgClass}`}
                        >
                          {tierMeta.labelHe} ({tierHotels.length})
                        </span>
                      </div>

                      {tierHotels.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center rounded-xl py-8 text-xs text-slate-400">
                          אין מלונות בקטגוריה זו בעיר זו
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tierHotels.map((hotel) => {
                            const isSelected = chosenId === hotel.id;
                            const estMin =
                              hotel.priceMin !== null
                                ? hotel.priceMin * city.days
                                : null;
                            const estMax =
                              hotel.priceMax !== null
                                ? hotel.priceMax * city.days
                                : estMin;

                            return (
                              <div
                                key={hotel.id}
                                className={`rounded-2xl border p-3.5 transition-all ${
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-500/10 shadow-md"
                                    : "border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-slate-900/75"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <Link
                                    href={`/place/${hotel.id}`}
                                    className="font-display text-sm font-extrabold text-slate-900 hover:text-orange-600 dark:text-white"
                                  >
                                    {hotel.name}
                                  </Link>

                                  {hotel.verified ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                      <ShieldCheck className="h-3 w-3" />
                                      מאומת
                                    </span>
                                  ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                      <AlertCircle className="h-3 w-3" />
                                      לא מאומת
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                  {hotel.description}
                                </p>

                                {/* Always display priceText verbatim */}
                                <div className="mt-2.5 rounded-xl bg-slate-900/5 p-2.5 text-[11px] leading-relaxed text-slate-800 dark:bg-white/5 dark:text-slate-200">
                                  <div className="font-bold">
                                    מחיר ללילה:{" "}
                                    <span className="font-normal">
                                      {hotel.priceText}
                                    </span>
                                  </div>
                                  {estMin !== null && city.days > 0 && (
                                    <div className="mt-1 font-mono text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                                      סה״כ ל-{city.days} לילות: ~NT$
                                      {estMin.toLocaleString()}
                                      {estMax && estMax !== estMin
                                        ? `–${estMax.toLocaleString()}`
                                        : ""}
                                    </div>
                                  )}
                                </div>

                                {hotel.source && (
                                  <div className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                                    מקור: {hotel.source}
                                  </div>
                                )}

                                <div className="mt-3 flex items-center justify-between border-t border-slate-900/5 pt-2.5 text-xs dark:border-white/5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      tripActions.selectHotelForCity(
                                        city.id,
                                        hotel.id
                                      )
                                    }
                                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold ${
                                      isSelected
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-900/10 text-slate-800 hover:bg-slate-900/20 dark:bg-white/10 dark:text-white"
                                    }`}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>
                                      {isSelected ? "נבחר לתקציב" : "בחר לתקציב"}
                                    </span>
                                  </button>

                                  <a
                                    href={buildGoogleMapsUrl(hotel)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400"
                                  >
                                    <span>Google Maps</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
