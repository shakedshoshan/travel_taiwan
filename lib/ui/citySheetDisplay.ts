import type { CityId } from "@/data/types";
import type { EnrichedCity } from "@/lib/data/selectors";

const CITY_EMOJI: Partial<Record<CityId, string>> = {
  taipei: "🏙️",
  "new-taipei": "🌉",
  kaohsiung: "🌊",
  tainan: "🏯",
  taichung: "🎡",
  "sun-moon-lake": "🛶",
  alishan: "🌲",
  kenting: "🏖️",
  hualien: "🏔️",
  taitung: "🌾",
};

export function citySheetEmoji(cityId: CityId): string {
  return CITY_EMOJI[cityId] ?? "📍";
}

export function citySheetSubtitle(city: EnrichedCity): string {
  const tripDates =
    city.dates?.length === 1
      ? city.dates[0]
      : city.dates?.length
        ? `${city.dates.length} תקופות במסלול`
        : city.nameEn;
  if (city.days > 0) return `${city.nameEn} · ${city.days} ימים · ${tripDates}`;
  return `${city.nameEn} · ${tripDates}`;
}
