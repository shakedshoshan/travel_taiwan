import * as THREE from "three";

interface FollowCity {
  worldX: number;
  worldY: number;
  worldZ: number;
}

/** Keep a readable offset while the camera eases toward the active route city. */
export function poseForRouteDay(
  camera: THREE.Camera,
  controlsTarget: THREE.Vector3,
  city: FollowCity,
  desiredTarget: THREE.Vector3,
  desiredCamPos: THREE.Vector3
) {
  desiredTarget.set(city.worldX, city.worldY + 0.35, city.worldZ);
  const offset = new THREE.Vector3().subVectors(camera.position, controlsTarget);
  const len = offset.length();
  if (len > 18 || len < 6) offset.setLength(12);
  desiredCamPos.copy(desiredTarget).add(offset);
}
