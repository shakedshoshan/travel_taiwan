"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "../WorldHtml";
import { getCityBundle, type EnrichedCity } from "@/lib/data/selectors";
import { tripActions } from "@/lib/store/useTripStore";
import { triggerHapticTap } from "@/lib/haptics";
import type { CityId } from "@/data/types";

interface SingleCityPinProps {
  city: EnrichedCity;
  index: number;
  isSelected: boolean;
  isTimelineActive: boolean;
  isNightMode: boolean;
  prefersReducedMotion: boolean;
  onSelectCity: (cityId: CityId) => void;
}

export function SingleCityPin({
  city,
  index,
  isSelected,
  isTimelineActive,
  isNightMode,
  prefersReducedMotion,
  onSelectCity,
}: SingleCityPinProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const counts = useMemo(() => {
    const b = getCityBundle(city.id);
    return {
      hotels: b.hotels.length,
      food: b.food.length,
      attractions: b.attractions.length,
      total: b.hotels.length + b.food.length + b.attractions.length,
    };
  }, [city.id]);

  const isOnRoute = city.onRoute;
  const isOptionalPin = Boolean(city.optional || city.id === "kenting");
  const showPinLabel = isOnRoute || isOptionalPin || hovered || isSelected;

  const baseScale = isOnRoute ? 1.05 : isOptionalPin ? 0.92 : 0.65;
  const activeMultiplier = isSelected
    ? 1.38
    : hovered
      ? 1.22
      : isTimelineActive
        ? 1.16
        : 1.0;

  const pinScaleTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const bobOffset = prefersReducedMotion
        ? 0
        : Math.sin(t * (isOnRoute ? 2.4 : 1.6) + index * 0.85) *
          (isOnRoute ? 0.06 : 0.025);
      groupRef.current.position.y = city.worldY + 0.35 + bobOffset;

      const targetScale = baseScale * activeMultiplier;
      pinScaleTarget.set(targetScale, targetScale, targetScale);
      groupRef.current.scale.lerp(pinScaleTarget, 0.15);
    }

    if (ringRef.current && !prefersReducedMotion) {
      const pulse = 1 + Math.sin(t * 3.5 + index) * 0.16;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const pinColor = isSelected
    ? "#facc15"
    : isTimelineActive
      ? "#ff5a36"
      : isOnRoute
        ? "#ff6b4a"
        : isOptionalPin
          ? "#38bdf8"
          : isNightMode
            ? "#64748b"
            : "#94a3b8";

  const emissiveIntensity = isSelected
    ? 1.8
    : hovered
      ? 1.4
      : isTimelineActive
        ? 1.15
        : isOnRoute || isOptionalPin
          ? isNightMode
            ? 0.9
            : 0.48
          : 0.12;

  const handlePinSelect = () => {
    triggerHapticTap();
    if (isSelected) {
      tripActions.enterCityZoomMap(city.id);
    } else {
      onSelectCity(city.id);
    }
  };

  return (
    <group position={[city.worldX, 0, city.worldZ]}>
      {/* Ground target ring on the island surface */}
      {(isOnRoute || isOptionalPin) && (
        <mesh
          ref={ringRef}
          position={[0, city.worldY + 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.18, 0.28, 28]} />
          <meshBasicMaterial
            color={
              isSelected || isTimelineActive
                ? "#facc15"
                : isOptionalPin
                  ? "#38bdf8"
                  : "#ff5a36"
            }
            transparent
            opacity={isSelected || hovered ? 0.95 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating 3D Pin + Child Label (same world position, <=12px screen-space offset above pin) */}
      <group
        ref={groupRef}
        position={[0, city.worldY + 0.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handlePinSelect();
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
        {/* Invisible >=44px equivalent 3D hit sphere for outdoor touch accuracy */}
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.56, 10, 10]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* Pin stem cone pointing down */}
        <mesh position={[0, -0.14, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.12, 0.28, 16]} />
          <meshStandardMaterial
            color={pinColor}
            emissive={pinColor}
            emissiveIntensity={emissiveIntensity * 0.6}
            roughness={0.28}
            metalness={0.2}
            transparent={!isOnRoute && !isOptionalPin}
            opacity={isOnRoute || isOptionalPin ? 1 : 0.68}
          />
        </mesh>

        {/* Pin head sphere */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial
            color={pinColor}
            emissive={pinColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.22}
            metalness={0.25}
            transparent={!isOnRoute && !isOptionalPin}
            opacity={isOnRoute || isOptionalPin ? 1 : 0.72}
          />
        </mesh>

        {/* Inner white jewel */}
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* City Label rendered directly as a child of its pin's group */}
        {showPinLabel && (
          <WorldHtml
            position={[0, 0.2, 0]}
            anchor="bottom"
            screenOffset={[0, -6]}
            clampToViewport
            avoidOverlap
            overlapLocked
            zIndexRange={[isSelected || hovered ? 32 : 20, 0]}
          >
            <div dir="rtl" className="flex flex-col items-center">
              <button
                type="button"
                aria-label={`${city.nameHe} (${city.nameEn})${
                  city.onRoute
                    ? ` – ${city.days} ימים במסלול`
                    : isOptionalPin
                      ? " – יעד אופציונלי"
                      : ""
                }`}
                title={`${city.nameHe} (${city.nameEn})`}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHapticTap();
                  onSelectCity(city.id);
                }}
                className={`relative flex min-h-[44px] min-w-[44px] cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-full px-3 text-[13px] font-bold shadow-lg transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  isSelected
                    ? "scale-105 bg-amber-400 text-slate-950 ring-2 ring-white"
                    : hovered
                      ? "scale-105 bg-slate-900 text-white ring-2 ring-amber-400"
                      : isTimelineActive
                        ? "bg-orange-500 text-white ring-1 ring-white/90"
                        : isOptionalPin
                          ? "border-2 border-dashed border-sky-400 bg-slate-900/90 text-sky-100"
                          : isOnRoute
                            ? "border border-slate-900/15 bg-white/95 text-slate-900 backdrop-blur-md dark:border-white/25 dark:bg-slate-900/95 dark:text-white"
                            : "bg-slate-900/90 text-slate-100"
                }`}
              >
                { city.nameHe }
              </button>

              {(hovered || isSelected) && (
                <div className="mt-1 flex flex-col items-center gap-1 rounded-2xl border border-white/20 bg-slate-950/95 px-2.5 py-1.5 text-[10px] text-white shadow-xl backdrop-blur-md">
                  <div className="whitespace-nowrap font-bold text-amber-300">
                    {city.nameHe} ({city.nameEn})
                  </div>
                  <div className="whitespace-nowrap text-[9.5px] text-slate-200">
                    {city.onRoute
                      ? `${city.days} ימים • ${city.dates.join(" | ")}`
                      : city.note ?? "מחוץ לציר הלינה הראשי • לחצו לפתיחה"}
                  </div>
                  {counts.total > 0 && (
                    <div className="flex items-center gap-2 border-t border-white/15 pt-1 text-[9.5px] font-bold">
                      <span>
                        🏨 {counts.hotels} • 🍜 {counts.food} • ★{" "}
                        {counts.attractions}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticTap();
                          tripActions.enterCityZoomMap(city.id);
                        }}
                        className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-950 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        זום 3D 🔍
                      </button>
                    </div>
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
