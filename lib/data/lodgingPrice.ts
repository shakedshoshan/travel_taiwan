export type StayRateMode = "bed" | "room";

export interface LodgingQuote {
  priceText: string;
  priceMin: number | null;
  priceMax: number | null;
}

function usable(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 150) return null;
  return value;
}

function mentionsBed(priceText: string): boolean {
  return priceText.includes("מיטה");
}

function mentionsRoom(priceText: string): boolean {
  return /חדר|פרטי|זוגי/.test(priceText);
}

/** Separate display chip. Mixed listings show both units. */
export function lodgingUnitChip(priceText: string): "מיטה" | "חדר" | "מיטה / חדר" {
  const bed = mentionsBed(priceText);
  const room = mentionsRoom(priceText);
  if (bed && room) return "מיטה / חדר";
  if (bed) return "מיטה";
  return "חדר";
}

/**
 * Bed mode uses the bed figure and skips room-only stays.
 * Room mode uses the private-room figure and skips bed-only stays.
 * A scraped priceMin of 11 or 12 is ignored in favor of priceMax.
 */
export function nightlyRateForMode(
  hotel: LodgingQuote,
  mode: StayRateMode
): number | null {
  const min = usable(hotel.priceMin);
  const max = usable(hotel.priceMax);
  const bed = mentionsBed(hotel.priceText);
  const room = mentionsRoom(hotel.priceText);
  const mixed = bed && room && min != null && max != null && max > min;

  if (mode === "bed") {
    if (!bed) return null;
    if (mixed) return min;
    return min ?? max;
  }

  if (bed && !room) return null;
  if (mixed) return max;
  return max ?? min;
}
