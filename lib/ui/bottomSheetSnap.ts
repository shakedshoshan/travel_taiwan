import type { SheetSnapPoint } from "@/lib/store/tripStoreTypes";
import {
  nextSheetSnapOnTap,
  visibleHeightPx,
  decideSnapFromRelease,
} from "@/lib/ui/bottomSheetGeometry";

export type { SheetSnapPoint };

export function sheetHeightCss(): string {
  return "90dvh";
}

export function sheetBottomReservePx(
  snap: SheetSnapPoint,
  viewportHeight: number
): number {
  const vh = Math.max(480, viewportHeight);
  if (snap === "full") return visibleHeightPx(vh, "full");
  if (snap === "half") return visibleHeightPx(vh, "half");
  if (snap === "peek") return visibleHeightPx(vh, "peek");
  return 0;
}

export {
  decideSnapFromRelease as decideSheetSnapAfterDrag,
  nextSheetSnapOnTap,
};
