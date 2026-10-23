"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

export interface LandmarkWorldPositions {
  taipei101: { x: number; y: number; z: number };
  smlLake: { x: number; y: number; z: number };
  smlRopewayTop: { x: number; y: number; z: number };
  alishanCenter: { x: number; y: number; z: number };
  domeOfLight: { x: number; y: number; z: number };
  eluanbiLighthouse: { x: number; y: number; z: number };
}

interface LandmarkDioramasProps {
  isNightMode: boolean;
  landmarks: LandmarkWorldPositions;
  landmarksRootRef: RefObject<THREE.Group | null>;
  ropewayCarRef: RefObject<THREE.Mesh | null>;
  smlBoatRef: RefObject<THREE.Group | null>;
  alishanTrainRef: RefObject<THREE.Group | null>;
  lighthouseBeamRef: RefObject<THREE.Mesh | null>;
  waterOnly?: boolean;
}

export function LandmarkDioramas({
  isNightMode,
  landmarks,
  landmarksRootRef,
  ropewayCarRef,
  smlBoatRef,
  alishanTrainRef,
  lighthouseBeamRef,
  waterOnly = false,
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
    <group ref={landmarksRootRef} name="landmark-dioramas">
      {!waterOnly && (
      <>
      {/* 1. Mini Taipei 101 Bamboo-Tiered Tower */}
      <group
        name="landmark-taipei-101"
        position={[
          landmarks.taipei101.x + 0.16,
          landmarks.taipei101.y,
          landmarks.taipei101.z - 0.1,
        ]}
      >
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.22, 0.2, 0.22]} />
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
            position={[0, 0.25 + tier * 0.13, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.08, 0.12, 4]} />
            <meshStandardMaterial
              color="#2dd4bf"
              emissive={isNightMode ? "#38bdf8" : "#0d9488"}
              emissiveIntensity={isNightMode ? 1.6 : 0.4}
              roughness={0.18}
              metalness={0.55}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.012, 0.028, 0.24, 8]} />
          <meshStandardMaterial
            color="#fde047"
            emissive="#fde047"
            emissiveIntensity={isNightMode ? 2.8 : 1.0}
          />
        </mesh>
      </group>
      </>
      )}

      {/* 2. Sun Moon Lake Water Surface + Gliding Boat + Ropeway Cable Car */}
      <group name="landmark-sun-moon-lake">
        <mesh
          position={[
            landmarks.smlLake.x + 0.72,
            landmarks.smlLake.y + 0.62,
            landmarks.smlLake.z + 0.06,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.22, 0.86, 1]}
          renderOrder={4}
        >
          <circleGeometry args={[0.92, 36]} />
          {isNightMode ? (
            <meshStandardMaterial
              color="#5eefff"
              emissive="#e0fbff"
              emissiveIntensity={0.9}
              roughness={0.2}
              metalness={0.02}
              depthTest={false}
              depthWrite={false}
            />
          ) : (
            <meshBasicMaterial
              color="#12d8f6"
              depthTest={false}
              depthWrite={false}
            />
          )}
        </mesh>
        <mesh
          position={[
            landmarks.smlLake.x + 0.72,
            landmarks.smlLake.y + 0.6,
            landmarks.smlLake.z + 0.06,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.22, 0.86, 1]}
          renderOrder={4}
        >
          <ringGeometry args={[0.84, 1.02, 36]} />
          <meshBasicMaterial
            color={isNightMode ? "#e7fbff" : "#f4fdff"}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* Sun Moon Lake Ferry Boat */}
        <group
          ref={smlBoatRef}
          position={[
            landmarks.smlLake.x,
            landmarks.smlLake.y + 0.52,
            landmarks.smlLake.z,
          ]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.1, 0.045, 0.2]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#e0f2fe"
              emissiveIntensity={isNightMode ? 0.8 : 0.2}
            />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.07, 0.04, 0.11]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#38bdf8"
              emissiveIntensity={isNightMode ? 1.2 : 0.3}
            />
          </mesh>
        </group>

        {/* Ropeway Cable Line & Car */}
        {!waterOnly && (
          <>
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
          </>
        )}
      </group>

      {!waterOnly && (
      <>
      {/* 3. Alishan Forest Railway Red Train + Track Ring */}
      <group name="landmark-alishan-train">
        <mesh
          position={[
            landmarks.alishanCenter.x,
            landmarks.alishanCenter.y + 0.01,
            landmarks.alishanCenter.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.22, 0.27, 28]} />
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

      {/* 4. Dome of Light (Formosa Boulevard Kaohsiung) */}
      <group
        name="landmark-dome-of-light"
        position={[
          landmarks.domeOfLight.x - 0.12,
          landmarks.domeOfLight.y + 0.02,
          landmarks.domeOfLight.z + 0.08,
        ]}
      >
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.24, 0.26, 0.05, 24]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#38bdf8"
            emissiveIntensity={isNightMode ? 1.4 : 0.45}
          />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry
            args={[0.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]}
          />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f43f5e"
            emissiveIntensity={isNightMode ? 2.1 : 0.75}
            transparent
            opacity={0.9}
            roughness={0.15}
          />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.18, 12]} />
          <meshStandardMaterial
            color="#fde047"
            emissive="#fde047"
            emissiveIntensity={isNightMode ? 2.4 : 0.9}
          />
        </mesh>
      </group>

      {/* 5. Eluanbi Lighthouse (Southernmost Cape of Taiwan) */}
      <group
        name="landmark-eluanbi-lighthouse"
        position={[
          landmarks.eluanbiLighthouse.x,
          landmarks.eluanbiLighthouse.y,
          landmarks.eluanbiLighthouse.z,
        ]}
      >
        {/* White Lighthouse Tower */}
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.095, 0.36, 16]} />
          <meshStandardMaterial
            color="#f8fafc"
            emissive="#e2e8f0"
            emissiveIntensity={isNightMode ? 0.55 : 0.15}
            roughness={0.25}
          />
        </mesh>
        {/* Red Gallery Rim & Lantern Room */}
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={isNightMode ? 1.3 : 0.4}
          />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={isNightMode ? 3.2 : 1.2}
          />
        </mesh>
        {/* Rotating Beacon Cone */}
        <mesh
          ref={lighthouseBeamRef}
          position={[0, 0.44, 0.18]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <coneGeometry args={[0.11, 0.36, 12, 1, true]} />
          <meshBasicMaterial
            color="#fef08a"
            transparent
            opacity={isNightMode ? 0.55 : 0.22}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
      </>
      )}
    </group>
  );
}
