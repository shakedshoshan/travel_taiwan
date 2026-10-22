"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { getAllPlaces, type EnrichedPlace } from "@/lib/data/selectors";
import {
  useTripStore,
  type LayerToggles,
} from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";
import {
  getArchetypeAndColor,
  isPlaceVisible,
  type MarkerArchetype,
  type MarkerEntry,
} from "./markers/markerConfig";
import { InstancedCategoryGroup } from "./markers/InstancedCategoryGroup";
import { MarkerTooltipCard } from "./markers/MarkerTooltipCard";

interface CategoryMarkersProps {
  layerToggles: LayerToggles;
  isNightMode: boolean;
  selectedCityId: CityId | null;
  focusedPlaceId: string | null;
  onSelectPlace: (place: EnrichedPlace) => void;
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
        <MarkerTooltipCard
          activeEntry={activeEntry}
          isFocused={focusedEntry?.place.id === activeEntry.place.id}
        />
      )}
    </group>
  );
}
