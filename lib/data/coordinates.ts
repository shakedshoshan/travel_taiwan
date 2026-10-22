import { CENTRAL_MOUNTAIN_PEAKS } from "./taiwanGeo";

// Geographic center of Taiwan for projection to 3D world space
export const TAIWAN_CENTER_LAT = 23.62;
export const TAIWAN_CENTER_LNG = 120.98;

// 1 deg latitude ≈ 111km, 1 deg longitude at 23.6N ≈ 101.8km
export const WORLD_LAT_SCALE = 7.6;
export const WORLD_LNG_SCALE = 7.6 * 0.916;
export const ISLAND_BASE_HEIGHT = 0.26;
export const MAX_MOUNTAIN_HEIGHT = 2.15;

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
 * Converts latitude/longitude into horizontal 3D plane coordinates (x = East/West, z = South/North).
 * Note: North is -Z so that looking from the South/above keeps North at the top of the viewport
 * and East at +X (right-hand coordinate system with +Y up).
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

/**
 * Deterministic elevation function for Taiwan's Central Mountain Range (running down east-center).
 * Used both to displace the 3D island geometry and to place city pins / category markers on top of the terrain.
 */
export function getElevationAtLatLng(lat: number, lng: number): number {
  let ridgeSum = 0;

  for (const peak of CENTRAL_MOUNTAIN_PEAKS) {
    const dLat = (lat - peak.lat) / peak.radiusLat;
    const dLng = (lng - peak.lng) / peak.radiusLng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < 4.5) {
      ridgeSum += peak.height * Math.exp(-distSq * 1.15);
    }
  }

  // Subtle deterministic organic ridges running NNE-SSW along Taiwan's tectonic axis (~18 deg)
  const ridgeAxis = (lat - 23.6) * 0.32 - (lng - 121.1) * 0.95;
  const alongAxis = (lat - 23.6) * 0.95 + (lng - 121.1) * 0.32;
  const spineEnvelope = Math.exp(-(ridgeAxis * ridgeAxis) / 0.09) *
    Math.exp(-(alongAxis * alongAxis) / 1.45);

  const detailWave =
    0.08 *
    Math.sin(lat * 26.0 + lng * 19.0) *
    Math.cos(lat * 18.0 - lng * 31.0);

  // Sun Moon Lake basin depression so the lake sits in a scenic mountain hollow
  const dSmlLat = (lat - 23.865) / 0.075;
  const dSmlLng = (lng - 120.915) / 0.075;
  const smlBasin = Math.exp(-(dSmlLat * dSmlLat + dSmlLng * dSmlLng)) * 0.22;

  const normalized = Math.max(
    0,
    Math.min(1.25, ridgeSum * 0.62 + spineEnvelope * 0.45 + detailWave * spineEnvelope - smlBasin)
  );

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
 * Computes deterministic golden-angle spiral offset around the city center for places with `approxLocation: true`,
 * while respecting optional `exactLat` / `exactLng` overrides if added in the future.
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
  const stepRadiusDeg = 0.0135; // compact ~1.5km base step
  const maxNormalized = Math.sqrt(indexWithinCity + 1);
  // Keep spiral tight even in cities with 60+ items (like Taipei)
  const scaleFactor = totalInCity > 35 ? 0.78 : 1.0;
  const radiusLat = stepRadiusDeg * maxNormalized * scaleFactor;
  const radiusLng = (stepRadiusDeg * maxNormalized * scaleFactor) / 0.916;

  // Slightly nudge coastal cities inward toward the island spine (lng ~120.95) so spiral pins stay on land
  const inwardLngBias = (120.95 - item.lng) * 0.08;

  const lat = item.lat + Math.sin(angle) * radiusLat;
  const lng = item.lng + Math.cos(angle) * radiusLng + inwardLngBias;
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
