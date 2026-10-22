"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { TAIWAN_COASTLINE_LAT_LNG } from "@/lib/data/taiwanGeo";
import {
  ISLAND_BASE_HEIGHT,
  latLngToXZ,
  getIslandHeightAtXZ,
} from "@/lib/data/coordinates";

interface TaiwanIslandProps {
  isNightMode: boolean;
}

/**
 * Checks if a 2D point (x, z) lies inside a polygon of [x, z] vertices.
 */
function isPointInPolygon(
  x: number,
  z: number,
  poly: ReadonlyArray<readonly [number, number]>
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const zi = poly[i][1];
    const xj = poly[j][0];
    const zj = poly[j][1];

    const intersect =
      zi > z !== zj > z &&
      x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-10) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Computes shortest distance from (x, z) to any segment of the coastline polygon.
 */
function distanceToPolygonEdge(
  x: number,
  z: number,
  poly: ReadonlyArray<readonly [number, number]>
): number {
  let minDistSq = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0];
    const az = poly[j][1];
    const bx = poly[i][0];
    const bz = poly[i][1];

    const dx = bx - ax;
    const dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    let t = lenSq > 0 ? ((x - ax) * dx + (z - az) * dz) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const px = ax + t * dx;
    const pz = az + t * dz;
    const dSq = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (dSq < minDistSq) minDistSq = dSq;
  }
  return Math.sqrt(minDistSq);
}

export function TaiwanIsland({ isNightMode }: TaiwanIslandProps) {
  const { baseExtrudeGeo, beachRimGeo, terrainGeo } = useMemo(() => {
    // 1. Project coastline to (x, z)
    const coastXZ: Array<readonly [number, number]> =
      TAIWAN_COASTLINE_LAT_LNG.map(([lat, lng]) => {
        const { x, z } = latLngToXZ(lat, lng);
        return [x, z] as const;
      });

    // Create THREE.Shape in (x, -z) because ExtrudeGeometry extrudes along +Z and we rotate X by -PI/2
    const islandShape = new THREE.Shape();
    coastXZ.forEach(([x, z], idx) => {
      if (idx === 0) islandShape.moveTo(x, -z);
      else islandShape.lineTo(x, -z);
    });
    islandShape.closePath();

    const baseExtrude = new THREE.ExtrudeGeometry(islandShape, {
      depth: ISLAND_BASE_HEIGHT,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.11,
      bevelSegments: 3,
      curveSegments: 2,
    });
    baseExtrude.rotateX(-Math.PI / 2);

    const beachExtrude = new THREE.ExtrudeGeometry(islandShape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.24,
      bevelSegments: 2,
      curveSegments: 2,
    });
    beachExtrude.rotateX(-Math.PI / 2);

    // 2. Build stylized low-poly Central Mountain Range topographic mesh over the island interior
    const segX = 76;
    const segZ = 136;
    const width = 16.5;
    const height = 27.5;
    const gridGeo = new THREE.PlaneGeometry(width, height, segX, segZ);
    gridGeo.rotateX(-Math.PI / 2);

    const posAttr = gridGeo.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    const dayLow = new THREE.Color("#88dfa0");
    const dayMid = new THREE.Color("#3dbd78");
    const dayHigh = new THREE.Color("#1d7c58");
    const dayPeak = new THREE.Color("#e8f2ee");
    const dayBeach = new THREE.Color("#f5dfa1");

    const nightLow = new THREE.Color("#18363a");
    const nightMid = new THREE.Color("#154745");
    const nightHigh = new THREE.Color("#1e5b5a");
    const nightPeak = new THREE.Color("#52748b");
    const nightBeach = new THREE.Color("#1f2e42");

    const cLow = isNightMode ? nightLow : dayLow;
    const cMid = isNightMode ? nightMid : dayMid;
    const cHigh = isNightMode ? nightHigh : dayHigh;
    const cPeak = isNightMode ? nightPeak : dayPeak;
    const cBeach = isNightMode ? nightBeach : dayBeach;
    const tmpColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      const inside = isPointInPolygon(vx, vz, coastXZ);
      const edgeDist = distanceToPolygonEdge(vx, vz, coastXZ);

      if (!inside) {
        // Sink outside vertices smoothly below the ocean floor
        const drop = Math.min(1.2, edgeDist * 1.8);
        posAttr.setY(i, -0.35 - drop);
        tmpColor.copy(cBeach);
      } else {
        // Feather elevation smoothly from the coastline inward
        const coastalFeather = Math.min(1, edgeDist / 0.55);
        const smoothFeather =
          coastalFeather * coastalFeather * (3 - 2 * coastalFeather);
        const rawHeight = getIslandHeightAtXZ(vx, vz);
        const finalY =
          ISLAND_BASE_HEIGHT +
          (rawHeight - ISLAND_BASE_HEIGHT) * smoothFeather;
        posAttr.setY(i, finalY);

        const relH = finalY - ISLAND_BASE_HEIGHT;
        if (relH < 0.08) {
          tmpColor.copy(cBeach).lerp(cLow, relH / 0.08);
        } else if (relH < 0.55) {
          tmpColor.copy(cLow).lerp(cMid, (relH - 0.08) / 0.47);
        } else if (relH < 1.25) {
          tmpColor.copy(cMid).lerp(cHigh, (relH - 0.55) / 0.7);
        } else {
          tmpColor
            .copy(cHigh)
            .lerp(cPeak, Math.min(1, (relH - 1.25) / 0.75));
        }
      }

      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    gridGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    gridGeo.computeVertexNormals();

    return {
      baseExtrudeGeo: baseExtrude,
      beachRimGeo: beachExtrude,
      terrainGeo: gridGeo,
    };
  }, [isNightMode]);

  return (
    <group name="taiwan-island">
      {/* Warm sandy shelf around the coastline */}
      <mesh
        geometry={beachRimGeo}
        position={[0, -0.02, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={isNightMode ? "#24344d" : "#f7dfa4"}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Extruded island cliff base */}
      <mesh
        geometry={baseExtrudeGeo}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color={isNightMode ? "#1b3d3e" : "#7fd899"}
          roughness={0.78}
          metalness={0.06}
        />
      </mesh>

      {/* Stylized low-poly Central Mountain Range terrain mesh */}
      <mesh
        geometry={terrainGeo}
        position={[0, 0.01, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>
    </group>
  );
}
