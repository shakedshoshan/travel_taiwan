"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Utensils,
  BedDouble,
  Info,
  ArrowLeft,
} from "lucide-react";
import {
  getAuditNotes,
  getCityBundle,
  getRouteLegs,
} from "@/lib/data/selectors";
import { MiniTaiwanMap } from "@/components/3d/MiniTaiwanMap";
import type { CityId } from "@/data/types";

export default function RoutePage() {
  const legs = getRouteLegs();
  const auditNotes = getAuditNotes();
  const [activeLegOrder, setActiveLegOrder] = useState<number>(1);
  const [activeCityId, setActiveCityId] = useState<CityId>(legs[0].cityId);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const order = Number(entry.target.getAttribute("data-leg-order"));
            const cityId = entry.target.getAttribute(
              "data-city-id"
            ) as CityId | null;
            if (order && cityId) {
              setActiveLegOrder(order);
              setActiveCityId(cityId);
            }
          }
        }
      },
      {
        rootMargin: "-25% 0px -45% 0px",
        threshold: 0.2,
      }
    );

    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-6 md:pt-24"
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-extrabold text-orange-600 dark:text-orange-300">
            <Calendar className="h-3.5 w-3.5" />
            מסלול מלא • 6 בנובמבר – 8 בדצמבר 2026
          </span>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-900 md:text-4xl dark:text-white">
            ציר הזמן של הטיול בטייוואן (10 מקטעים • 33 ימים)
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            גללו לאורך המסלול – מפת התלת-ממד מתעדכנת אוטומטית לפי המקטע הפעיל.
          </p>
        </div>

        <Link
          href="/"
          className="toy-button inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md dark:bg-amber-400 dark:text-slate-950"
        >
          <span>חזרה למפת 3D מלאה</span>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* Two-Column Layout: Sticky 3D Mini-Map + Vertical Timeline */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Right Column (in RTL): Vertical Itinerary Timeline */}
        <div className="space-y-6 lg:col-span-7">
          <div className="relative border-r-4 border-orange-500/30 pr-5 md:pr-8">
            {legs.map((leg) => {
              const bundle = getCityBundle(leg.cityId);
              const isActive = activeLegOrder === leg.order;
              const topAttractions = bundle.attractions.slice(0, 4);
              const topFood = bundle.food.slice(0, 3);

              return (
                <article
                  key={leg.id}
                  id={leg.id}
                  data-leg-order={leg.order}
                  data-city-id={leg.cityId}
                  ref={(el) => {
                    if (el) cardRefs.current.set(leg.order, el);
                  }}
                  onClick={() => {
                    setActiveLegOrder(leg.order);
                    setActiveCityId(leg.cityId);
                  }}
                  className={`glass-panel relative mb-8 cursor-pointer rounded-3xl p-5 transition-all md:p-6 ${
                    isActive
                      ? "ring-2 ring-orange-500 shadow-xl"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Timeline Node Badge */}
                  <div
                    className={`absolute -right-[34px] top-6 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-black shadow-md md:-right-[46px] ${
                      isActive
                        ? "scale-125 bg-orange-500 text-white"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    {leg.order}
                  </div>

                  {/* Leg Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
                          מקטע {leg.order}: {leg.focus}
                        </h2>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          ({bundle.city.nameEn})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-3 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-400/20 dark:text-amber-300">
                        <Calendar className="h-3.5 w-3.5" />
                        {leg.dates}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Clock className="h-3.5 w-3.5" />
                        {leg.days} ימים
                      </span>
                    </div>
                  </div>

                  {/* Anchor Activities */}
                  <div className="mt-3 rounded-2xl bg-slate-900/5 p-3.5 text-sm leading-relaxed text-slate-800 dark:bg-white/5 dark:text-slate-200">
                    <span className="font-extrabold text-orange-600 dark:text-amber-300">
                      פעילויות עוגן:{" "}
                    </span>
                    {leg.anchor}
                  </div>

                  {leg.notes && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <Info className="h-4 w-4 shrink-0" />
                      <span>דגשים: {leg.notes}</span>
                    </div>
                  )}

                  {/* Top Attractions & Food Pills for this Leg */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>אטרקציות מובילות ב{bundle.city.nameHe}:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topAttractions.map((a) => (
                          <Link
                            key={a.id}
                            href={`/place/${a.id}`}
                            className="rounded-xl border border-slate-900/10 bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-orange-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {a.name} {"★".repeat(a.importance)}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Utensils className="h-3.5 w-3.5 text-rose-500" />
                        <span>אוכל ושווקים מומלצים:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topFood.length > 0 ? (
                          topFood.map((f) => (
                            <Link
                              key={f.id}
                              href={`/place/${f.id}`}
                              className="rounded-xl border border-slate-900/10 bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-rose-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {f.name}
                            </Link>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            ראו ערי בסיס סמוכות
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Footer Links */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900/10 pt-3 text-xs dark:border-white/10">
                    <Link
                      href={`/?city=${leg.cityId}`}
                      className="inline-flex items-center gap-1 font-bold text-orange-600 hover:underline dark:text-amber-300"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>פתח את {bundle.city.nameHe} במפת 3D</span>
                    </Link>
                    <Link
                      href={`/hotels?city=${leg.cityId}`}
                      className="inline-flex items-center gap-1 font-bold text-sky-600 hover:underline dark:text-sky-300"
                    >
                      <BedDouble className="h-3.5 w-3.5" />
                      <span>
                        השוואת מלונות ב{bundle.city.nameHe} ({bundle.hotels.length})
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Historical Audit Notes (Marked explicitly as older than the route legs) */}
          <div className="glass-panel rounded-3xl p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
              <Info className="h-4 w-4 text-amber-500" />
              <span>
                הערות גיליון בקרה היסטוריות (לידיעה בלבד – מקטעי המסלול למעלה הם הקובעים והעדכניים):
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {auditNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-900/10 bg-slate-900/5 p-3 text-xs dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{note.topic}</span>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      {note.status} (ארכיון)
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    {note.finding}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left Column (in RTL): Sticky Synced 3D Mini-Map */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-3">
            <div className="glass-panel h-[480px] overflow-hidden rounded-3xl p-2 md:h-[580px]">
              <MiniTaiwanMap
                activeCityId={activeCityId}
                activeLegOrder={activeLegOrder}
              />
            </div>
            <div className="glass-panel rounded-2xl px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-orange-600 dark:text-amber-300">
                מקטע פעיל במפה:{" "}
              </span>
              מקטע {activeLegOrder} –{" "}
              {legs.find((l) => l.order === activeLegOrder)?.focus} (
              {legs.find((l) => l.order === activeLegOrder)?.dates})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
