"use client";

import { useSyncExternalStore } from "react";
import * as THREE from "three";

const STAGES = ["terrain", "ocean", "pins", "frame"] as const;
const done = new Set<string>();
let fileTotal = 0;
let fileLoaded = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function markLoadStage(stage: (typeof STAGES)[number] | string) {
  if (done.has(stage)) return;
  done.add(stage);
  emit();
}

export function loadProgressPercent(): number {
  const denom = STAGES.length + fileTotal;
  const numer =
    STAGES.filter((stage) => done.has(stage)).length + Math.min(fileLoaded, fileTotal);
  if (denom <= 0) return 0;
  return Math.min(100, Math.round((numer / denom) * 100));
}

export function bindDefaultLoadingManager() {
  const manager = THREE.DefaultLoadingManager;
  manager.onStart = (_url, loaded, total) => {
    fileLoaded = loaded;
    fileTotal = total;
    emit();
  };
  manager.onProgress = (_url, loaded, total) => {
    fileLoaded = loaded;
    fileTotal = total;
    emit();
  };
  manager.onLoad = () => {
    if (fileTotal > 0) fileLoaded = fileTotal;
    emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLoadProgress(): number {
  return useSyncExternalStore(subscribe, loadProgressPercent, () => 0);
}
