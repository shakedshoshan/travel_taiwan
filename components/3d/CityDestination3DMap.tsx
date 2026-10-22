"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Utensils,
  Sparkles,
  Trees,
  Flame,
  ExternalLink,
  MapPin,
  AlertCircle,
  Eye,
  EyeOff,
  Compass,
  Navigation,
  Star,
} from "lucide-react";
import { WorldHtml } from "./WorldHtml";
import {
  buildGoogleMapsUrl,
  FOOD_TYPE_META,
  getAllCities,
  getCityBundle,
  HOTEL_TIER_META,
  type EnrichedPlace,
} from "@/lib/data/selectors";
import { getPlaceImage } from "@/lib/data/placeImages";
import {
  tripActions,
  useTripStore,
  type LayerToggles,
} from "@/lib/store/useTripStore";
import type { CityId } from "@/data/types";

export interface CityMapNode {
  place: EnrichedPlace;
  x: number;
  y: number;
  z: number;
  color: string;
  accentColor: string;
  badgeText: string;
  categoryGroup: "hotel" | "market" | "food" | "nature" | "attraction";
  importance: number;
  approxDistanceKm: number;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function isPlaceEnabledByToggles(
  place: EnrichedPlace,
  toggles: LayerToggles
): boolean {
  if (place.kind === "hotel") return toggles.hotels;
  if (place.kind === "food") {
    if (place.type === "market") return toggles.markets;
    if (place.type === "michelin-bib") return toggles.michelinBib;
    if (place.type === "hidden-local") return toggles.hiddenLocal;
    return toggles.food;
  }
  if (place.kind === "attraction") {
    return place.isNature ? toggles.nature : toggles.attractions;
  }
  return true;
}

/**
 * Deterministically maps all places of a city (hotels, restaurants/markets, attractions/nature)
 * onto a spacious 3D Destination Diorama (-11..+11 world units) with zero overlap.
 */
export function computeCityMapNodes(cityId: CityId): CityMapNode[] {
  const bundle = getCityBundle(cityId);
  const { hotels, food, attractions } = bundle;

  const nodes: CityMapNode[] = [];

  // 1. Hotels -> Inner Grand Boulevard Ring (radius 2.4 .. 3.9)
  hotels.forEach((hotel, idx) => {
    const count = Math.max(1, hotels.length);
    const angle = (idx / count) * Math.PI * 2 + 0.35;
    const radius = 2.6 + (idx % 2) * 0.85;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.22;

    const color =
      hotel.tier === "splurge"
        ? "#f59e0b"
        : hotel.tier === "quality"
          ? "#0ea5e9"
          : "#10b981";

    nodes.push({
      place: hotel,
      x,
      y,
      z,
      color,
      accentColor: "#ffffff",
      badgeText: `מלון • ${hotel.tierHe}`,
      categoryGroup: "hotel",
      importance: hotel.tier === "splurge" ? 5 : hotel.tier === "quality" ? 4 : 3,
      approxDistanceKm: Number((radius * 0.35).toFixed(1)),
    });
  });

  // 2. Food & Night Markets -> Culinary District Ring (radius 4.3 .. 7.4)
  food.forEach((item, idx) => {
    const count = Math.max(1, food.length);
    // Distribute evenly using golden angle + ring progression so even 25 food spots never collide
    const norm = (idx + 0.5) / count;
    const angle = idx * GOLDEN_ANGLE + 1.1;
    const radius = 4.3 + Math.sqrt(norm) * 3.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.22;

    const isMarket = item.type === "market";
    const color = isMarket
      ? "#ff5a36"
      : item.type === "michelin-bib"
        ? "#f43f5e"
        : item.type === "hidden-local"
          ? "#a855f7"
          : "#10b981";

    nodes.push({
      place: item,
      x,
      y,
      z,
      color,
      accentColor: isMarket ? "#fde047" : "#ffffff",
      badgeText: item.typeHe,
      categoryGroup: isMarket ? "market" : "food",
      importance: item.importance,
      approxDistanceKm: Number((radius * 0.42).toFixed(1)),
    });
  });

  // 3. Attractions (Urban & Nature) -> Cultural Plaza & Scenic Rim (radius 4.8 .. 10.2)
  const urbanAttractions = attractions.filter((a) => !a.isNature);
  const natureAttractions = attractions.filter((a) => a.isNature);

  urbanAttractions.forEach((attr, idx) => {
    const count = Math.max(1, urbanAttractions.length);
    const norm = (idx + 0.5) / count;
    const angle = idx * GOLDEN_ANGLE + 2.4;
    const radius = 4.8 + Math.sqrt(norm) * 3.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.24;

    nodes.push({
      place: attr,
      x,
      y,
      z,
      color: attr.importance === 5 ? "#fbbf24" : "#38bdf8",
      accentColor: "#ffffff",
      badgeText: "אטרקציה עירונית",
      categoryGroup: "attraction",
      importance: attr.importance,
      approxDistanceKm: Number((radius * 0.48).toFixed(1)),
    });
  });

  natureAttractions.forEach((attr, idx) => {
    const count = Math.max(1, natureAttractions.length);
    const angle = (idx / count) * Math.PI * 2 + 0.75;
    const radius = 8.2 + (idx % 3) * 0.95;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.48; // Elevated on the green scenic rim

    nodes.push({
      place: attr,
      x,
      y,
      z,
      color: "#10b981",
      accentColor: "#a7f3d0",
      badgeText: "טבע ונוף",
      categoryGroup: "nature",
      importance: attr.importance,
      approxDistanceKm: Number((radius * 0.65).toFixed(1)),
    });
  });

  return nodes;
}

interface SingleDestinationPinProps {
  node: CityMapNode;
  isFocused: boolean;
  isNightMode: boolean;
  showAllLabels: boolean;
  onSelectNode: (node: CityMapNode) => void;
}

function SingleDestinationPin({
  node,
  isFocused,
  isNightMode,
  showAllLabels,
  onSelectNode,
}: SingleDestinationPinProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const scaleMultiplier = isFocused
    ? 1.38
    : hovered
      ? 1.22
      : 0.92 + node.importance * 0.06;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const bob =
        isFocused || hovered
          ? Math.sin(t * 4.2) * 0.06
          : Math.sin(t * 2.0 + node.x) * 0.02;
      groupRef.current.position.y = node.y + bob;
      groupRef.current.scale.lerp(
        new THREE.Vector3(scaleMultiplier, scaleMultiplier, scaleMultiplier),
        0.16
      );
    }
    if (beaconRef.current) {
      const pulse = 1 + Math.sin(t * 4.0) * 0.22;
      beaconRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const showLabel =
    showAllLabels ||
    hovered ||
    isFocused ||
    node.importance >= 4 ||
    node.categoryGroup === "hotel";

  return (
    <group position={[node.x, 0, node.z]}>
      {/* Ground plot pad */}
      <mesh
        position={[0, node.y - 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[0.46, 24]} />
        <meshStandardMaterial
          color={isFocused ? "#fde047" : node.color}
          transparent
          opacity={isFocused || hovered ? 0.55 : 0.25}
          roughness={0.6}
        />
      </mesh>

      {(isFocused || hovered) && (
        <mesh
          ref={beaconRef}
          position={[0, node.y + 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.48, 0.62, 32]} />
          <meshBasicMaterial
            color={isFocused ? "#fde047" : node.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
          />
        </mesh>
      )}

      {/* 3D Miniature Building / Landmark by Category */}
      <group
        ref={groupRef}
        position={[0, node.y, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        {node.categoryGroup === "hotel" && (
          <group>
            {/* Hotel podium */}
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.52, 0.24, 0.42]} />
              <meshStandardMaterial
                color={isNightMode ? "#1e293b" : "#f8fafc"}
                roughness={0.3}
              />
            </mesh>
            {/* Hotel main tower */}
            <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.38, 0.56, 0.32]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isNightMode ? 0.95 : 0.35}
                roughness={0.25}
                metalness={0.3}
              />
            </mesh>
            {/* Glowing hotel windows */}
            <mesh position={[0, 0.48, 0.165]}>
              <planeGeometry args={[0.26, 0.42]} />
              <meshBasicMaterial
                color={isNightMode ? "#fef08a" : "#e0f2fe"}
              />
            </mesh>
            {/* Rooftop crown */}
            <mesh position={[0, 0.82, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.18, 0.12, 6]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#fde047"
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
        )}

        {node.categoryGroup === "market" && (
          <group>
            {/* Night Market Paifang Archway Pillars */}
            <mesh position={[-0.2, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.56, 10]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={0.6}
              />
            </mesh>
            <mesh position={[0.2, 0.28, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.56, 10]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#dc2626"
                emissiveIntensity={0.6}
              />
            </mesh>
            {/* Archway ornate roof */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[0.58, 0.12, 0.22]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#ff5a36"
                emissiveIntensity={isNightMode ? 1.6 : 0.65}
              />
            </mesh>
            {/* Glowing red lantern in center */}
            <mesh position={[0, 0.38, 0]} castShadow>
              <sphereGeometry args={[0.12, 14, 14]} />
              <meshStandardMaterial
                color="#ff4522"
                emissive="#ff5a36"
                emissiveIntensity={isNightMode ? 2.6 : 1.1}
              />
            </mesh>
          </group>
        )}

        {node.categoryGroup === "food" && (
          <group>
            {/* Culinary pavilion base */}
            <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.24, 0.26, 0.32, 12]} />
              <meshStandardMaterial
                color={isNightMode ? "#334155" : "#fff7ed"}
                roughness={0.4}
              />
            </mesh>
            {/* Awning cone */}
            <mesh position={[0, 0.38, 0]} castShadow>
              <coneGeometry args={[0.32, 0.2, 12]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isNightMode ? 1.1 : 0.4}
              />
            </mesh>
            {/* Floating Bowl / Michelin Star */}
            <mesh position={[0, 0.58, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.08, 0.14, 16]} />
              <meshStandardMaterial
                color="#fde047"
                emissive={node.color}
                emissiveIntensity={1.2}
              />
            </mesh>
          </group>
        )}

        {node.categoryGroup === "attraction" && (
          <group>
            {/* Cultural Temple / Landmark Pedestal */}
            <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.44, 0.28, 0.44]} />
              <meshStandardMaterial
                color={isNightMode ? "#1e293b" : "#f1f5f9"}
                roughness={0.35}
              />
            </mesh>
            {/* Pagoda middle tier */}
            <mesh position={[0, 0.38, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.26, 0.24, 6]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isNightMode ? 1.1 : 0.45}
              />
            </mesh>
            {/* Star crystal top */}
            <mesh position={[0, 0.66, 0]} castShadow>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial
                color="#fde047"
                emissive="#fbbf24"
                emissiveIntensity={isNightMode ? 2.2 : 0.9}
              />
            </mesh>
          </group>
        )}

        {node.categoryGroup === "nature" && (
          <group>
            {/* Main mountain peak */}
            <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
              <coneGeometry args={[0.34, 0.64, 7]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#059669"
                emissiveIntensity={isNightMode ? 0.8 : 0.25}
                flatShading
              />
            </mesh>
            {/* Secondary peak */}
            <mesh position={[0.2, 0.22, 0.12]} castShadow>
              <coneGeometry args={[0.22, 0.44, 6]} />
              <meshStandardMaterial
                color="#34d399"
                flatShading
              />
            </mesh>
            {/* Snow/Cloud cap */}
            <mesh position={[0, 0.56, 0]}>
              <coneGeometry args={[0.13, 0.2, 7]} />
              <meshStandardMaterial
                color="#ecfdf5"
                emissive="#a7f3d0"
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        )}

        {/* Floating WorldHtml Label for this Place */}
        {showLabel && (
          <WorldHtml
            position={[0, 1.05, 0]}
            center
            distanceFactor={14}
            zIndexRange={[isFocused || hovered ? 40 : 22, 0]}
          >
            <div
              dir="rtl"
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              className={`cursor-pointer select-none rounded-2xl border px-2.5 py-1 text-right transition-all ${
                isFocused
                  ? "scale-110 border-amber-300 bg-slate-950 text-white shadow-2xl ring-2 ring-amber-400"
                  : hovered
                    ? "scale-105 border-white/60 bg-slate-900/95 text-white shadow-xl"
                    : "border-slate-900/15 bg-white/92 text-slate-900 shadow-md backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90 dark:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: node.color }}
                />
                <span className="max-w-[150px] truncate text-[11px] font-extrabold">
                  {node.place.name}
                </span>
              </div>

              {(hovered || isFocused) && (
                <div className="mt-0.5 flex items-center justify-between gap-2 whitespace-nowrap text-[10px] opacity-90">
                  <span className="font-semibold text-amber-400">
                    {node.badgeText}
                  </span>
                  <span className="text-amber-400">
                    {"★".repeat(node.importance)}
                  </span>
                </div>
              )}

              {(hovered || isFocused) &&
                (node.place.kind === "food" || node.place.kind === "hotel") &&
                node.place.priceText && (
                  <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[9.5px] font-mono text-emerald-300">
                    <span>{node.place.priceText}</span>
                    {!node.place.verified && (
                      <span className="rounded bg-amber-500/30 px-1 text-[8.5px] text-amber-200">
                        לא מאומת
                      </span>
                    )}
                  </div>
                )}
            </div>
          </WorldHtml>
        )}
      </group>
    </group>
  );
}

interface CityDestination3DSceneProps {
  cityId: CityId;
  isNightMode: boolean;
  showAllLabels: boolean;
  categoryFilter: "all" | "hotel" | "food" | "attraction" | "nature";
}

export function CityDestination3DScene({
  cityId,
  isNightMode,
  showAllLabels,
  categoryFilter,
}: CityDestination3DSceneProps) {
  const store = useTripStore();
  const bundle = useMemo(() => getCityBundle(cityId), [cityId]);
  const allNodes = useMemo(() => computeCityMapNodes(cityId), [cityId]);

  const visibleNodes = useMemo(() => {
    return allNodes.filter((n) => {
      if (!isPlaceEnabledByToggles(n.place, store.layerToggles)) return false;
      if (categoryFilter === "all") return true;
      if (categoryFilter === "hotel") return n.categoryGroup === "hotel";
      if (categoryFilter === "food")
        return n.categoryGroup === "food" || n.categoryGroup === "market";
      if (categoryFilter === "nature") return n.categoryGroup === "nature";
      if (categoryFilter === "attraction")
        return n.categoryGroup === "attraction" || n.categoryGroup === "nature";
      return true;
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
      // Keep clear of place nodes
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
            color={
              idx <= 1
                ? "#38bdf8"
                : idx <= 3
                  ? "#fb923c"
                  : "#10b981"
            }
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

      {/* 10. All Destination Place 3D Markers (Hotels, Restaurants, Markets, Attractions, Nature) */}
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

interface CityDestinationHUDProps {
  cityId: CityId;
  showAllLabels: boolean;
  onToggleAllLabels: () => void;
  categoryFilter: "all" | "hotel" | "food" | "attraction" | "nature";
  onChangeCategoryFilter: (
    filter: "all" | "hotel" | "food" | "attraction" | "nature"
  ) => void;
}

export function CityDestinationHUD({
  cityId,
  showAllLabels,
  onToggleAllLabels,
  categoryFilter,
  onChangeCategoryFilter,
}: CityDestinationHUDProps) {
  const store = useTripStore();
  const [showQuickDirectory, setShowQuickDirectory] = useState(true);
  const cities = getAllCities();
  const bundle = useMemo(() => getCityBundle(cityId), [cityId]);
  const allNodes = useMemo(() => computeCityMapNodes(cityId), [cityId]);

  const focusedNode = useMemo(
    () => allNodes.find((n) => n.place.id === store.focusedPlaceId) ?? null,
    [allNodes, store.focusedPlaceId]
  );

  const filteredDirectoryNodes = useMemo(() => {
    return allNodes.filter((n) => {
      if (categoryFilter === "all") return true;
      if (categoryFilter === "hotel") return n.categoryGroup === "hotel";
      if (categoryFilter === "food")
        return n.categoryGroup === "food" || n.categoryGroup === "market";
      if (categoryFilter === "nature") return n.categoryGroup === "nature";
      if (categoryFilter === "attraction")
        return n.categoryGroup === "attraction" || n.categoryGroup === "nature";
      return true;
    });
  }, [allNodes, categoryFilter]);

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed inset-0 z-25 flex flex-col justify-between p-3 md:p-6"
    >
      {/* Top Destination Explorer Bar */}
      <div className="flex flex-wrap items-start justify-between gap-2 pt-14 md:pt-12">
        <div className="glass-panel pointer-events-auto flex flex-wrap items-center gap-2 rounded-3xl border border-amber-400/40 p-2.5 shadow-2xl">
          <button
            type="button"
            onClick={() => tripActions.exitCityZoomMap()}
            className="toy-button flex items-center gap-1.5 rounded-2xl bg-orange-500 px-3.5 py-2 text-xs font-black text-white shadow-md hover:bg-orange-600"
          >
            <ArrowRight className="h-4 w-4" />
            <span>חזרה למפת טייוואן המלאה</span>
          </button>

          <div className="px-2">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-500" />
              <span className="font-display text-base font-black text-slate-900 dark:text-white">
                מפת יעד 3D: {bundle.city.nameHe} ({bundle.city.nameEn})
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              כל המלונות, המסעדות, שווקי הלילה והאטרקציות פרוסים בתלת-ממד
            </div>
          </div>

          {/* Quick Destination Switcher */}
          <select
            value={cityId}
            onChange={(e) =>
              tripActions.enterCityZoomMap(e.target.value as CityId)
            }
            aria-label="החלף עיר במפת יעד"
            className="rounded-2xl border border-slate-900/15 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameHe} ({c.nameEn}) {c.onRoute ? `• ${c.days} ימים` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Pills & Show All Labels Toggle inside Destination Map */}
        <div className="glass-panel pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-3xl p-2 shadow-xl">
          {(
            [
              ["all", `הכל (${allNodes.length})`, Sparkles],
              ["hotel", `מלונות (${bundle.hotels.length})`, BedDouble],
              ["food", `מסעדות ושווקים (${bundle.food.length})`, Utensils],
              [
                "attraction",
                `אטרקציות (${bundle.attractions.length})`,
                Star,
              ],
              [
                "nature",
                `טבע (${bundle.attractions.filter((a) => a.isNature).length})`,
                Trees,
              ],
            ] as const
          ).map(([val, label, Icon]) => (
            <button
              key={val}
              type="button"
              onClick={() => onChangeCategoryFilter(val)}
              className={`toy-button flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                categoryFilter === val
                  ? "bg-amber-400 text-slate-950 shadow-sm"
                  : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={onToggleAllLabels}
            className={`toy-button flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-xs font-extrabold transition-all ${
              showAllLabels
                ? "border-emerald-400 bg-emerald-500 text-white"
                : "border-transparent bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-slate-200"
            }`}
            title="הצג או הסתר תוויות שם מעל כל המקומות במפה"
          >
            {showAllLabels ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>כל השמות גלויים</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>הצג את כל השמות</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle / Bottom Area: Quick Place Directory + Focused Place Inspector Card */}
      <div className="mb-20 flex flex-col items-stretch justify-between gap-3 md:mb-16 md:flex-row md:items-end">
        {/* Right Side: Interactive Directory of All Places in Destination */}
        <div className="glass-panel pointer-events-auto flex max-h-[38vh] w-full flex-col rounded-3xl border border-white/25 p-3 shadow-2xl md:max-h-[52vh] md:w-88">
          <div className="flex items-center justify-between border-b border-slate-900/10 pb-2 dark:border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
              <Navigation className="h-3.5 w-3.5 text-orange-500" />
              <span>
                נקודות במפת {bundle.city.nameHe} ({filteredDirectoryNodes.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickDirectory((p) => !p)}
              className="rounded-xl bg-slate-900/5 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300"
            >
              {showQuickDirectory ? "מזער" : "הרחב"}
            </button>
          </div>

          {showQuickDirectory && (
            <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto pl-1">
              {filteredDirectoryNodes.map((node) => {
                const isSelected = store.focusedPlaceId === node.place.id;
                return (
                  <button
                    key={node.place.id}
                    type="button"
                    onClick={() =>
                      tripActions.focusPlace(node.place.id, cityId)
                    }
                    className={`flex w-full items-center justify-between gap-2 rounded-2xl border p-2 text-right text-xs transition-all ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/20 font-bold shadow-sm"
                        : "border-slate-900/5 bg-white/70 hover:bg-white dark:border-white/5 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="truncate font-bold text-slate-900 dark:text-white">
                          {node.place.name}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{node.badgeText}</span>
                        <span>•</span>
                        <span>~{node.approxDistanceKm} ק״מ מהמרכז</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-amber-500">
                      {"★".repeat(node.importance)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Left Side: Focused Place Inspector Card when a pin is clicked */}
        {focusedNode && (
          <div className="glass-panel pointer-events-auto w-full rounded-3xl border-2 border-amber-400/70 p-4 shadow-2xl md:w-96">
            <div className="relative mb-3 h-32 w-full overflow-hidden rounded-2xl bg-slate-900">
              <Image
                src={getPlaceImage(focusedNode.place).src}
                alt={focusedNode.place.name}
                title={getPlaceImage(focusedNode.place).attribution}
                fill
                sizes="384px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="absolute bottom-1.5 left-2 max-w-[90%] truncate rounded bg-slate-950/65 px-1.5 py-0.5 text-[9px] text-slate-200">
                {getPlaceImage(focusedNode.place).creditHe}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white"
                    style={{ backgroundColor: focusedNode.color }}
                  >
                    {focusedNode.badgeText}
                  </span>
                  <span className="text-xs font-bold text-amber-500">
                    {"★".repeat(focusedNode.importance)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ~{focusedNode.approxDistanceKm} ק״מ ממרכז {bundle.city.nameHe}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-lg font-black text-slate-900 dark:text-white">
                  {focusedNode.place.name}
                </h3>
                {focusedNode.place.nameZh && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {focusedNode.place.nameZh}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
              {focusedNode.place.description}
            </p>

            {/* Verbatim price & hours + unverified badges */}
            {(focusedNode.place.kind === "food" ||
              focusedNode.place.kind === "hotel") && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-900/5 p-2.5 text-xs dark:bg-white/5">
                {focusedNode.place.priceText && (
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {focusedNode.place.priceText}
                  </span>
                )}
                {!focusedNode.place.verified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3 w-3" />
                    לא מאומת
                  </span>
                )}
                {focusedNode.place.kind === "food" &&
                  focusedNode.place.hours && (
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      • שעות: {focusedNode.place.hours}
                    </span>
                  )}
                {focusedNode.place.kind === "food" &&
                  !focusedNode.place.hoursVerified && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      שעות: לא מאומת
                    </span>
                  )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-slate-900/10 pt-2.5 text-xs dark:border-white/10">
              <Link
                href={`/place/${focusedNode.place.id}`}
                className="rounded-xl bg-orange-500 px-3 py-1.5 font-bold text-white hover:bg-orange-600"
              >
                לעמוד המקום המלא ←
              </Link>
              <a
                href={buildGoogleMapsUrl(focusedNode.place)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>נווט</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
