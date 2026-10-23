export interface GoogleMapsPlaceInput {
  name: string;
  nameZh?: string | null;
  nameEn?: string | null;
  cityNameEn?: string;
  city?: string;
  lat?: number;
  lng?: number;
  approxLocation?: boolean;
  resolvedCoords?: { lat: number; lng: number; isExact?: boolean };
}

function firstPlaceName(place: GoogleMapsPlaceInput): string {
  const candidates = [place.nameZh, place.nameEn, place.name];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return "";
}

/**
 * Exact pins (`approxLocation === false` with lat/lng) open directions.
 * Everything else searches `nameZh || nameEn || name` plus the English city once.
 * An empty place name never becomes the city name, repeated or alone.
 */
export function buildGoogleMapsUrl(place: GoogleMapsPlaceInput): string {
  const lat = place.lat;
  const lng = place.lng;
  if (
    place.approxLocation === false &&
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  const label = firstPlaceName(place);
  const city = (place.cityNameEn ?? "").trim();
  let query: string;
  if (!label) {
    query = "Taiwan";
  } else if (!city || label.toLowerCase() === city.toLowerCase()) {
    query = label;
  } else {
    query = `${label} ${city}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query.replace(/\s+/g, " ").trim()
  )}`;
}
