"use client";

import { useEffect, useRef } from "react";
import type { SheetSnapPoint } from "@/lib/store/tripStoreTypes";
import {
  decideSnapFromRelease,
  nextSheetSnapOnTap,
  offsetYForSnap,
  readViewportHeight,
  sheetPanelHeightPx,
  type OpenSheetSnap,
} from "@/lib/ui/bottomSheetGeometry";
import { runSpring } from "@/lib/ui/runSpring";

interface MotionState {
  offsetPx: number;
  snap: OpenSheetSnap;
  dragging: boolean;
  dragStartY: number | null;
  dragStartOffset: number;
  dragStartTime: number;
  lastMoveY: number;
  lastMoveTime: number;
  velocityY: number;
  cancelSpring: (() => void) | null;
  moved: boolean;
}

export interface UseBottomSheetTransformOptions {
  snap: OpenSheetSnap;
  onSnapChange: (snap: SheetSnapPoint) => void;
  onClose: () => void;
}

export function useBottomSheetTransform({
  snap,
  onSnapChange,
  onClose,
}: UseBottomSheetTransformOptions) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const stateRef = useRef<MotionState>({
    offsetPx: 0,
    snap,
    dragging: false,
    dragStartY: null,
    dragStartOffset: 0,
    dragStartTime: 0,
    lastMoveY: 0,
    lastMoveTime: 0,
    velocityY: 0,
    cancelSpring: null,
    moved: false,
  });

  const applyTransform = () => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = `translate3d(0, ${stateRef.current.offsetPx}px, 0)`;
  };

  const springToOffset = (target: number, onDone?: () => void) => {
    stateRef.current.cancelSpring?.();
    const from = stateRef.current.offsetPx;
    stateRef.current.cancelSpring = runSpring(
      from,
      target,
      (value) => {
        stateRef.current.offsetPx = value;
        applyTransform();
      },
      () => {
        stateRef.current.cancelSpring = null;
        stateRef.current.offsetPx = target;
        applyTransform();
        onDone?.();
      },
      { stiffness: 420, damping: 38 }
    );
  };

  useEffect(() => {
    const vh = readViewportHeight();
    if (stateRef.current.offsetPx === 0 && !stateRef.current.dragging) {
      stateRef.current.offsetPx = sheetPanelHeightPx(vh);
      applyTransform();
    }
    stateRef.current.snap = snap;
    if (stateRef.current.dragging) return;
    springToOffset(offsetYForSnap(vh, snap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap]);

  useEffect(() => {
    const onResize = () => {
      if (stateRef.current.dragging) return;
      springToOffset(offsetYForSnap(readViewportHeight(), stateRef.current.snap));
    };
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("resize", onResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      stateRef.current.cancelSpring?.();
      document.documentElement.classList.remove("sheet-dragging");
    },
    []
  );

  const finishDrag = () => {
    const st = stateRef.current;
    if (st.dragStartY === null) return;
    const velocityY = st.velocityY;
    st.dragging = false;
    st.dragStartY = null;
    document.documentElement.classList.remove("sheet-dragging");

    const vh = readViewportHeight();
    const next = decideSnapFromRelease(vh, st.offsetPx, velocityY);
    if (next === "closed") {
      springToOffset(sheetPanelHeightPx(vh), onClose);
      return;
    }
    if (next !== st.snap) onSnapChange(next);
    else springToOffset(offsetYForSnap(vh, st.snap));
  };

  const beginDrag = (clientY: number, pointerId: number) => {
    stateRef.current.cancelSpring?.();
    stateRef.current.cancelSpring = null;
    stateRef.current.dragging = true;
    stateRef.current.dragStartY = clientY;
    stateRef.current.dragStartOffset = stateRef.current.offsetPx;
    stateRef.current.dragStartTime = performance.now();
    stateRef.current.lastMoveY = clientY;
    stateRef.current.lastMoveTime = performance.now();
    stateRef.current.velocityY = 0;
    stateRef.current.moved = false;
    document.documentElement.classList.add("sheet-dragging");

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      if (stateRef.current.dragStartY === null) return;
      e.preventDefault();
      const dy = e.clientY - stateRef.current.dragStartY;
      if (Math.abs(dy) > 5) stateRef.current.moved = true;

      const now = performance.now();
      const dt = Math.max(1, now - stateRef.current.lastMoveTime);
      stateRef.current.velocityY =
        (e.clientY - stateRef.current.lastMoveY) / dt;
      stateRef.current.lastMoveY = e.clientY;
      stateRef.current.lastMoveTime = now;

      const vh = readViewportHeight();
      const panel = sheetPanelHeightPx(vh);
      stateRef.current.offsetPx = Math.min(
        panel,
        Math.max(0, stateRef.current.dragStartOffset + dy)
      );
      applyTransform();
    };

    const onEnd = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      finishDrag();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  const handleGrabTap = () => {
    if (stateRef.current.moved) {
      stateRef.current.moved = false;
      return;
    }
    const next = nextSheetSnapOnTap(snap);
    if (next === "closed") onClose();
    else onSnapChange(next);
  };

  return { sheetRef, beginDrag, handleGrabTap };
}
