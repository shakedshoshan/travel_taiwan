import * as THREE from "three";
import type { SheetSnapPoint } from "@/lib/store/useTripStore";

// Generous bounds around Taiwan + Penghu/Green/Orchid islands
export const MIN_X = -13;
export const MAX_X = 11;
export const MIN_Z = -16.5;
export const MAX_Z = 16.5;

/**
 * Computes a camera position and target that fits the entire Taiwan island
 * inside the viewport while accounting for top chrome (~108px) and bottom chrome (~136px).
 * Works across 390x844 portrait phones, tablets, and wide desktops.
 */
export function computeFitIslandPose(
  viewportWidth: number,
  viewportHeight: number,
  fovDeg = 42
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const w = Math.max(320, viewportWidth);
  const h = Math.max(480, viewportHeight);
  const aspect = w / h;

  const topChromePx = w < 768 ? 108 : 96;
  const bottomChromePx = w < 768 ? 136 : 124;
  const safeVerticalFraction = Math.max(
    0.52,
    (h - topChromePx - bottomChromePx) / h
  );
  const safeHorizontalFraction = w < 768 ? 0.88 : 0.82;

  const vFovRad = THREE.MathUtils.degToRad(fovDeg);
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * aspect);

  // Taiwan main island + offshore islands + Kenting label span ~15.2 units E-W and ~29.4 units N-S
  const islandSpanX = 15.2;
  const islandSpanZ = 29.4;

  // Camera looks from slightly south-southwest at ~52 deg above horizon
  const pitchRad = 0.96; // ~55 deg elevation above horizontal
  const apparentHeightSpan = islandSpanZ * Math.sin(pitchRad) + 2.4;

  const distForHeight =
    apparentHeightSpan /
    2 /
    (Math.tan(vFovRad / 2) * safeVerticalFraction);
  const distForWidth =
    islandSpanX /
    2 /
    (Math.tan(hFovRad / 2) * safeHorizontalFraction);

  const dist = THREE.MathUtils.clamp(
    Math.max(distForHeight, distForWidth),
    21.5,
    38.0
  );

  // Shift target slightly south (+Z) if bottom chrome is taller than top chrome
  // so the island sits visually centered in the open safe area
  const pixelBiasY = (bottomChromePx - topChromePx) * 0.5;
  const worldPerPixel = (2 * dist * Math.tan(vFovRad / 2)) / h;
  const targetZShift = pixelBiasY * worldPerPixel * 0.85;

  const target = new THREE.Vector3(-0.35, 0.35, 0.45 + targetZShift);

  // Slight azimuth angle so 3D mountain relief reads immediately
  const azimuthRad = -0.14;
  const horizDist = dist * Math.cos(pitchRad);
  const camY = target.y + dist * Math.sin(pitchRad);
  const camX = target.x + Math.sin(azimuthRad) * horizDist;
  const camZ = target.z + Math.cos(azimuthRad) * horizDist;

  return {
    position: new THREE.Vector3(camX, camY, camZ),
    target,
  };
}

/**
 * When the bottom sheet is snapped to "half" (55% of viewport height),
 * shifts the camera target south (+Z) so the focused city/place appears
 * centered in the upper 45% visible map region above the sheet.
 */
export function applySheetReframeOffset(
  baseTarget: THREE.Vector3,
  baseCamPos: THREE.Vector3,
  sheetSnap: SheetSnapPoint
) {
  if (sheetSnap !== "half" && sheetSnap !== "peek") return;
  const shiftZ = sheetSnap === "half" ? 2.15 : 0.55;
  baseTarget.z += shiftZ;
  baseCamPos.z += shiftZ;
}

export function clampTargetToBounds(
  target: THREE.Vector3,
  camPos?: THREE.Vector3
) {
  const clampedX = THREE.MathUtils.clamp(target.x, MIN_X, MAX_X);
  const clampedZ = THREE.MathUtils.clamp(target.z, MIN_Z, MAX_Z);
  const clampedY = THREE.MathUtils.clamp(target.y, 0.0, 3.2);

  if (camPos) {
    camPos.x += clampedX - target.x;
    camPos.z += clampedZ - target.z;
    camPos.y += clampedY - target.y;
  }

  target.set(clampedX, clampedY, clampedZ);
}
