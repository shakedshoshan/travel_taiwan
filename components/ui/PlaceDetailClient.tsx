"use client";

import Link from "next/link";
import {
  Heart,
  CheckCircle2,
  Navigation,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trees,
  Clock,
  Wallet,
  Train,
  Utensils,
} from "lucide-react";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  formatDisplayPriceText,
  HOTEL_TIER_META,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import { getPlaceImage } from "@/lib/data/placeImages";
import { MiniTaiwanMap } from "@/components/3d/MiniTaiwanMap";
import { PlaceCard } from "@/components/ui/PlaceCard";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

interface PlaceDetailClientProps {
  place: EnrichedPlace;
  nearbyPlaces: EnrichedPlace[];
}

const CITY_TRANSIT_GUIDE_HE: Record<CityId, string> = {
  taipei:
    "הגעה נוחה במטרו של טייפה (MRT) עם כרטיס איזי-קארד או באוטובוס עירוני. מומלץ לנווט ישירות לתחנת ה-MRT הקרובה.",
  "new-taipei":
    "רכבת פרברית (TRA) או אוטובוס ישיר מתחנת טייפה מיין / שער צפוני (קו 965 לג׳יופן, קו פונג-שי לשיפן, קו 1815 ליהליו).",
  keelung:
    "רכבת פרברית (TRA) מתחנת טייפה מיין לקילונג (כ-45 דקות נסיעה) או אוטובוס מהיר 2088.",
  yilan:
    "רכבת אקספרס (TRA) מתחנת טייפה מיין או אוטובוס קוואן/קמאלאן דרך מנהרת שואשאן (כ-50 דקות).",
  taoyuan:
    "קו ה-MRT של שדה התעופה (Airport MRT) מתחנת טייפה מיין (35 דקות באקספרס) או רכבת מהירה (HSR).",
  hsinchu:
    "רכבת מהירה (HSR) או רכבת TRA מטייפה, ובהמשך שאטל/אוטובוס מקומי (לפארק ליופו אוטובוס 5350 ממתחם סונגשאן/ג׳ונגלי).",
  miaoli:
    "רכבת TRA לתחנת מיאולי או סאני (Sanyi), ומונית/אוטובוס תיירים לאזור דאהו.",
  taichung:
    "רכבת מהירה (HSR) לתחנת טאיצ׳ונג, MRT קו ירוק ואוטובוסים עירוניים (חינם או מוזלים עם איזי-קארד).",
  changhua:
    "רכבת TRA מטאיצ׳ונג לתחנת ג׳אנגהואה (כ-20 דקות) ואוטובוס ללוקאנג.",
  nantou:
    "אוטובוס תיירים Taiwan Tourist Shuttle מתחנת טאיצ׳ונג מיין או תחנת HSR טאיצ׳ונג.",
  "sun-moon-lake":
    "אוטובוס קו 6670 מתחנת HSR טאיצ׳ונג או קו 6739 שמור מראש מאלישאן. סביב האגם מתניידים בסירות מעבורת, אופניים ורכבל.",
  chiayi:
    "רכבת מהירה (HSR) או רכבת TRA לתחנת צ׳יאיי – שער היציאה הראשי לרכבת היער ולאוטובוסים לאלישאן.",
  alishan:
    "אוטובוס 7322 מתחנת TRA צ׳יאיי או 7329 מתחנת HSR צ׳יאיי (או רכבת היער של אלישאן בהזמנה מראש). היציאה לאגם בקו 6739 שמור.",
  tainan:
    "רכבת TRA לתחנת טאינאן במרכז העיר (עדיפה על HSR המרוחקת), ומשם הליכה או אוטובוס קצר לאזור גואואה ואנפינג.",
  kaohsiung:
    "רכבת מהירה (HSR Zuoying) מחוברת ישירות לקו ה-MRT האדום והרכבת הקלה (LRT) סביב הנמל ופיר 2. לג׳יג׳ין – מעבורת של 5 דקות מגושאן.",
  pingtung:
    "רכבת ל-Fangliao או אוטובוס Kenting Express מתחנת HSR Zuoying בקאושיונג; לשיאוליוצ׳יו – מעבורת מנמל דונגגאנג (Donggang).",
  hualien:
    "רכבת אקספרס מזרחית (EMU3000) מתחנת טייפה מיין לחואליאן (כשעתיים ורבע). לאזור טארוקו וצ׳ישינגטאן באוטובוס תיירים 310 או מונית.",
  taitung:
    "רכבת TRA לאורך עמק הריפט המזרחי מחואליאן לצ׳ישאנג וטאיטונג, ואוטובוס חופי 8101/8102 לדולאן וסאנשיאנטאי.",
};

export function PlaceDetailClient({
  place,
  nearbyPlaces,
}: PlaceDetailClientProps) {
  const store = useTripStore();
  const isFav = store.favorites.includes(place.id);
  const isDone = store.donePlaces.includes(place.id);

  const googleMapsUrl = buildGoogleMapsUrl(place);
  const imageMeta = getPlaceImage(place);
  const cleanPrice =
    place.kind === "food" || place.kind === "hotel"
      ? formatDisplayPriceText(place.priceText)
      : "";

  const isUnverified =
    (place.kind === "food" &&
      (!place.verified || !place.priceVerified || !place.hoursVerified)) ||
    (place.kind === "hotel" && !place.verified);

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-4xl px-3.5 pt-16 pb-24 md:px-6 md:pt-20"
    >
      {/* Top Back Navigation */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Link
            href="/"
            onClick={() => tripActions.selectCity(place.cityId, "half")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-white px-3.5 text-slate-800 shadow-xs dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <span>חזרה למפה ({place.cityNameHe})</span>
          </Link>
          {place.kind === "food" && (
            <Link
              href="/food"
              className="inline-flex min-h-[44px] items-center rounded-2xl bg-rose-500/15 px-3.5 text-rose-700 dark:text-rose-300"
            >
              כל האוכל
            </Link>
          )}
          {place.kind === "hotel" && (
            <Link
              href="/hotels"
              className="inline-flex min-h-[44px] items-center rounded-2xl bg-sky-500/15 px-3.5 text-sky-700 dark:text-sky-300"
            >
              כל המלונות
            </Link>
          )}
        </div>
      </div>

      {/* 1. Hero Photo + Title Header */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-56 w-full bg-slate-900 sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageMeta.src}
            alt={
              imageMeta.match === "representative"
                ? `${place.name} (תמונה מייצגת)`
                : place.name
            }
            title={imageMeta.attribution}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

          {/* Credit Pill with Wikimedia Commons Source Link */}
          <a
            href={imageMeta.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={imageMeta.attribution}
            className="absolute top-3 left-3 max-w-[80%] truncate rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] text-slate-200 backdrop-blur-xs hover:bg-slate-900 hover:underline"
          >
            {imageMeta.creditHe} ↗
          </a>

          {/* Overlay Title & Badges */}
          <div className="absolute right-4 bottom-4 left-4 text-white">
            <div className="flex flex-wrap items-center gap-1.5">
              {place.kind === "attraction" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-black text-slate-950">
                  {place.isNature ? (
                    <>
                      <Trees className="h-3.5 w-3.5" />
                      <span>טבע ונוף</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>אטרקציה</span>
                    </>
                  )}
                </span>
              )}
              {place.kind === "food" && (
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-black text-white">
                  {FOOD_TYPE_META[place.type].labelHe}
                </span>
              )}
              {place.kind === "hotel" && (
                <span className="rounded-full bg-sky-500 px-2.5 py-0.5 text-xs font-black text-white">
                  מלון • {HOTEL_TIER_META[place.tier].labelHe}
                </span>
              )}

              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-xs">
                {place.cityNameHe}
              </span>

              {"importance" in place && (
                <span className="text-xs font-bold text-amber-400">
                  {"★".repeat(place.importance)}
                </span>
              )}
            </div>

            <h1 className="mt-2 font-display text-2xl font-black leading-tight sm:text-3xl">
              {place.name}
            </h1>
            {place.nameZh && (
              <div className="mt-0.5 text-sm font-bold text-amber-300">
                {place.nameZh}
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Bar ("נווט" + "♥" + "בוצע") */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3.5 dark:border-slate-800">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="toy-button inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-orange-500 to-amber-500 px-5 text-sm font-black text-white shadow-md"
          >
            <Navigation className="h-4 w-4" />
            <span>נווט למקום</span>
          </a>

          <button
            type="button"
            onClick={() => tripActions.toggleFavorite(place.id)}
            aria-label={isFav ? "הסר ממועדפים" : "שמור למועדפים"}
            className={`toy-button inline-flex min-h-[48px] min-w-[52px] items-center justify-center gap-1.5 rounded-2xl border px-4 text-xs font-bold ${
              isFav
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-slate-200 bg-slate-50 text-rose-500 dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
            <span>♥</span>
          </button>

          <button
            type="button"
            onClick={() => tripActions.toggleDone(place.id)}
            className={`toy-button inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border px-3.5 text-xs font-bold ${
              isDone
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isDone ? "בוצע ✓" : "סמן כבוצע"}</span>
          </button>
        </div>

        {/* 2. Mini 3D Map of the Exact Spot at the Top */}
        <div className="border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              מיקום בתלת-ממד על האי ({place.cityNameHe})
            </span>
            <Link
              href={`/?city=${place.cityId}`}
              className="text-xs font-bold text-orange-600 hover:underline dark:text-amber-300"
            >
              פתח במפה המלאה ←
            </Link>
          </div>
          <div className="h-56 w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <MiniTaiwanMap
              activeCityId={place.cityId}
              focusedPlaceId={place.id}
            />
          </div>
        </div>

        {/* 3. What to Eat / Do, Hours, Price & How to Get There */}
        <div className="space-y-4 p-4 sm:p-6">
          {/* What to Eat / Do */}
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-black text-orange-600 dark:text-amber-300">
              {place.kind === "food" ? (
                <>
                  <Utensils className="h-4 w-4" />
                  <span>מה לאכול ולהזמין כאן</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>מה לעשות ולראות כאן</span>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {place.description}
            </p>
          </div>

          {/* Price & Hours */}
          {(cleanPrice ||
            (place.kind === "food" && place.hours) ||
            isUnverified) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cleanPrice && (
                <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Wallet className="h-4 w-4 text-emerald-500" />
                      <span>מחיר</span>
                    </span>
                    {isUnverified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-3 w-3" />
                        לא מאומת
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-sm font-black text-slate-900 dark:text-white">
                    {cleanPrice}
                  </div>
                </div>
              )}

              {place.kind === "food" && place.hours && (
                <div className="rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>שעות פעילות</span>
                    </span>
                    {!place.hoursVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        <AlertCircle className="h-3 w-3" />
                        לא מאומת
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {place.hours}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* How to Get There */}
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
              <Train className="h-4 w-4" />
              <span>איך להגיע לכאן ({place.cityNameHe})</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {CITY_TRANSIT_GUIDE_HE[place.cityId]}
            </p>
          </div>

          {/* Full Wikimedia Attribution & Representative Notice */}
          <div
            dir="ltr"
            className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"
          >
            <div>
              Photo credit:{" "}
              <a
                href={imageMeta.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-700 underline dark:text-slate-300"
              >
                {imageMeta.title}
              </a>{" "}
              by {imageMeta.author} ·{" "}
              {imageMeta.licenseUrl ? (
                <a
                  href={imageMeta.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {imageMeta.license}
                </a>
              ) : (
                <span>{imageMeta.license}</span>
              )}
              {imageMeta.match === "representative" && (
                <span dir="rtl" className="ml-2 inline-block rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  תמונה מייצגת של המנה/האזור
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Nearby Places in the Same City */}
      {nearbyPlaces.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
            עוד ב{place.cityNameHe} ({nearbyPlaces.length} מומלצים באזור)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {nearbyPlaces.map((other) => (
              <PlaceCard key={other.id} place={other} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
