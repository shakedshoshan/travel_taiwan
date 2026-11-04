import type { SheetSnapPoint } from "@/lib/store/tripStoreTypes";

export type OpenSheetSnap = Exclude<SheetSnapPoint, "closed">;

export function readViewportHeight(): number {
  if (typeof window === "undefined") return 844;
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

/** Fixed sheet panel height (always rendered at full expansion size). */
export function sheetPanelHeightPx(viewportHeight: number): number {
  const vh = Math.max(480, viewportHeight);
  return Math.round(vh * 0.9);
}

export function visibleHeightPx(
  viewportHeight: number,
  snap: OpenSheetSnap
): number {
  const vh = Math.max(480, viewportHeight);
  if (snap === "full") return Math.round(vh * 0.9);
  if (snap === "half") return Math.round(vh * 0.55);
  return Math.max(120, Math.round(vh * 0.2));
}

/** translateY that leaves `visibleHeightPx` of the panel showing (panel anchored to bottom). */
export function offsetYForVisible(
  panelHeightPx: number,
  visiblePx: number
): number {
  return Math.max(0, panelHeightPx - visiblePx);
}

export function offsetYForSnap(
  viewportHeight: number,
  snap: OpenSheetSnap
): number {
  const panel = sheetPanelHeightPx(viewportHeight);
  return offsetYForVisible(panel, visibleHeightPx(viewportHeight, snap));
}

export function visibleFromOffset(
  panelHeightPx: number,
  offsetPx: number
): number {
  return Math.max(0, panelHeightPx - offsetPx);
}

const FLING_MS_TO_PX = 140;

export function decideSnapFromRelease(
  viewportHeight: number,
  offsetPx: number,
  velocityY: number
): SheetSnapPoint {
  const panel = sheetPanelHeightPx(viewportHeight);
  let projectedVisible = visibleFromOffset(panel, offsetPx);

  if (velocityY > 0.25) {
    projectedVisible -= velocityY * FLING_MS_TO_PX;
  } else if (velocityY < -0.25) {
    projectedVisible += -velocityY * FLING_MS_TO_PX;
  }

  const peekV = visibleHeightPx(viewportHeight, "peek");
  const halfV = visibleHeightPx(viewportHeight, "half");
  const fullV = visibleHeightPx(viewportHeight, "full");

  if (projectedVisible < peekV * 0.45) return "closed";

  const candidates: Array<{ snap: OpenSheetSnap; visible: number }> = [
    { snap: "peek", visible: peekV },
    { snap: "half", visible: halfV },
    { snap: "full", visible: fullV },
  ];

  let best: OpenSheetSnap = "peek";
  let bestDist = Infinity;
  for (const item of candidates) {
    const dist = Math.abs(projectedVisible - item.visible);
    if (dist < bestDist) {
      bestDist = dist;
      best = item.snap;
    }
  }

  if (velocityY > 0.55 && best === "full") return "half";
  if (velocityY > 0.55 && best === "half") return "peek";
  if (velocityY < -0.45 && best === "peek") return "half";
  if (velocityY < -0.45 && best === "half") return "full";

  return best;
}

export function nextSheetSnapOnTap(snap: OpenSheetSnap): SheetSnapPoint {
  if (snap === "peek") return "half";
  if (snap === "half") return "full";
  return "peek";
}
