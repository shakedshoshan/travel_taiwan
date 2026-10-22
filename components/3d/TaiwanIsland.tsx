"use client";

import { useMemo } from "react";
import {
  buildIslandGeometries,
  terrainFragmentShader,
  terrainVertexShader,
  TERRAIN_REVISION,
} from "./island/terrainBuilder";

interface TaiwanIslandProps {
  isNightMode: boolean;
}

export function TaiwanIsland({ isNightMode }: TaiwanIslandProps) {
  const { baseExtrudeGeo, beachRimGeo, terrainGeo, offshoreMeshes } = useMemo(
    () => buildIslandGeometries(isNightMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isNightMode, TERRAIN_REVISION]
  );

  return (
    <group name="taiwan-island">
      {/* Warm sandy shelf around the main coastline */}
      <mesh
        geometry={beachRimGeo}
        position={[0, -0.02, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={isNightMode ? "#24344d" : "#f0ddb0"}
          roughness={0.92}
          metalness={0}
        />
      </mesh>

      {/* Extruded main island cliff base */}
      <mesh
        geometry={baseExtrudeGeo}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={isNightMode ? "#1a3338" : "#3f8f56"}
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* DEM Central Mountain Range & Coastal Range terrain mesh */}
      <mesh
        geometry={terrainGeo}
        position={[0, 0.04, 0]}
        receiveShadow
        castShadow
      >
        <shaderMaterial
          vertexShader={terrainVertexShader}
          fragmentShader={terrainFragmentShader}
        />
      </mesh>

      {/* Offshore Islands: Penghu, Xiaoliuqiu, Green Island, Orchid Island */}
      {offshoreMeshes.map((isl) => (
        <group key={isl.id} name={`island-${isl.id}`}>
          <mesh
            geometry={isl.rimGeo}
            position={[0, -0.015, 0]}
            receiveShadow
          >
            <meshStandardMaterial
              color={isNightMode ? "#24344d" : "#f0ddb0"}
              roughness={0.9}
            />
          </mesh>
          <mesh
            geometry={isl.landGeo}
            position={[0, 0, 0]}
            receiveShadow
            castShadow
          >
            <meshStandardMaterial
              color={isNightMode ? "#194842" : "#389e56"}
              roughness={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
