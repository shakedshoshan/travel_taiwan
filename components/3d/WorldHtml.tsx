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
} from "./overlay/labelOverlapSolver";

interface WorldHtmlEntry {
  id: string;
  children: React.ReactNode;
  center: boolean;
  anchor: "center" | "bottom";
  zIndex: number;
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
  distanceFactor?: number;
  zIndexRange?: [number, number];
  avoidOverlap?: boolean;
  /** When true, the label stays on its anchor and other labels move aside. */
  overlapLocked?: boolean;
  overlapDrop?: number;
  children: React.ReactNode;
}

const tmpVec = new THREE.Vector3();
const tmpCamPos = new THREE.Vector3();
const tmpCamDir = new THREE.Vector3();

export function WorldHtml({
  position = [0, 0, 0],
  center = false,
  anchor = "center",
  screenOffset = [0, 0],
  clampToViewport = false,
  zIndexRange = [20, 0],
  avoidOverlap = false,
  overlapLocked = false,
  overlapDrop = 0,
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
      bindElement,
    });
    emitEntriesChange();
  }, [id, children, center, anchor, zIndex, bindElement]);

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
      if (el.style.opacity !== "0") {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
      return;
    }

    tmpVec.project(camera);
    let x = (tmpVec.x * 0.5 + 0.5) * size.width + screenOffset[0];
    let y = (-(tmpVec.y * 0.5) + 0.5) * size.height + screenOffset[1];

    if (clampToViewport && Number.isFinite(x) && Number.isFinite(y)) {
      const w = el.offsetWidth || 72;
      const h = el.offsetHeight || 26;
      const padX = 10;
      const padTop = 104;
      const padBottom = size.width >= 1024 ? 84 : 132;

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
        const maxY = Math.max(minY, size.height - padBottom - halfH);
        y = Math.min(maxY, Math.max(minY, y));
      }
    }

    if (avoidOverlap && Number.isFinite(x) && Number.isFinite(y)) {
      const slot = labelSlots.get(id) ?? {
        ax: x,
        ay: y,
        w: 88,
        h: 28,
        ox: 0,
        oy: 0,
        homeOy: 0,
        drop: 0,
        active: true,
        locked: overlapLocked,
        hasSolve: false,
        solvedAx: x,
        solvedAy: y,
        solvedW: 88,
      };
      slot.ax = x;
      slot.ay = y;
      slot.w = Math.max(72, el.offsetWidth || 88);
      slot.h = Math.max(24, el.offsetHeight || 28);
      slot.drop = overlapDrop;
      slot.active = true;
      slot.locked = overlapLocked;
      labelSlots.set(id, slot);
      labelElements.set(id, el);
      queueLabelSolve();
      if (el.style.opacity !== "1") {
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
      }
      el.style.transform = `translate3d(${(x + slot.ox).toFixed(1)}px, ${(y + slot.oy).toFixed(1)}px, 0)`;
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
