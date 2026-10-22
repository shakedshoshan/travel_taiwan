"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "../WorldHtml";
import { triggerHapticTap } from "@/lib/haptics";
import type { CityMapNode } from "./cityMapLayout";
import { DestinationPinModels } from "./DestinationPinModels";

interface SingleDestinationPinProps {
  node: CityMapNode;
  isFocused: boolean;
  isNightMode: boolean;
  showAllLabels: boolean;
  onSelectNode: (node: CityMapNode) => void;
}

export function SingleDestinationPin({
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
          triggerHapticTap();
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
        <DestinationPinModels node={node} isNightMode={isNightMode} />

        {/* Floating WorldHtml Label for this Place */}
        {showLabel && (
          <WorldHtml
            position={[0, 1.05, 0]}
            anchor="bottom"
            screenOffset={[0, -6]}
            clampToViewport
            distanceFactor={14}
            zIndexRange={[isFocused || hovered ? 40 : 22, 0]}
          >
            <button
              type="button"
              dir="rtl"
              aria-label={`${node.place.name} (${node.badgeText})`}
              title={node.place.name}
              onClick={(e) => {
                e.stopPropagation();
                triggerHapticTap();
                onSelectNode(node);
              }}
              className={`cursor-pointer select-none rounded-2xl border px-2.5 py-1 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                isFocused
                  ? "scale-110 border-amber-300 bg-slate-950 text-white shadow-2xl ring-2 ring-amber-400"
                  : hovered
                    ? "scale-105 border-white/60 bg-slate-900/95 text-white shadow-xl"
                    : "border-slate-900/15 bg-white/95 text-slate-900 shadow-md backdrop-blur-md dark:border-white/25 dark:bg-slate-900/95 dark:text-white"
              }`}
            >
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: node.color }}
                />
                <span className="max-w-[140px] truncate text-[11px] font-extrabold">
                  {node.place.name}
                </span>
              </div>

              {(hovered || isFocused) && (
                <div className="mt-0.5 flex flex-col gap-0.5 whitespace-nowrap text-[10px] opacity-95">
                  <div className="font-bold text-white">{node.place.name}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-400">
                      {node.badgeText}
                    </span>
                    <span className="text-amber-400">
                      {"★".repeat(node.importance)}
                    </span>
                  </div>
                </div>
              )}

              {(hovered || isFocused) &&
                (node.place.kind === "food" || node.place.kind === "hotel") &&
                node.place.priceText && (
                  <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap font-mono text-[9.5px] text-emerald-300">
                    <span>{node.place.priceText}</span>
                    {!node.place.verified && (
                      <span className="rounded bg-amber-500/30 px-1 text-[8.5px] text-amber-200">
                        לא מאומת
                      </span>
                    )}
                  </div>
                )}
            </button>
          </WorldHtml>
        )}
      </group>
    </group>
  );
}
