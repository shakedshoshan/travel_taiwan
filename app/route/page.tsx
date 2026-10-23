"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { getAuditNotes, getRouteLegs, getTimelineDays } from "@/lib/data/selectors";
import { uniqueRouteLegImages } from "@/lib/data/placeImages";
import { MiniTaiwanMap } from "@/components/3d/MiniTaiwanMap";
import { RouteLegCard } from "@/components/ui/route/RouteLegCard";
import { OptionalDetourCard } from "@/components/ui/route/OptionalDetourCard";
import { getTripTodayStatus, TodayCardModal } from "@/components/ui/TodayCardModal";
import { DateRange, LtrText, RtlParen } from "@/components/ui/bidi";
import { BackToTop } from "@/components/ui/CityJumpBar";
import { tripActions } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

export default function RoutePage() {
  const legs = getRouteLegs();
  const legImages = uniqueRouteLegImages(legs);
  const auditNotes = getAuditNotes();
  const todayStatus = getTripTodayStatus(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("today")
      : null
  );
  const initialDay = todayStatus.inTrip
    ? getTimelineDays()[todayStatus.dayIndex]
    : undefined;

  const [activeLegOrder, setActiveLegOrder] = useState<number>(
    initialDay?.legOrder ?? 1
  );
  const [activeCityId, setActiveCityId] = useState<CityId>(
    initialDay?.cityId ?? legs[0].cityId
  );
  const todayBannerText = todayStatus.statusTextHe;
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    if (todayStatus.inTrip) {
      tripActions.setCurrentDayIndex(todayStatus.dayIndex);
    }
  }, [todayStatus.inTrip, todayStatus.dayIndex]);

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
        rootMargin: "-35% 0px -40% 0px",
        threshold: 0.15,
      }
    );

    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const activeLeg = legs.find((l) => l.order === activeLegOrder) ?? legs[0];

  return (
    <div dir="rtl" className="mx-auto max-w-5xl pb-24">
      {/* Sticky Top 35vh Mini 3D Map Synced to Scroll */}
      <div
        style={{ top: "calc(3.25rem + env(safe-area-inset-top))" }}
        className="sticky z-30 border-b border-slate-200/80 bg-background/95 px-2.5 pt-1.5 pb-2 backdrop-blur-md md:px-6 dark:border-slate-800"
      >
        <div className="relative h-[35vh] max-h-[340px] min-h-[210px] w-full overflow-hidden rounded-3xl border border-slate-200 shadow-lg dark:border-slate-800">
          <MiniTaiwanMap
            activeCityId={activeCityId}
            activeLegOrder={activeLegOrder}
          />
          <div className="pointer-events-none absolute right-2.5 bottom-2.5 left-2.5 flex items-center justify-between gap-2 rounded-2xl bg-slate-950/85 px-3 py-1.5 text-xs text-white backdrop-blur-md">
            <div className="truncate font-bold">
              <span className="text-amber-300">מקטע {activeLeg.order}: </span>
              <span>{activeLeg.focus}</span>
            </div>
            <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-black text-white">
              <DateRange>{activeLeg.dates}</DateRange>{" "}
              <RtlParen>
                (<LtrText>{activeLeg.days}</LtrText> ימים)
              </RtlParen>
            </span>
          </div>
        </div>

        {/* Quick Leg Jump Pills */}
        <div className="fade-edge-scroll no-scrollbar mt-2 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pl-4">
          {legs.map((leg) => {
            const isCurrent = leg.order === activeLegOrder;
            return (
              <a
                key={leg.id}
                href={`#${leg.id}`}
                onClick={() => {
                  setActiveLegOrder(leg.order);
                  setActiveCityId(leg.cityId);
                }}
                className={`flex min-h-11 shrink-0 snap-start items-center rounded-full px-3 text-xs font-bold whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                <LtrText>{leg.order}.</LtrText> {leg.focus}
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Itinerary Content */}
      <TodayCardModal />
      <div className="px-3.5 pt-16 md:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-slate-900 md:text-3xl dark:text-white">
              המסלול המלא בטייוואן{" "}
              <RtlParen className="inline-block whitespace-nowrap">
                (<LtrText>10</LtrText> מקטעים · <LtrText>33</LtrText> ימים)
              </RtlParen>
            </h1>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">
              <DateRange>6.11 – 8.12.2026</DateRange> • גללו מטה – המפה התלת-ממדית למעלה עוקבת אוטומטית אחרי כל מקטע.
            </p>
          </div>
          {todayBannerText && (
            <button
              type="button"
              onClick={() => tripActions.setTodayCardOpen(true)}
              className="toy-button rounded-2xl bg-amber-400/25 px-3.5 py-2 text-xs font-extrabold text-amber-950 dark:bg-amber-400/20 dark:text-amber-200"
            >
              📅 {todayBannerText} · פתח כרטיס היום
            </button>
          )}
        </div>

        <div className="space-y-5">
          {legs.map((leg) => (
            <Fragment key={leg.id}>
              <RouteLegCard
                leg={leg}
                isActive={activeLegOrder === leg.order}
                onSelectLeg={(order, cityId) => {
                  setActiveLegOrder(order);
                  setActiveCityId(cityId);
                }}
                registerRef={(order, el) => {
                  if (el) cardRefs.current.set(order, el);
                }}
                images={legImages.get(leg.order) ?? { city: null, route: null }}
              />
              {leg.cityId === "kaohsiung" && <OptionalDetourCard />}
            </Fragment>
          ))}
        </div>

        {/* Historical Audit Notes Archive */}
        <details className="mt-8 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <summary className="cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
            הערות גיליון בקרה היסטוריות (ארכיון בלבד – 10 מקטעי המסלול למעלה הם הקובעים)
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {auditNotes.map((note, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{note.topic}</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    {note.status} (ארכיון)
                  </span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  {note.finding}
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
      <BackToTop />
    </div>
  );
}
