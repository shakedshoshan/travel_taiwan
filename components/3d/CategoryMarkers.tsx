"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";
import { WorldHtml } from "./WorldHtml";
import {
  buildGoogleMapsUrl,
  getAllPlaces,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import { getPlaceImage } from "@/lib/data/placeImages";
import {
  tripActions,
  useTripStore,
  type LayerToggles,
} from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

interface CategoryMarkersProps {
  layerToggles: LayerToggles;
  isNightMode: boolean;
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
  onSelectPlace: (place: EnrichedPlace) => void;
}

type MarkerArchetype = "lantern" | "bowl" | "bed" | "nature" | "star";

interface MarkerEntry {
  place: EnrichedPlace;
  archetype: MarkerArchetype;
  importance: number;
  scale: number;
  color: string;
}

function isPlaceVisible(place: EnrichedPlace, toggles: LayerToggles): boolean {
  if (place.kind === "attraction") {
    if (place.isNature) return toggles.nature;
    return toggles.attractions;
  }
  if (place.kind === "food") {
    if (place.type === "market") return toggles.markets;
    if (place.type === "michelin-bib") return toggles.michelinBib;
    if (place.type === "hidden-local") return toggles.hiddenLocal;
    return toggles.food;
  }
  if (place.kind === "hotel") {
    return toggles.hotels;
  }
  return true;
}

function getArchetypeAndColor(place: EnrichedPlace): {
  archetype: MarkerArchetype;
  color: string;
  importance: number;
} {
  if (place.kind === "hotel") {
    const color =
      place.tier === "splurge"
        ? "#f59e0b"
        : place.tier === "quality"
          ? "#0ea5e9"
          : "#10b981";
    const imp = place.tier === "splurge" ? 5 : place.tier === "quality" ? 4 : 3;
    return { archetype: "bed", color, importance: imp };
  }

  if (place.kind === "food") {
    if (place.type === "market") {
      return {
        archetype: "lantern",
        color: "#ff4522",
        importance: place.importance,
      };
    }
    const color =
      place.type === "michelin-bib"
        ? "#f43f5e"
        : place.type === "hidden-local"
          ? "#a855f7"
          : "#10b981";
    return { archetype: "bowl", color, importance: place.importance };
  }

  if (place.isNature) {
    return {
      archetype: "nature",
      color: place.importance === 5 ? "#10b981" : "#22c55e",
      importance: place.importance,
    };
  }

  if (place.importance === 5) {
    return { archetype: "star", color: "#fbbf24", importance: 5 };
  }

  return {
    archetype: "star",
    color: "#38bdf8",
    importance: place.importance,
  };
}

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

function InstancedCategoryGroup({
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

      // Importance 5 landmarks stay subtly visible zoomed out; others emerge as you zoom in
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

export function CategoryMarkers({
  layerToggles,
  isNightMode,
  selectedCityId,
  focusedPlaceId,
  onSelectPlace,
}: CategoryMarkersProps) {
  const store = useTripStore();
  const [hoveredEntry, setHoveredEntry] = useState<MarkerEntry | null>(null);

  const geometries = useMemo(() => {
    const lanternGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.16, 12);
    const bowlGeo = new THREE.CylinderGeometry(0.085, 0.045, 0.09, 14);
    const bedGeo = new THREE.BoxGeometry(0.13, 0.08, 0.11);
    const natureGeo = new THREE.ConeGeometry(0.085, 0.21, 7);
    const starGeo = new THREE.OctahedronGeometry(0.095, 0);

    return {
      lantern: lanternGeo,
      bowl: bowlGeo,
      bed: bedGeo,
      nature: natureGeo,
      star: starGeo,
    };
  }, []);

  const groupedEntries = useMemo(() => {
    const allPlaces = getAllPlaces();
    const groups: Record<MarkerArchetype, MarkerEntry[]> = {
      lantern: [],
      bowl: [],
      bed: [],
      nature: [],
      star: [],
    };

    for (const place of allPlaces) {
      if (!isPlaceVisible(place, layerToggles)) continue;

      const { archetype, color, importance } = getArchetypeAndColor(place);
      const importanceScale = 0.55 + importance * 0.16;
      const cityBoost =
        selectedCityId && place.cityId === selectedCityId ? 1.2 : 1.0;
      const focusBoost = focusedPlaceId === place.id ? 1.65 : 1.0;

      groups[archetype].push({
        place,
        archetype,
        importance,
        scale: importanceScale * cityBoost * focusBoost,
        color,
      });
    }

    return groups;
  }, [layerToggles, selectedCityId, focusedPlaceId]);

  const topImportancePlaces = useMemo(() => {
    const list: MarkerEntry[] = [];
    for (const key of Object.keys(groupedEntries) as MarkerArchetype[]) {
      for (const entry of groupedEntries[key]) {
        if (entry.importance === 5) list.push(entry);
      }
    }
    return list;
  }, [groupedEntries]);

  const focusedEntry = useMemo(() => {
    if (!focusedPlaceId) return null;
    for (const key of Object.keys(groupedEntries) as MarkerArchetype[]) {
      const found = groupedEntries[key].find(
        (e) => e.place.id === focusedPlaceId
      );
      if (found) return found;
    }
    return null;
  }, [groupedEntries, focusedPlaceId]);

  const activeEntry = hoveredEntry ?? focusedEntry;

  return (
    <group name="category-markers">
      <InstancedCategoryGroup
        archetype="lantern"
        entries={groupedEntries.lantern}
        geometry={geometries.lantern}
        baseColor="#ffffff"
        emissiveColor="#ff4522"
        emissiveIntensity={isNightMode ? 2.4 : 0.85}
        selectedCityId={selectedCityId}
        prefersReducedMotion={store.prefersReducedMotion}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      <InstancedCategoryGroup
        archetype="bowl"
        entries={groupedEntries.bowl}
        geometry={geometries.bowl}
        baseColor="#ffffff"
        emissiveColor="#f43f5e"
        emissiveIntensity={isNightMode ? 1.3 : 0.45}
        selectedCityId={selectedCityId}
        prefersReducedMotion={store.prefersReducedMotion}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      <InstancedCategoryGroup
        archetype="bed"
        entries={groupedEntries.bed}
        geometry={geometries.bed}
        baseColor="#ffffff"
        emissiveColor="#38bdf8"
        emissiveIntensity={isNightMode ? 1.2 : 0.4}
        selectedCityId={selectedCityId}
        prefersReducedMotion={store.prefersReducedMotion}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      <InstancedCategoryGroup
        archetype="nature"
        entries={groupedEntries.nature}
        geometry={geometries.nature}
        baseColor="#ffffff"
        emissiveColor="#10b981"
        emissiveIntensity={isNightMode ? 0.9 : 0.35}
        selectedCityId={selectedCityId}
        prefersReducedMotion={store.prefersReducedMotion}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      <InstancedCategoryGroup
        archetype="star"
        entries={groupedEntries.star}
        geometry={geometries.star}
        baseColor="#ffffff"
        emissiveColor="#fbbf24"
        emissiveIntensity={isNightMode ? 1.9 : 0.75}
        selectedCityId={selectedCityId}
        prefersReducedMotion={store.prefersReducedMotion}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      {/* Sparkles around importance=5 places (disabled when prefers-reduced-motion) */}
      {topImportancePlaces.length > 0 && !store.prefersReducedMotion && (
        <Sparkles
          count={Math.min(90, topImportancePlaces.length * 2)}
          scale={[12, 3.2, 22]}
          position={[0, 1.1, 0]}
          size={isNightMode ? 3.0 : 2.0}
          speed={0.4}
          color={isNightMode ? "#fde047" : "#f59e0b"}
        />
      )}

      {/* Hover or Focused Card for any Category Marker */}
      {activeEntry && (
        <WorldHtml
          position={[
            activeEntry.place.resolvedCoords.worldX,
            activeEntry.place.resolvedCoords.worldY + 0.42,
            activeEntry.place.resolvedCoords.worldZ,
          ]}
          center
          distanceFactor={15}
          zIndexRange={[35, 0]}
        >
          <div
            dir="rtl"
            className={`${
              focusedEntry?.place.id === activeEntry.place.id
                ? "pointer-events-auto border-amber-300 ring-2 ring-amber-400"
                : "pointer-events-none border-white/40"
            } w-64 rounded-2xl border bg-slate-950/95 p-3 text-right text-xs text-white shadow-2xl backdrop-blur-md`}
          >
            <div className="mb-2 relative h-24 w-full overflow-hidden rounded-xl bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPlaceImage(activeEntry.place).src}
                alt={activeEntry.place.name}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-1 left-1.5 max-w-[90%] truncate text-[8.5px] text-slate-300">
                {getPlaceImage(activeEntry.place).creditHe}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {activeEntry.place.kind === "attraction"
                  ? activeEntry.place.isNature
                    ? "טבע ונוף"
                    : "אטרקציה"
                  : activeEntry.place.kind === "food"
                    ? activeEntry.place.typeHe
                    : `מלון • ${activeEntry.place.tierHe}`}
              </span>
              <span className="text-[10px] text-amber-400">
                {"★".repeat(activeEntry.importance)}
              </span>
            </div>
            <div className="mt-1 font-bold text-white">
              {activeEntry.place.name}
            </div>
            {activeEntry.place.nameZh && (
              <div className="text-[10px] text-amber-200/90">
                {activeEntry.place.nameZh}
              </div>
            )}
            <div className="text-[10px] text-slate-400">
              {activeEntry.place.cityNameHe}
            </div>
            <div className="mt-1 line-clamp-2 text-[11px] text-slate-300">
              {activeEntry.place.description}
            </div>
            {(activeEntry.place.kind === "food" ||
              activeEntry.place.kind === "hotel") &&
              activeEntry.place.priceText && (
                <div className="mt-1 font-mono text-[10.5px] font-bold text-emerald-300">
                  {activeEntry.place.priceText}
                </div>
              )}
            {(activeEntry.place.kind === "food" ||
              activeEntry.place.kind === "hotel") &&
              !activeEntry.place.verified && (
                <div className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300">
                  לא מאומת
                </div>
              )}

            {focusedEntry?.place.id === activeEntry.place.id && (
              <div className="mt-2.5 flex flex-col gap-1.5 border-t border-white/15 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    tripActions.enterCityZoomMap(activeEntry.place.cityId);
                    tripActions.focusPlace(
                      activeEntry.place.id,
                      activeEntry.place.cityId
                    );
                  }}
                  className="min-h-[38px] w-full rounded-xl bg-amber-400 py-1.5 text-[11px] font-black text-slate-950 hover:bg-amber-300"
                >
                  🔍 זום למפת יעד 3D ({activeEntry.place.cityNameHe})
                </button>
                <div className="flex items-center justify-between text-[11px]">
                  <Link
                    href={`/place/${activeEntry.place.id}`}
                    className="font-bold text-orange-400 hover:underline"
                  >
                    לעמוד המקום המלא ←
                  </Link>
                  <a
                    href={buildGoogleMapsUrl(activeEntry.place)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-300 hover:text-white"
                  >
                    נווט ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </WorldHtml>
      )}
    </group>
  );
}
