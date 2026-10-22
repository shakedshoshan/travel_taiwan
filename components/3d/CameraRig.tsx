"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CityId } from "@/data/types";
import { getCityById, getPlaceById } from "@/lib/data/selectors";
import { useTripStore, type SheetSnapPoint } from "@/lib/store/useTripStore";
import { computeCityMapNodes } from "./CityDestination3DMap";

interface CameraRigProps {
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
}

// Generous bounds around Taiwan + Penghu/Green/Orchid islands
const MIN_X = -13;
const MAX_X = 11;
const MIN_Z = -16.5;
const MAX_Z = 16.5;

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
function applySheetReframeOffset(
  baseTarget: THREE.Vector3,
  baseCamPos: THREE.Vector3,
  sheetSnap: SheetSnapPoint
) {
  if (sheetSnap !== "half" && sheetSnap !== "peek") return;
  const shiftZ = sheetSnap === "half" ? 2.15 : 0.55;
  baseTarget.z += shiftZ;
  baseCamPos.z += shiftZ;
}

function clampTargetToBounds(target: THREE.Vector3, camPos?: THREE.Vector3) {
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

export function CameraRig({
  selectedCityId,
  focusedPlaceId,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl, size } = useThree();
  const store = useTripStore();

  const initialFit = computeFitIslandPose(size.width, size.height);
  const desiredTarget = useRef(new THREE.Vector3().copy(initialFit.target));
  const desiredCamPos = useRef(new THREE.Vector3().copy(initialFit.position));
  const isTransitioning = useRef(false);
  const transitionTimer = useRef(0);
  const lastCommandSeq = useRef<number>(0);
  const isHighTilt = useRef<boolean>(false);
  const hasInitializedCamera = useRef(false);

  // Track active keyboard keys (desktop only)
  const pressedKeys = useRef<Set<string>>(new Set());

  // Immediately snap camera to fit-to-island pose on first mount
  useEffect(() => {
    if (hasInitializedCamera.current) return;
    hasInitializedCamera.current = true;
    const fit = computeFitIslandPose(size.width, size.height);
    camera.position.copy(fit.position);
    desiredCamPos.current.copy(fit.position);
    desiredTarget.current.copy(fit.target);
    if (controlsRef.current) {
      controlsRef.current.target.copy(fit.target);
      controlsRef.current.update();
    }
  }, [camera, size.width, size.height]);

  // Re-fit on viewport resize / orientationchange when viewing the whole island
  useEffect(() => {
    if (selectedCityId || focusedPlaceId || store.isCityZoomMapOpen) return;
    const fit = computeFitIslandPose(size.width, size.height);
    desiredTarget.current.copy(fit.target);
    desiredCamPos.current.copy(fit.position);
    isTransitioning.current = true;
    transitionTimer.current = 0.65;
  }, [
    size.width,
    size.height,
    selectedCityId,
    focusedPlaceId,
    store.isCityZoomMapOpen,
  ]);

  // Listen to explicit orientationchange on mobile
  useEffect(() => {
    const onOrientationChange = () => {
      if (selectedCityId || focusedPlaceId || store.isCityZoomMapOpen) return;
      window.setTimeout(() => {
        const fit = computeFitIslandPose(window.innerWidth, window.innerHeight);
        desiredTarget.current.copy(fit.target);
        desiredCamPos.current.copy(fit.position);
        isTransitioning.current = true;
        transitionTimer.current = 0.7;
      }, 120);
    };
    window.addEventListener("orientationchange", onOrientationChange);
    return () =>
      window.removeEventListener("orientationchange", onOrientationChange);
  }, [selectedCityId, focusedPlaceId, store.isCityZoomMapOpen]);

  // Helper to move (pan) camera + target horizontally along the island plane
  const panCameraByScreenDelta = (
    deltaPixelsX: number,
    deltaPixelsY: number
  ) => {
    const controls = controlsRef.current;
    if (!controls) return;

    isTransitioning.current = false;

    const element = gl.domElement;
    const height = Math.max(1, element.clientHeight || 800);
    const fovRad =
      camera instanceof THREE.PerspectiveCamera
        ? THREE.MathUtils.degToRad(camera.fov)
        : THREE.MathUtils.degToRad(42);
    const dist = Math.max(2, camera.position.distanceTo(controls.target));
    const worldPerPixel = (2 * dist * Math.tan(fovRad * 0.5)) / height;

    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    right.y = 0;
    if (right.lengthSq() < 1e-5) right.set(1, 0, 0);
    else right.normalize();

    const forward = new THREE.Vector3(0, 1, 0).cross(right).normalize();

    const moveOffset = new THREE.Vector3()
      .addScaledVector(right, -deltaPixelsX * worldPerPixel)
      .addScaledVector(forward, deltaPixelsY * worldPerPixel);

    controls.target.add(moveOffset);
    camera.position.add(moveOffset);
    clampTargetToBounds(controls.target, camera.position);
    controls.update();
  };

  const panByWorldStep = (stepRight: number, stepForward: number) => {
    const controls = controlsRef.current;
    if (!controls) return;

    isTransitioning.current = false;

    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    right.y = 0;
    if (right.lengthSq() < 1e-5) right.set(1, 0, 0);
    else right.normalize();

    const forward = new THREE.Vector3(0, 1, 0).cross(right).normalize();

    const moveOffset = new THREE.Vector3()
      .addScaledVector(right, stepRight)
      .addScaledVector(forward, stepForward);

    desiredTarget.current.copy(controls.target).add(moveOffset);
    desiredCamPos.current.copy(camera.position).add(moveOffset);
    clampTargetToBounds(desiredTarget.current, desiredCamPos.current);

    isTransitioning.current = true;
    transitionTimer.current = 0.45;
  };

  // Fly to focused place or selected city (with half-sheet camera reframing!)
  useEffect(() => {
    if (store.isCityZoomMapOpen && selectedCityId) {
      if (focusedPlaceId) {
        const nodes = computeCityMapNodes(selectedCityId);
        const node = nodes.find((n) => n.place.id === focusedPlaceId);
        if (node) {
          desiredTarget.current.set(node.x, node.y + 0.35, node.z);
          desiredCamPos.current.set(node.x - 1.8, node.y + 4.4, node.z + 4.6);
          isTransitioning.current = true;
          transitionTimer.current = 0.95;
          return;
        }
      }
      desiredTarget.current.set(0, 0.25, 0);
      desiredCamPos.current.set(0, 12.2, 12.8);
      isTransitioning.current = true;
      transitionTimer.current = 1.05;
      return;
    }

    if (focusedPlaceId) {
      const place = getPlaceById(focusedPlaceId);
      if (place) {
        const { worldX, worldY, worldZ } = place.resolvedCoords;
        desiredTarget.current.set(worldX, worldY + 0.2, worldZ);
        desiredCamPos.current.set(worldX - 1.4, worldY + 5.2, worldZ + 4.8);
        applySheetReframeOffset(
          desiredTarget.current,
          desiredCamPos.current,
          store.sheetSnap
        );
        isTransitioning.current = true;
        transitionTimer.current = 0.95;
        return;
      }
    }

    if (selectedCityId) {
      const city = getCityById(selectedCityId);
      if (city) {
        desiredTarget.current.set(city.worldX, city.worldY + 0.3, city.worldZ);
        desiredCamPos.current.set(
          city.worldX - 1.8,
          city.worldY + 7.2,
          city.worldZ + 6.4
        );
        applySheetReframeOffset(
          desiredTarget.current,
          desiredCamPos.current,
          store.sheetSnap
        );
        isTransitioning.current = true;
        transitionTimer.current = 0.95;
        return;
      }
    }

    const fit = computeFitIslandPose(size.width, size.height);
    desiredTarget.current.copy(fit.target);
    desiredCamPos.current.copy(fit.position);
    isTransitioning.current = true;
    transitionTimer.current = 0.9;
  }, [
    selectedCityId,
    focusedPlaceId,
    store.isCityZoomMapOpen,
    store.sheetSnap,
    size.width,
    size.height,
  ]);

  // Handle camera commands (including Recenter FAB)
  useEffect(() => {
    const cmd = store.cameraCommand;
    if (!cmd || cmd.seq === lastCommandSeq.current) return;
    lastCommandSeq.current = cmd.seq;

    const controls = controlsRef.current;
    if (!controls) return;

    const dist = Math.max(3, camera.position.distanceTo(controls.target));
    const panStep = Math.max(1.4, dist * 0.18);

    switch (cmd.type) {
      case "pan-north":
        panByWorldStep(0, panStep);
        break;
      case "pan-south":
        panByWorldStep(0, -panStep);
        break;
      case "pan-east":
        panByWorldStep(panStep, 0);
        break;
      case "pan-west":
        panByWorldStep(-panStep, 0);
        break;
      case "rotate-left":
      case "rotate-right": {
        isTransitioning.current = false;
        const offset = camera.position.clone().sub(controls.target);
        const angle = cmd.type === "rotate-left" ? 0.38 : -0.38;
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        desiredTarget.current.copy(controls.target);
        desiredCamPos.current.copy(controls.target).add(offset);
        isTransitioning.current = true;
        transitionTimer.current = 0.45;
        break;
      }
      case "tilt-toggle": {
        isHighTilt.current = !isHighTilt.current;
        const offset = camera.position.clone().sub(controls.target);
        const radius = offset.length();
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.phi = isHighTilt.current ? 1.08 : 0.58;
        spherical.radius = radius;
        offset.setFromSpherical(spherical);
        desiredTarget.current.copy(controls.target);
        desiredCamPos.current.copy(controls.target).add(offset);
        isTransitioning.current = true;
        transitionTimer.current = 0.55;
        break;
      }
      case "zoom-in":
      case "zoom-out": {
        const factor = cmd.type === "zoom-in" ? 0.74 : 1.32;
        const offset = camera.position.clone().sub(controls.target);
        const nextLen = THREE.MathUtils.clamp(
          offset.length() * factor,
          2.6,
          42
        );
        offset.setLength(nextLen);
        desiredTarget.current.copy(controls.target);
        desiredCamPos.current.copy(controls.target).add(offset);
        isTransitioning.current = true;
        transitionTimer.current = 0.4;
        break;
      }
      case "reset": {
        if (store.isCityZoomMapOpen) {
          desiredTarget.current.set(0, 0.25, 0);
          desiredCamPos.current.set(0, 12.2, 12.8);
        } else {
          const fit = computeFitIslandPose(size.width, size.height);
          desiredTarget.current.copy(fit.target);
          desiredCamPos.current.copy(fit.position);
        }
        isTransitioning.current = true;
        transitionTimer.current = 0.85;
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.cameraCommand, camera, size.width, size.height]);

  // Direct pointer-drag map panning + double-tap zoom + desktop-only keyboard WASD
  useEffect(() => {
    const domEl =
      (gl.domElement.closest("[data-map-canvas-root]") as HTMLElement | null) ??
      gl.domElement;

    let isDraggingPan = false;
    let lastClientX = 0;
    let lastClientY = 0;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const onPointerDown = (e: PointerEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        targetEl.tagName !== "CANVAS" &&
        !targetEl.hasAttribute("data-r3f-html-overlay")
      ) {
        return;
      }

      isTransitioning.current = false;

      // Double-tap / double-click zoom on touch & mouse
      const now = performance.now();
      const dt = now - lastTapTime;
      const distPx = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);
      if (dt > 40 && dt < 320 && distPx < 36) {
        const controls = controlsRef.current;
        if (controls) {
          const offset = camera.position.clone().sub(controls.target);
          const nextLen = THREE.MathUtils.clamp(offset.length() * 0.65, 2.8, 42);
          offset.setLength(nextLen);
          desiredTarget.current.copy(controls.target);
          desiredCamPos.current.copy(controls.target).add(offset);
          isTransitioning.current = true;
          transitionTimer.current = 0.35;
        }
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;

      // Mouse pan gesture (touch uses native OrbitControls ONE=PAN / TWO=DOLLY_ROTATE)
      if (e.pointerType === "mouse") {
        const isPanGesture =
          (store.mapDragMode === "pan" &&
            e.button === 0 &&
            !e.shiftKey &&
            !e.altKey &&
            !e.ctrlKey) ||
          (store.mapDragMode === "rotate" &&
            (e.button === 2 || e.button === 1 || e.shiftKey));

        if (isPanGesture) {
          isDraggingPan = true;
          lastClientX = e.clientX;
          lastClientY = e.clientY;
          document.body.style.cursor = "grabbing";
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingPan) return;
      const dx = e.clientX - lastClientX;
      const dy = e.clientY - lastClientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      panCameraByScreenDelta(dx, dy);
    };

    const stopDragging = () => {
      if (isDraggingPan) {
        isDraggingPan = false;
        document.body.style.cursor = "auto";
      }
    };

    const isDesktopPointer =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: fine)").matches;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isDesktopPointer) return;
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT"
      ) {
        return;
      }
      pressedKeys.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.code);
    };

    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    if (isDesktopPointer) {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
    }

    return () => {
      domEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, store.mapDragMode, camera]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    // 1. Desktop keyboard navigation
    if (pressedKeys.current.size > 0) {
      const keys = pressedKeys.current;
      const dist = Math.max(3, camera.position.distanceTo(controls.target));
      const speed = dist * 0.85 * delta;

      let moveR = 0;
      let moveF = 0;
      if (keys.has("ArrowUp") || keys.has("KeyW")) moveF += speed;
      if (keys.has("ArrowDown") || keys.has("KeyS")) moveF -= speed;
      if (keys.has("ArrowRight") || keys.has("KeyD")) moveR += speed;
      if (keys.has("ArrowLeft") || keys.has("KeyA")) moveR -= speed;

      if (moveR !== 0 || moveF !== 0) {
        isTransitioning.current = false;
        const right = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          0
        );
        right.y = 0;
        right.normalize();
        const forward = new THREE.Vector3(0, 1, 0).cross(right).normalize();

        const moveVec = new THREE.Vector3()
          .addScaledVector(right, moveR)
          .addScaledVector(forward, moveF);

        controls.target.add(moveVec);
        camera.position.add(moveVec);
        clampTargetToBounds(controls.target, camera.position);
        controls.update();
      }

      if (keys.has("KeyQ") || keys.has("KeyE")) {
        isTransitioning.current = false;
        const rotAngle = (keys.has("KeyQ") ? 1 : -1) * 1.4 * delta;
        const offset = camera.position.clone().sub(controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotAngle);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      }
    }

    // 2. Smooth camera fly-to transitions
    if (isTransitioning.current) {
      const dampTime = store.prefersReducedMotion ? 0.05 : 0.24;
      easing.damp3(controls.target, desiredTarget.current, dampTime, delta);
      easing.damp3(camera.position, desiredCamPos.current, dampTime, delta);
      controls.update();

      transitionTimer.current -= delta;
      if (transitionTimer.current <= 0) {
        isTransitioning.current = false;
      }
    } else {
      clampTargetToBounds(controls.target, camera.position);
    }
  });

  const mouseButtons =
    store.mapDragMode === "pan"
      ? {
          LEFT: -1 as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }
      : {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: -1 as unknown as THREE.MOUSE,
        };

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enableZoom
      zoomToCursor
      zoomSpeed={1.15}
      enableRotate
      rotateSpeed={0.85}
      enablePan
      screenSpacePanning={false}
      minDistance={2.5}
      maxDistance={42}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minPolarAngle={0.16}
      mouseButtons={mouseButtons}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      onStart={() => {
        isTransitioning.current = false;
      }}
    />
  );
}
