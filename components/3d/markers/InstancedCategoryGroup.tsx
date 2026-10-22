"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnrichedPlace } from "@/lib/data/selectors";
import type { CityId } from "@/data/types";
import type { MarkerArchetype, MarkerEntry } from "./markerConfig";

interface InstancedCategoryGroupProps {
  archetype: MarkerArchetype;
  entries: MarkerEntry[];
  geometry: THREE.BufferGeometry;
  baseColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  selectedCityId: CityId | null;
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
      mesh.setColorAt(idx, tmpColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (hitMesh) hitMesh.instanceMatrix.needsUpdate = true;
  }, [entries, dummy, tmpColor]);

  useFrame(({ clock, camera }) => {
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

      const finalScale = entry.scale * lodScale;
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
        dummy.scale.setScalar(finalScale > 0.15 ? Math.max(1.0, finalScale) : 0);
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
            onSelect(entries[e.instanceId].place);
          }
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
