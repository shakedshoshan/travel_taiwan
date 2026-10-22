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
    const x = (tmpVec.x * 0.5 + 0.5) * size.width;
    const y = (-(tmpVec.y * 0.5) + 0.5) * size.height;

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
