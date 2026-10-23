import { TRIP_DATA } from "./loaders";
import { getAllCities, getTimelineDays } from "./selectors";

export interface TripSpan {
  dayCount: number;
  legCount: number;
  dateRange: string;
  startIso: string;
  endIso: string;
  routeCityNamesHe: string[];
}

/** Day count and date labels derived from route legs and the generated timeline. */
export function getTripSpan(): TripSpan {
  const days = getTimelineDays();
  const first = days[0];
  const last = days[days.length - 1] ?? first;
  const dayCount = TRIP_DATA.legs.reduce((sum, leg) => sum + leg.days, 0);
  return {
    dayCount,
    legCount: TRIP_DATA.legs.length,
    dateRange: `${first.dateShort}–${last.dateShort}`,
    startIso: first.dateIso,
    endIso: last.dateIso,
    routeCityNamesHe: getAllCities()
      .filter((city) => city.onRoute)
      .map((city) => city.nameHe),
  };
}
