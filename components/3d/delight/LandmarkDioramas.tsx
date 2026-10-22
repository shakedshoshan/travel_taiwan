"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

interface LandmarkDioramasProps {
  isNightMode: boolean;
  landmarks: {
    taipei101: { x: number; y: number; z: number };
    smlLake: { x: number; y: number; z: number };
    smlRopewayTop: { x: number; y: number; z: number };
    alishanCenter: { x: number; y: number; z: number };
  };
  ropewayCarRef: RefObject<THREE.Mesh | null>;
  alishanTrainRef: RefObject<THREE.Group | null>;
}

export function LandmarkDioramas({
  isNightMode,
  landmarks,
  ropewayCarRef,
  alishanTrainRef,
}: LandmarkDioramasProps) {
  const ropewayLineGeo = useMemo(() => {
    const start = new THREE.Vector3(
      landmarks.smlLake.x,
      landmarks.smlLake.y + 0.22,
      landmarks.smlLake.z
    );
    const end = new THREE.Vector3(
      landmarks.smlRopewayTop.x,
      landmarks.smlRopewayTop.y + 0.22,
      landmarks.smlRopewayTop.z
    );
    const curve = new THREE.LineCurve3(start, end);
    return new THREE.TubeGeometry(curve, 8, 0.012, 6, false);
  }, [landmarks]);

  return (
    <>
      {/* 1. Mini Taipei 101 Bamboo-Tiered Tower */}
      <group
        position={[
          landmarks.taipei101.x + 0.18,
          landmarks.taipei101.y,
          landmarks.taipei101.z - 0.12,
        ]}
      >
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.24, 0.2, 0.24]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={isNightMode ? 1.2 : 0.35}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
        {[0, 1, 2, 3, 4].map((tier) => (
          <mesh
            key={`t101-tier-${tier}`}
            position={[0, 0.26 + tier * 0.14, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.11, 0.085, 0.13, 4]} />
            <meshStandardMaterial
              color="#2dd4bf"
              emissive={isNightMode ? "#38bdf8" : "#0d9488"}
              emissiveIntensity={isNightMode ? 1.6 : 0.4}
              roughness={0.18}
              metalness={0.55}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.012, 0.03, 0.26, 8]} />
          <meshStandardMaterial
            color="#fde047"
            emissive="#fde047"
            emissiveIntensity={isNightMode ? 2.8 : 1.0}
          />
        </mesh>
      </group>

      {/* 2. Sun Moon Lake Water Surface + Ropeway Cable Car */}
      <group name="sun-moon-lake-delight">
        <mesh
          position={[
            landmarks.smlLake.x,
            landmarks.smlLake.y + 0.52,
            landmarks.smlLake.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={3}
        >
          <circleGeometry args={[0.88, 40]} />
          {isNightMode ? (
            <meshStandardMaterial
              color="#7ef3ff"
              emissive="#cffafe"
              emissiveIntensity={0.85}
              roughness={0.22}
              metalness={0.04}
            />
          ) : (
            <meshBasicMaterial color="#1ad4f2" />
          )}
        </mesh>
        <mesh
          position={[
            landmarks.smlLake.x,
            landmarks.smlLake.y + 0.5,
            landmarks.smlLake.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={3}
        >
          <ringGeometry args={[0.78, 1.02, 40]} />
          <meshBasicMaterial
            color={isNightMode ? "#e7fbff" : "#f4fdff"}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <mesh geometry={ropewayLineGeo}>
          <meshBasicMaterial color="#e2e8f0" />
        </mesh>

        <mesh ref={ropewayCarRef} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.09]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#f43f5e"
            emissiveIntensity={isNightMode ? 1.8 : 0.6}
          />
        </mesh>
      </group>

      {/* 3. Alishan Forest Railway Red Train + Track Ring */}
      <group name="alishan-train-delight">
        <mesh
          position={[
            landmarks.alishanCenter.x,
            landmarks.alishanCenter.y + 0.01,
            landmarks.alishanCenter.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.23, 0.28, 28]} />
          <meshBasicMaterial
            color="#78350f"
            side={THREE.DoubleSide}
            transparent
            opacity={0.75}
          />
        </mesh>

        <group ref={alishanTrainRef}>
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.09, 0.18]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={isNightMode ? 1.5 : 0.4}
            />
          </mesh>
          <mesh position={[0, 0.07, 0.05]}>
            <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      </group>
    </>
  );
}
