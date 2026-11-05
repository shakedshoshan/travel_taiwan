import citiesRaw from "@/data/philippines/cities.json";
import attractionsRaw from "@/data/philippines/attractions.json";
import foodRaw from "@/data/philippines/food.json";
import hotelsRaw from "@/data/philippines/hotels.json";
import eventsRaw from "@/data/philippines/events.json";
import natureRaw from "@/data/philippines/nature.json";
import activitiesRaw from "@/data/philippines/activities.json";
import practicalRaw from "@/data/philippines/practical.json";
import {
  PhilippinesActivitiesArraySchema,
  PhilippinesAttractionsArraySchema,
  PhilippinesCitiesArraySchema,
  PhilippinesEventsArraySchema,
  PhilippinesFoodArraySchema,
  PhilippinesHotelsArraySchema,
  PhilippinesNatureArraySchema,
  PhilippinesPracticalArraySchema,
  assertPhilippinesCityIds,
} from "./schemas";
import type {
  PhilippinesCategoryId,
  PhilippinesCity,
  PhilippinesListRow,
} from "./types";

const cities = PhilippinesCitiesArraySchema.parse(citiesRaw);
const validCityIds = new Set(cities.map((c) => c.id));

const attractions = PhilippinesAttractionsArraySchema.parse(attractionsRaw);
const food = PhilippinesFoodArraySchema.parse(foodRaw);
const hotels = PhilippinesHotelsArraySchema.parse(hotelsRaw);
const events = PhilippinesEventsArraySchema.parse(eventsRaw);
const nature = PhilippinesNatureArraySchema.parse(natureRaw);
const activities = PhilippinesActivitiesArraySchema.parse(activitiesRaw);
const practical = PhilippinesPracticalArraySchema.parse(practicalRaw);

for (const [label, rows] of [
  ["attractions", attractions],
  ["food", food],
  ["hotels", hotels],
  ["events", events],
  ["nature", nature],
  ["activities", activities],
] as const) {
  assertPhilippinesCityIds(validCityIds, label, rows);
}

const citiesById = new Map(cities.map((c) => [c.id, c]));

function hotelImportance(tier: string): number {
  if (tier === "splurge") return 5;
  if (tier === "quality") return 4;
  return 3;
}

function toLocatedRow(
  item: Record<string, unknown>,
  category: PhilippinesCategoryId
): PhilippinesListRow {
  const cityId = String(item.cityId);
  const city = citiesById.get(cityId);
  const tier = typeof item.tier === "string" ? item.tier : "";
  const importance =
    typeof item.importance === "number"
      ? item.importance
      : category === "hotels"
        ? hotelImportance(tier)
        : 3;
  return {
    id: String(item.id),
    name: String(item.name),
    description: String(item.description),
    importance,
    status: item.status as PhilippinesListRow["status"],
    source: String(item.source),
    category,
    groupKey: cityId,
    groupLabel: city?.nameHe ?? cityId,
    city: String(item.city),
    cityId,
    dates: typeof item.dates === "string" ? item.dates : undefined,
    hours: typeof item.hours === "string" || item.hours === null ? (item.hours as string | null) : undefined,
    priceText:
      typeof item.priceText === "string" || item.priceText === null
        ? (item.priceText as string | null)
        : undefined,
    tierHe: typeof item.tierHe === "string" ? item.tierHe : undefined,
    typeHe: typeof item.typeHe === "string" ? item.typeHe : undefined,
    isNature: Boolean(item.isNature) || category === "nature",
  };
}

const allRows: PhilippinesListRow[] = [
  ...attractions.map((item) => toLocatedRow(item, "attractions")),
  ...food.map((item) => toLocatedRow(item, "food")),
  ...hotels.map((item) => toLocatedRow(item, "hotels")),
  ...events.map((item) => toLocatedRow(item, "events")),
  ...nature.map((item) => toLocatedRow(item, "nature")),
  ...activities.map((item) => toLocatedRow(item, "activities")),
  ...practical.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    importance: item.importance,
    status: item.status,
    source: item.source,
    category: "practical" as const,
    groupKey: item.topic,
    groupLabel: item.topic,
  })),
];

const cityOrder = new Map(cities.map((c, i) => [c.id, i]));

export const PHILIPPINES_DATA = {
  cities,
  attractions,
  food,
  hotels,
  events,
  nature,
  activities,
  practical,
  allRows,
  totalRows: allRows.length,
};

export function getPhilippinesCities(): PhilippinesCity[] {
  return PHILIPPINES_DATA.cities;
}

export function getPhilippinesRowsForCategory(
  category: PhilippinesCategoryId
): PhilippinesListRow[] {
  return PHILIPPINES_DATA.allRows
    .filter((row) => row.category === category)
    .sort((a, b) => {
      if (category === "practical") {
        const topicCmp = a.groupLabel.localeCompare(b.groupLabel, "he");
        if (topicCmp !== 0) return topicCmp;
        return b.importance - a.importance;
      }
      const orderA = cityOrder.get(a.groupKey) ?? 999;
      const orderB = cityOrder.get(b.groupKey) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return b.importance - a.importance;
    });
}

export function countPhilippinesByCategory(): Record<PhilippinesCategoryId, number> {
  return {
    attractions: attractions.length,
    food: food.length,
    hotels: hotels.length,
    events: events.length,
    nature: nature.length,
    activities: activities.length,
    practical: practical.length,
  };
}
