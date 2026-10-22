import type { CityId } from "@/data/types";
import { TRIP_DATA } from "./loaders";

export interface SearchResultItem {
  id: string;
  kind: "city" | "leg" | "attraction" | "food" | "hotel";
  titleHe: string;
  subtitle: string;
  badgeHe: string;
  cityId: CityId;
  importance?: number;
  href: string;
}

export function searchEverything(rawQuery: string): SearchResultItem[] {
  const q = rawQuery.trim().toLowerCase();
  const results: SearchResultItem[] = [];

  for (const city of TRIP_DATA.cities) {
    if (
      !q ||
      city.nameHe.toLowerCase().includes(q) ||
      city.nameEn.toLowerCase().includes(q) ||
      city.id.toLowerCase().includes(q)
    ) {
      results.push({
        id: `city-${city.id}`,
        kind: "city",
        titleHe: `${city.nameHe} (${city.nameEn})`,
        subtitle: city.onRoute
          ? `${city.days} ימים במסלול • ${city.dates.join(", ")}`
          : "יעד מחוץ למסלול הלינה הראשי",
        badgeHe: city.onRoute ? "עיר במסלול" : "עיר",
        cityId: city.id,
        importance: city.onRoute ? 5 : 3,
        href: `/?city=${city.id}`,
      });
    }
  }

  for (const leg of TRIP_DATA.legs) {
    const city = TRIP_DATA.citiesById[leg.cityId];
    if (
      q &&
      (leg.focus.toLowerCase().includes(q) ||
        leg.anchor.toLowerCase().includes(q) ||
        leg.dates.toLowerCase().includes(q) ||
        (leg.notes && leg.notes.toLowerCase().includes(q)))
    ) {
      results.push({
        id: leg.id,
        kind: "leg",
        titleHe: `מקטע ${leg.order}: ${leg.focus} (${leg.dates})`,
        subtitle: leg.anchor,
        badgeHe: "מסלול",
        cityId: leg.cityId,
        importance: 5,
        href: `/route#${leg.id}`,
      });
    } else if (!q && leg.order <= 3) {
      results.push({
        id: leg.id,
        kind: "leg",
        titleHe: `מקטע ${leg.order}: ${leg.focus} (${leg.dates})`,
        subtitle: `${city.nameHe} • ${leg.days} ימים`,
        badgeHe: "מסלול",
        cityId: leg.cityId,
        importance: 4,
        href: `/route#${leg.id}`,
      });
    }
  }

  for (const place of TRIP_DATA.allPlaces) {
    const matches =
      !q ||
      place.name.toLowerCase().includes(q) ||
      (place.nameZh && place.nameZh.toLowerCase().includes(q)) ||
      place.description.toLowerCase().includes(q) ||
      place.city.toLowerCase().includes(q) ||
      place.cityNameHe.toLowerCase().includes(q) ||
      place.cityNameEn.toLowerCase().includes(q);

    if (!matches) continue;

    if (place.kind === "attraction") {
      results.push({
        id: place.id,
        kind: "attraction",
        titleHe: place.name,
        subtitle: `${place.cityNameHe} (${place.cityNameEn}) • ${place.description}`,
        badgeHe: place.isNature ? "טבע" : "אטרקציה",
        cityId: place.cityId,
        importance: place.importance,
        href: `/place/${place.id}`,
      });
    } else if (place.kind === "food") {
      results.push({
        id: place.id,
        kind: "food",
        titleHe: place.name,
        subtitle: `${place.cityNameHe} • ${place.typeHe} • ${place.description}`,
        badgeHe: place.typeHe,
        cityId: place.cityId,
        importance: place.importance,
        href: `/place/${place.id}`,
      });
    } else {
      results.push({
        id: place.id,
        kind: "hotel",
        titleHe: place.name,
        subtitle: `${place.cityNameHe} • ${place.tierHe} • ${place.description}`,
        badgeHe: `מלון (${place.tierHe})`,
        cityId: place.cityId,
        importance: 4,
        href: `/place/${place.id}`,
      });
    }
  }

  return results
    .sort((a, b) => (b.importance ?? 3) - (a.importance ?? 3))
    .slice(0, q ? 45 : 24);
}
