"use client";

import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToWorld3D } from "@/lib/data/coordinates";
import { getAllCities, getRouteLegs, getTimelineDays } from "@/lib/data/selectors";
import { shouldSkipLandmarks } from "@/lib/devicePower";
import { tripActions, useTripStore } from "@/lib/store/useTripStore";
import { WorldHtml } from "./WorldHtml";

const LandmarkDioramas = lazy(() =>
  import("./delight/LandmarkDioramas").then((mod) => ({
    default: mod.LandmarkDioramas,
  }))
);

interface DelightDetailsProps {
  isNightMode: boolean;
}

export function DelightDetails({ isNightMode }: DelightDetailsProps) {
  const store = useTripStore();
  const cloudsGroupRef = useRef<THREE.Group>(null);
  const lanternsGroupRef = useRef<THREE.Group>(null);
  const landmarksRootRef = useRef<THREE.Group>(null);
  const ropewayCarRef = useRef<THREE.Mesh>(null);
  const smlBoatRef = useRef<THREE.Group>(null);
  const alishanTrainRef = useRef<THREE.Group>(null);
  const lighthouseBeamRef = useRef<THREE.Mesh>(null);
  const travelerRef = useRef<THREE.Group>(null);
  const playAccumRef = useRef<number>(0);
  const landmarksOnRef = useRef(false);
  const [landmarksOn, setLandmarksOn] = useState(false);
  const skipLandmarks = shouldSkipLandmarks(store.prefersReducedMotion);

  // Key landmark world coordinates
  const landmarks = useMemo(() => {
    const taipei101 = latLngToWorld3D(25.0339, 121.5645, 0);
    const smlLake = latLngToWorld3D(23.862, 120.912, 0.02);
    const smlRopewayTop = latLngToWorld3D(23.869, 120.942, 0.35);
    const alishanCenter = latLngToWorld3D(23.512, 120.808, 0.06);
    const domeOfLight = latLngToWorld3D(22.6314, 120.3019, 0.04);
    const eluanbiLighthouse = latLngToWorld3D(21.9024, 120.8526, 0.02);

    return {
      taipei101,
      smlLake,
      smlRopewayTop,
      alishanCenter,
      domeOfLight,
      eluanbiLighthouse,
    };
  }, []);

  // Build smooth 3D curve across the 10 route legs for Traveler "Play" animation
  const routeCurve = useMemo(() => {
    const legs = getRouteLegs();
    const cities = getAllCities();
    const cityMap = new Map(cities.map((c) => [c.id, c]));
    const pts = legs.map((leg) => {
      const c = cityMap.get(leg.cityId) ?? cities[0];
      return new THREE.Vector3(c.worldX, c.worldY + 0.45, c.worldZ);
    });
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.35);
  }, []);

  // Generate sky lanterns (Pingxi/Jiufen + major night market cities)
  const skyLanterns = useMemo(() => {
    const origins = [
      [25.04, 121.74], // Pingxi / Shifen
      [25.1, 121.84], // Jiufen
      [25.05, 121.52], // Taipei Raohe / Ningxia
      [24.18, 120.64], // Taichung Fengchia
      [23.0, 120.2], // Tainan Garden Market
      [22.66, 120.3], // Kaohsiung Ruifeng
      [23.99, 121.61], // Hualien Dongdamen
    ];

    return Array.from({ length: 24 }, (_, idx) => {
      const [baseLat, baseLng] = origins[idx % origins.length];
      const lat = baseLat + Math.sin(idx * 2.1) * 0.08;
      const lng = baseLng + Math.cos(idx * 1.7) * 0.08;
      const basePos = latLngToWorld3D(lat, lng, 0.4);
      return {
        id: idx,
        x: basePos.x,
        baseY: basePos.y,
        z: basePos.z,
        speed: 0.22 + (idx % 5) * 0.06,
        phase: idx * 0.85,
      };
    });
  }, []);

  // Generate fluffy low-poly mountain clouds over the Central Mountain Range
  const mountainClouds = useMemo(() => {
    const cloudCoords = [
      [24.42, 121.32],
      [24.12, 121.22],
      [23.78, 121.08],
      [23.48, 120.92],
      [23.18, 121.02],
      [22.75, 120.82],
    ];
    return cloudCoords.map(([lat, lng], idx) => {
      const pos = latLngToWorld3D(lat, lng, 1.45 + (idx % 2) * 0.2);
      return {
        id: idx,
        baseX: pos.x,
        baseY: pos.y,
        baseZ: pos.z,
        scale: 0.58 + (idx % 3) * 0.08,
        phase: idx * 1.3,
      };
    });
  }, []);

  const days = getTimelineDays();
  const currentDay = days[store.currentDayIndex] ?? days[0];

  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime();

    const showLandmarks = !skipLandmarks && camera.position.length() < 18;
    if (showLandmarks !== landmarksOnRef.current) {
      landmarksOnRef.current = showLandmarks;
      setLandmarksOn(showLandmarks);
    }

    // Traveler route playback animation (P1 #10)
    if (store.isRoutePlaying) {
      playAccumRef.current += delta;
      if (playAccumRef.current >= 0.45) {
        playAccumRef.current = 0;
        const nextIdx = store.currentDayIndex + 1;
        if (nextIdx >= days.length) {
          tripActions.setCurrentDayIndex(0);
          tripActions.setRoutePlaying(false);
        } else {
          tripActions.setCurrentDayIndex(nextIdx);
        }
      }
    }

    if (travelerRef.current) {
      const progress = THREE.MathUtils.clamp(
        store.currentDayIndex / Math.max(1, days.length - 1),
        0,
        1
      );
      const pt = routeCurve.getPointAt(progress);
      const bob = store.prefersReducedMotion ? 0 : Math.sin(t * 5.0) * 0.08;
      travelerRef.current.position.set(pt.x, pt.y + 0.32 + bob, pt.z);
      travelerRef.current.rotation.y = t * 1.8;
    }

    if (store.prefersReducedMotion) return;

    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.children.forEach((child, idx) => {
        const meta = mountainClouds[idx];
        if (!meta) return;
        child.position.x = meta.baseX + Math.sin(t * 0.35 + meta.phase) * 0.35;
        child.position.y = meta.baseY + Math.cos(t * 0.6 + meta.phase) * 0.06;
      });
    }

    if (lanternsGroupRef.current) {
      lanternsGroupRef.current.children.forEach((child, idx) => {
        const l = skyLanterns[idx];
        if (!l) return;
        const cycle = (t * l.speed + l.phase) % 2.4;
        child.position.set(
          l.x + Math.sin(t * 0.9 + l.phase) * 0.12,
          l.baseY + cycle,
          l.z + Math.cos(t * 0.8 + l.phase) * 0.12
        );
        const s = cycle < 2.0 ? 1 : Math.max(0.01, (2.4 - cycle) * 2.5);
        child.scale.setScalar(s);
      });
    }

    if (ropewayCarRef.current) {
      const alpha = (Math.sin(t * 1.2) + 1) * 0.5;
      ropewayCarRef.current.position.lerpVectors(
        new THREE.Vector3(
          landmarks.smlLake.x,
          landmarks.smlLake.y + 0.18,
          landmarks.smlLake.z
        ),
        new THREE.Vector3(
          landmarks.smlRopewayTop.x,
          landmarks.smlRopewayTop.y + 0.18,
          landmarks.smlRopewayTop.z
        ),
        alpha
      );
    }

    if (smlBoatRef.current) {
      const boatAngle = t * 0.85;
      const boatRadius = 0.48;
      smlBoatRef.current.position.set(
        landmarks.smlLake.x + 0.72 + Math.cos(boatAngle) * boatRadius,
        landmarks.smlLake.y + 0.64,
        landmarks.smlLake.z + 0.06 + Math.sin(boatAngle) * boatRadius * 0.7
      );
      smlBoatRef.current.rotation.y = -boatAngle;
    }

    if (alishanTrainRef.current) {
      const angle = t * 1.35;
      const radius = 0.24;
      const cx = landmarks.alishanCenter.x;
      const cy = landmarks.alishanCenter.y;
      const cz = landmarks.alishanCenter.z;
      alishanTrainRef.current.position.set(
        cx + Math.cos(angle) * radius,
        cy + 0.04,
        cz + Math.sin(angle) * radius
      );
      alishanTrainRef.current.rotation.y = -angle;
    }

    if (lighthouseBeamRef.current) {
      lighthouseBeamRef.current.rotation.z = t * 1.6;
    }
  });

  return (
    <group name="delight-details">
      <Suspense fallback={null}>
          <LandmarkDioramas
            isNightMode={isNightMode}
            landmarks={landmarks}
            landmarksRootRef={landmarksRootRef}
            ropewayCarRef={ropewayCarRef}
            smlBoatRef={smlBoatRef}
            alishanTrainRef={alishanTrainRef}
            lighthouseBeamRef={lighthouseBeamRef}
            waterOnly={!landmarksOn}
          />
        </Suspense>

      {/* Traveler Avatar along the Route on "Play" */}
      {store.isRoutePlaying && (
        <group ref={travelerRef} name="route-traveler-avatar">
          <mesh position={[0, 0.12, 0]} castShadow>
            <octahedronGeometry args={[0.2, 1]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#ff5a36"
              emissiveIntensity={2.5}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.36, 24]} />
            <meshBasicMaterial
              color="#fde047"
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
          <WorldHtml
            position={[0, 0.34, 0]}
            anchor="bottom"
            screenOffset={[0, -6]}
            clampToViewport
            zIndexRange={[36, 0]}
          >
            <div
              dir="rtl"
              className="pointer-events-none select-none whitespace-nowrap rounded-full border border-white bg-gradient-to-l from-orange-500 to-amber-500 px-2.5 py-0.5 text-[10px] font-black text-slate-950 shadow-xl"
            >
              🎒 יום {currentDay.dayNumber}: {currentDay.cityNameHe}
            </div>
          </WorldHtml>
        </group>
      )}

      {/* Floating Sky Lanterns (Pingxi & Night Markets) */}
      <group ref={lanternsGroupRef} name="sky-lanterns">
        {skyLanterns.map((l) => (
          <mesh key={`lantern-${l.id}`} position={[l.x, l.baseY, l.z]}>
            <cylinderGeometry args={[0.05, 0.035, 0.11, 8]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#ff5a36"
              emissiveIntensity={isNightMode ? 3.2 : 1.3}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Drifting Mountain Clouds over the Central Mountain Range (visible only when zoomed in) */}
      <group ref={cloudsGroupRef} name="mountain-clouds" visible={false}>
        {mountainClouds.map((c) => (
          <group
            key={`cloud-${c.id}`}
            position={[c.baseX, c.baseY, c.baseZ]}
            scale={c.scale}
          >
            <mesh position={[0, 0, 0]}>
              <dodecahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial
                color={isNightMode ? "#64748b" : "#f8fafc"}
                transparent
                opacity={isNightMode ? 0.4 : 0.58}
                roughness={1}
                depthWrite={false}
                flatShading
              />
            </mesh>
            <mesh position={[0.14, -0.03, 0.04]}>
              <dodecahedronGeometry args={[0.11, 0]} />
              <meshStandardMaterial
                color={isNightMode ? "#64748b" : "#f8fafc"}
                transparent
                opacity={isNightMode ? 0.4 : 0.58}
                roughness={1}
                depthWrite={false}
                flatShading
              />
            </mesh>
            <mesh position={[-0.12, -0.02, -0.03]}>
              <dodecahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial
                color={isNightMode ? "#64748b" : "#f8fafc"}
                transparent
                opacity={isNightMode ? 0.4 : 0.58}
                roughness={1}
                depthWrite={false}
                flatShading
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
