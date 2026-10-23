import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraCommandType } from "@/lib/store/tripStoreTypes";
import { clampTargetToBounds, computeFitIslandPose } from "./cameraMath";

interface MutableRef<T> {
  current: T;
}

interface RunCameraCommandOptions {
  command: { type: CameraCommandType; seq: number } | null;
  lastSeq: MutableRef<number>;
  controls: OrbitControlsImpl | null;
  camera: THREE.Camera;
  desiredTarget: THREE.Vector3;
  desiredCamPos: THREE.Vector3;
  isTransitioning: MutableRef<boolean>;
  transitionTimer: MutableRef<number>;
  isHighTilt: MutableRef<boolean>;
  isCityZoomMapOpen: boolean;
  width: number;
  height: number;
}

function panByWorldStep(
  stepRight: number,
  stepForward: number,
  camera: THREE.Camera,
  controls: OrbitControlsImpl,
  desiredTarget: THREE.Vector3,
  desiredCamPos: THREE.Vector3,
  isTransitioning: MutableRef<boolean>,
  transitionTimer: MutableRef<number>
) {
  isTransitioning.current = false;
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  right.y = 0;
  if (right.lengthSq() < 1e-5) right.set(1, 0, 0);
  else right.normalize();
  const forward = new THREE.Vector3(0, 1, 0).cross(right).normalize();
  const moveOffset = new THREE.Vector3()
    .addScaledVector(right, stepRight)
    .addScaledVector(forward, stepForward);
  desiredTarget.copy(controls.target).add(moveOffset);
  desiredCamPos.copy(camera.position).add(moveOffset);
  clampTargetToBounds(desiredTarget, desiredCamPos);
  isTransitioning.current = true;
  transitionTimer.current = 0.45;
}

export function runCameraCommand({
  command,
  lastSeq,
  controls,
  camera,
  desiredTarget,
  desiredCamPos,
  isTransitioning,
  transitionTimer,
  isHighTilt,
  isCityZoomMapOpen,
  width,
  height,
}: RunCameraCommandOptions) {
  if (!command || command.seq === lastSeq.current || !controls) return;
  lastSeq.current = command.seq;
  const dist = Math.max(3, camera.position.distanceTo(controls.target));
  const panStep = Math.max(1.4, dist * 0.18);

  switch (command.type) {
    case "pan-north":
      panByWorldStep(0, panStep, camera, controls, desiredTarget, desiredCamPos, isTransitioning, transitionTimer);
      break;
    case "pan-south":
      panByWorldStep(0, -panStep, camera, controls, desiredTarget, desiredCamPos, isTransitioning, transitionTimer);
      break;
    case "pan-east":
      panByWorldStep(panStep, 0, camera, controls, desiredTarget, desiredCamPos, isTransitioning, transitionTimer);
      break;
    case "pan-west":
      panByWorldStep(-panStep, 0, camera, controls, desiredTarget, desiredCamPos, isTransitioning, transitionTimer);
      break;
    case "rotate-left":
    case "rotate-right": {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        command.type === "rotate-left" ? 0.38 : -0.38
      );
      desiredTarget.copy(controls.target);
      desiredCamPos.copy(controls.target).add(offset);
      isTransitioning.current = true;
      transitionTimer.current = 0.45;
      break;
    }
    case "tilt-toggle": {
      isHighTilt.current = !isHighTilt.current;
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.phi = isHighTilt.current ? 1.08 : 0.58;
      offset.setFromSpherical(spherical);
      desiredTarget.copy(controls.target);
      desiredCamPos.copy(controls.target).add(offset);
      isTransitioning.current = true;
      transitionTimer.current = 0.55;
      break;
    }
    case "zoom-in":
    case "zoom-out": {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(
        THREE.MathUtils.clamp(offset.length() * (command.type === "zoom-in" ? 0.74 : 1.32), 2.6, 42)
      );
      desiredTarget.copy(controls.target);
      desiredCamPos.copy(controls.target).add(offset);
      isTransitioning.current = true;
      transitionTimer.current = 0.4;
      break;
    }
    case "reset": {
      if (isCityZoomMapOpen) {
        desiredTarget.set(0, 0.25, 0);
        desiredCamPos.set(0, 12.2, 12.8);
      } else {
        const fit = computeFitIslandPose(width, height);
        desiredTarget.copy(fit.target);
        desiredCamPos.copy(fit.position);
      }
      isTransitioning.current = true;
      transitionTimer.current = 0.85;
      break;
    }
  }
}
