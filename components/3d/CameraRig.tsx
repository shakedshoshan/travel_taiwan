"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CityId } from "@/data/types";
import { getCityById, getPlaceById } from "@/lib/data/selectors";
import { useTripStore } from "@/lib/store/useTripStore";
import { computeCityMapNodes } from "./CityDestination3DMap";

interface CameraRigProps {
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
  activeTimelineCityId: CityId;
  isPlaying: boolean;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(-4.5, 19.5, 16.5);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.4, 0.5);

// Generous bounds around Taiwan so users can pan anywhere from Keelung to Kenting
const MIN_X = -10;
const MAX_X = 10;
const MIN_Z = -16;
const MAX_Z = 16;

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
  activeTimelineCityId,
  isPlaying,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const store = useTripStore();

  const desiredTarget = useRef(new THREE.Vector3().copy(DEFAULT_TARGET));
  const desiredCamPos = useRef(new THREE.Vector3().copy(DEFAULT_CAMERA_POS));
  const isTransitioning = useRef(false);
  const transitionTimer = useRef(0);
  const lastCommandSeq = useRef<number>(0);
  const isHighTilt = useRef<boolean>(false);

  // Track active keyboard keys (WASD + Arrows + Q/E)
  const pressedKeys = useRef<Set<string>>(new Set());

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

    // Horizontal right vector on XZ plane
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    right.y = 0;
    if (right.lengthSq() < 1e-5) right.set(1, 0, 0);
    else right.normalize();

    // Horizontal forward vector on XZ plane
    const forward = new THREE.Vector3(0, 1, 0).cross(right).normalize();

    const moveOffset = new THREE.Vector3()
      .addScaledVector(right, -deltaPixelsX * worldPerPixel)
      .addScaledVector(forward, deltaPixelsY * worldPerPixel);

    controls.target.add(moveOffset);
    camera.position.add(moveOffset);
    clampTargetToBounds(controls.target, camera.position);
    controls.update();
  };

  // Helper to pan by world XZ units
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

  // Fly to focused place or selected city (or Destination 3D Zoom Map)
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
        desiredCamPos.current.set(worldX - 1.8, worldY + 4.8, worldZ + 4.5);
        isTransitioning.current = true;
        transitionTimer.current = 1.1;
        return;
      }
    }

    if (selectedCityId) {
      const city = getCityById(selectedCityId);
      if (city) {
        desiredTarget.current.set(city.worldX, city.worldY + 0.3, city.worldZ);
        desiredCamPos.current.set(
          city.worldX - 2.4,
          city.worldY + 6.4,
          city.worldZ + 5.8
        );
        isTransitioning.current = true;
        transitionTimer.current = 1.1;
        return;
      }
    }

    desiredTarget.current.copy(DEFAULT_TARGET);
    desiredCamPos.current.copy(DEFAULT_CAMERA_POS);
    isTransitioning.current = true;
    transitionTimer.current = 0.95;
  }, [selectedCityId, focusedPlaceId, store.isCityZoomMapOpen]);

  // Follow timeline city only while Play is active
  useEffect(() => {
    if (!isPlaying) return;
    const city = getCityById(activeTimelineCityId);
    if (city) {
      desiredTarget.current.set(city.worldX, city.worldY + 0.3, city.worldZ);
      desiredCamPos.current.set(
        city.worldX - 3.5,
        city.worldY + 11.2,
        city.worldZ + 9.5
      );
      isTransitioning.current = true;
      transitionTimer.current = 0.8;
    }
  }, [activeTimelineCityId, isPlaying]);

  // Handle on-screen navigation pad commands
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
          36
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
          desiredTarget.current.copy(DEFAULT_TARGET);
          desiredCamPos.current.copy(DEFAULT_CAMERA_POS);
        }
        isTransitioning.current = true;
        transitionTimer.current = 1.0;
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.cameraCommand, camera]);

  // Direct pointer-drag map panning + keyboard WASD / Arrow navigation
  useEffect(() => {
    const domEl =
      (gl.domElement.closest("[data-map-canvas-root]") as HTMLElement | null) ??
      gl.domElement;

    let isDraggingPan = false;
    let lastClientX = 0;
    let lastClientY = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Ignore clicks on UI buttons/overlays
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        targetEl.tagName !== "CANVAS" &&
        !targetEl.hasAttribute("data-r3f-html-overlay")
      ) {
        return;
      }

      isTransitioning.current = false;

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

    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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

    // 1. Handle active keyboard movement (Arrows / WASD / Q / E)
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
      easing.damp3(
        controls.target,
        desiredTarget.current,
        0.26,
        delta
      );
      easing.damp3(camera.position, desiredCamPos.current, 0.28, delta);
      controls.update();

      transitionTimer.current -= delta;
      if (transitionTimer.current <= 0) {
        isTransitioning.current = false;
      }
    } else {
      clampTargetToBounds(controls.target, camera.position);
    }
  });

  // In "pan" mode: left-mouse pan is handled by our direct ground-plane panner, right-mouse rotates.
  // In "rotate" mode: left-mouse rotates via OrbitControls, right-mouse pans.
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
      maxDistance={36}
      maxPolarAngle={Math.PI / 2 - 0.08}
      minPolarAngle={0.16}
      mouseButtons={mouseButtons}
      touches={{
        ONE:
          store.mapDragMode === "pan"
            ? (THREE.TOUCH.PAN as THREE.TOUCH)
            : (THREE.TOUCH.ROTATE as THREE.TOUCH),
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      onStart={() => {
        isTransitioning.current = false;
      }}
    />
  );
}
