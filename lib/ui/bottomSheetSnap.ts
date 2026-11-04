import type { SheetSnapPoint } from "@/lib/store/tripStoreTypes";

export type { SheetSnapPoint };

/** Visual sheet height — keep in sync with `sheetBottomReservePx`. */
export function sheetHeightCss(snap: Exclude<SheetSnapPoint, "closed">): string {
  if (snap === "peek") return "max(120px, 20dvh)";
  if (snap === "half") return "55dvh";
  return "90dvh";
}

export function sheetBottomReservePx(
  snap: SheetSnapPoint,
  viewportHeight: number
): number {
  const h = Math.max(480, viewportHeight);
  if (snap === "full") return Math.round(h * 0.9);
  if (snap === "half") return Math.round(h * 0.55);
  if (snap === "peek") return Math.max(120, Math.round(h * 0.2));
  return 0;
}

const DRAG_DOWN_CLOSE_PX = 64;
const DRAG_DOWN_VEL = 0.55;
const DRAG_UP_OPEN_PX = 32;
const DRAG_UP_VEL = 0.35;

export function decideSheetSnapAfterDrag(
  snap: Exclude<SheetSnapPoint, "closed">,
  dy: number,
  velocityY: number
): SheetSnapPoint {
  if (dy > DRAG_DOWN_CLOSE_PX || velocityY > DRAG_DOWN_VEL) {
    if (snap === "full") return "half";
    if (snap === "half") return "peek";
    return "closed";
  }
  if (dy < -DRAG_UP_OPEN_PX || velocityY < -DRAG_UP_VEL) {
    if (snap === "peek") return "half";
    if (snap === "half") return "full";
  }
  return snap;
}

export function nextSheetSnapOnTap(
  snap: Exclude<SheetSnapPoint, "closed">
): SheetSnapPoint {
  if (snap === "peek") return "half";
  if (snap === "half") return "full";
  return "peek";
}
