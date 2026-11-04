import type { SheetSnapPoint } from "./tripStoreTypes";

/** Sheet height when a place is focused vs city-only overview. */
export function sheetSnapAfterPlaceFocus(
  placeId: string | null,
  selectedCityId: string | null,
  previousSnap: SheetSnapPoint
): SheetSnapPoint {
  if (!placeId && !selectedCityId) return "closed";
  if (!placeId) return selectedCityId ? "peek" : "closed";
  if (previousSnap === "full") return "full";
  return "half";
}
