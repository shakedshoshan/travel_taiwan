"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToWorld3D } from "@/lib/data/coordinates";
import { useTripStore } from "@/lib/store/useTripStore";
import { LandmarkDioramas } from "./delight/LandmarkDioramas";

interface DelightDetailsProps {
  isNightMode: boolean;
}

export function DelightDetails({ isNightMode }: DelightDetailsProps) {
  const store = useTripStore();
  const cloudsGroupRef = useRef<THREE.Group>(null);
  const lanternsGroupRef = useRef<THREE.Group>(null);
  const ropewayCarRef = useRef<THREE.Mesh>(null);
  const alishanTrainRef = useRef<THREE.Group>(null);

  // Key landmark world coordinates
  const landmarks = useMemo(() => {
    const taipei101 = latLngToWorld3D(25.0339, 121.5645, 0);
    const smlLake = latLngToWorld3D(23.862, 120.912, 0.02);
    const smlRopewayTop = latLngToWorld3D(23.869, 120.942, 0.35);
    const alishanCenter = latLngToWorld3D(23.512, 120.808, 0.06);
    const pingxiSky = latLngToWorld3D(25.025, 121.74, 0.25);

    return {
      taipei101,
      smlLake,
      smlRopewayTop,
      alishanCenter,
      pingxiSky,
    };
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

  useFrame(({ clock }) => {
    if (store.prefersReducedMotion) return;
    const t = clock.getElapsedTime();

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

    if (alishanTrainRef.current) {
      const angle = t * 1.35;
      const radius = 0.26;
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
  });

  return (
    <group name="delight-details">
      <LandmarkDioramas
        isNightMode={isNightMode}
        landmarks={landmarks}
        ropewayCarRef={ropewayCarRef}
        alishanTrainRef={alishanTrainRef}
      />

      {/* 4. Floating Sky Lanterns (Pingxi & Night Markets) */}
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

      {/* 5. Drifting Mountain Clouds over the Central Mountain Range */}
      <group ref={cloudsGroupRef} name="mountain-clouds">
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
