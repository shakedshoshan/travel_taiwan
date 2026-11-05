export type TripCountry = "taiwan" | "philippines";

const STORAGE_KEY = "trip-country-v1";

export function readStoredCountry(): TripCountry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "taiwan" || raw === "philippines") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredCountry(country: TripCountry) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, country);
  } catch {
    /* ignore */
  }
}

export function countryFromPathname(pathname: string): TripCountry {
  return pathname.startsWith("/philippines") ? "philippines" : "taiwan";
}

export function eventsCountryForPath(
  pathname: string,
  stored: TripCountry | null
): TripCountry {
  if (pathname.startsWith("/philippines")) return "philippines";
  if (stored) return stored;
  return "taiwan";
}
