import type { EnrichedPlace } from "@/lib/data/selectors";
import type { LayerToggles } from "@/lib/store/useTripStore";

export type MarkerArchetype = "lantern" | "bowl" | "bed" | "nature" | "star";

export interface MarkerEntry {
  place: EnrichedPlace;
  archetype: MarkerArchetype;
  importance: number;
  scale: number;
  color: string;
}

export function isPlaceVisible(
  place: EnrichedPlace,
  toggles: LayerToggles
): boolean {
  if (place.kind === "attraction") {
    if (place.isNature) return toggles.nature;
    return toggles.attractions;
  }
  if (place.kind === "food") {
    if (place.type === "market") return toggles.markets;
    if (place.type === "michelin-bib") return toggles.michelinBib;
    if (place.type === "hidden-local") return toggles.hiddenLocal;
    return toggles.food;
  }
  if (place.kind === "hotel") {
    return toggles.hotels;
  }
  return true;
}

export function getArchetypeAndColor(place: EnrichedPlace): {
  archetype: MarkerArchetype;
  color: string;
  importance: number;
} {
  if (place.kind === "hotel") {
    const color =
      place.tier === "splurge"
        ? "#f59e0b"
        : place.tier === "quality"
          ? "#0ea5e9"
          : "#10b981";
    const imp =
      place.tier === "splurge" ? 5 : place.tier === "quality" ? 4 : 3;
    return { archetype: "bed", color, importance: imp };
  }

  if (place.kind === "food") {
    if (place.type === "market") {
      return {
        archetype: "lantern",
        color: "#ff4522",
        importance: place.importance,
      };
    }
    const color =
      place.type === "michelin-bib"
        ? "#f43f5e"
        : place.type === "hidden-local"
          ? "#a855f7"
          : "#10b981";
    return { archetype: "bowl", color, importance: place.importance };
  }

  if (place.isNature) {
    return {
      archetype: "nature",
      color: place.importance === 5 ? "#10b981" : "#22c55e",
      importance: place.importance,
    };
  }

  if (place.importance === 5) {
    return { archetype: "star", color: "#fbbf24", importance: 5 };
  }

  return {
    archetype: "star",
    color: "#38bdf8",
    importance: place.importance,
  };
}
