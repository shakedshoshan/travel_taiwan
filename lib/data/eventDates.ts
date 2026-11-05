const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

const DEFAULT_YEAR = 2026;

/** First calendar day in a Hebrew date string like `14.11.2026 • 18:30` or `6–8.11.2026`. */
export function parseEventSortKey(dateHe: string): number {
  const match = dateHe.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (!match) return 9_999_999;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : DEFAULT_YEAR;
  if (year < 100) year += 2000;
  return year * 10_000 + month * 100 + day;
}

export function monthBucketFromSortKey(sortKey: number): {
  monthKey: string;
  monthLabelHe: string;
} {
  if (sortKey >= 9_999_000) {
    return { monthKey: "unknown", monthLabelHe: "תאריך לא ידוע" };
  }
  const year = Math.floor(sortKey / 10_000);
  const month = Math.floor((sortKey % 10_000) / 100);
  const monthName = HEBREW_MONTHS[month - 1] ?? `חודש ${month}`;
  return {
    monthKey: `${year}-${String(month).padStart(2, "0")}`,
    monthLabelHe: `${monthName} ${year}`,
  };
}

export function groupByMonth<T extends { sortKey: number; monthKey: string; monthLabelHe: string }>(
  rows: T[]
): { monthKey: string; monthLabelHe: string; rows: T[] }[] {
  const map = new Map<string, { monthLabelHe: string; rows: T[] }>();
  for (const row of rows) {
    const entry = map.get(row.monthKey) ?? {
      monthLabelHe: row.monthLabelHe,
      rows: [],
    };
    entry.rows.push(row);
    map.set(row.monthKey, entry);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, value]) => ({
      monthKey,
      monthLabelHe: value.monthLabelHe,
      rows: value.rows.sort((a, b) => a.sortKey - b.sortKey),
    }));
}
