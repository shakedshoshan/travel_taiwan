"use client";

import { useEffect, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { MapDragMode } from "@/lib/store/useTripStore";
import { clampTargetToBounds } from "./cameraMath";

interface UseCameraPointerAndKeysOptions {
  gl: THREE.WebGLRenderer;
  camera: THREE.Camera;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  mapDragMode: MapDragMode;
  desiredTarget: RefObject<THREE.Vector3>;
  desiredCamPos: RefObject<THREE.Vector3>;
  isTransitioning: RefObject<boolean>;
  transitionTimer: RefObject<number>;
  pressedKeys: RefObject<Set<string>>;
  userInteracting?: { current: boolean };
}

export function useCameraPointerAndKeys({
  gl,
  camera,
  controlsRef,
  mapDragMode,
  desiredTarget,
  desiredCamPos,
  isTransitioning,
  transitionTimer,
  pressedKeys,
  userInteracting,
}: UseCameraPointerAndKeysOptions) {
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

      const right = new THREE.Vector3().setFromMatrixColumn(
        camera.matrixWorld,
        0
      );
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
      if (userInteracting) userInteracting.current = true;

      // Double-tap / double-click zoom on touch & mouse
      const now = performance.now();
      const dt = now - lastTapTime;
      const distPx = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);
      if (dt > 40 && dt < 320 && distPx < 36) {
        const controls = controlsRef.current;
        if (controls) {
          const offset = camera.position.clone().sub(controls.target);
          const nextLen = THREE.MathUtils.clamp(
            offset.length() * 0.65,
            2.8,
            42
          );
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
          (mapDragMode === "pan" &&
            e.button === 0 &&
            !e.shiftKey &&
            !e.altKey &&
            !e.ctrlKey) ||
          (mapDragMode === "rotate" &&
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
      if (userInteracting) userInteracting.current = false;
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
  }, [
    gl,
    mapDragMode,
    camera,
    controlsRef,
    desiredTarget,
    desiredCamPos,
    isTransitioning,
    transitionTimer,
    pressedKeys,
    userInteracting,
  ]);
}
