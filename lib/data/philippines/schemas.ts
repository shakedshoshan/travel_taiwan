import { z } from "zod";

export const PhilippinesStatusSchema = z.enum([
  "אומת",
  "לא אומת",
  "תאריך לא סופי",
]);

export const PhilippinesCitySchema = z.object({
  id: z.string().min(1),
  nameHe: z.string().min(1),
  nameEn: z.string().min(1),
  lat: z.number().min(4).max(22),
  lng: z.number().min(115).max(128),
  onRoute: z.boolean(),
  routeOrder: z.array(z.number().int().positive()).nullable(),
  dates: z.array(z.string()),
  days: z.number().int().nonnegative(),
});

const LocatedBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameZh: z.string().nullable(),
  city: z.string().min(1),
  description: z.string(),
  importance: z.number().int().min(1).max(5),
  status: PhilippinesStatusSchema,
  source: z.string().min(1),
  cityId: z.string().min(1),
  lat: z.number().min(4).max(22),
  lng: z.number().min(115).max(128),
  approxLocation: z.boolean(),
  isNature: z.boolean().optional(),
});

export const PhilippinesAttractionSchema = LocatedBaseSchema.extend({
  isNature: z.boolean(),
});

export const PhilippinesFoodSchema = LocatedBaseSchema.extend({
  typeHe: z.string().min(1),
  type: z.string().min(1),
  hours: z.string().nullable(),
  priceText: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  priceUnit: z.string().min(1),
  hoursVerified: z.boolean(),
  priceVerified: z.boolean(),
  verified: z.boolean(),
});

export const PhilippinesHotelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nameZh: z.string().nullable(),
  city: z.string().min(1),
  description: z.string(),
  status: PhilippinesStatusSchema,
  source: z.string().min(1),
  cityId: z.string().min(1),
  lat: z.number().min(4).max(22),
  lng: z.number().min(115).max(128),
  approxLocation: z.boolean(),
  tierHe: z.string().min(1),
  tier: z.string().min(1),
  priceText: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  priceUnit: z.string().min(1),
  verified: z.boolean(),
  importance: z.number().int().min(1).max(5).optional(),
});

export const PhilippinesEventSchema = LocatedBaseSchema.extend({
  dates: z.string().min(1),
});

export const PhilippinesPracticalSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  importance: z.number().int().min(1).max(5),
  status: PhilippinesStatusSchema,
  verified: z.boolean().optional(),
  source: z.string().min(1),
});

export const PhilippinesCitiesArraySchema = z.array(PhilippinesCitySchema);
export const PhilippinesAttractionsArraySchema = z.array(PhilippinesAttractionSchema);
export const PhilippinesFoodArraySchema = z.array(PhilippinesFoodSchema);
export const PhilippinesHotelsArraySchema = z.array(PhilippinesHotelSchema);
export const PhilippinesEventsArraySchema = z.array(PhilippinesEventSchema);
export const PhilippinesNatureArraySchema = z.array(PhilippinesAttractionSchema);
export const PhilippinesActivitiesArraySchema = z.array(LocatedBaseSchema);
export const PhilippinesPracticalArraySchema = z.array(PhilippinesPracticalSchema);

export function assertPhilippinesCityIds(
  validIds: Set<string>,
  label: string,
  rows: { cityId: string; id: string }[]
) {
  for (const row of rows) {
    if (!validIds.has(row.cityId)) {
      throw new Error(
        `[Philippines data] ${label} row ${row.id} has unknown cityId "${row.cityId}"`
      );
    }
  }
}
