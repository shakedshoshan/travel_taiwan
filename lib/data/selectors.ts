import type { CityId, HotelTier, RouteLeg } from "@/data/types";
import {
  TRIP_DATA,
  type EnrichedAttraction,
  type EnrichedCity,
  type EnrichedFood,
  type EnrichedHotel,
  type EnrichedPlace,
} from "./loaders";
import { FOOD_TYPE_META, HOTEL_TIER_META } from "./foodAndPlaceMeta";
import { searchEverything, type SearchResultItem } from "./search";

export { FOOD_TYPE_META, HOTEL_TIER_META, searchEverything };
export type {
  EnrichedAttraction,
  EnrichedCity,
  EnrichedFood,
  EnrichedHotel,
  EnrichedPlace,
  SearchResultItem,
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

  const startDate = new Date(Date.UTC(2026, 10, 6)); // Nov 6, 2026
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

      const legStartFraction = legIdx / Math.max(1, legs.length - 1);
      const nextLegFraction =
        Math.min(legs.length - 1, legIdx + 1) / Math.max(1, legs.length - 1);
      const intraLegFraction = leg.days > 1 ? d / leg.days : 0;
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
export function formatDisplayPriceText(
  priceText: string | null | undefined
): string {
  if (!priceText) return "";
  const [mainPrice] = priceText.split("|");
  return mainPrice.trim();
}
