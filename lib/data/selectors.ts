import type { CityId, FoodType, HotelTier, RouteLeg } from "@/data/types";
import {
  TRIP_DATA,
  type EnrichedAttraction,
  type EnrichedCity,
  type EnrichedFood,
  type EnrichedHotel,
  type EnrichedPlace,
} from "./loaders";

export type {
  EnrichedAttraction,
  EnrichedCity,
  EnrichedFood,
  EnrichedHotel,
  EnrichedPlace,
};

export interface TimelineDay {
  dayIndex: number; // 0..32 (33 days total)
  dayNumber: number; // 1..33
  dateShort: string; // e.g. "6.11" or "8.12"
  dateIso: string; // e.g. "2026-11-06"
  weekdayHe: string;
  legOrder: number; // 1..10
  legId: string;
  legFocus: string;
  legDates: string;
  legAnchor: string;
  legNotes: string | null;
  dayInLeg: number; // 1..leg.days
  daysInLeg: number;
  cityId: CityId;
  cityNameHe: string;
  cityNameEn: string;
  routeProgress: number; // 0..1 normalized progress along the 10-leg route curve
}

export interface CityBundle {
  city: EnrichedCity;
  legs: RouteLeg[];
  daysHere: TimelineDay[];
  attractions: EnrichedAttraction[];
  food: EnrichedFood[];
  hotels: EnrichedHotel[];
  hotelsByTier: Record<HotelTier, EnrichedHotel[]>;
}

const WEEKDAYS_HE = [
  "יום א׳",
  "יום ב׳",
  "יום ג׳",
  "יום ד׳",
  "יום ה׳",
  "יום ו׳",
  "שבת",
] as const;

let cachedTimelineDays: TimelineDay[] | null = null;

/**
 * Generates all 33 chronological trip days (6 Nov 2026 -> 8 Dec 2026) mapped to their route leg & city.
 */
export function getTimelineDays(): TimelineDay[] {
  if (cachedTimelineDays) return cachedTimelineDays;

  const startDate = new Date(Date.UTC(2026, 10, 6)); // Nov 6, 2026 (month is 0-indexed)
  const legs = TRIP_DATA.legs;
  const totalDays = legs.reduce((acc, l) => acc + l.days, 0);

  const days: TimelineDay[] = [];
  let globalDayIdx = 0;

  for (let legIdx = 0; legIdx < legs.length; legIdx++) {
    const leg = legs[legIdx];
    const city = TRIP_DATA.citiesById[leg.cityId];

    for (let d = 0; d < leg.days; d++) {
      const current = new Date(startDate.getTime() + globalDayIdx * 86400000);
      const dayOfMonth = current.getUTCDate();
      const month = current.getUTCMonth() + 1;
      const year = current.getUTCFullYear();
      const weekdayHe = WEEKDAYS_HE[current.getUTCDay()];

      // Normalized progress along the 10 legs (0.0 at leg 1 start -> 1.0 at leg 10 end)
      const legStartFraction = legIdx / Math.max(1, legs.length - 1);
      const nextLegFraction =
        Math.min(legs.length - 1, legIdx + 1) / Math.max(1, legs.length - 1);
      const intraLegFraction =
        leg.days > 1 ? d / leg.days : 0;
      const routeProgress =
        legIdx === legs.length - 1
          ? 1
          : Math.min(
              1,
              legStartFraction +
                (nextLegFraction - legStartFraction) * intraLegFraction
            );

      days.push({
        dayIndex: globalDayIdx,
        dayNumber: globalDayIdx + 1,
        dateShort: `${dayOfMonth}.${month}`,
        dateIso: `${year}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`,
        weekdayHe,
        legOrder: leg.order,
        legId: leg.id,
        legFocus: leg.focus,
        legDates: leg.dates,
        legAnchor: leg.anchor,
        legNotes: leg.notes,
        dayInLeg: d + 1,
        daysInLeg: leg.days,
        cityId: leg.cityId,
        cityNameHe: city.nameHe,
        cityNameEn: city.nameEn,
        routeProgress: totalDays > 1 ? routeProgress : 0,
      });

      globalDayIdx++;
    }
  }

  cachedTimelineDays = days;
  return days;
}

export function getAllCities(): EnrichedCity[] {
  return TRIP_DATA.cities;
}

export function getCityById(cityId: CityId): EnrichedCity {
  return TRIP_DATA.citiesById[cityId];
}

export function getRouteLegs(): RouteLeg[] {
  return TRIP_DATA.legs;
}

export function getAuditNotes() {
  return TRIP_DATA.audit;
}

export function getAllPlaces(): EnrichedPlace[] {
  return TRIP_DATA.allPlaces;
}

export function getPlaceById(id: string): EnrichedPlace | undefined {
  return TRIP_DATA.placesById.get(id);
}

export function getAttractions(): EnrichedAttraction[] {
  return TRIP_DATA.attractions;
}

export function getFoodItems(): EnrichedFood[] {
  return TRIP_DATA.food;
}

export function getHotels(): EnrichedHotel[] {
  return TRIP_DATA.hotels;
}

export function getCityBundle(cityId: CityId): CityBundle {
  const city = TRIP_DATA.citiesById[cityId];
  const legs = TRIP_DATA.legs.filter((l) => l.cityId === cityId);
  const daysHere = getTimelineDays().filter((d) => d.cityId === cityId);

  const attractions = TRIP_DATA.attractions
    .filter((a) => a.cityId === cityId)
    .sort((a, b) => b.importance - a.importance);

  const food = TRIP_DATA.food
    .filter((f) => f.cityId === cityId)
    .sort((a, b) => b.importance - a.importance);

  const hotels = TRIP_DATA.hotels.filter((h) => h.cityId === cityId);

  const hotelsByTier: Record<HotelTier, EnrichedHotel[]> = {
    cheap: hotels.filter((h) => h.tier === "cheap"),
    quality: hotels.filter((h) => h.tier === "quality"),
    splurge: hotels.filter((h) => h.tier === "splurge"),
  };

  return {
    city,
    legs,
    daysHere,
    attractions,
    food,
    hotels,
    hotelsByTier,
  };
}

export interface SearchResultItem {
  id: string;
  kind: "city" | "leg" | "attraction" | "food" | "hotel";
  titleHe: string;
  subtitle: string;
  badgeHe: string;
  cityId: CityId;
  importance?: number;
  href: string;
}

export function searchEverything(rawQuery: string): SearchResultItem[] {
  const q = rawQuery.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  for (const city of TRIP_DATA.cities) {
    if (
      !q ||
      city.nameHe.toLowerCase().includes(q) ||
      city.nameEn.toLowerCase().includes(q) ||
      city.id.toLowerCase().includes(q)
    ) {
      results.push({
        id: `city-${city.id}`,
        kind: "city",
        titleHe: `${city.nameHe} (${city.nameEn})`,
        subtitle: city.onRoute
          ? `${city.days} ימים במסלול • ${city.dates.join(", ")}`
          : "יעד מחוץ למסלול הלינה הראשי",
        badgeHe: city.onRoute ? "עיר במסלול" : "עיר",
        cityId: city.id,
        importance: city.onRoute ? 5 : 3,
        href: `/?city=${city.id}`,
      });
    }
  }

  for (const leg of TRIP_DATA.legs) {
    const city = TRIP_DATA.citiesById[leg.cityId];
    if (
      q &&
      (leg.focus.toLowerCase().includes(q) ||
        leg.anchor.toLowerCase().includes(q) ||
        leg.dates.toLowerCase().includes(q) ||
        (leg.notes && leg.notes.toLowerCase().includes(q)))
    ) {
      results.push({
        id: leg.id,
        kind: "leg",
        titleHe: `מקטע ${leg.order}: ${leg.focus} (${leg.dates})`,
        subtitle: leg.anchor,
        badgeHe: "מסלול",
        cityId: leg.cityId,
        importance: 5,
        href: `/route#${leg.id}`,
      });
    } else if (!q && leg.order <= 3) {
      results.push({
        id: leg.id,
        kind: "leg",
        titleHe: `מקטע ${leg.order}: ${leg.focus} (${leg.dates})`,
        subtitle: `${city.nameHe} • ${leg.days} ימים`,
        badgeHe: "מסלול",
        cityId: leg.cityId,
        importance: 4,
        href: `/route#${leg.id}`,
      });
    }
  }

  for (const place of TRIP_DATA.allPlaces) {
    const matches =
      !q ||
      place.name.toLowerCase().includes(q) ||
      (place.nameZh && place.nameZh.toLowerCase().includes(q)) ||
      place.description.toLowerCase().includes(q) ||
      place.city.toLowerCase().includes(q) ||
      place.cityNameHe.toLowerCase().includes(q) ||
      place.cityNameEn.toLowerCase().includes(q);

    if (!matches) continue;

    if (place.kind === "attraction") {
      results.push({
        id: place.id,
        kind: "attraction",
        titleHe: place.name,
        subtitle: `${place.cityNameHe} (${place.cityNameEn}) • ${place.description}`,
        badgeHe: place.isNature ? "טבע" : "אטרקציה",
        cityId: place.cityId,
        importance: place.importance,
        href: `/place/${place.id}`,
      });
    } else if (place.kind === "food") {
      results.push({
        id: place.id,
        kind: "food",
        titleHe: place.name,
        subtitle: `${place.cityNameHe} • ${place.typeHe} • ${place.description}`,
        badgeHe: place.typeHe,
        cityId: place.cityId,
        importance: place.importance,
        href: `/place/${place.id}`,
      });
    } else {
      results.push({
        id: place.id,
        kind: "hotel",
        titleHe: place.name,
        subtitle: `${place.cityNameHe} • ${place.tierHe} • ${place.description}`,
        badgeHe: `מלון (${place.tierHe})`,
        cityId: place.cityId,
        importance: 4,
        href: `/place/${place.id}`,
      });
    }
  }

  return results
    .sort((a, b) => (b.importance ?? 3) - (a.importance ?? 3))
    .slice(0, q ? 45 : 24);
}

/**
 * Builds a Google Maps navigation or search URL:
 * - When the place has exact coordinates (`!approxLocation` or overridden in `overrides.json`),
 *   returns `https://www.google.com/maps/dir/?api=1&destination=<lat,lng>`.
 * - Otherwise queries `nameZh || nameEn || nonHebrewName` + city in English + "Taiwan" (never Hebrew alone).
 */
export function buildGoogleMapsUrl(place: {
  name: string;
  nameZh?: string | null;
  nameEn?: string | null;
  cityNameEn?: string;
  city?: string;
  lat?: number;
  lng?: number;
  approxLocation?: boolean;
  resolvedCoords?: { lat: number; lng: number; isExact: boolean };
}): string {
  const isExact =
    place.approxLocation === false || place.resolvedCoords?.isExact === true;
  const lat = place.resolvedCoords?.lat ?? place.lat;
  const lng = place.resolvedCoords?.lng ?? place.lng;

  if (isExact && typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  // Extract Chinese/English tokens from `name` if `nameZh`/`nameEn` are not set
  const nonHebrewFromName = place.name
    .replace(/[\u0590-\u05FF״׳–—().,0-9-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const primaryQuery =
    (place.nameZh && place.nameZh.trim()) ||
    (place.nameEn && place.nameEn.trim()) ||
    nonHebrewFromName ||
    place.cityNameEn ||
    "Taiwan";

  const cityEn = place.cityNameEn ?? "Taiwan";
  const queryParts = [primaryQuery, cityEn, "Taiwan"];

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    queryParts.join(" ")
  )}`;
}

/**
 * Returns the clean price portion of `priceText` (e.g. bed/room rate in NT$)
 * without internal scraper diagnostic notes after `|`.
 */
export function formatDisplayPriceText(priceText: string | null | undefined): string {
  if (!priceText) return "";
  const [mainPrice] = priceText.split("|");
  return mainPrice.trim();
}

export const FOOD_TYPE_META: Record<
  FoodType,
  { labelHe: string; labelEn: string; color: string; bgClass: string }
> = {
  "michelin-bib": {
    labelHe: "מישלן ביב",
    labelEn: "Michelin Bib",
    color: "#e11d48",
    bgClass: "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
  },
  market: {
    labelHe: "שוק לילה",
    labelEn: "Night Market",
    color: "#ff5a36",
    bgClass:
      "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30",
  },
  "hidden-local": {
    labelHe: "מקומי נסתר",
    labelEn: "Hidden Local",
    color: "#8b5cf6",
    bgClass:
      "bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30",
  },
  cheap: {
    labelHe: "זול וחובה",
    labelEn: "Cheap Gem",
    color: "#10b981",
    bgClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  },
};

export const HOTEL_TIER_META: Record<
  HotelTier,
  { labelHe: string; labelEn: string; color: string; bgClass: string }
> = {
  cheap: {
    labelHe: "זול / הוסטל",
    labelEn: "Budget / Hostel",
    color: "#10b981",
    bgClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  quality: {
    labelHe: "איכותי ומשתלם",
    labelEn: "Quality Stay",
    color: "#0ea5e9",
    bgClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  splurge: {
    labelHe: "פינוק / יוקרה",
    labelEn: "Splurge",
    color: "#f59e0b",
    bgClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};
