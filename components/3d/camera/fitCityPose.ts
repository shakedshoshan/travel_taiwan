import * as THREE from "three";
import type { SheetSnapPoint } from "@/lib/store/tripStoreTypes";

const scratchCam = new THREE.PerspectiveCamera(42, 1, 0.1, 160);
const scratchVec = new THREE.Vector3();

export interface WorldPoint {
  x: number;
  y: number;
  z: number;
}

export function sheetBottomReservePx(
  snap: SheetSnapPoint,
  viewportHeight: number
): number {
  if (snap === "full") return Math.round(viewportHeight * 0.85);
  if (snap === "half") return Math.round(viewportHeight * 0.5);
  if (snap === "peek") return 120;
  return 0;
}

export function computeFitCityPose(
  points: WorldPoint[],
  viewportWidth: number,
  viewportHeight: number,
  bottomReservedPx: number,
  topReservedPx = 64
): { position: THREE.Vector3; target: THREE.Vector3; distance: number } {
  const w = Math.max(320, viewportWidth);
  const h = Math.max(480, viewportHeight);
  const pts = points.length > 0 ? points : [{ x: 0, y: 0.4, z: 0 }];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxY = 0.2;
  for (const point of pts) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
    maxY = Math.max(maxY, point.y);
  }
  const pad = 0.4;
  minX -= pad;
  maxX += pad;
  minZ -= pad;
  maxZ += pad;
  const target = new THREE.Vector3(
    (minX + maxX) / 2,
    Math.min(1.2, maxY * 0.35),
    (minZ + maxZ) / 2
  );
  const span = Math.max(0.9, maxX - minX, maxZ - minZ);
  const pitch = 0.92;
  const azimuth = -0.12;
  const top = topReservedPx;
  const bottom = Math.min(h - top - 72, bottomReservedPx + 8);
  const usableH = Math.max(80, h - top - bottom);
  const usableW = Math.max(80, w - 56);
  let dist = THREE.MathUtils.clamp(span * 1.7, 4.2, 28);
  const corners = [
    new THREE.Vector3(minX, maxY, minZ),
    new THREE.Vector3(maxX, maxY, minZ),
    new THREE.Vector3(minX, maxY, maxZ),
    new THREE.Vector3(maxX, maxY, maxZ),
  ];

  scratchCam.fov = 42;
  scratchCam.aspect = w / h;
  scratchCam.updateProjectionMatrix();

  for (let step = 0; step < 6; step++) {
    const horiz = dist * Math.cos(pitch);
    scratchCam.position.set(
      target.x + Math.sin(azimuth) * horiz,
      target.y + dist * Math.sin(pitch),
      target.z + Math.cos(azimuth) * horiz
    );
    scratchCam.lookAt(target);
    scratchCam.updateMatrixWorld(true);
    let minSX = Infinity;
    let maxSX = -Infinity;
    let minSY = Infinity;
    let maxSY = -Infinity;
    for (const corner of corners) {
      scratchVec.copy(corner).project(scratchCam);
      const sx = (scratchVec.x * 0.5 + 0.5) * w;
      const sy = (-scratchVec.y * 0.5 + 0.5) * h;
      minSX = Math.min(minSX, sx);
      maxSX = Math.max(maxSX, sx);
      minSY = Math.min(minSY, sy);
      maxSY = Math.max(maxSY, sy);
    }
    const scale = Math.max(
      (maxSX - minSX) / usableW,
      (maxSY - minSY) / usableH
    );
    dist = THREE.MathUtils.clamp(dist * (0.25 + 0.75 * scale), 3.5, 36);
    const centerY = (minSY + maxSY) / 2;
    const desiredCenterY = top + usableH / 2;
    const worldPerPx =
      (2 * dist * Math.tan(THREE.MathUtils.degToRad(21))) / h;
    target.z += (centerY - desiredCenterY) * worldPerPx * 0.65;
  }

  const horiz = dist * Math.cos(pitch);
  const position = new THREE.Vector3(
    target.x + Math.sin(azimuth) * horiz,
    target.y + dist * Math.sin(pitch),
    target.z + Math.cos(azimuth) * horiz
  );
  return { position, target, distance: position.distanceTo(target) };
}

export function computePlaceFocusPose(
  point: WorldPoint,
  viewportWidth: number,
  viewportHeight: number,
  bottomReservedPx: number
) {
  return computeFitCityPose(
    [
      point,
      { x: point.x + 0.7, y: point.y, z: point.z + 0.7 },
      { x: point.x - 0.7, y: point.y, z: point.z - 0.7 },
    ],
    viewportWidth,
    viewportHeight,
    bottomReservedPx
  );
}
