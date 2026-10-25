export type SheetHistorySource = "user" | "history" | "url";

type SheetHistoryState = {
  twSheet?: boolean;
  level?: "city" | "place";
  cityId?: string | null;
  placeId?: string | null;
  sheetDepth?: number;
};

export function sheetSearch(cityId: string, placeId: string | null): string {
  const params = new URLSearchParams();
  params.set("city", cityId);
  if (placeId) params.set("place", placeId);
  return `/?${params.toString()}`;
}

function historyState(): SheetHistoryState | null {
  if (typeof window === "undefined") return null;
  return (window.history.state as SheetHistoryState | null) ?? null;
}

function onHome(): boolean {
  return typeof window !== "undefined" && window.location.pathname === "/";
}

/** Push `/?city=`, or replace when a city entry is already current. */
export function pushCityEntry(cityId: string) {
  if (!onHome()) return;
  const url = sheetSearch(cityId, null);
  const prev = historyState();
  if (!prev?.twSheet) {
    window.history.pushState(
      { twSheet: true, level: "city", cityId, placeId: null, sheetDepth: 1 },
      "",
      url
    );
    return;
  }
  window.history.replaceState(
    {
      twSheet: true,
      level: "city",
      cityId,
      placeId: null,
      sheetDepth: prev.sheetDepth ?? 1,
    },
    "",
    url
  );
}

/** Push `/?city=&place=` on top of the city entry. Switching places replaces. */
export function pushPlaceEntry(cityId: string, placeId: string) {
  if (!onHome()) return;
  const url = sheetSearch(cityId, placeId);
  const prev = historyState();
  if (prev?.twSheet && prev.level === "place") {
    window.history.replaceState(
      {
        twSheet: true,
        level: "place",
        cityId,
        placeId,
        sheetDepth: prev.sheetDepth ?? 2,
      },
      "",
      url
    );
    return;
  }
  if (!prev?.twSheet) {
    window.history.pushState(
      { twSheet: true, level: "city", cityId, placeId: null, sheetDepth: 1 },
      "",
      sheetSearch(cityId, null)
    );
  }
  const depth = (historyState()?.sheetDepth ?? 1) + 1;
  window.history.pushState(
    { twSheet: true, level: "place", cityId, placeId, sheetDepth: depth },
    "",
    url
  );
}

/** Pop every city/place entry back to the Taiwan overview. */
export function exitToOverview() {
  if (!onHome()) return;
  const depth = historyState()?.sheetDepth ?? 0;
  if (depth > 0) {
    window.history.go(-depth);
    return;
  }
  if (window.location.search) {
    window.history.replaceState({ twSheet: false, sheetDepth: 0 }, "", "/");
  }
}

/** One step: place → city, or city → Taiwan. */
export function backOneSheetLevel() {
  if (!onHome()) return;
  if (historyState()?.twSheet) window.history.back();
}

/**
 * A shared link is split so Back walks place → city → the previous page.
 */
export function seedSheetHistory(cityId: string, placeId: string | null) {
  if (typeof window === "undefined") return;
  if (historyState()?.twSheet) return;
  window.history.replaceState({ twSheet: false, sheetDepth: 0 }, "", "/");
  window.history.pushState(
    { twSheet: true, level: "city", cityId, placeId: null, sheetDepth: 1 },
    "",
    sheetSearch(cityId, null)
  );
  if (!placeId) return;
  window.history.pushState(
    { twSheet: true, level: "place", cityId, placeId, sheetDepth: 2 },
    "",
    sheetSearch(cityId, placeId)
  );
}
