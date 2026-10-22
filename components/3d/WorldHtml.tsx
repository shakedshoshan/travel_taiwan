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

interface WorldHtmlEntry {
  id: string;
  children: React.ReactNode;
  center: boolean;
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
              transform: entry.center ? "translate3d(-50%, -50%, 0)" : undefined,
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
  distanceFactor?: number;
  zIndexRange?: [number, number];
  avoidOverlap?: boolean;
  /** Extra pixels downward before overlap solving. Used by the day badge. */
  overlapDrop?: number;
  children: React.ReactNode;
}

interface LabelSlot {
  ax: number;
  ay: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  homeOy: number;
  drop: number;
  active: boolean;
  hasSolve: boolean;
  solvedAx: number;
  solvedAy: number;
  solvedW: number;
}

const labelSlots = new Map<string, LabelSlot>();
let solveQueued = false;

function anchorsMoved(): boolean {
  for (const slot of labelSlots.values()) {
    if (!slot.active) continue;
    if (!slot.hasSolve) return true;
    if (Math.abs(slot.ax - slot.solvedAx) > 12) return true;
    if (Math.abs(slot.ay - slot.solvedAy) > 12) return true;
    if (Math.abs(slot.w - slot.solvedW) > 10) return true;
  }
  return false;
}

function solveLabelOverlaps(viewportHeight: number) {
  const list: LabelSlot[] = [];
  for (const slot of labelSlots.values()) {
    if (!slot.active) continue;
    list.push(slot);
  }
  const minY = viewportHeight * 0.34;
  const maxY = viewportHeight * 0.72;
  const maxDriftX = 72;
  const maxDriftY = 72;
  for (const slot of list) {
    const widthChanged =
      slot.hasSolve && Math.abs(slot.w - slot.solvedW) > 10;
    const separatedY =
      slot.hasSolve && !widthChanged ? slot.oy - slot.homeOy : 0;
    const separatedX = slot.hasSolve && !widthChanged ? slot.ox : 0;
    let oy = -18;
    if (slot.ay + oy > maxY) oy = maxY - slot.ay;
    if (slot.ay + oy < minY) oy = minY - slot.ay;
    oy += slot.drop;
    if (slot.ay + oy > maxY) oy = maxY - slot.ay;
    slot.homeOy = oy;
    slot.oy = oy + separatedY;
    slot.ox = separatedX;
  }
  const withinY = (slot: LabelSlot, nextOy: number) => {
    const y = slot.ay + nextOy;
    return (
      y >= minY &&
      y <= maxY &&
      nextOy <= slot.homeOy + maxDriftY &&
      nextOy >= slot.homeOy - 6
    );
  };
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const ax = a.ax + a.ox;
        const ay = a.ay + a.oy;
        const bx = b.ax + b.ox;
        const by = b.ay + b.oy;
        const dx = bx - ax;
        const dy = by - ay;
        const gapX = (a.w + b.w) * 0.5 + 8 - Math.abs(dx);
        const gapY = (a.h + b.h) * 0.5 + 6 - Math.abs(dy);
        if (gapX <= 4 || gapY <= 4) continue;
        const xDir =
          Math.abs(dx) < 4 ? (a.ax <= b.ax ? -1 : 1) : Math.sign(dx);
        const aWould = a.ox - xDir * gapX * 0.5;
        const bWould = b.ox + xDir * gapX * 0.5;
        const horizontalFits =
          Math.abs(aWould) <= maxDriftX && Math.abs(bWould) <= maxDriftX;
        const preferred =
          a.drop > 0 && b.drop === 0
            ? a
            : b.drop > 0 && a.drop === 0
              ? b
              : ay >= by
                ? a
                : b;
        const other = preferred === a ? b : a;
        if (horizontalFits && gapX < gapY) {
          a.ox = aWould;
          b.ox = bWould;
        } else if (withinY(preferred, preferred.oy + gapY)) {
          preferred.oy += gapY;
        } else if (withinY(other, other.oy + gapY)) {
          other.oy += gapY;
        } else if (horizontalFits) {
          a.ox = aWould;
          b.ox = bWould;
        }
      }
    }
    for (const slot of list) {
      if (slot.ox > maxDriftX) slot.ox = maxDriftX;
      if (slot.ox < -maxDriftX) slot.ox = -maxDriftX;
      if (slot.oy > slot.homeOy + maxDriftY) slot.oy = slot.homeOy + maxDriftY;
      if (slot.oy < slot.homeOy - 6) slot.oy = slot.homeOy - 6;
      const y = slot.ay + slot.oy;
      if (y > maxY) slot.oy += maxY - y;
      if (y < minY) slot.oy += minY - y;
    }
  }
  for (const slot of list) {
    slot.solvedAx = slot.ax;
    slot.solvedAy = slot.ay;
    slot.solvedW = slot.w;
    slot.hasSolve = true;
  }
}

function queueLabelSolve(viewportHeight: number) {
  if (solveQueued) return;
  solveQueued = true;
  queueMicrotask(() => {
    solveQueued = false;
    if (anchorsMoved()) solveLabelOverlaps(viewportHeight);
    for (const [id, slot] of labelSlots) {
      const el = labelElements.get(id);
      if (!el || !slot.active) continue;
      const x = slot.ax + slot.ox;
      const y = slot.ay + slot.oy;
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });
}

const labelElements = new Map<string, HTMLDivElement>();

const tmpVec = new THREE.Vector3();
const tmpCamPos = new THREE.Vector3();
const tmpCamDir = new THREE.Vector3();

export function WorldHtml({
  position = [0, 0, 0],
  center = false,
  zIndexRange = [20, 0],
  avoidOverlap = false,
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
      zIndex,
      bindElement,
    });
    emitEntriesChange();
  }, [id, children, center, zIndex, bindElement]);

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
    let x = (tmpVec.x * 0.5 + 0.5) * size.width;
    let y = (-(tmpVec.y * 0.5) + 0.5) * size.height;

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
      labelSlots.set(id, slot);
      labelElements.set(id, el);
      queueLabelSolve(size.height);
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
