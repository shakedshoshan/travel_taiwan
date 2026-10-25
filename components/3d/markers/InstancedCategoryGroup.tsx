"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnrichedPlace } from "@/lib/data/selectors";
import { triggerHapticTap } from "@/lib/haptics";
import type { CityId } from "@/data/types";
import type { MarkerArchetype, MarkerEntry } from "./markerConfig";
import { bounceScale, markMarkerBounce, markerFrame } from "./markerFrame";

interface InstancedCategoryGroupProps {
  archetype: MarkerArchetype;
  entries: MarkerEntry[];
  geometry: THREE.BufferGeometry;
  baseColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
  prefersReducedMotion: boolean;
  onHover: (entry: MarkerEntry | null) => void;
  onSelect: (place: EnrichedPlace) => void;
}

export function InstancedCategoryGroup({
  entries,
  geometry,
  baseColor,
  emissiveColor,
  emissiveIntensity,
  selectedCityId,
  focusedPlaceId,
  prefersReducedMotion,
  onHover,
  onSelect,
}: InstancedCategoryGroupProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hitMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // Enlarged invisible hit-sphere geometry (>=44px screen equivalent) for reliable raycasting
  const hitSphereGeo = useMemo(
    () => new THREE.SphereGeometry(0.24, 8, 8),
    []
  );

  useEffect(() => {
    const mesh = meshRef.current;
    const hitMesh = hitMeshRef.current;
    if (!mesh) return;

    entries.forEach((entry, idx) => {
      const { worldX, worldY, worldZ } = entry.place.resolvedCoords;
      dummy.position.set(worldX, worldY + 0.08 * entry.scale, worldZ);
      dummy.scale.setScalar(entry.scale);
      dummy.rotation.set(0, idx * 0.5, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
      if (hitMesh) hitMesh.setMatrixAt(idx, dummy.matrix);

      tmpColor.set(entry.color);
      if (focusedPlaceId && entry.place.id !== focusedPlaceId) {
        tmpColor.multiplyScalar(0.4);
      }
      mesh.setColorAt(idx, tmpColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (hitMesh) hitMesh.instanceMatrix.needsUpdate = true;
  }, [entries, dummy, tmpColor, focusedPlaceId]);

  useFrame(({ clock, camera, size }) => {
    const mesh = meshRef.current;
    const hitMesh = hitMeshRef.current;
    if (!mesh || entries.length === 0) return;
    const t = clock.getElapsedTime();

    // Zoom-based clustering LOD:
    // When zoomed out (camera.position.length() > 21) and no city is selected,
    // cluster non-top-importance markers into cities so the overview map stays crisp.
    const camDist = camera.position.length();
    const zoomDetailFactor = selectedCityId
      ? 1.0
      : THREE.MathUtils.clamp((22.5 - camDist) / 4.5, 0.0, 1.0);

    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      const { worldX, worldY, worldZ } = entry.place.resolvedCoords;
      const isSelectedCityPlace =
        selectedCityId && entry.place.cityId === selectedCityId;

      const lodScale =
        isSelectedCityPlace || entry.importance === 5
          ? Math.max(0.68, zoomDetailFactor)
          : zoomDetailFactor;

      const hidden = Boolean(selectedCityId) && markerFrame.hiddenIds.has(entry.place.id);
      const bounce = bounceScale(entry.place.id, prefersReducedMotion);
      const finalScale = hidden ? 0 : entry.scale * lodScale * bounce;
      const bob =
        !prefersReducedMotion && entry.importance >= 4 && finalScale > 0.2
          ? Math.sin(t * 2.4 + idx * 0.7) * 0.03
          : 0;

      dummy.position.set(
        worldX,
        worldY + 0.08 * Math.max(0.2, finalScale) + bob,
        worldZ
      );
      dummy.scale.setScalar(finalScale);
      dummy.rotation.set(
        0,
        !prefersReducedMotion && entry.importance === 5
          ? t * 0.8 + idx
          : idx * 0.5,
        0
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);

      if (hitMesh) {
        const dist = Math.max(0.4, camera.position.distanceTo(dummy.position));
        const fov = (camera as THREE.PerspectiveCamera).fov ?? 42;
        const worldPerPx =
          (2 * dist * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) /
          Math.max(1, size.height);
        const hitScale =
          finalScale > 0.05
            ? THREE.MathUtils.clamp((44 * worldPerPx) / 0.48, 0.65, 3.2)
            : 0;
        dummy.scale.setScalar(hitScale);
        dummy.updateMatrix();
        hitMesh.setMatrixAt(idx, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (hitMesh) hitMesh.instanceMatrix.needsUpdate = true;
  });

  if (entries.length === 0) return null;

  return (
    <group>
      {/* Visible Instanced Mesh */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, entries.length]}
        castShadow
      >
        <meshStandardMaterial
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.2}
        />
      </instancedMesh>

      {/* Enlarged Invisible Raycast Hit Mesh (>=44px touch target) */}
      <instancedMesh
        ref={hitMeshRef}
        args={[hitSphereGeo, undefined, entries.length]}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (typeof e.instanceId === "number" && entries[e.instanceId]) {
            onHover(entries[e.instanceId]);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (typeof e.instanceId === "number" && entries[e.instanceId]) {
            triggerHapticTap();
            markMarkerBounce(entries[e.instanceId].place.id);
            onSelect(entries[e.instanceId].place);
          }
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
