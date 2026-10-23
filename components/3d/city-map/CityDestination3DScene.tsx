"use client";

import { useEffect, useMemo } from "react";
import { markLoadStage } from "../loadProgress";
import * as THREE from "three";
import { WorldHtml } from "../WorldHtml";
import { getCityBundle } from "@/lib/data/selectors";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";
import {
  computeCityMapNodes,
  isPlaceEnabledByToggles,
  matchesCityCategoryFilter,
  type CityCategoryFilter,
} from "./cityMapLayout";
import { SingleDestinationPin } from "./SingleDestinationPin";

interface CityDestination3DSceneProps {
  cityId: CityId;
  isNightMode: boolean;
  showAllLabels: boolean;
  categoryFilter: CityCategoryFilter;
}

export function CityDestination3DScene({
  cityId,
  isNightMode,
  showAllLabels,
  categoryFilter,
}: CityDestination3DSceneProps) {
  const store = useTripStore();
  useEffect(() => {
    markLoadStage("terrain");
    markLoadStage("pins");
  }, []);
  const bundle = useMemo(() => getCityBundle(cityId), [cityId]);
  const allNodes = useMemo(() => computeCityMapNodes(cityId), [cityId]);

  const visibleNodes = useMemo(() => {
    return allNodes.filter((n) => {
      if (!isPlaceEnabledByToggles(n.place, store.layerToggles)) return false;
      return matchesCityCategoryFilter(n, categoryFilter);
    });
  }, [allNodes, store.layerToggles, categoryFilter]);

  const focusedNode = useMemo(
    () => allNodes.find((n) => n.place.id === store.focusedPlaceId) ?? null,
    [allNodes, store.focusedPlaceId]
  );

  // Decorative background city blocks so the zoomed-in map feels like a living 3D city
  const decorativeBlocks = useMemo(() => {
    const blocks: Array<{
      x: number;
      z: number;
      w: number;
      h: number;
      d: number;
      isTree: boolean;
    }> = [];
    for (let i = 0; i < 48; i++) {
      const angle = i * 1.17;
      const radius = 1.6 + (i % 9) * 1.05;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const tooClose = allNodes.some(
        (n) => Math.hypot(n.x - x, n.z - z) < 0.92
      );
      if (tooClose) continue;
      blocks.push({
        x,
        z,
        w: 0.35 + (i % 3) * 0.14,
        h: radius > 7.5 ? 0.45 + (i % 4) * 0.25 : 0.18 + (i % 4) * 0.16,
        d: 0.35 + ((i + 1) % 3) * 0.14,
        isTree: radius > 7.2 || i % 3 === 0,
      });
    }
    return blocks;
  }, [allNodes]);

  // Path curve from Central Station Hub (0,0,0) to focused place
  const focusPathGeo = useMemo(() => {
    if (!focusedNode) return null;
    const start = new THREE.Vector3(0, 0.26, 0);
    const mid = new THREE.Vector3(
      focusedNode.x * 0.5,
      Math.max(0.45, focusedNode.y + 0.25),
      focusedNode.z * 0.5
    );
    const end = new THREE.Vector3(
      focusedNode.x,
      focusedNode.y + 0.08,
      focusedNode.z
    );
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return new THREE.TubeGeometry(curve, 24, 0.055, 8, false);
  }, [focusedNode]);

  return (
    <group name="city-destination-3d-scene">
      {/* 1. Outer Scenic Rim / Nature Hills Ring */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[12.6, 13.4, 0.36, 48]} />
        <meshStandardMaterial
          color={isNightMode ? "#133836" : "#6ee7b7"}
          roughness={0.8}
        />
      </mesh>

      {/* 2. Main Urban Diorama Plateau */}
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <cylinderGeometry args={[8.4, 8.8, 0.16, 48]} />
        <meshStandardMaterial
          color={isNightMode ? "#1e293b" : "#f8fafc"}
          roughness={0.65}
        />
      </mesh>

      {/* 3. Inner Hotel & Central Station Plaza Disc */}
      <mesh position={[0, 0.21, 0]} receiveShadow>
        <cylinderGeometry args={[3.9, 4.0, 0.08, 40]} />
        <meshStandardMaterial
          color={isNightMode ? "#0f172a" : "#f1f5f9"}
          roughness={0.5}
        />
      </mesh>

      {/* 4. Scenic River / Harbor Waterway cutting across the city diorama */}
      <mesh
        position={[-1.2, 0.215, 0.6]}
        rotation={[-Math.PI / 2, 0, 0.38]}
        receiveShadow
      >
        <planeGeometry args={[24, 0.85]} />
        <meshStandardMaterial
          color={isNightMode ? "#0284c7" : "#38bdf8"}
          emissive={isNightMode ? "#0369a1" : "#0ea5e9"}
          emissiveIntensity={isNightMode ? 0.85 : 0.25}
          roughness={0.15}
          metalness={0.35}
        />
      </mesh>

      {/* 5. District Boulevard Rings (Hotels Ring, Culinary & Attractions Ring, Nature Ring) */}
      {[2.6, 3.8, 5.8, 7.8, 9.8].map((r, idx) => (
        <mesh
          key={`ring-${r}`}
          position={[0, idx >= 4 ? 0.27 : 0.245, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[r - 0.04, r + 0.04, 64]} />
          <meshBasicMaterial
            color={idx <= 1 ? "#38bdf8" : idx <= 3 ? "#fb923c" : "#10b981"}
            transparent
            opacity={isNightMode ? 0.45 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* 6. Radial Avenue Spokes */}
      {[0, 1, 2, 3, 4, 5].map((spoke) => (
        <mesh
          key={`spoke-${spoke}`}
          position={[0, 0.242, 0]}
          rotation={[-Math.PI / 2, 0, (spoke * Math.PI) / 6]}
        >
          <planeGeometry args={[16.8, 0.11]} />
          <meshBasicMaterial
            color={isNightMode ? "#475569" : "#cbd5e1"}
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* 7. Central City Hub Monument */}
      <group position={[0, 0.25, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 0.36, 8]} />
          <meshStandardMaterial
            color="#ff5a36"
            emissive="#ff5a36"
            emissiveIntensity={isNightMode ? 1.4 : 0.5}
          />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color="#fde047"
            emissive="#fde047"
            emissiveIntensity={1.8}
          />
        </mesh>

        <WorldHtml position={[0, 0.95, 0]} center zIndexRange={[25, 0]}>
          <div
            dir="rtl"
            className="pointer-events-none whitespace-nowrap rounded-2xl border border-amber-300/70 bg-slate-950/90 px-3 py-1 text-center shadow-xl backdrop-blur-md"
          >
            <div className="text-xs font-black text-amber-300">
              מרכז {bundle.city.nameHe} ({bundle.city.nameEn})
            </div>
            <div className="text-[10px] text-slate-300">
              {bundle.hotels.length} מלונות • {bundle.food.length} מסעדות ושווקים •{" "}
              {bundle.attractions.length} אטרקציות
            </div>
          </div>
        </WorldHtml>
      </group>

      {/* 8. Decorative Low-Poly City Buildings & Park Trees */}
      {decorativeBlocks.map((b, i) =>
        b.isTree ? (
          <group
            key={`deco-${i}`}
            position={[
              b.x,
              Math.hypot(b.x, b.z) > 8.3 ? 0.26 : 0.24,
              b.z,
            ]}
          >
            <mesh position={[0, 0.18, 0]} castShadow>
              <coneGeometry args={[0.22, 0.38, 6]} />
              <meshStandardMaterial
                color={isNightMode ? "#065f46" : "#10b981"}
                flatShading
              />
            </mesh>
          </group>
        ) : (
          <mesh
            key={`deco-${i}`}
            position={[b.x, 0.24 + b.h / 2, b.z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={isNightMode ? "#1e293b" : "#e2e8f0"}
              roughness={0.6}
            />
          </mesh>
        )
      )}

      {/* 9. Highlighted Path Arc from City Hub to Focused Place */}
      {focusPathGeo && focusedNode && (
        <group>
          <mesh geometry={focusPathGeo}>
            <meshStandardMaterial
              color="#fde047"
              emissive="#f59e0b"
              emissiveIntensity={1.6}
            />
          </mesh>
          <WorldHtml
            position={[
              focusedNode.x * 0.5,
              focusedNode.y + 0.55,
              focusedNode.z * 0.5,
            ]}
            center
            zIndexRange={[35, 0]}
          >
            <div
              dir="rtl"
              className="pointer-events-none whitespace-nowrap rounded-full border border-amber-300 bg-slate-950/90 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 shadow-lg"
            >
              ~{focusedNode.approxDistanceKm} ק״מ ממרכז העיר
            </div>
          </WorldHtml>
        </group>
      )}

      {/* 10. All Destination Place 3D Markers */}
      {visibleNodes.map((node) => (
        <SingleDestinationPin
          key={node.place.id}
          node={node}
          isFocused={store.focusedPlaceId === node.place.id}
          isNightMode={isNightMode}
          showAllLabels={showAllLabels}
          onSelectNode={(n) => tripActions.focusPlace(n.place.id, cityId)}
        />
      ))}
    </group>
  );
}
