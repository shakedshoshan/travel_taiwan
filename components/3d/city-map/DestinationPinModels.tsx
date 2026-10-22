"use client";

import type { CityMapNode } from "./cityMapLayout";

interface DestinationPinModelsProps {
  node: CityMapNode;
  isNightMode: boolean;
}

export function DestinationPinModels({
  node,
  isNightMode,
}: DestinationPinModelsProps) {
  if (node.categoryGroup === "hotel") {
    return (
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
          <meshBasicMaterial color={isNightMode ? "#fef08a" : "#e0f2fe"} />
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
    );
  }

  if (node.categoryGroup === "market") {
    return (
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
    );
  }

  if (node.categoryGroup === "food") {
    return (
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
    );
  }

  if (node.categoryGroup === "attraction") {
    return (
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
    );
  }

  return (
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
        <meshStandardMaterial color="#34d399" flatShading />
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
  );
}
