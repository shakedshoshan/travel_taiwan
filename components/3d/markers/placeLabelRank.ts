import type { CityCategory } from "@/lib/store/tripStoreTypes";
import type { EnrichedPlace } from "@/lib/data/selectors";
import {
  placeImportance,
  placeMatchesCityCategory,
} from "@/lib/data/cityCategory";

export function ellipsis16(name: string): string {
  const chars = Array.from(name);
  if (chars.length <= 16) return name;
  return `${chars.slice(0, 16).join("")}…`;
}

/** Map labels stay Hebrew. The Chinese name stays in the place card. */
export function mapLabelName(name: string): string {
  const hebrew = name.replace(/[\u3400-\u9fff]+/g, " ").replace(/\s+/g, " ").trim();
  return ellipsis16(hebrew || name);
}

export function rankPlacesForLabels(
  places: EnrichedPlace[],
  category: CityCategory,
  centerX: number,
  centerZ: number,
  hiddenIds: Set<string>,
  focusedPlaceId: string | null
): EnrichedPlace[] {
  return places
    .filter((place) => place.id !== focusedPlaceId && !hiddenIds.has(place.id))
    .sort((a, b) => {
      const mustA = placeImportance(a) >= 4 ? 1 : 0;
      const mustB = placeImportance(b) >= 4 ? 1 : 0;
      if (mustA !== mustB) return mustB - mustA;
      const catA =
        category !== "all" && placeMatchesCityCategory(a, category) ? 1 : 0;
      const catB =
        category !== "all" && placeMatchesCityCategory(b, category) ? 1 : 0;
      if (catA !== catB) return catB - catA;
      const distA =
        (a.resolvedCoords.worldX - centerX) ** 2 +
        (a.resolvedCoords.worldZ - centerZ) ** 2;
      const distB =
        (b.resolvedCoords.worldX - centerX) ** 2 +
        (b.resolvedCoords.worldZ - centerZ) ** 2;
      return distA - distB;
    });
}
