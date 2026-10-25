import type { CityCategory } from "@/lib/store/tripStoreTypes";
import type { CityBundle, EnrichedPlace } from "./selectors";

export function placeImportance(place: EnrichedPlace): number {
  if (place.kind === "hotel") {
    if (place.tier === "splurge") return 5;
    if (place.tier === "quality") return 4;
    return 3;
  }
  return place.importance;
}

export function placeMatchesCityCategory(
  place: EnrichedPlace,
  category: CityCategory
): boolean {
  if (category === "all") return true;
  if (category === "food") return place.kind === "food";
  if (category === "hotels") return place.kind === "hotel";
  if (category === "nature") {
    return place.kind === "attraction" && place.isNature;
  }
  return place.kind === "attraction" && !place.isNature;
}

export function placesForCityCategory(
  bundle: CityBundle,
  category: CityCategory
): EnrichedPlace[] {
  const places: EnrichedPlace[] = [
    ...bundle.attractions,
    ...bundle.food,
    ...bundle.hotels,
  ];
  return places
    .filter((place) => placeMatchesCityCategory(place, category))
    .sort(
      (a, b) =>
        placeImportance(b) - placeImportance(a) ||
        a.name.localeCompare(b.name, "he")
    );
}

export function cityCategoryCounts(bundle: CityBundle) {
  const nature = bundle.attractions.filter((place) => place.isNature).length;
  const attractions = bundle.attractions.length - nature;
  return {
    all: bundle.attractions.length + bundle.food.length + bundle.hotels.length,
    attractions,
    food: bundle.food.length,
    hotels: bundle.hotels.length,
    nature,
  };
}

export function placeCategoryLabel(place: EnrichedPlace): string {
  if (place.kind === "food") return place.typeHe || "אוכל";
  if (place.kind === "hotel") return place.tierHe || "מלון";
  if (place.isNature) return "טבע";
  return "אטרקציה";
}
