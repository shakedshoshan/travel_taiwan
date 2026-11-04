"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CityId } from "@/data/types";
import { placesForCityCategory } from "@/lib/data/cityCategory";
import { getCityBundle, getCityById, getPlaceById } from "@/lib/data/selectors";
import { useTripStore } from "@/lib/store/useTripStore";
import {
  clampTargetToBounds,
  computeFitIslandPose,
} from "./camera/cameraMath";
import {
  computeFitCityPose,
  computePlaceFocusPose,
  sheetBottomReservePx,
} from "./camera/fitCityPose";
import { setCityFit } from "./markers/markerFrame";
import { useCameraPointerAndKeys } from "./camera/useCameraPointerAndKeys";
import { runCameraCommand } from "./camera/runCameraCommand";
import { markMapActivity } from "./mapActivity";

export { computeFitIslandPose };

interface CameraRigProps {
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
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
  const pressedKeys = useRef<Set<string>>(new Set());
  const userInteracting = useRef(false);

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
    if (selectedCityId || focusedPlaceId) return;
    const fit = computeFitIslandPose(size.width, size.height);
    desiredTarget.current.copy(fit.target);
    desiredCamPos.current.copy(fit.position);
    isTransitioning.current = true; markMapActivity();
    transitionTimer.current = 0.65;
  }, [
    size.width,
    size.height,
    selectedCityId,
    focusedPlaceId,
  ]);

  // Listen to explicit orientationchange on mobile
  useEffect(() => {
    const onOrientationChange = () => {
      if (selectedCityId || focusedPlaceId) return;
      window.setTimeout(() => {
        const fit = computeFitIslandPose(window.innerWidth, window.innerHeight);
        desiredTarget.current.copy(fit.target);
        desiredCamPos.current.copy(fit.position);
        isTransitioning.current = true; markMapActivity();
        transitionTimer.current = 0.7;
      }, 120);
    };
    window.addEventListener("orientationchange", onOrientationChange);
    return () =>
      window.removeEventListener("orientationchange", onOrientationChange);
  }, [selectedCityId, focusedPlaceId]);

  // Fly to the selected city bounds, padded by the sheet, or to one place.
  useEffect(() => {
    const bottom = sheetBottomReservePx(store.sheetSnap, size.height);
    if (focusedPlaceId) {
      const place = getPlaceById(focusedPlaceId);
      if (place) {
        const pose = computePlaceFocusPose(
          {
            x: place.resolvedCoords.worldX,
            y: place.resolvedCoords.worldY,
            z: place.resolvedCoords.worldZ,
          },
          size.width,
          size.height,
          bottom
        );
        desiredTarget.current.copy(pose.target);
        desiredCamPos.current.copy(pose.position);
        isTransitioning.current = true; markMapActivity();
        transitionTimer.current = store.prefersReducedMotion ? 0 : 0.85;
        return;
      }
    }

    if (selectedCityId) {
      const city = getCityById(selectedCityId);
      const bundle = getCityBundle(selectedCityId);
      const places = placesForCityCategory(bundle, store.cityCategory);
      const points = [
        { x: city.worldX, y: city.worldY, z: city.worldZ },
        ...places.map((place) => ({
          x: place.resolvedCoords.worldX,
          y: place.resolvedCoords.worldY,
          z: place.resolvedCoords.worldZ,
        })),
      ];
      const pose = computeFitCityPose(points, size.width, size.height, bottom);
      if (store.sheetSnap === "peek") {
        setCityFit(pose.distance, pose.target.x, pose.target.y, pose.target.z);
      }
      desiredTarget.current.copy(pose.target);
      desiredCamPos.current.copy(pose.position);
      isTransitioning.current = true; markMapActivity();
      transitionTimer.current = store.prefersReducedMotion ? 0 : 0.9;
      return;
    }

    const fit = computeFitIslandPose(size.width, size.height);
    desiredTarget.current.copy(fit.target);
    desiredCamPos.current.copy(fit.position);
    isTransitioning.current = true; markMapActivity();
    transitionTimer.current = store.prefersReducedMotion ? 0 : 0.9;
  }, [
    selectedCityId,
    focusedPlaceId,
    store.cityCategory,
    store.sheetSnap,
    store.prefersReducedMotion,
    size.width,
    size.height,
  ]);

  useEffect(() => {
    runCameraCommand({
      command: store.cameraCommand,
      lastSeq: lastCommandSeq,
      controls: controlsRef.current,
      camera,
      desiredTarget: desiredTarget.current,
      desiredCamPos: desiredCamPos.current,
      isTransitioning,
      transitionTimer,
      isHighTilt,
      width: size.width,
      height: size.height,
    });
  }, [store.cameraCommand, camera, size.width, size.height]);

  useCameraPointerAndKeys({
    gl,
    camera,
    controlsRef,
    mapDragMode: store.mapDragMode,
    desiredTarget,
    desiredCamPos,
    isTransitioning,
    transitionTimer,
    pressedKeys,
    userInteracting,
  });

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (
      pressedKeys.current.size > 0 ||
      isTransitioning.current ||
      userInteracting.current
    ) {
      markMapActivity();
    }

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
      if (store.prefersReducedMotion) {
        controls.target.copy(desiredTarget.current);
        camera.position.copy(desiredCamPos.current);
        controls.update();
        isTransitioning.current = false;
      } else {
        const dampTime = 0.24;
        easing.damp3(controls.target, desiredTarget.current, dampTime, delta);
        easing.damp3(camera.position, desiredCamPos.current, dampTime, delta);
        controls.update();

        transitionTimer.current -= delta;
        if (transitionTimer.current <= 0) {
          isTransitioning.current = false;
        }
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

  useEffect(() => {
    const blockCanvas = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-bottom-sheet], [data-mobile-sheet]")) return;
      const controls = controlsRef.current;
      if (controls) controls.enabled = false;
    };

    const unblockCanvas = () => {
      const controls = controlsRef.current;
      if (controls) controls.enabled = true;
    };

    window.addEventListener("pointerdown", blockCanvas, true);
    window.addEventListener("pointerup", unblockCanvas, true);
    window.addEventListener("pointercancel", unblockCanvas, true);
    return () => {
      window.removeEventListener("pointerdown", blockCanvas, true);
      window.removeEventListener("pointerup", unblockCanvas, true);
      window.removeEventListener("pointercancel", unblockCanvas, true);
    };
  }, []);

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
      minDistance={selectedCityId ? 3.5 : 10}
      maxDistance={42}
      maxPolarAngle={Math.PI / 2 - 0.22}
      minPolarAngle={0.28}
      mouseButtons={mouseButtons}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_ROTATE,
      }}
      onStart={() => {
        userInteracting.current = true;
        isTransitioning.current = false;
        markMapActivity();
      }}
      onEnd={() => {
        userInteracting.current = false;
        markMapActivity();
      }}
    />
  );
}
