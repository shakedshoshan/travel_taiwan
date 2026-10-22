"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { WorldHtml } from "./WorldHtml";
import { getAllPlaces, type EnrichedPlace } from "@/lib/data/selectors";
import type { LayerToggles } from "@/lib/store/useTripStore";
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

  // Attraction
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
  onHover: (entry: MarkerEntry | null) => void;
  onSelect: (place: EnrichedPlace) => void;
}

function InstancedCategoryGroup({
  entries,
  geometry,
  baseColor,
  emissiveColor,
  emissiveIntensity,
  onHover,
  onSelect,
}: InstancedCategoryGroupProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    entries.forEach((entry, idx) => {
      const { worldX, worldY, worldZ } = entry.place.resolvedCoords;
      dummy.position.set(worldX, worldY + 0.08 * entry.scale, worldZ);
      dummy.scale.setScalar(entry.scale);
      dummy.rotation.set(0, idx * 0.5, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);

      tmpColor.set(entry.color);
      mesh.setColorAt(idx, tmpColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [entries, dummy, tmpColor]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || entries.length === 0) return;
    const t = clock.getElapsedTime();

    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      const { worldX, worldY, worldZ } = entry.place.resolvedCoords;
      const bob =
        entry.importance >= 4
          ? Math.sin(t * 2.6 + idx * 0.7) * 0.035
          : 0;
      dummy.position.set(worldX, worldY + 0.08 * entry.scale + bob, worldZ);
      dummy.scale.setScalar(entry.scale);
      dummy.rotation.set(
        0,
        entry.importance === 5 ? t * 0.9 + idx : idx * 0.5,
        0
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (entries.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, entries.length]}
      castShadow
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
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        roughness={0.3}
        metalness={0.2}
      />
    </instancedMesh>
  );
}

export function CategoryMarkers({
  layerToggles,
  isNightMode,
  selectedCityId,
  focusedPlaceId,
  onSelectPlace,
}: CategoryMarkersProps) {
  const [hoveredEntry, setHoveredEntry] = useState<MarkerEntry | null>(null);

  const geometries = useMemo(() => {
    // Lantern = cylindrical red paper lantern
    const lanternGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.16, 12);
    // Bowl = tapered noodle bowl
    const bowlGeo = new THREE.CylinderGeometry(0.085, 0.045, 0.09, 14);
    // Bed = cozy hotel block
    const bedGeo = new THREE.BoxGeometry(0.13, 0.08, 0.11);
    // Nature = stylized pine cone / mountain peak
    const natureGeo = new THREE.ConeGeometry(0.085, 0.21, 7);
    // Star = octahedral crystal star
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
      // Scale marker by importance (1..5), boost if city is selected or place is focused
      const importanceScale = 0.55 + importance * 0.16; // imp 5 => 1.35, imp 3 => 1.03
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

  // Collect importance-5 places for extra sparkle effects
  const topImportancePlaces = useMemo(() => {
    const list: MarkerEntry[] = [];
    for (const key of Object.keys(groupedEntries) as MarkerArchetype[]) {
      for (const entry of groupedEntries[key]) {
        if (entry.importance === 5) list.push(entry);
      }
    }
    return list;
  }, [groupedEntries]);

  return (
    <group name="category-markers">
      {/* Markets = Glowing Lanterns */}
      <InstancedCategoryGroup
        archetype="lantern"
        entries={groupedEntries.lantern}
        geometry={geometries.lantern}
        baseColor="#ffffff"
        emissiveColor="#ff4522"
        emissiveIntensity={isNightMode ? 2.4 : 0.85}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      {/* Food = Noodle Bowls */}
      <InstancedCategoryGroup
        archetype="bowl"
        entries={groupedEntries.bowl}
        geometry={geometries.bowl}
        baseColor="#ffffff"
        emissiveColor="#f43f5e"
        emissiveIntensity={isNightMode ? 1.3 : 0.45}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      {/* Hotels = Cozy Beds */}
      <InstancedCategoryGroup
        archetype="bed"
        entries={groupedEntries.bed}
        geometry={geometries.bed}
        baseColor="#ffffff"
        emissiveColor="#38bdf8"
        emissiveIntensity={isNightMode ? 1.2 : 0.4}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      {/* Nature = Pine / Mountain Cones */}
      <InstancedCategoryGroup
        archetype="nature"
        entries={groupedEntries.nature}
        geometry={geometries.nature}
        baseColor="#ffffff"
        emissiveColor="#10b981"
        emissiveIntensity={isNightMode ? 0.9 : 0.35}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      {/* Attractions & Importance-5 Stars */}
      <InstancedCategoryGroup
        archetype="star"
        entries={groupedEntries.star}
        geometry={geometries.star}
        baseColor="#ffffff"
        emissiveColor="#fbbf24"
        emissiveIntensity={isNightMode ? 1.9 : 0.75}
        onHover={setHoveredEntry}
        onSelect={onSelectPlace}
      />

      {/* Sparkles around importance=5 places */}
      {topImportancePlaces.length > 0 && (
        <Sparkles
          count={Math.min(120, topImportancePlaces.length * 2)}
          scale={[12, 3.2, 22]}
          position={[0, 1.1, 0]}
          size={isNightMode ? 3.2 : 2.2}
          speed={0.45}
          color={isNightMode ? "#fde047" : "#f59e0b"}
        />
      )}

      {/* Hover Tooltip for any Category Marker */}
      {hoveredEntry && (
        <WorldHtml
          position={[
            hoveredEntry.place.resolvedCoords.worldX,
            hoveredEntry.place.resolvedCoords.worldY + 0.35,
            hoveredEntry.place.resolvedCoords.worldZ,
          ]}
          center
          distanceFactor={15}
          zIndexRange={[30, 0]}
        >
          <div
            dir="rtl"
            className="pointer-events-none w-56 rounded-2xl border border-white/40 bg-slate-950/92 p-2.5 text-right text-xs text-white shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {hoveredEntry.place.kind === "attraction"
                  ? hoveredEntry.place.isNature
                    ? "טבע ונוף"
                    : "אטרקציה"
                  : hoveredEntry.place.kind === "food"
                    ? hoveredEntry.place.typeHe
                    : `מלון • ${hoveredEntry.place.tierHe}`}
              </span>
              <span className="text-[10px] text-amber-400">
                {"★".repeat(hoveredEntry.importance)}
              </span>
            </div>
            <div className="mt-1 font-bold text-white">
              {hoveredEntry.place.name}
            </div>
            <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-300">
              {hoveredEntry.place.description}
            </div>
            {(hoveredEntry.place.kind === "food" ||
              hoveredEntry.place.kind === "hotel") &&
              !hoveredEntry.place.verified && (
                <div className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300">
                  לא מאומת
                </div>
              )}
          </div>
        </WorldHtml>
      )}
    </group>
  );
}
