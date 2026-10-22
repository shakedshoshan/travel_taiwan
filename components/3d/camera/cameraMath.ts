import * as THREE from "three";
import type { SheetSnapPoint } from "@/lib/store/useTripStore";

// Generous bounds around Taiwan + Penghu/Green/Orchid islands
export const MIN_X = -13;
export const MAX_X = 11;
export const MIN_Z = -16.5;
export const MAX_Z = 16.5;

// Bounding box key points in 3D world space:
// North cape + Taipei pin/label: z ≈ -12.8, y ≈ 1.1
// South cape (Eluanbi / Kenting pin + label): z ≈ +13.15, y ≈ 0.65
// West (Penghu / Tainan coast) & East (Sandiaojiao / Orchid Island): x ∈ [-8.2, 7.3]
const BBOX_POINTS = [
  new THREE.Vector3(1.5, 1.15, -12.85), // North tip + Taipei pin/label headroom
  new THREE.Vector3(3.7, 0.95, -10.85), // Taipei city pin + label
  new THREE.Vector3(-0.6, 0.7, 13.15), // Eluanbi / Kenting southern tip
  new THREE.Vector3(-1.26, 0.75, 12.72), // Kenting pin + label
  new THREE.Vector3(-8.2, 0.45, 1.4), // West bound (Penghu / West coast)
  new THREE.Vector3(7.2, 0.45, -5.5), // East bound
] as const;

const scratchCam = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
const scratchVec = new THREE.Vector3();

/**
 * Computes a camera position and target that fits the entire Taiwan island bounding box
 * inside the visible area minus the top bar (48px), layer chips (44px), and timeline bar.
 * Guarantees Taipei's north-tip pin/label is below the layer chips and
 * Eluanbi/Kenting is visible above the timeline bar on load at 390x844 and 1440x900.
 */
export function computeFitIslandPose(
  viewportWidth: number,
  viewportHeight: number,
  fovDeg = 42
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const w = Math.max(320, viewportWidth);
  const h = Math.max(480, viewportHeight);
  const aspect = w / h;

  // Reserved UI chrome in pixels:
  // Top: Navbar (48px + 8px top gap) + LayerToggles (44px + gap) + label height (~30px) = ~136px
  // Bottom: On <1024px: Bottom Nav (56px) + Timeline pill (64px + gap) = ~150px
  //         On >=1024px (top nav, no bottom tab bar): Timeline pill (64px + 20px gap) = ~106px
  const topReservedPx = w < 768 ? 138 : 132;
  const bottomReservedPx = w >= 1024 ? 172 : 208;
  const sideReservedPx = w < 768 ? 24 : 52;

  const pitchRad = 0.98; // ~56 deg elevation above horizontal
  const azimuthRad = -0.12;

  scratchCam.fov = fovDeg;
  scratchCam.aspect = aspect;
  scratchCam.updateProjectionMatrix();

  // Iteratively refine targetZ and dist so projected north/south/east/west bounds
  // sit squarely inside [sideReservedPx, w - sideReservedPx] x [topReservedPx, h - bottomReservedPx].
  let targetZ = 0.4;
  let dist = w < 768 ? 31.5 : 24.5;
  const targetX = -0.35;
  const targetY = 0.35;

  const desiredTopY = topReservedPx;
  const desiredBottomY = h - bottomReservedPx;
  const desiredCenterY = (desiredTopY + desiredBottomY) * 0.5;
  const maxAllowedSpanY = Math.max(180, desiredBottomY - desiredTopY);
  const maxAllowedSpanX = Math.max(200, w - sideReservedPx * 2);

  for (let step = 0; step < 6; step++) {
    const horizDist = dist * Math.cos(pitchRad);
    const camX = targetX + Math.sin(azimuthRad) * horizDist;
    const camY = targetY + dist * Math.sin(pitchRad);
    const camZ = targetZ + Math.cos(azimuthRad) * horizDist;

    scratchCam.position.set(camX, camY, camZ);
    scratchCam.lookAt(targetX, targetY, targetZ);
    scratchCam.updateMatrixWorld(true);

    let minScreenX = Infinity;
    let maxScreenX = -Infinity;
    let minScreenY = Infinity;
    let maxScreenY = -Infinity;

    for (const pt of BBOX_POINTS) {
      scratchVec.copy(pt).project(scratchCam);
      const sx = (scratchVec.x * 0.5 + 0.5) * w;
      const sy = (-(scratchVec.y * 0.5) + 0.5) * h;
      if (sx < minScreenX) minScreenX = sx;
      if (sx > maxScreenX) maxScreenX = sx;
      if (sy < minScreenY) minScreenY = sy;
      if (sy > maxScreenY) maxScreenY = sy;
    }

    const currentSpanY = Math.max(1, maxScreenY - minScreenY);
    const currentSpanX = Math.max(1, maxScreenX - minScreenX);
    const currentCenterY = (minScreenY + maxScreenY) * 0.5;

    // Shift targetZ so the projected vertical center matches desiredCenterY
    const vFovRad = THREE.MathUtils.degToRad(fovDeg);
    const worldPerPixelZ =
      (2 * dist * Math.tan(vFovRad / 2)) / (h * Math.sin(pitchRad));
    const deltaPixelsY = currentCenterY - desiredCenterY;
    targetZ += deltaPixelsY * worldPerPixelZ * 0.85;

    // Scale distance so both vertical and horizontal spans fit comfortably inside safe area
    const scaleNeeded = Math.max(
      currentSpanY / maxAllowedSpanY,
      currentSpanX / maxAllowedSpanX
    );
    dist = THREE.MathUtils.clamp(dist * (0.3 + 0.7 * scaleNeeded), 19.5, 42.0);
  }

  const horizDist = dist * Math.cos(pitchRad);
  const target = new THREE.Vector3(targetX, targetY, targetZ);
  const position = new THREE.Vector3(
    target.x + Math.sin(azimuthRad) * horizDist,
    target.y + dist * Math.sin(pitchRad),
    target.z + Math.cos(azimuthRad) * horizDist
  );

  return { position, target };
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
