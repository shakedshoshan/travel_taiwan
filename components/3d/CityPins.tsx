"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "./WorldHtml";
import { getAllCities, type EnrichedCity } from "@/lib/data/selectors";
import type { CityId } from "@/data/types";

interface CityPinsProps {
  selectedCityId: CityId | null;
  activeTimelineCityId: CityId;
  isNightMode: boolean;
  onSelectCity: (cityId: CityId) => void;
}

interface SingleCityPinProps {
  city: EnrichedCity;
  index: number;
  isSelected: boolean;
  isTimelineActive: boolean;
  isNightMode: boolean;
  onSelectCity: (cityId: CityId) => void;
}

function SingleCityPin({
  city,
  index,
  isSelected,
  isTimelineActive,
  isNightMode,
  onSelectCity,
}: SingleCityPinProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const isOnRoute = city.onRoute;
  const baseScale = isOnRoute ? 1.05 : 0.62;
  const activeMultiplier = isSelected ? 1.38 : hovered ? 1.22 : isTimelineActive ? 1.16 : 1.0;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const bobOffset =
        Math.sin(t * (isOnRoute ? 2.4 : 1.6) + index * 0.85) *
        (isOnRoute ? 0.08 : 0.035);
      groupRef.current.position.y = city.worldY + 0.35 + bobOffset;

      const targetScale = baseScale * activeMultiplier;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
    }

    if (ringRef.current) {
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
        : isNightMode
          ? "#64748b"
          : "#94a3b8";

  const emissiveIntensity = isSelected
    ? 1.8
    : hovered
      ? 1.4
      : isTimelineActive
        ? 1.15
        : isOnRoute
          ? isNightMode
            ? 0.9
            : 0.45
          : 0.12;

  return (
    <group position={[city.worldX, 0, city.worldZ]}>
      {/* Ground target ring on the island surface */}
      {isOnRoute && (
        <mesh
          ref={ringRef}
          position={[0, city.worldY + 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.18, 0.28, 28]} />
          <meshBasicMaterial
            color={isSelected || isTimelineActive ? "#facc15" : "#ff5a36"}
            transparent
            opacity={isSelected || hovered ? 0.95 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Floating 3D Pin */}
      <group
        ref={groupRef}
        position={[0, city.worldY + 0.35, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCity(city.id);
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
        {/* Pin stem cone pointing down */}
        <mesh position={[0, -0.14, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.12, 0.28, 16]} />
          <meshStandardMaterial
            color={pinColor}
            emissive={pinColor}
            emissiveIntensity={emissiveIntensity * 0.6}
            roughness={0.28}
            metalness={0.2}
            transparent={!isOnRoute}
            opacity={isOnRoute ? 1 : 0.68}
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
            transparent={!isOnRoute}
            opacity={isOnRoute ? 1 : 0.72}
          />
        </mesh>

        {/* Inner white jewel */}
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Persistent label for on-route cities or hover tooltip for any city */}
        {(isOnRoute || hovered || isSelected) && (
          <WorldHtml
            position={[0, 0.34, 0]}
            center
            distanceFactor={16}
            zIndexRange={[20, 0]}
          >
            <div
              dir="rtl"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCity(city.id);
              }}
              className={`cursor-pointer select-none whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-lg transition-all ${
                isSelected
                  ? "scale-110 bg-amber-400 text-slate-950 ring-2 ring-white"
                  : hovered
                    ? "scale-105 bg-slate-900/95 text-white ring-2 ring-amber-400"
                    : isTimelineActive
                      ? "bg-orange-500 text-white ring-1 ring-white/80"
                      : isOnRoute
                        ? "bg-white/90 text-slate-900 backdrop-blur-md dark:bg-slate-900/90 dark:text-white"
                        : "bg-slate-800/80 text-slate-200"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {city.routeOrder && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950/15 px-1 text-[10px] font-extrabold dark:bg-white/20">
                    {city.routeOrder.join(",")}
                  </span>
                )}
                <span>{city.nameHe}</span>
                {(hovered || isSelected) && (
                  <span className="text-[10px] font-normal opacity-80">
                    {city.nameEn}
                  </span>
                )}
              </div>
              {hovered && (
                <div className="mt-0.5 text-[10px] font-medium opacity-90">
                  {city.onRoute
                    ? `${city.days} ימים • ${city.dates.join(" | ")}`
                    : "מחוץ לציר הלינה הראשי • לחצו לפתיחה"}
                </div>
              )}
            </div>
          </WorldHtml>
        )}
      </group>
    </group>
  );
}

export function CityPins({
  selectedCityId,
  activeTimelineCityId,
  isNightMode,
  onSelectCity,
}: CityPinsProps) {
  const cities = getAllCities();

  return (
    <group name="city-pins">
      {cities.map((city, idx) => (
        <SingleCityPin
          key={city.id}
          city={city}
          index={idx}
          isSelected={selectedCityId === city.id}
          isTimelineActive={activeTimelineCityId === city.id}
          isNightMode={isNightMode}
          onSelectCity={onSelectCity}
        />
      ))}
    </group>
  );
}
