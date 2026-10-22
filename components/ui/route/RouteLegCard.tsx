"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BedDouble,
  BellRing,
  Calendar,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Sparkles,
  Train,
  Utensils,
} from "lucide-react";
import { getCityBundle } from "@/lib/data/selectors";
import {
  getCityPrimaryImage,
  getRouteLegImage,
} from "@/lib/data/placeImages";
import { PhotoCreditPopover } from "@/components/ui/PhotoCreditPopover";
import practicalData from "@/data/practical.json";
import type { CityId, RouteLeg } from "@/data/types";

type LegTransportMap = typeof practicalData.legTransport;

interface RouteLegCardProps {
  leg: RouteLeg;
  isActive: boolean;
  onSelectLeg: (order: number, cityId: CityId) => void;
  registerRef: (order: number, el: HTMLElement | null) => void;
}

export function RouteLegCard({
  leg,
  isActive,
  onSelectLeg,
  registerRef,
}: RouteLegCardProps) {
  const bundle = getCityBundle(leg.cityId);
  const topAttractions = bundle.attractions.slice(0, 4);
  const topFood = bundle.food.slice(0, 3);
  const transport =
    practicalData.legTransport[leg.id as keyof LegTransportMap];
  const routeImg = getRouteLegImage(leg.order, leg.cityId);
  const cityImg = getCityPrimaryImage(leg.cityId);

  return (
    <article
      id={leg.id}
      data-leg-order={leg.order}
      data-city-id={leg.cityId}
      ref={(el) => registerRef(leg.order, el)}
      onClick={() => onSelectLeg(leg.order, leg.cityId)}
      className={`scroll-mt-[46vh] overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition-all md:p-6 dark:bg-slate-900 ${
        isActive
          ? "border-orange-500 ring-2 ring-orange-500/30"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Route Leg & City Photo Banner */}
      <div className="mb-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="relative h-32 overflow-hidden rounded-2xl bg-slate-900">
          <Image
            src={cityImg.src}
            alt={bundle.city.nameHe}
            title={cityImg.attribution}
            fill
            sizes="(max-width: 640px) 92vw, 440px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <span className="absolute right-2.5 bottom-1.5 text-[10px] font-bold text-white">
            {bundle.city.nameHe}
          </span>
          <PhotoCreditPopover image={cityImg} positionClass="bottom-1.5 left-2" />
        </div>
        <div className="relative h-32 overflow-hidden rounded-2xl bg-slate-900">
          <Image
            src={routeImg.src}
            alt={leg.focus}
            title={routeImg.attribution}
            fill
            sizes="(max-width: 640px) 92vw, 440px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <span className="absolute right-2.5 bottom-1.5 text-[10px] font-bold text-amber-300">
            תחבורה ודרך · מקטע {leg.order}
          </span>
          <PhotoCreditPopover image={routeImg} positionClass="bottom-1.5 left-2" />
        </div>
      </div>

      {/* Leg Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black text-white">
            {leg.order}
          </span>
          <div>
            <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
              {leg.focus}
            </h2>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {bundle.city.nameHe} ({bundle.city.nameEn})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/25 px-2.5 py-1 text-xs font-extrabold text-amber-900 dark:bg-amber-400/20 dark:text-amber-300">
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
      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 dark:bg-slate-800/70 dark:text-slate-200">
        <span className="font-extrabold text-orange-600 dark:text-amber-300">
          פעילויות עוגן:{" "}
        </span>
        {leg.anchor}
      </div>

      {leg.notes && (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
          <Info className="h-4 w-4 shrink-0" />
          <span>דגשים: {leg.notes}</span>
        </div>
      )}

      {/* Inline Event Callouts */}
      {transport?.events && transport.events.length > 0 && (
        <div className="mt-3 space-y-2">
          {transport.events.map((ev, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3 text-xs"
            >
              <div className="flex items-center gap-1.5 font-extrabold text-rose-700 dark:text-rose-300">
                <BellRing className="h-3.5 w-3.5 shrink-0" />
                <span>
                  אירוע מיוחד ({ev.dateHe}): {ev.titleHe}
                </span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-200">
                {ev.detailHe}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* "איך מגיעים לכאן" from /data/practical.json */}
      {transport && (
        <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-300">
              <Train className="h-4 w-4" />
              <span>איך מגיעים לכאן:</span>
            </span>
            <a
              href={transport.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs"
            >
              <span>{transport.bookingLabelHe}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="mt-1.5 space-y-1 text-slate-700 dark:text-slate-300">
            <div>
              <span className="font-bold">אמצעי תחבורה: </span>
              {transport.modeHe}
            </div>
            <div className="flex flex-wrap gap-3">
              <span>
                <strong className="font-bold">זמן נסיעה:</strong>{" "}
                {transport.durationHe}
              </span>
              <span>
                <strong className="font-bold">עלות:</strong> {transport.priceHe}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Attractions & Food Pills */}
      <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 hover:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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

      {/* Footer Links */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
        <Link
          href={`/?city=${leg.cityId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-[44px] items-center gap-1 font-bold text-orange-600 hover:underline dark:text-amber-300"
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>פתח את {bundle.city.nameHe} במפת 3D</span>
        </Link>
        <Link
          href={`/hotels#${leg.cityId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-[44px] items-center gap-1 font-bold text-sky-600 hover:underline dark:text-sky-300"
        >
          <BedDouble className="h-3.5 w-3.5" />
          <span>
            מלונות ב{bundle.city.nameHe} ({bundle.hotels.length})
          </span>
        </Link>
      </div>
    </article>
  );
}
