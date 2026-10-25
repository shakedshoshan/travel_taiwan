import { getRouteLegs, getTimelineDays } from "./selectors";

export interface TripSpan {
  dayCount: number;
  legCount: number;
  dateRange: string;
  startIso: string;
  endIso: string;
  routeCityNamesHe: string[];
}

/** Day count, dates, and route cities derived from the generated timeline. */
export function getTripSpan(): TripSpan {
  const days = getTimelineDays();
  const legs = getRouteLegs();
  const first = days[0];
  const last = days[days.length - 1] ?? first;
  const routeCityNamesHe: string[] = [];
  for (const leg of legs) {
    const name = days.find((day) => day.legId === leg.id)?.cityNameHe;
    if (name && routeCityNamesHe[routeCityNamesHe.length - 1] !== name) {
      routeCityNamesHe.push(name);
    }
  }
  return {
    dayCount: days.length,
    legCount: legs.length,
    dateRange: first && last ? `${first.dateShort}–${last.dateShort}` : "",
    startIso: first?.dateIso ?? "2026-11-06",
    endIso: last?.dateIso ?? "2026-12-08",
    routeCityNamesHe,
  };
}
