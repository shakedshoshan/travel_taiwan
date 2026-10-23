export type SheetHistorySource = "user" | "history" | "url";

export function sheetSearch(cityId: string, placeId: string | null): string {
  const params = new URLSearchParams();
  params.set("city", cityId);
  if (placeId) params.set("place", placeId);
  return `/?${params.toString()}`;
}

/** Push a sheet URL, or replace it when the sheet is already the current entry. */
export function pushOrReplaceSheet(cityId: string, placeId: string | null) {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  const url = sheetSearch(cityId, placeId);
  const next = { twSheet: true, cityId, placeId };
  if (window.history.state?.twSheet) {
    window.history.replaceState(next, "", url);
    return;
  }
  window.history.pushState(next, "", url);
}

/** Back closes the sheet entry before the browser leaves the page. */
export function backSheetIfOwned() {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") return;
  if (window.history.state?.twSheet) {
    window.history.back();
  }
}

/**
 * A shared `/?city=` link is split so the first Back closes the sheet
 * and the next Back leaves the page.
 */
export function seedSheetHistory(cityId: string, placeId: string | null) {
  if (typeof window === "undefined") return;
  if (window.history.state?.twSheet) return;
  window.history.replaceState({ twSheet: false }, "", "/");
  window.history.pushState(
    { twSheet: true, cityId, placeId },
    "",
    sheetSearch(cityId, placeId)
  );
}
