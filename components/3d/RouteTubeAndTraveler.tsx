"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldHtml } from "./WorldHtml";
import {
  getCityById,
  getRouteLegs,
  type TimelineDay,
} from "@/lib/data/selectors";
import { latLngToWorld3D } from "@/lib/data/coordinates";

interface RouteTubeAndTravelerProps {
  currentDay: TimelineDay;
  isNightMode: boolean;
}

export function RouteTubeAndTraveler({
  currentDay,
  isNightMode,
}: RouteTubeAndTravelerProps) {
  const travelerRef = useRef<THREE.Group>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const smoothProgress = useRef(currentDay.routeProgress);

  // Compute the invisible motion curve connecting the 10 legs so the traveler can still animate between cities
  // without rendering any orange route tube line over the island.
  const curve = useMemo(() => {
    const legs = getRouteLegs();
    const stopPoints: THREE.Vector3[] = [];

    for (const leg of legs) {
      const city = getCityById(leg.cityId);
      stopPoints.push(
        new THREE.Vector3(city.worldX, city.worldY + 0.22, city.worldZ)
      );
    }

    const waypointsLatLng: Array<Array<[number, number, number]>> = [
      [
        [24.92, 121.78, 0.3],
        [24.42, 121.76, 0.32],
      ],
      [[23.38, 121.35, 0.32]],
      [
        [22.32, 120.76, 0.28],
        [22.52, 120.48, 0.25],
      ],
      [[22.81, 120.25, 0.24]],
      [[23.42, 120.52, 0.35]],
      [[23.68, 120.88, 0.42]],
      [
        [24.15, 120.76, 0.34],
        [24.68, 120.98, 0.34],
      ],
      [[24.75, 120.82, 0.28]],
      [[24.58, 120.92, 0.38]],
    ];

    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i < stopPoints.length; i++) {
      curvePoints.push(stopPoints[i]);
      if (i < waypointsLatLng.length) {
        for (const [lat, lng, extraY] of waypointsLatLng[i]) {
          const w = latLngToWorld3D(lat, lng, extraY);
          curvePoints.push(new THREE.Vector3(w.x, w.y, w.z));
        }
      }
    }

    return new THREE.CatmullRomCurve3(
      curvePoints,
      false,
      "catmullrom",
      0.45
    );
  }, []);

  useFrame(({ clock }, delta) => {
    smoothProgress.current = THREE.MathUtils.lerp(
      smoothProgress.current,
      currentDay.routeProgress,
      Math.min(1, delta * 6.5)
    );

    const t = Math.max(0.001, Math.min(0.999, smoothProgress.current));
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    if (travelerRef.current) {
      const hoverBob = Math.sin(clock.getElapsedTime() * 5.0) * 0.03;
      travelerRef.current.position.set(
        point.x,
        point.y + 0.14 + hoverBob,
        point.z
      );

      const lookTarget = point.clone().add(tangent);
      lookTarget.y = travelerRef.current.position.y;
      travelerRef.current.lookAt(lookTarget);
    }

    if (pulseRingRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4.5) * 0.25;
      pulseRingRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group name="traveler-marker">
      {/* Animated Traveler (Miniature High-Speed Train / Scooter Capsule) */}
      <group ref={travelerRef}>
        {/* Pulsing halo beneath traveler */}
        <mesh
          ref={pulseRingRef}
          position={[0, -0.09, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.16, 0.28, 24]} />
          <meshBasicMaterial
            color="#fde047"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Train/Scooter body */}
        <mesh castShadow position={[0, 0.04, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.44]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fb923c"
            emissiveIntensity={isNightMode ? 0.9 : 0.35}
            roughness={0.2}
          />
        </mesh>

        {/* Taiwan HSR nose stripe */}
        <mesh castShadow position={[0, 0.05, 0.14]}>
          <boxGeometry args={[0.23, 0.08, 0.2]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={isNightMode ? 1.4 : 0.5}
          />
        </mesh>

        {/* Cockpit window */}
        <mesh position={[0, 0.09, 0.16]}>
          <boxGeometry args={[0.18, 0.06, 0.12]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.2}
          />
        </mesh>

        {/* Floating Day Badge on Traveler */}
        <WorldHtml
          position={[0, 0.42, 0]}
          center
          distanceFactor={15}
          zIndexRange={[25, 0]}
        >
          <div
            dir="rtl"
            className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-300/80 bg-slate-950/90 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 shadow-lg backdrop-blur-md"
          >
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-amber-400" />
            <span>יום {currentDay.dayNumber}</span>
            <span className="text-white">({currentDay.dateShort})</span>
          </div>
        </WorldHtml>
      </group>
    </group>
  );
}
