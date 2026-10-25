"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CityCategory } from "@/lib/store/tripStoreTypes";
import type { EnrichedPlace } from "@/lib/data/selectors";
import { WorldHtml } from "../WorldHtml";
import {
  clusterPopScale,
  labelBudget,
  markerFrame,
} from "./markerFrame";
import { mapLabelName, rankPlacesForLabels } from "./placeLabelRank";

const SLOT_COUNT = 8;
const scratch = new THREE.Vector3();

function SlotGroup({
  index,
  kind,
}: {
  index: number;
  kind: "name" | "count";
}) {
  const ref = useRef<THREE.Group>(null);
  return (
    <group ref={ref} name={`${kind}-slot-${index}`}>
      <WorldHtml
        anchor="bottom"
        screenOffset={[0, kind === "count" ? -18 : -10]}
        hideWhenOffscreen
        labelPriority={kind === "name" ? 70 - index : 40 - index}
        showWhenFar
        passive
        ariaHidden
      >
        <span
          data-map-label="1"
          data-place-slot={kind === "name" ? String(index) : undefined}
          data-cluster-slot={kind === "count" ? String(index) : undefined}
          className="pointer-events-none block max-w-[8.5rem] truncate rounded-full bg-slate-950/88 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-white"
        />
      </WorldHtml>
    </group>
  );
}

export function CityOverlayLabels({
  places,
  category,
  focusedPlaceId,
  centerX,
  centerZ,
  reducedMotion,
}: {
  places: EnrichedPlace[];
  category: CityCategory;
  focusedPlaceId: string | null;
  centerX: number;
  centerZ: number;
  reducedMotion: boolean;
}) {
  const nameGroups = useRef<Array<THREE.Group | null>>([]);
  const countGroups = useRef<Array<THREE.Group | null>>([]);

  useFrame(({ camera }) => {
    const live = camera.position.distanceTo(
      scratch.set(markerFrame.fitX, markerFrame.fitY, markerFrame.fitZ)
    );
    const nameAllowance = Math.min(8, labelBudget(live, markerFrame.fitDistance));
    const ranked = rankPlacesForLabels(
      places,
      category,
      centerX,
      centerZ,
      markerFrame.hiddenIds,
      focusedPlaceId
    );
    const names = ranked.slice(0, nameAllowance);
    const counts = markerFrame.badges.slice(0, Math.max(0, 8 - names.length));

    for (let index = 0; index < SLOT_COUNT; index++) {
      const group = nameGroups.current[index];
      const place = names[index];
      if (!group) continue;
      if (!place) {
        group.position.set(0, -80, 0);
      } else {
        const { worldX, worldY, worldZ } = place.resolvedCoords;
        group.position.set(worldX, worldY + 0.42, worldZ);
      }
      group.updateMatrixWorld(true);
      const node = document.querySelector<HTMLElement>(
        `[data-place-slot="${index}"]`
      );
      const name = place ? mapLabelName(place.name) : "";
      if (node) {
        node.hidden = !name;
        if (node.textContent !== name) node.textContent = name;
      }
    }

    for (let index = 0; index < SLOT_COUNT; index++) {
      const group = countGroups.current[index];
      const badge = counts[index];
      if (!group) continue;
      if (!badge) {
        group.position.set(0, -80, 0);
      } else {
        const pop = clusterPopScale(badge.key, reducedMotion);
        group.position.set(badge.x, badge.y + 0.55 * pop, badge.z);
        group.scale.setScalar(pop);
      }
      group.updateMatrixWorld(true);
      const node = document.querySelector<HTMLElement>(
        `[data-cluster-slot="${index}"]`
      );
      const text = badge ? String(badge.count) : "";
      if (node) {
        node.hidden = !text;
        if (node.textContent !== text) node.textContent = text;
      }
    }
  }, -1);

  return (
    <group
      ref={(node) => {
        if (!node) return;
        nameGroups.current = [];
        countGroups.current = [];
        node.children.forEach((child, index) => {
          if (index < SLOT_COUNT) nameGroups.current.push(child as THREE.Group);
          else countGroups.current.push(child as THREE.Group);
        });
      }}
    >
      {Array.from({ length: SLOT_COUNT }, (_, index) => (
        <SlotGroup key={`name-${index}`} index={index} kind="name" />
      ))}
      {Array.from({ length: SLOT_COUNT }, (_, index) => (
        <SlotGroup key={`count-${index}`} index={index} kind="count" />
      ))}
    </group>
  );
}
