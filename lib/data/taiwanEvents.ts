import type { Attraction } from "@/data/types";
import practicalData from "@/data/practical.json";
import { getRouteLegs } from "@/lib/data/selectors";
import { TRIP_DATA } from "@/lib/data/loaders";
import {
  groupByMonth,
  monthBucketFromSortKey,
  parseEventSortKey,
} from "@/lib/data/eventDates";

export type TaiwanEventStatusKind =
  | "verified"
  | "sold_out"
  | "after_flight"
  | "not_in_city"
  | "tbc"
  | "unverified";

export interface TaiwanEventRow {
  id: string;
  titleHe: string;
  dateHe: string;
  detailHe: string;
  cityHe: string;
  legLabelHe?: string;
  statusKind: TaiwanEventStatusKind;
  statusLabelHe: string;
  sourceUrl?: string;
  ticketUrl?: string;
  sortKey: number;
  monthKey: string;
  monthLabelHe: string;
  placeId?: string;
}

const EVENT_ATTRACTION_RE =
  /פסטיבל|קונצרט|מופע|מסיבה|Ultra|fest|festival|concert|Fireball|GBIYUK|Accusefive|LE SSERAFIM|Kimura|BTS|ARIRANG|派对|夜遊|告五人/i;

export function isSpecialEventAttraction(attraction: Attraction): boolean {
  const hay = `${attraction.name} ${attraction.description} ${attraction.nameEn ?? ""}`;
  return EVENT_ATTRACTION_RE.test(hay);
}

function statusFromPracticalEvent(
  titleHe: string,
  legVerified: boolean
): { kind: TaiwanEventStatusKind; labelHe: string } {
  if (titleHe.includes("[אזל]")) {
    return { kind: "sold_out", labelHe: "אזל" };
  }
  if (titleHe.includes("[אחרי הטיסה")) {
    return { kind: "after_flight", labelHe: "אחרי הטיסה" };
  }
  if (titleHe.includes("[לא בעיר")) {
    return { kind: "not_in_city", labelHe: "לא בעיר בתאריך" };
  }
  if (/תאריך לא/i.test(titleHe) || /טרם פורסם/i.test(titleHe)) {
    return { kind: "tbc", labelHe: "תאריך לא סופי" };
  }
  if (legVerified) {
    return { kind: "verified", labelHe: "מקור מאומת" };
  }
  return { kind: "unverified", labelHe: "לא מאומת" };
}

function ticketUrlFromText(text: string, fallback?: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) return urlMatch[0].replace(/[.,]$/, "");
  return fallback;
}

function practicalEvents(): TaiwanEventRow[] {
  const legs = getRouteLegs();
  const transport = practicalData.legTransport as Record<
    string,
    {
      events?: Array<{ dateHe: string; titleHe: string; detailHe: string }>;
      verified?: boolean;
      bookingUrl?: string;
      sourceUrls?: string[];
    }
  >;

  const rows: TaiwanEventRow[] = [];
  for (const leg of legs) {
    const block = transport[leg.id];
    if (!block?.events?.length) continue;
    const cityHe = leg.focus;
    for (const [index, event] of block.events.entries()) {
      const sortKey = parseEventSortKey(event.dateHe);
      const { monthKey, monthLabelHe } = monthBucketFromSortKey(sortKey);
      const status = statusFromPracticalEvent(
        event.titleHe,
        Boolean(block.verified)
      );
      const cleanTitle = event.titleHe
        .replace(/^\[אזל\]\s*/, "")
        .replace(/^\[אחרי הטיסה[^\]]*\]\s*/, "")
        .replace(/^\[לא בעיר[^\]]*\]\s*/, "")
        .trim();
      rows.push({
        id: `practical-${leg.id}-${index}`,
        titleHe: cleanTitle,
        dateHe: event.dateHe,
        detailHe: event.detailHe,
        cityHe,
        legLabelHe: `מקטע ${leg.order}`,
        statusKind: status.kind,
        statusLabelHe: status.labelHe,
        sourceUrl: block.sourceUrls?.[0],
        ticketUrl:
          ticketUrlFromText(`${event.detailHe} ${event.titleHe}`, block.bookingUrl) ??
          block.bookingUrl,
        sortKey,
        monthKey,
        monthLabelHe,
      });
    }
  }
  return rows;
}

function attractionEvents(): TaiwanEventRow[] {
  const attractions = TRIP_DATA.attractions.filter(isSpecialEventAttraction);
  return attractions.map((attraction) => {
    const dateMatch = attraction.description.match(
      /(\d{1,2}(?:[–-]\d{1,2})?\.\d{1,2}(?:\.\d{4})?)/
    );
    const dateHe = dateMatch?.[1] ?? "במהלך המסלול";
    const sortKey = parseEventSortKey(dateHe);
    const { monthKey, monthLabelHe } = monthBucketFromSortKey(sortKey);
    const statusKind: TaiwanEventStatusKind = attraction.source
      ? "verified"
      : "unverified";
    return {
      id: `attr-${attraction.id}`,
      titleHe: attraction.name,
      dateHe,
      detailHe: attraction.description,
      cityHe: attraction.city,
      statusKind,
      statusLabelHe: statusKind === "verified" ? "אטרקציית אירוע" : "לא מאומת",
      sourceUrl: attraction.source ?? undefined,
      sortKey,
      monthKey,
      monthLabelHe,
      placeId: attraction.id,
    };
  });
}

export function getTaiwanSpecialEvents(): TaiwanEventRow[] {
  const merged = [...practicalEvents(), ...attractionEvents()];
  const byTitle = new Map<string, TaiwanEventRow>();
  for (const row of merged.sort((a, b) => a.sortKey - b.sortKey)) {
    const key = `${row.titleHe}::${row.dateHe}`;
    if (!byTitle.has(key)) byTitle.set(key, row);
  }
  return Array.from(byTitle.values()).sort((a, b) => a.sortKey - b.sortKey);
}

export function getTaiwanEventsGroupedByMonth() {
  return groupByMonth(getTaiwanSpecialEvents());
}
