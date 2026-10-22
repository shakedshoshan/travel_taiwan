"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Trees,
  Utensils,
  BedDouble,
  Calendar,
  AlertCircle,
  MapPin,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  getCityBundle,
  HOTEL_TIER_META,
} from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { FoodType, HotelTier } from "@/data/types";

type DrawerTab = "attractions" | "food" | "hotels" | "days";

export function CityDrawer() {
  const store = useTripStore();
  const [activeTab, setActiveTab] = useState<DrawerTab>("attractions");
  const [natureFilter, setNatureFilter] = useState<"all" | "nature" | "urban">(
    "all"
  );
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodType | "all">("all");
  const [maxFoodPrice, setMaxFoodPrice] = useState<number>(1000);
  const [hotelTierFilter, setHotelTierFilter] = useState<HotelTier | "all">(
    "all"
  );

  const bundle = useMemo(() => {
    if (!store.selectedCityId) return null;
    return getCityBundle(store.selectedCityId);
  }, [store.selectedCityId]);

  if (!bundle) return null;

  const { city, attractions, food, hotels, legs, daysHere } = bundle;

  const filteredAttractions = attractions.filter((a) => {
    if (natureFilter === "nature") return a.isNature;
    if (natureFilter === "urban") return !a.isNature;
    return true;
  });

  const filteredFood = food.filter((f) => {
    if (foodTypeFilter !== "all" && f.type !== foodTypeFilter) return false;
    if (
      maxFoodPrice < 1000 &&
      f.priceMin !== null &&
      f.priceMin > maxFoodPrice
    ) {
      return false;
    }
    return true;
  });

  const filteredHotels = hotels.filter((h) => {
    if (hotelTierFilter !== "all" && h.tier !== hotelTierFilter) return false;
    return true;
  });

  const selectedHotelIdForCity = store.selectedHotels[city.id];

  return (
    <AnimatePresence>
      <motion.aside
        key={city.id}
        dir="rtl"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="glass-panel pointer-events-auto fixed right-0 bottom-0 left-0 z-30 flex max-h-[80vh] flex-col rounded-t-3xl md:top-20 md:right-auto md:bottom-6 md:left-6 md:max-h-[calc(100vh-6.5rem)] md:w-[440px] md:rounded-3xl"
      >
        {/* Mobile grab handle */}
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-400/40 md:hidden" />

        {/* City Header */}
        <div className="flex items-start justify-between border-b border-slate-900/10 p-4 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-black text-slate-900 dark:text-white">
                {city.nameHe}
              </h2>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {city.nameEn}
              </span>
              {city.onRoute ? (
                <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-300">
                  {city.days} ימים במסלול
                </span>
              ) : (
                <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  טיול יום / מחוץ לציר הלינה
                </span>
              )}
            </div>
            {city.dates.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-orange-500" />
                <span>תאריכים: {city.dates.join(" • ")}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => tripActions.selectCity(null)}
            className="toy-button rounded-2xl bg-slate-900/5 p-2 text-slate-600 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-300"
            aria-label="סגור חלונית עיר"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-4 gap-1 border-b border-slate-900/10 bg-slate-900/5 p-1.5 dark:border-white/10 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("attractions")}
            className={`flex items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition-all ${
              activeTab === "attractions"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>אטרקציות ({attractions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("food")}
            className={`flex items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition-all ${
              activeTab === "food"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:text-slate-300"
            }`}
          >
            <Utensils className="h-3.5 w-3.5 text-rose-500" />
            <span>אוכל ({food.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("hotels")}
            className={`flex items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition-all ${
              activeTab === "hotels"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <BedDouble className="h-3.5 w-3.5 text-sky-500" />
            <span>מלונות ({hotels.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("days")}
            className={`flex items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold transition-all ${
              activeTab === "days"
                ? "bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
            <span>ימים ({daysHere.length})</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {/* TAB 1: ATTRACTIONS */}
          {activeTab === "attractions" && (
            <>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    ["all", "הכל"],
                    ["nature", "טבע ונוף"],
                    ["urban", "עירוני ותרבות"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNatureFilter(val)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                      natureFilter === val
                        ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                        : "bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredAttractions.length === 0 ? (
                <div className="rounded-2xl bg-slate-900/5 p-6 text-center text-sm text-slate-500 dark:bg-white/5">
                  אין אטרקציות בסינון הנוכחי בעיר זו.
                </div>
              ) : (
                filteredAttractions.map((item) => {
                  const isFav = store.favorites.includes(item.id);
                  const isDone = store.donePlaces.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        isDone
                          ? "border-emerald-500/40 bg-emerald-500/5 opacity-80"
                          : "border-slate-900/10 bg-white/75 hover:border-orange-400/50 dark:border-white/10 dark:bg-slate-900/65"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={`/place/${item.id}`}
                              className="font-display text-sm font-extrabold text-slate-900 hover:text-orange-600 dark:text-white dark:hover:text-amber-300"
                            >
                              {item.name}
                            </Link>
                            {item.isNature && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                <Trees className="h-3 w-3" />
                                טבע
                              </span>
                            )}
                            <span className="text-xs font-bold text-amber-500">
                              {"★".repeat(item.importance)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            {item.city}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => tripActions.toggleFavorite(item.id)}
                            className={`rounded-xl p-1.5 ${
                              isFav
                                ? "bg-rose-500/15 text-rose-500"
                                : "text-slate-400 hover:bg-slate-900/5"
                            }`}
                            title="הוסף למועדפים"
                          >
                            <Heart
                              className={`h-4 w-4 ${isFav ? "fill-current" : ""}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => tripActions.toggleDone(item.id)}
                            className={`rounded-xl p-1.5 ${
                              isDone
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "text-slate-400 hover:bg-slate-900/5"
                            }`}
                            title="סמן כבוצע"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {item.description}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-900/5 pt-2 text-[11px] dark:border-white/5">
                        <Link
                          href={`/place/${item.id}`}
                          className="font-bold text-orange-600 hover:underline dark:text-amber-300"
                        >
                          פרטים מלאים והתמקדות ←
                        </Link>
                        <a
                          href={buildGoogleMapsUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>Google Maps</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: FOOD */}
          {activeTab === "food" && (
            <>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1">
                  {(
                    [
                      ["all", "הכל"],
                      ["michelin-bib", "מישלן ביב"],
                      ["market", "שוק לילה"],
                      ["hidden-local", "מקומי נסתר"],
                      ["cheap", "זול"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFoodTypeFilter(val)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                        foodTypeFilter === val
                          ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                          : "bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/5 px-3 py-1.5 text-xs dark:bg-white/5">
                  <span>סינון מחיר מקסימלי:</span>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    step={50}
                    value={maxFoodPrice}
                    onChange={(e) => setMaxFoodPrice(Number(e.target.value))}
                    className="w-28 accent-orange-500"
                  />
                  <span className="font-mono font-bold">
                    {maxFoodPrice >= 1000 ? "ללא הגבלה" : `עד NT$${maxFoodPrice}`}
                  </span>
                </div>
              </div>

              {filteredFood.length === 0 ? (
                <div className="rounded-2xl bg-slate-900/5 p-6 text-center text-sm text-slate-500 dark:bg-white/5">
                  אין מקומות אוכל בסינון זה בעיר זו.
                </div>
              ) : (
                filteredFood.map((item) => {
                  const meta = FOOD_TYPE_META[item.type];
                  const isFav = store.favorites.includes(item.id);
                  const isDone = store.donePlaces.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-900/10 bg-white/75 p-3.5 dark:border-white/10 dark:bg-slate-900/65"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={`/place/${item.id}`}
                              className="font-display text-sm font-extrabold text-slate-900 hover:text-orange-600 dark:text-white"
                            >
                              {item.name}
                            </Link>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.bgClass}`}
                            >
                              {meta.labelHe}
                            </span>
                            <span className="text-xs font-bold text-amber-500">
                              {"★".repeat(item.importance)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => tripActions.toggleFavorite(item.id)}
                            className={`rounded-xl p-1.5 ${
                              isFav ? "text-rose-500" : "text-slate-400"
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 ${isFav ? "fill-current" : ""}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => tripActions.toggleDone(item.id)}
                            className={`rounded-xl p-1.5 ${
                              isDone ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {item.description}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        {item.priceText && (
                          <span className="rounded-lg bg-slate-900/5 px-2 py-0.5 font-mono font-bold text-slate-800 dark:bg-white/10 dark:text-slate-200">
                            {item.priceText}
                          </span>
                        )}
                        {!item.priceVerified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            <AlertCircle className="h-3 w-3" />
                            מחיר לא מאומת
                          </span>
                        )}
                        {item.hours && (
                          <span className="text-slate-600 dark:text-slate-400">
                            שעות: {item.hours}
                          </span>
                        )}
                        {!item.hoursVerified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            לא מאומת
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-900/5 pt-2 text-[11px] dark:border-white/5">
                        <Link
                          href={`/place/${item.id}`}
                          className="font-bold text-orange-600 hover:underline dark:text-amber-300"
                        >
                          עמוד מקום מלא ←
                        </Link>
                        <a
                          href={buildGoogleMapsUrl(item)}
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
                })
              )}
            </>
          )}

          {/* TAB 3: HOTELS */}
          {activeTab === "hotels" && (
            <>
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    ["all", "כל הרמות"],
                    ["cheap", "זול"],
                    ["quality", "איכותי"],
                    ["splurge", "פינוק"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setHotelTierFilter(val)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                      hotelTierFilter === val
                        ? "bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950"
                        : "bg-slate-900/5 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredHotels.length === 0 ? (
                <div className="rounded-2xl bg-slate-900/5 p-6 text-center text-sm text-slate-500 dark:bg-white/5">
                  אין מלונות שמורים עבור עיר זו.
                </div>
              ) : (
                filteredHotels.map((hotel) => {
                  const tierMeta = HOTEL_TIER_META[hotel.tier];
                  const isChosenForBudget = selectedHotelIdForCity === hotel.id;

                  return (
                    <div
                      key={hotel.id}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        isChosenForBudget
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-900/10 bg-white/75 dark:border-white/10 dark:bg-slate-900/65"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={`/place/${hotel.id}`}
                              className="font-display text-sm font-extrabold text-slate-900 hover:text-orange-600 dark:text-white"
                            >
                              {hotel.name}
                            </Link>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tierMeta.bgClass}`}
                            >
                              {hotel.tierHe}
                            </span>
                            {!hotel.verified && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                <AlertCircle className="h-3 w-3" />
                                לא מאומת
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            tripActions.selectHotelForCity(city.id, hotel.id)
                          }
                          className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${
                            isChosenForBudget
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-900/10 text-slate-700 hover:bg-slate-900/20 dark:bg-white/10 dark:text-slate-200"
                          }`}
                        >
                          {isChosenForBudget ? "נבחר לתקציב ✓" : "בחר לתקציב"}
                        </button>
                      </div>

                      <p className="mt-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {hotel.description}
                      </p>

                      {/* Always display full priceText as required */}
                      <div className="mt-2 rounded-xl bg-slate-900/5 p-2 text-[11px] font-medium text-slate-800 dark:bg-white/5 dark:text-slate-200">
                        <span className="font-bold">מחיר ללילה: </span>
                        {hotel.priceText}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <Link
                          href={`/place/${hotel.id}`}
                          className="font-bold text-orange-600 hover:underline dark:text-amber-300"
                        >
                          פרטי מלון ←
                        </Link>
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
                })
              )}
            </>
          )}

          {/* TAB 4: DAYS HERE */}
          {activeTab === "days" && (
            <div className="space-y-3">
              {legs.length === 0 ? (
                <div className="rounded-2xl bg-slate-900/5 p-5 text-center text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  עיר זו אינה תחנת לינה ראשית ב-10 מקטעי המסלול, אך ניתן לשלב אותה כטיול יום מערי הבסיס הסמוכות.
                </div>
              ) : (
                legs.map((leg) => (
                  <div
                    key={leg.id}
                    className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-extrabold text-orange-700 dark:text-orange-300">
                        מקטע {leg.order}: {leg.focus}
                      </span>
                      <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-slate-900 dark:bg-slate-900 dark:text-amber-300">
                        {leg.dates} ({leg.days} ימים)
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                      {leg.anchor}
                    </p>
                    {leg.notes && (
                      <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                        הערות: {leg.notes}
                      </p>
                    )}
                  </div>
                ))
              )}

              {daysHere.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    ימים ספציפיים בציר הזמן (לחצו לקפיצה במפה):
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {daysHere.map((d) => (
                      <button
                        key={d.dayIndex}
                        type="button"
                        onClick={() =>
                          tripActions.setCurrentDayIndex(d.dayIndex)
                        }
                        className={`rounded-xl border p-2 text-right text-xs transition-all ${
                          store.currentDayIndex === d.dayIndex
                            ? "border-orange-500 bg-orange-500 text-white font-bold"
                            : "border-slate-900/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/5"
                        }`}
                      >
                        <div>
                          יום {d.dayNumber} • {d.dateShort}
                        </div>
                        <div className="text-[10px] opacity-80">
                          {d.weekdayHe} ({d.legFocus})
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
