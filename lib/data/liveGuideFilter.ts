import type { LiveGuideEntry } from "./liveGuide";

const MIZRAHNIK = "מזרחניק";

export function getLiveGuideSourceKey(
  source: string
): "mizrahnik" | "app" | "shaked" | "other" {
  if (source === MIZRAHNIK) return "mizrahnik";
  if (source.includes("האפליקציה")) return "app";
  if (source.includes("Shaked")) return "shaked";
  return "other";
}

export function isMizrahnikSource(source: string): boolean {
  return getLiveGuideSourceKey(source) === "mizrahnik";
}

const HEBREW_RE = /[\u0590-\u05FF]/;

/** Prefer Hebrew `name` when present; otherwise show `nameZh` or English first. */
export function getLiveGuideDisplayName(entry: LiveGuideEntry): {
  primary: string;
  secondary: string | null;
} {
  const name = entry.name.trim();
  const zhRaw = entry.nameZh;
  const zh = typeof zhRaw === "string" ? zhRaw.trim() : "";
  if (HEBREW_RE.test(name)) {
    return { primary: name, secondary: zh && zh !== name ? zh : null };
  }
  if (zh) {
    return { primary: zh, secondary: name };
  }
  return { primary: name, secondary: null };
}

export function getLiveGuideStatusBucket(
  status: string | null | undefined
): string {
  if (!status || !status.trim()) return "none";
  const s = status;
  if (/סגור|מוגבל|סגורים|סגורה|סגורות/.test(s)) return "closed_limited";
  if (/לבדוק|מידע מהאפליקציה/.test(s)) return "check_before";
  if (/תלוי עונה|עונתי|עונה/.test(s)) return "seasonal";
  if (/לוגיסטיקה/.test(s)) return "heavy_logistics";
  return "other";
}

export const LIVE_GUIDE_STATUS_BUCKETS: { value: string; labelHe: string }[] = [
  { value: "none", labelHe: "ללא סטטוס מובחן" },
  { value: "check_before", labelHe: "לבדוק לפני יציאה" },
  { value: "closed_limited", labelHe: "סגור / מוגבל" },
  { value: "seasonal", labelHe: "תלוי עונה או עונתי" },
  { value: "heavy_logistics", labelHe: "לוגיסטיקה כבדה" },
  { value: "other", labelHe: "אחר / היסטורי" },
];

export interface LiveGuideFilterState {
  query: string;
  area: string;
  type: string;
  priority: string;
  source: string;
  statusBucket: string;
}

export const LIVE_GUIDE_DEFAULT_FILTERS: LiveGuideFilterState = {
  query: "",
  area: "",
  type: "",
  priority: "",
  source: "",
  statusBucket: "",
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function entrySearchBlob(e: LiveGuideEntry): string {
  const { primary, secondary } = getLiveGuideDisplayName(e);
  return normalize(
    [
      primary,
      secondary ?? "",
      e.area,
      e.nameZh ?? "",
      e.note ?? "",
      e.hours ?? "",
      e.status ?? "",
      e.source,
      ...(e.types ?? []),
      String(e.priority),
    ].join(" ")
  );
}

function matchesQuery(e: LiveGuideEntry, q: string): boolean {
  if (!q) return true;
  const needle = normalize(q);
  return entrySearchBlob(e).includes(needle);
}

export function filterAndSortLiveGuide(
  entries: LiveGuideEntry[],
  filters: LiveGuideFilterState
): LiveGuideEntry[] {
  const out = entries.filter((e) => {
    if (!matchesQuery(e, filters.query)) return false;
    if (filters.area && e.area !== filters.area) return false;
    if (filters.type && !(e.types ?? []).includes(filters.type)) return false;
    if (filters.priority && String(e.priority) !== filters.priority) return false;
    if (filters.source && getLiveGuideSourceKey(e.source) !== filters.source) {
      return false;
    }
    if (filters.statusBucket) {
      const b = getLiveGuideStatusBucket(e.status);
      if (b !== filters.statusBucket) return false;
    }
    return true;
  });

  out.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.area.localeCompare(b.area, "he");
  });

  return out;
}

export function collectUniqueAreas(entries: LiveGuideEntry[]): string[] {
  const s = new Set<string>();
  for (const e of entries) s.add(e.area);
  return [...s].sort((a, b) => a.localeCompare(b, "he"));
}

export function collectUniqueTypes(entries: LiveGuideEntry[]): string[] {
  const s = new Set<string>();
  for (const e of entries) {
    for (const t of e.types ?? []) s.add(t);
  }
  return [...s].sort((a, b) => a.localeCompare(b, "he"));
}
