"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { placeImportance } from "@/lib/data/cityCategory";
import type { EnrichedPlace } from "@/lib/data/selectors";
import { clusterScreenPoints } from "./clusterMarkers";
import { markerFrame, publishVisiblePlaces } from "./markerFrame";

const projected = new THREE.Vector3();
let lastPublish = 0;

export function CityClusterController({
  places,
  enabled,
}: {
  places: EnrichedPlace[];
  enabled: boolean;
}) {
  const points = useMemo(() => places, [places]);

  useFrame(({ camera, size }) => {
    if (!enabled) {
      if (markerFrame.hiddenIds.size > 0) markerFrame.hiddenIds = new Set();
      if (markerFrame.badges.length > 0) markerFrame.badges = [];
      return;
    }
    const screen = points.map((place) => {
      const { worldX, worldY, worldZ } = place.resolvedCoords;
      projected.set(worldX, worldY + 0.2, worldZ).project(camera);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const onScreen =
        projected.z > -1 &&
        projected.z < 1 &&
        x >= 0 &&
        y >= 0 &&
        x <= size.width &&
        y <= size.height;
      return {
        id: place.id,
        x,
        y,
        worldX,
        worldY,
        worldZ,
        importance: placeImportance(place),
        onScreen,
      };
    });
    const result = clusterScreenPoints(screen, 48);
    markerFrame.hiddenIds = result.hiddenIds;
    markerFrame.badges = result.badges;
    const now = performance.now();
    if (now - lastPublish > 220) {
      lastPublish = now;
      publishVisiblePlaces(screen.filter((point) => point.onScreen).map((point) => point.id));
    }
  }, -2);

  return null;
}
