import citiesRaw from "@/data/cities.json";
import routeRaw from "@/data/route.json";
import attractionsRaw from "@/data/attractions.json";
import foodRaw from "@/data/food.json";
import hotelsRaw from "@/data/hotels.json";
import overridesRaw from "@/data/overrides.json";
import practicalRaw from "@/data/practical.json";
import type {
  Attraction,
  AuditNote,
  City,
  CityId,
  Food,
  Hotel,
  RouteLeg,
} from "@/data/types";
import {
  AttractionsArraySchema,
  CitiesArraySchema,
  FoodArraySchema,
  HotelsArraySchema,
  OverridesRecordSchema,
  RouteDataSchema,
  type PlaceOverride,
} from "./schemas";
import {
  latLngToWorld3D,
  resolvePlaceCoordinates,
  type ResolvedCoordinates,
} from "./coordinates";

export interface EnrichedCity extends City {
  worldX: number;
  worldY: number;
  worldZ: number;
}

export interface PlaceMeta {
  resolvedCoords: ResolvedCoordinates;
  indexWithinCity: number;
  cityNameHe: string;
  cityNameEn: string;
  nameEn?: string | null;
}

export type EnrichedAttraction = Attraction &
  PlaceMeta & {
    kind: "attraction";
    exactLat?: number;
    exactLng?: number;
  };

export type EnrichedFood = Food &
  PlaceMeta & {
    kind: "food";
    exactLat?: number;
    exactLng?: number;
  };

export type EnrichedHotel = Hotel &
  PlaceMeta & {
    kind: "hotel";
    exactLat?: number;
    exactLng?: number;
  };

export type EnrichedPlace = EnrichedAttraction | EnrichedFood | EnrichedHotel;

export interface ValidatedTripDataset {
  cities: EnrichedCity[];
  citiesById: Record<CityId, EnrichedCity>;
  legs: RouteLeg[];
  audit: AuditNote[];
  attractions: EnrichedAttraction[];
  food: EnrichedFood[];
  hotels: EnrichedHotel[];
  allPlaces: EnrichedPlace[];
  placesById: Map<string, EnrichedPlace>;
}

function applyOverride<
  T extends {
    id: string;
    name: string;
    nameZh: string | null;
    nameEn?: string | null;
    cityId: CityId;
    lat: number;
    lng: number;
    approxLocation: boolean;
    exactLat?: number;
    exactLng?: number;
  },
>(
  item: T,
  overrides: Record<string, PlaceOverride>
): T & { nameEn?: string | null } {
  const ov = overrides[item.id] ?? overrides[item.name];
  if (!ov) return item;

  const hasCoords = typeof ov.lat === "number" && typeof ov.lng === "number";
  return {
    ...item,
    nameZh: ov.nameZh ?? item.nameZh,
    nameEn: ov.nameEn ?? item.nameEn ?? null,
    cityId: ov.cityId ?? item.cityId,
    lat: ov.lat ?? item.lat,
    lng: ov.lng ?? item.lng,
    approxLocation: hasCoords ? false : item.approxLocation,
    exactLat: ov.lat ?? item.exactLat,
    exactLng: ov.lng ?? item.exactLng,
  };
}

function validateAndBuildDataset(): ValidatedTripDataset {
  const citiesParsed = CitiesArraySchema.parse(citiesRaw);
  const routeParsed = RouteDataSchema.parse(routeRaw);
  const overridesParsed = OverridesRecordSchema.parse(overridesRaw);

  const attractionsParsed = AttractionsArraySchema.parse(attractionsRaw).map(
    (a) => applyOverride(a, overridesParsed)
  );
  const foodParsed = FoodArraySchema.parse(foodRaw).map((f) =>
    applyOverride(f, overridesParsed)
  );
  const hotelsParsed = HotelsArraySchema.parse(hotelsRaw).map((h) =>
    applyOverride(h, overridesParsed)
  );

  const validCityIds = new Set<string>(citiesParsed.map((c) => c.id));

  // Fail build immediately if any item references an unknown cityId
  for (const leg of routeParsed.legs) {
    if (!validCityIds.has(leg.cityId)) {
      throw new Error(
        `[Data Validation Error] Route leg "${leg.id}" has broken cityId "${leg.cityId}"`
      );
    }
  }
  for (const attr of attractionsParsed) {
    if (!validCityIds.has(attr.cityId)) {
      throw new Error(
        `[Data Validation Error] Attraction "${attr.id}" (${attr.name}) has broken cityId "${attr.cityId}"`
      );
    }
  }
  for (const item of foodParsed) {
    if (!validCityIds.has(item.cityId)) {
      throw new Error(
        `[Data Validation Error] Food "${item.id}" (${item.name}) has broken cityId "${item.cityId}"`
      );
    }
  }
  for (const hotel of hotelsParsed) {
    if (!validCityIds.has(hotel.cityId)) {
      throw new Error(
        `[Data Validation Error] Hotel "${hotel.id}" (${hotel.name}) has broken cityId "${hotel.cityId}"`
      );
    }
  }

  const cities: EnrichedCity[] = citiesParsed.map((city) => {
    const world = latLngToWorld3D(city.lat, city.lng, 0.12);
    return {
      ...city,
      worldX: world.x,
      worldY: world.y,
      worldZ: world.z,
    };
  });

  const citiesById = Object.fromEntries(
    cities.map((c) => [c.id, c])
  ) as Record<CityId, EnrichedCity>;

  // Count total items per city so golden-angle spiral scales nicely
  const cityCounts = new Map<CityId, number>();
  const cityRunningIndex = new Map<CityId, number>();

  for (const item of [...attractionsParsed, ...foodParsed, ...hotelsParsed]) {
    cityCounts.set(item.cityId, (cityCounts.get(item.cityId) ?? 0) + 1);
  }

  const nextCityIndex = (cityId: CityId): { index: number; total: number } => {
    const current = cityRunningIndex.get(cityId) ?? 0;
    cityRunningIndex.set(cityId, current + 1);
    return { index: current, total: cityCounts.get(cityId) ?? 1 };
  };

  const attractions: EnrichedAttraction[] = attractionsParsed.map((attr) => {
    const { index, total } = nextCityIndex(attr.cityId);
    const cityObj = citiesById[attr.cityId];
    return {
      ...attr,
      kind: "attraction",
      indexWithinCity: index,
      cityNameHe: cityObj.nameHe,
      cityNameEn: cityObj.nameEn,
      resolvedCoords: resolvePlaceCoordinates(attr, index, total),
    };
  });

  const food: EnrichedFood[] = foodParsed.map((item) => {
    const { index, total } = nextCityIndex(item.cityId);
    const cityObj = citiesById[item.cityId];
    return {
      ...item,
      kind: "food",
      indexWithinCity: index,
      cityNameHe: cityObj.nameHe,
      cityNameEn: cityObj.nameEn,
      resolvedCoords: resolvePlaceCoordinates(item, index, total),
    };
  });

  const hotels: EnrichedHotel[] = hotelsParsed.map((hotel) => {
    const { index, total } = nextCityIndex(hotel.cityId);
    const cityObj = citiesById[hotel.cityId];
    return {
      ...hotel,
      kind: "hotel",
      indexWithinCity: index,
      cityNameHe: cityObj.nameHe,
      cityNameEn: cityObj.nameEn,
      resolvedCoords: resolvePlaceCoordinates(hotel, index, total),
    };
  });

  const allPlaces: EnrichedPlace[] = [...attractions, ...food, ...hotels];
  const placesById = new Map<string, EnrichedPlace>(
    allPlaces.map((p) => [p.id, p])
  );

  // Build-time dataset counts verification (P0 #1)
  const kentingHotelsCount = hotels.filter((h) => h.cityId === "kenting").length;
  const hasKentingCity = cities.some((c) => c.id === "kenting");
  const alertsCount = Array.isArray(practicalRaw.alerts)
    ? practicalRaw.alerts.length
    : 0;

  if (attractions.length !== 180) {
    throw new Error(
      `[Data Check Failed] Expected 180 attractions, got ${attractions.length}`
    );
  }
  if (hotels.length !== 40) {
    throw new Error(
      `[Data Check Failed] Expected 40 hotels, got ${hotels.length}`
    );
  }
  if (kentingHotelsCount !== 3) {
    throw new Error(
      `[Data Check Failed] Expected 3 Kenting hotels, got ${kentingHotelsCount}`
    );
  }
  if (!hasKentingCity) {
    throw new Error(`[Data Check Failed] Expected cities.json to include kenting`);
  }
  if (alertsCount <= 0) {
    throw new Error(
      `[Data Check Failed] Expected practical.json alerts > 0, got ${alertsCount}`
    );
  }

  return {
    cities,
    citiesById,
    legs: [...routeParsed.legs].sort((a, b) => a.order - b.order),
    audit: routeParsed.audit,
    attractions,
    food,
    hotels,
    allPlaces,
    placesById,
  };
}

export const TRIP_DATA: ValidatedTripDataset = validateAndBuildDataset();
