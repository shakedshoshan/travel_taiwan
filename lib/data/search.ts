import type { CityId } from "@/data/types";
import { TRIP_DATA } from "./loaders";

const NAME_ALIASES: Record<string, readonly string[]> = {
  taipei: ["taipei", "taibei"],
  kenting: ["kenting", "kending", "hengchun"],
  "guishan island": ["guishan", "gui shan", "gueishan", "turtle island"],
  "keelung islet": ["keelung islet", "keelung island"],
  "sun moon lake": ["sun moon lake", "sunmoon"],
  "green island": ["green island", "ludao"],
  "orchid island (lanyu)": ["orchid island", "lanyu"],
  penghu: ["penghu", "pescadores"],
  xiaoliuqiu: ["xiaoliuqiu", "liuqiu", "lamay"],
  kaohsiung: ["kaohsiung", "gaoxiong"],
  taichung: ["taichung", "taizhong"],
  taitung: ["taitung", "taidong"],
  hualien: ["hualien", "hualian"],
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’ʼʻ′]/g, "")
    .toLowerCase()
    .trim();
}

function textHit(haystack: string | null | undefined, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  return fold(haystack).includes(needle);
}

function aliasHit(label: string | null | undefined, needle: string): boolean {
  if (!needle || !label) return false;
  const list = NAME_ALIASES[fold(label)];
  if (!list) return false;
  return list.some((alias) => fold(alias).includes(needle));
}

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
  const q = fold(rawQuery);
  const results: SearchResultItem[] = [];

  for (const city of TRIP_DATA.cities) {
    if (
      !q ||
      textHit(city.nameHe, q) ||
      textHit(city.nameEn, q) ||
      textHit(city.id, q) ||
      aliasHit(city.nameEn, q)
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
      (textHit(leg.focus, q) ||
        textHit(leg.anchor, q) ||
        textHit(leg.dates, q) ||
        textHit(leg.notes, q) ||
        textHit(city?.nameEn, q) ||
        aliasHit(city?.nameEn, q))
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
      textHit(place.name, q) ||
      textHit(place.nameZh, q) ||
      textHit(place.nameEn, q) ||
      aliasHit(place.nameEn, q) ||
      textHit(place.description, q) ||
      textHit(place.city, q) ||
      textHit(place.cityNameHe, q) ||
      textHit(place.cityNameEn, q) ||
      aliasHit(place.cityNameEn, q);

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
