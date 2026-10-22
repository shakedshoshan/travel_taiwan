import type { City, FoodType, HotelTier } from "@/data/types";
import type { EnrichedFood } from "@/lib/data/selectors";

export function computeDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistanceAndWalk(distanceKm: number): string {
  const walkMinutes = Math.max(1, Math.round(distanceKm * 12));
  const distPart =
    distanceKm < 1
      ? `${Math.round(distanceKm * 1000)} מ׳`
      : `${distanceKm.toFixed(1)} ק״מ`;
  return `${distPart} · ${walkMinutes} דק׳ הליכה`;
}

export function checkIsOpenNow(item: EnrichedFood): boolean {
  const hrs = item.hours;
  if (!hrs) return true;
  if (hrs.includes("24")) return true;

  // Compute current hour in Taiwan (UTC+8)
  const nowUtcMs = Date.now();
  const taiwanDate = new Date(nowUtcMs + 8 * 3600 * 1000);
  const currentHour = taiwanDate.getUTCHours();

  // Check explicit HH:MM–HH:MM range if present
  const match = hrs.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const openH = Number(match[1]);
    const closeH = Number(match[3]);
    if (closeH > openH) {
      return currentHour >= openH && currentHour < closeH;
    } else {
      return currentHour >= openH || currentHour < closeH;
    }
  }

  if (hrs.includes("ערב") || item.type === "market") {
    return currentHour >= 16 || currentHour <= 1 || true;
  }
  return true;
}

export function resolveNearMeCoordinates(
  fallbackCity: City,
  onResolved: (coords: { lat: number; lng: number; labelHe: string }) => void
) {
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const inTaiwan =
          latitude >= 21.5 &&
          latitude <= 25.6 &&
          longitude >= 119.3 &&
          longitude <= 122.3;
        if (inTaiwan) {
          onResolved({
            lat: latitude,
            lng: longitude,
            labelHe: "המיקום שלי כעת",
          });
        } else {
          onResolved({
            lat: fallbackCity.lat,
            lng: fallbackCity.lng,
            labelHe: `מרכז ${fallbackCity.nameHe}`,
          });
        }
      },
      () => {
        onResolved({
          lat: fallbackCity.lat,
          lng: fallbackCity.lng,
          labelHe: `מרכז ${fallbackCity.nameHe}`,
        });
      },
      { timeout: 3500 }
    );
  } else {
    onResolved({
      lat: fallbackCity.lat,
      lng: fallbackCity.lng,
      labelHe: `מרכז ${fallbackCity.nameHe}`,
    });
  }
}

export const FOOD_TYPE_META: Record<
  FoodType,
  { labelHe: string; labelEn: string; color: string; bgClass: string }
> = {
  "michelin-bib": {
    labelHe: "מישלן ביב",
    labelEn: "Michelin Bib",
    color: "#e11d48",
    bgClass:
      "bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30",
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
    bgClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  splurge: {
    labelHe: "פינוק / יוקרה",
    labelEn: "Splurge",
    color: "#f59e0b",
    bgClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};
