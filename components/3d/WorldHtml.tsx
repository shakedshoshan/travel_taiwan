"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  labelElements,
  labelSlots,
  queueLabelSolve,
  setFarZoom,
} from "./overlay/labelOverlapSolver";

interface WorldHtmlEntry {
  id: string;
  children: React.ReactNode;
  center: boolean;
  anchor: "center" | "bottom";
  zIndex: number;
  ariaHidden: boolean;
  bindElement: (el: HTMLDivElement | null) => void;
}

const entriesMap = new Map<string, WorldHtmlEntry>();
let snapshotEntries: WorldHtmlEntry[] = [];
const listeners = new Set<() => void>();

function emitEntriesChange() {
  snapshotEntries = Array.from(entriesMap.values());
  for (const listener of listeners) {
    listener();
  }
}

function subscribeEntries(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getEntriesSnapshot(): WorldHtmlEntry[] {
  return snapshotEntries;
}

const SERVER_SNAPSHOT: WorldHtmlEntry[] = [];
function getEntriesServerSnapshot(): WorldHtmlEntry[] {
  return SERVER_SNAPSHOT;
}

/**
 * Pure ReactDOM overlay host rendered as a sibling to <Canvas>.
 * Eliminates all secondary ReactDOM.createRoot() and manual removeChild() calls.
 */
export function WorldHtmlHost() {
  const entries = useSyncExternalStore(
    subscribeEntries,
    getEntriesSnapshot,
    getEntriesServerSnapshot
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-15 overflow-hidden">
      {entries.map((entry) => (
        <div
          key={entry.id}
          ref={entry.bindElement}
          aria-hidden={entry.ariaHidden || undefined}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transformOrigin: "0 0",
            pointerEvents: "auto",
            zIndex: entry.zIndex,
            willChange: "transform",
            opacity: 0,
          }}
        >
          <div
            data-anchor={
              entry.anchor === "bottom" ? "bottom" : entry.center ? "center" : "none"
            }
            style={{
              transform:
                entry.anchor === "bottom"
                  ? "translate3d(-50%, -100%, 0)"
                  : entry.center
                    ? "translate3d(-50%, -50%, 0)"
                    : undefined,
            }}
          >
            {entry.children}
          </div>
        </div>
      ))}
    </div>
  );
}

interface WorldHtmlProps {
  position?: [number, number, number];
  center?: boolean;
  anchor?: "center" | "bottom";
  /** Screen-space pixel offset [dx, dy] applied after 3D projection (e.g. [0, -8] for <=12px above pin) */
  screenOffset?: [number, number];
  /** Clamp projected label inside safe viewport area so labels never clip off-screen */
  clampToViewport?: boolean;
  /** Hide when the anchor is outside the frustum instead of sliding it to a screen edge. */
  hideWhenOffscreen?: boolean;
  /** Extra bottom inset as a fraction of the viewport (open bottom sheet). */
  safeBottomRatio?: number;
  distanceFactor?: number;
  zIndexRange?: [number, number];
  /** Higher wins. Overlaps hide the lower label; they are never moved apart. */
  labelPriority?: number;
  /** Shown at the fit-island zoom. Off-route and offshore labels pass false. */
  showWhenFar?: boolean;
  /** Decorative overlay text. The selected city control leaves this false. */
  ariaHidden?: boolean;
  children: React.ReactNode;
}

const tmpVec = new THREE.Vector3();
const tmpCamPos = new THREE.Vector3();
const tmpCamDir = new THREE.Vector3();
const tmpIsland = new THREE.Vector3(-0.35, 0.35, 0.4);

export function WorldHtml({
  position = [0, 0, 0],
  center = false,
  anchor = "center",
  screenOffset = [0, 0],
  clampToViewport = false,
  hideWhenOffscreen = false,
  safeBottomRatio = 0,
  zIndexRange = [20, 0],
  labelPriority,
  showWhenFar = true,
  ariaHidden = false,
  children,
}: WorldHtmlProps) {
  const id = useId();
  const groupRef = useRef<THREE.Group>(null);
  const domElRef = useRef<HTMLDivElement | null>(null);
  const zIndex = zIndexRange[0];

  const bindElement = useCallback((el: HTMLDivElement | null) => {
    domElRef.current = el;
  }, []);

  useEffect(() => {
    entriesMap.set(id, {
      id,
      children,
      center,
      anchor,
      zIndex,
      ariaHidden,
      bindElement,
    });
    emitEntriesChange();
  }, [id, children, center, anchor, zIndex, ariaHidden, bindElement]);

  useEffect(() => {
    return () => {
      labelSlots.delete(id);
      labelElements.delete(id);
      if (entriesMap.has(id)) {
        entriesMap.delete(id);
        queueMicrotask(() => {
          emitEntriesChange();
        });
      }
    };
  }, [id]);

  useFrame(({ camera, size }) => {
    const group = groupRef.current;
    const el = domElRef.current;
    if (!group || !el) return;

    tmpVec.setFromMatrixPosition(group.matrixWorld);
    tmpCamPos.setFromMatrixPosition(camera.matrixWorld);
    camera.getWorldDirection(tmpCamDir);

    const toObj = tmpVec.clone().sub(tmpCamPos);
    const behind =
      toObj.lengthSq() > 1e-6 && toObj.angleTo(tmpCamDir) > Math.PI / 2;
    if (behind) {
      const slot = labelSlots.get(id);
      if (slot) slot.active = false;
      if (el.style.opacity !== "0") {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
      return;
    }

    tmpVec.project(camera);
    const rawX = (tmpVec.x * 0.5 + 0.5) * size.width;
    const rawY = (-(tmpVec.y * 0.5) + 0.5) * size.height;
    const offscreen =
      hideWhenOffscreen &&
      (tmpVec.z < -1 ||
        tmpVec.z > 1 ||
        rawX < 0 ||
        rawY < 0 ||
        rawX > size.width ||
        rawY > size.height);
    if (offscreen) {
      const slot = labelSlots.get(id);
      if (slot) slot.active = false;
      if (el.style.opacity !== "0") {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
      return;
    }

    let x = rawX + screenOffset[0];
    let y = rawY + screenOffset[1];

    if (clampToViewport && Number.isFinite(x) && Number.isFinite(y)) {
      const padX = 12;
      const padTop = 104;
      const sheetBottom = Math.max(0, safeBottomRatio) * size.height;
      const padBottom = Math.max(
        size.width >= 1024 ? 84 : 132,
        sheetBottom + 12
      );
      const maxW = Math.max(48, size.width - padX * 2);
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) inner.style.maxWidth = `${maxW}px`;

      const w = Math.min(el.offsetWidth || 72, maxW);
      const h = el.offsetHeight || 26;

      const halfW = anchor === "bottom" || center ? w * 0.5 : 0;
      const minX = padX + halfW;
      const maxX = Math.max(minX, size.width - padX - halfW);
      x = Math.min(maxX, Math.max(minX, x));

      if (anchor === "bottom") {
        const minY = padTop + h;
        const maxY = Math.max(minY, size.height - padBottom);
        y = Math.min(maxY, Math.max(minY, y));
      } else {
        const halfH = center ? h * 0.5 : 0;
        const minY = padTop + halfH;
        const maxY = Math.max(minY, size.height - padBottom - (center ? halfH : h));
        y = Math.min(maxY, Math.max(minY, y));
      }
    }

    if (typeof labelPriority === "number" && Number.isFinite(x) && Number.isFinite(y)) {
      setFarZoom(camera.position.distanceTo(tmpIsland) > 18);
      const slot = labelSlots.get(id) ?? {
        ax: x,
        ay: y,
        w: 88,
        h: 28,
        priority: labelPriority,
        showWhenFar,
        active: true,
        hidden: false,
        scale: 1,
      };
      slot.ax = x;
      slot.ay = y;
      slot.w = Math.max(48, el.offsetWidth || 88);
      slot.h = Math.max(20, el.offsetHeight || 28);
      slot.priority = labelPriority;
      slot.showWhenFar = showWhenFar;
      slot.active = true;
      labelSlots.set(id, slot);
      labelElements.set(id, el);
      el.dataset.decorative = ariaHidden ? "1" : "0";
      queueLabelSolve();
      return;
    }

    if (el.style.opacity !== "1") {
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    }
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });

  return <group ref={groupRef} position={position} />;
}
