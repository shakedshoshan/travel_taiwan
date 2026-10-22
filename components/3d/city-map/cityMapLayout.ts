import {
  getCityBundle,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import type { LayerToggles } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

export interface CityMapNode {
  place: EnrichedPlace;
  x: number;
  y: number;
  z: number;
  color: string;
  accentColor: string;
  badgeText: string;
  categoryGroup: "hotel" | "market" | "food" | "nature" | "attraction";
  importance: number;
  approxDistanceKm: number;
}

export type CityCategoryFilter =
  | "all"
  | "hotel"
  | "food"
  | "attraction"
  | "nature";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function isPlaceEnabledByToggles(
  place: EnrichedPlace,
  toggles: LayerToggles
): boolean {
  if (place.kind === "hotel") return toggles.hotels;
  if (place.kind === "food") {
    if (place.type === "market") return toggles.markets;
    if (place.type === "michelin-bib") return toggles.michelinBib;
    if (place.type === "hidden-local") return toggles.hiddenLocal;
    return toggles.food;
  }
  if (place.kind === "attraction") {
    return place.isNature ? toggles.nature : toggles.attractions;
  }
  return true;
}

export function matchesCityCategoryFilter(
  node: CityMapNode,
  categoryFilter: CityCategoryFilter
): boolean {
  if (categoryFilter === "all") return true;
  if (categoryFilter === "hotel") return node.categoryGroup === "hotel";
  if (categoryFilter === "food")
    return node.categoryGroup === "food" || node.categoryGroup === "market";
  if (categoryFilter === "nature") return node.categoryGroup === "nature";
  if (categoryFilter === "attraction")
    return (
      node.categoryGroup === "attraction" || node.categoryGroup === "nature"
    );
  return true;
}

/**
 * Deterministically maps all places of a city (hotels, restaurants/markets, attractions/nature)
 * onto a spacious 3D Destination Diorama (-11..+11 world units) with zero overlap.
 */
export function computeCityMapNodes(cityId: CityId): CityMapNode[] {
  const bundle = getCityBundle(cityId);
  const { hotels, food, attractions } = bundle;

  const nodes: CityMapNode[] = [];

  // 1. Hotels -> Inner Grand Boulevard Ring (radius 2.4 .. 3.9)
  hotels.forEach((hotel, idx) => {
    const count = Math.max(1, hotels.length);
    const angle = (idx / count) * Math.PI * 2 + 0.35;
    const radius = 2.6 + (idx % 2) * 0.85;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.22;

    const color =
      hotel.tier === "splurge"
        ? "#f59e0b"
        : hotel.tier === "quality"
          ? "#0ea5e9"
          : "#10b981";

    nodes.push({
      place: hotel,
      x,
      y,
      z,
      color,
      accentColor: "#ffffff",
      badgeText: `מלון • ${hotel.tierHe}`,
      categoryGroup: "hotel",
      importance:
        hotel.tier === "splurge" ? 5 : hotel.tier === "quality" ? 4 : 3,
      approxDistanceKm: Number((radius * 0.35).toFixed(1)),
    });
  });

  // 2. Food & Night Markets -> Culinary District Ring (radius 4.3 .. 7.4)
  food.forEach((item, idx) => {
    const count = Math.max(1, food.length);
    const norm = (idx + 0.5) / count;
    const angle = idx * GOLDEN_ANGLE + 1.1;
    const radius = 4.3 + Math.sqrt(norm) * 3.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.22;

    const isMarket = item.type === "market";
    const color = isMarket
      ? "#ff5a36"
      : item.type === "michelin-bib"
        ? "#f43f5e"
        : item.type === "hidden-local"
          ? "#a855f7"
          : "#10b981";

    nodes.push({
      place: item,
      x,
      y,
      z,
      color,
      accentColor: isMarket ? "#fde047" : "#ffffff",
      badgeText: item.typeHe,
      categoryGroup: isMarket ? "market" : "food",
      importance: item.importance,
      approxDistanceKm: Number((radius * 0.42).toFixed(1)),
    });
  });

  // 3. Attractions (Urban & Nature) -> Cultural Plaza & Scenic Rim (radius 4.8 .. 10.2)
  const urbanAttractions = attractions.filter((a) => !a.isNature);
  const natureAttractions = attractions.filter((a) => a.isNature);

  urbanAttractions.forEach((attr, idx) => {
    const count = Math.max(1, urbanAttractions.length);
    const norm = (idx + 0.5) / count;
    const angle = idx * GOLDEN_ANGLE + 2.4;
    const radius = 4.8 + Math.sqrt(norm) * 3.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.24;

    nodes.push({
      place: attr,
      x,
      y,
      z,
      color: attr.importance === 5 ? "#fbbf24" : "#38bdf8",
      accentColor: "#ffffff",
      badgeText: "אטרקציה עירונית",
      categoryGroup: "attraction",
      importance: attr.importance,
      approxDistanceKm: Number((radius * 0.48).toFixed(1)),
    });
  });

  natureAttractions.forEach((attr, idx) => {
    const count = Math.max(1, natureAttractions.length);
    const angle = (idx / count) * Math.PI * 2 + 0.75;
    const radius = 8.2 + (idx % 3) * 0.95;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.48;

    nodes.push({
      place: attr,
      x,
      y,
      z,
      color: "#10b981",
      accentColor: "#a7f3d0",
      badgeText: "טבע ונוף",
      categoryGroup: "nature",
      importance: attr.importance,
      approxDistanceKm: Number((radius * 0.65).toFixed(1)),
    });
  });

  return nodes;
}
