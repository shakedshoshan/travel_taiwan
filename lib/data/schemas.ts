import { z } from "zod";
import type {
  Attraction,
  AuditNote,
  City,
  CityId,
  Food,
  FoodType,
  Hotel,
  HotelTier,
  RouteData,
  RouteLeg,
} from "@/data/types";

export const CITY_IDS = [
  "taipei",
  "new-taipei",
  "keelung",
  "yilan",
  "taoyuan",
  "hsinchu",
  "miaoli",
  "taichung",
  "changhua",
  "nantou",
  "sun-moon-lake",
  "chiayi",
  "alishan",
  "tainan",
  "kaohsiung",
  "pingtung",
  "hualien",
  "taitung",
] as const satisfies readonly CityId[];

export const CityIdSchema = z.enum(CITY_IDS);

export const LocatedSchema = z.object({
  cityId: CityIdSchema,
  city: z.string().min(1),
  lat: z.number().min(21).max(26),
  lng: z.number().min(119).max(123),
  approxLocation: z.boolean(),
  // Optional overrides so exact geocoded coordinates can be added per item later
  exactLat: z.number().min(21).max(26).optional(),
  exactLng: z.number().min(119).max(123).optional(),
});

export const CitySchema: z.ZodType<City> = z.object({
  id: CityIdSchema,
  nameHe: z.string().min(1),
  nameEn: z.string().min(1),
  lat: z.number().min(21).max(26),
  lng: z.number().min(119).max(123),
  onRoute: z.boolean(),
  routeOrder: z.array(z.number().int().positive()).nullable(),
  dates: z.array(z.string()),
  days: z.number().int().nonnegative(),
});

export const AttractionSchema: z.ZodType<
  Attraction & { exactLat?: number; exactLng?: number }
> = LocatedSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  nameZh: z.string().nullable(),
  description: z.string(),
  importance: z.number().int().min(1).max(5),
  isNature: z.boolean(),
});

export const FoodTypeSchema: z.ZodType<FoodType> = z.enum([
  "market",
  "cheap",
  "michelin-bib",
  "hidden-local",
]);

export const FoodSchema: z.ZodType<
  Food & { exactLat?: number; exactLng?: number }
> = LocatedSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  nameZh: z.string().nullable(),
  typeHe: z.string().min(1),
  type: FoodTypeSchema,
  description: z.string(),
  hours: z.string().nullable(),
  importance: z.number().int().min(1).max(5),
  priceText: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  priceUnit: z.literal("NT$ per person"),
  hoursVerified: z.boolean(),
  priceVerified: z.boolean(),
  verified: z.boolean(),
});

export const HotelTierSchema: z.ZodType<HotelTier> = z.enum([
  "cheap",
  "quality",
  "splurge",
]);

export const HotelSchema: z.ZodType<
  Hotel & { exactLat?: number; exactLng?: number }
> = LocatedSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  nameZh: z.string().nullable(),
  tierHe: z.string().min(1),
  tier: HotelTierSchema,
  priceText: z.string().min(1),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  priceUnit: z.literal("NT$ per night"),
  description: z.string(),
  source: z.string().nullable(),
  verified: z.boolean(),
});

export const RouteLegSchema: z.ZodType<RouteLeg> = z.object({
  order: z.number().int().positive(),
  id: z.string().min(1),
  focus: z.string().min(1),
  cityId: CityIdSchema,
  days: z.number().int().positive(),
  dates: z.string().min(1),
  anchor: z.string().min(1),
  notes: z.string().nullable(),
});

export const AuditNoteSchema: z.ZodType<AuditNote> = z.object({
  topic: z.string().min(1),
  status: z.string().min(1),
  finding: z.string().min(1),
});

export const RouteDataSchema: z.ZodType<RouteData> = z.object({
  legs: z.array(RouteLegSchema).min(1),
  audit: z.array(AuditNoteSchema),
});

export const CitiesArraySchema = z.array(CitySchema).length(18);
export const AttractionsArraySchema = z.array(AttractionSchema).min(1);
export const FoodArraySchema = z.array(FoodSchema).min(1);
export const HotelsArraySchema = z.array(HotelSchema).min(1);
