import {
  CENTRAL_MOUNTAIN_PEAKS,
  OFFSHORE_ISLANDS,
  TAIWAN_COASTLINE_LAT_LNG,
  sampleTaiwanDem,
} from "./taiwanGeo";

// Geographic center of Taiwan for projection to 3D world space
export const TAIWAN_CENTER_LAT = 23.62;
export const TAIWAN_CENTER_LNG = 120.98;

// 1 deg latitude ≈ 111km, 1 deg longitude at 23.6N ≈ 101.8km
export const WORLD_LAT_SCALE = 7.6;
export const WORLD_LNG_SCALE = 7.6 * 0.916;
export const ISLAND_BASE_HEIGHT = 0.24;
export const MAX_MOUNTAIN_HEIGHT = 2.05;

const GOLDEN_ANGLE_RAD = Math.PI * (3 - Math.sqrt(5)); // ~2.399963229728653 rad

export interface World3DPoint {
  x: number;
  y: number;
  z: number;
}

export interface ResolvedCoordinates {
  lat: number;
  lng: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  isExact: boolean;
}

/**
 * Shared projection function converting latitude/longitude into horizontal 3D plane coordinates
 * (x = West->East, z = North->South where North is -Z and East is +X).
 */
export function latLngToXZ(lat: number, lng: number): { x: number; z: number } {
  const x = (lng - TAIWAN_CENTER_LNG) * WORLD_LNG_SCALE;
  const z = -(lat - TAIWAN_CENTER_LAT) * WORLD_LAT_SCALE;
  return { x, z };
}

/**
 * Inverse transform from world (x, z) back to (lat, lng).
 */
export function xzToLatLng(x: number, z: number): { lat: number; lng: number } {
  const lng = x / WORLD_LNG_SCALE + TAIWAN_CENTER_LNG;
  const lat = -z / WORLD_LAT_SCALE + TAIWAN_CENTER_LAT;
  return { lat, lng };
}

function isLatLngInsidePolygon(
  lat: number,
  lng: number,
  poly: ReadonlyArray<readonly [number, number]>
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const lati = poly[i][0];
    const lngi = poly[i][1];
    const latj = poly[j][0];
    const lngj = poly[j][1];
    const intersect =
      lngi > lng !== lngj > lng &&
      lat < ((latj - lati) * (lng - lngi)) / (lngj - lngi + 1e-10) + lati;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Downsampled real DEM + peak synthesis for Taiwan's Central Mountain Range,
 * East Rift Valley, Coastal Range, and offshore islands.
 */
export function getElevationAtLatLng(lat: number, lng: number): number {
  // Check offshore islands first
  for (const isl of OFFSHORE_ISLANDS) {
    const dLat = (lat - isl.centerLat) / 0.12;
    const dLng = (lng - isl.centerLng) / 0.12;
    const dSq = dLat * dLat + dLng * dLng;
    if (dSq < 1.8) {
      return ISLAND_BASE_HEIGHT + isl.peakHeight * Math.exp(-dSq * 1.6);
    }
  }

  const demValue = sampleTaiwanDem(lat, lng);

  let peakDetail = 0;
  for (const peak of CENTRAL_MOUNTAIN_PEAKS) {
    const dLat = (lat - peak.lat) / peak.radiusLat;
    const dLng = (lng - peak.lng) / peak.radiusLng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < 2.8) {
      peakDetail += peak.height * Math.exp(-distSq * 2.2);
    }
  }

  // Fine ridge texture so high mountain ranges have crisp facets
  const ridgeDetail =
    0.09 *
    Math.sin(lat * 22.0 + lng * 14.0) *
    Math.cos(lat * 13.0 - lng * 19.0);

  // Sun Moon Lake scenic depression
  const dSmlLat = (lat - 23.865) / 0.068;
  const dSmlLng = (lng - 120.915) / 0.068;
  const smlBasin = Math.exp(-(dSmlLat * dSmlLat + dSmlLng * dSmlLng)) * 0.24;

  const combined =
    demValue * 0.65 +
    peakDetail * 0.36 +
    ridgeDetail * Math.max(0, demValue - 0.15) -
    smlBasin;

  const normalized = Math.max(0, Math.min(1.12, combined));
  return ISLAND_BASE_HEIGHT + normalized * MAX_MOUNTAIN_HEIGHT;
}

/**
 * Samples terrain height in world units at world (x, z).
 */
export function getIslandHeightAtXZ(x: number, z: number): number {
  const { lat, lng } = xzToLatLng(x, z);
  return getElevationAtLatLng(lat, lng);
}

/**
 * Converts (lat, lng) directly to a 3D world point sitting on the terrain surface (plus optional yOffset).
 */
export function latLngToWorld3D(
  lat: number,
  lng: number,
  yOffset = 0
): World3DPoint {
  const { x, z } = latLngToXZ(lat, lng);
  const y = getElevationAtLatLng(lat, lng) + yOffset;
  return { x, y, z };
}

/**
 * Computes coordinates for a place:
 * - Uses exact item lat/lng when `approxLocation` is false or overridden in `/data/overrides.json`.
 * - Otherwise applies a deterministic golden-angle spiral offset around the city center,
 *   clamped to stay on the proper coast (east coast for Hualien/Taitung, west coast for Tainan/Kaohsiung).
 */
export function resolvePlaceCoordinates(
  item: {
    lat: number;
    lng: number;
    approxLocation: boolean;
    exactLat?: number;
    exactLng?: number;
  },
  indexWithinCity: number,
  totalInCity: number
): ResolvedCoordinates {
  const hasExactOverride =
    typeof item.exactLat === "number" && typeof item.exactLng === "number";

  if (hasExactOverride || !item.approxLocation) {
    const lat = item.exactLat ?? item.lat;
    const lng = item.exactLng ?? item.lng;
    const { x, y, z } = latLngToWorld3D(lat, lng, 0.08);
    return {
      lat,
      lng,
      worldX: x,
      worldY: y,
      worldZ: z,
      isExact: true,
    };
  }

  // Golden-angle spiral around city center so markers never overlap
  const angle = indexWithinCity * GOLDEN_ANGLE_RAD;
  const stepRadiusDeg = 0.0125;
  const maxNormalized = Math.sqrt(indexWithinCity + 1);
  const scaleFactor = totalInCity > 35 ? 0.72 : 0.92;
  const radiusLat = stepRadiusDeg * maxNormalized * scaleFactor;
  const radiusLng = (stepRadiusDeg * maxNormalized * scaleFactor) / 0.916;

  // Keep east-coast cities (Hualien, Taitung) on the east coast and west-coast cities on land
  const isEastCoast = item.lng > 121.1 && item.lat < 24.85;
  const inwardLngBias = isEastCoast
    ? -Math.abs(Math.cos(angle) * radiusLng) * 0.45
    : (120.95 - item.lng) * 0.06;

  let lat = item.lat + Math.sin(angle) * radiusLat;
  let lng = item.lng + Math.cos(angle) * radiusLng + inwardLngBias;

  // Ensure spiral point stays on the main island polygon
  if (!isLatLngInsidePolygon(lat, lng, TAIWAN_COASTLINE_LAT_LNG)) {
    lat = item.lat + (lat - item.lat) * 0.35;
    lng = item.lng + (lng - item.lng) * 0.35;
  }

  const { x, y, z } = latLngToWorld3D(lat, lng, 0.08);

  return {
    lat,
    lng,
    worldX: x,
    worldY: y,
    worldZ: z,
    isExact: false,
  };
}
