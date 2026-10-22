"use client";

import { useMemo } from "react";
import * as THREE from "three";
import {
  OFFSHORE_ISLANDS,
  TAIWAN_COASTLINE_LAT_LNG,
} from "@/lib/data/taiwanGeo";
import {
  ISLAND_BASE_HEIGHT,
  latLngToXZ,
  getIslandHeightAtXZ,
} from "@/lib/data/coordinates";

interface TaiwanIslandProps {
  isNightMode: boolean;
}

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

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function shadeVariation(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

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

const TERRAIN_REVISION = 8;

const terrainVertexShader = /* glsl */ `
  attribute vec3 color;
  varying vec3 vColor;
  varying vec3 vNormal;
  void main() {
    vColor = color;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terrainFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vNormal;
  void main() {
    vec3 lightDir = normalize(vec3(0.42, 0.86, 0.28));
    float wrap = dot(normalize(vNormal), lightDir) * 0.5 + 0.5;
    float shade = mix(0.58, 1.0, clamp(wrap, 0.0, 1.0));
    gl_FragColor = vec4(vColor * shade, 1.0);
  }
`;

export function TaiwanIsland({ isNightMode }: TaiwanIslandProps) {
  const {
    baseExtrudeGeo,
    beachRimGeo,
    terrainGeo,
    offshoreMeshes,
  } = useMemo(() => {
    // 1. Project main island coastline to (x, z)
    const coastXZ: Array<readonly [number, number]> =
      TAIWAN_COASTLINE_LAT_LNG.map(([lat, lng]) => {
        const { x, z } = latLngToXZ(lat, lng);
        return [x, z] as const;
      });

    const islandShape = new THREE.Shape();
    coastXZ.forEach(([x, z], idx) => {
      if (idx === 0) islandShape.moveTo(x, -z);
      else islandShape.lineTo(x, -z);
    });
    islandShape.closePath();

    const baseExtrude = new THREE.ExtrudeGeometry(islandShape, {
      depth: ISLAND_BASE_HEIGHT,
      bevelEnabled: true,
      bevelThickness: 0.085,
      bevelSize: 0.1,
      bevelSegments: 3,
      curveSegments: 2,
    });
    baseExtrude.rotateX(-Math.PI / 2);

    const beachExtrude = new THREE.ExtrudeGeometry(islandShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.065,
      bevelSegments: 2,
      curveSegments: 2,
    });
    beachExtrude.rotateX(-Math.PI / 2);

    // 2. Build offshore island geometries (Penghu, Green Island, Orchid Island, Xiaoliuqiu)
    const offshore = OFFSHORE_ISLANDS.map((isl) => {
      const polyXZ = isl.polygonLatLng.map(([lat, lng]) => {
        const { x, z } = latLngToXZ(lat, lng);
        return [x, z] as const;
      });
      const shape = new THREE.Shape();
      polyXZ.forEach(([x, z], idx) => {
        if (idx === 0) shape.moveTo(x, -z);
        else shape.lineTo(x, -z);
      });
      shape.closePath();

      const landGeo = new THREE.ExtrudeGeometry(shape, {
        depth: ISLAND_BASE_HEIGHT + isl.peakHeight,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.07,
        bevelSegments: 3,
      });
      landGeo.rotateX(-Math.PI / 2);

      const rimGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.055,
        bevelSegments: 2,
      });
      rimGeo.rotateX(-Math.PI / 2);

      return {
        id: isl.id,
        landGeo,
        rimGeo,
      };
    });

    // 3. Build DEM topographic mesh over Taiwan's main island
    const segX = 104;
    const segZ = 176;
    const width = 16.5;
    const height = 27.5;
    const gridGeo = new THREE.PlaneGeometry(width, height, segX, segZ);
    gridGeo.rotateX(-Math.PI / 2);

    const posAttr = gridGeo.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);

    // Rich green -> alpine rock -> light snow crest palette (never a white blob)
    const dayBeach = new THREE.Color("#f3e3b2");
    const dayPlain = new THREE.Color("#84d464");
    const dayLow = new THREE.Color("#56bb63");
    const dayMid = new THREE.Color("#268e50");
    const dayHigh = new THREE.Color("#165f39");
    const dayRock = new THREE.Color("#7c756c");
    const daySnow = new THREE.Color("#eef5f3");
    const daySubmerged = new THREE.Color("#0c6fa8");

    const nightBeach = new THREE.Color("#2a3a52");
    const nightPlain = new THREE.Color("#1c4640");
    const nightLow = new THREE.Color("#163f3d");
    const nightMid = new THREE.Color("#14524a");
    const nightHigh = new THREE.Color("#1a6156");
    const nightRock = new THREE.Color("#3e4e5e");
    const nightSnow = new THREE.Color("#88a0b2");
    const nightSubmerged = new THREE.Color("#071525");

    const cBeach = isNightMode ? nightBeach : dayBeach;
    const cPlain = isNightMode ? nightPlain : dayPlain;
    const cLow = isNightMode ? nightLow : dayLow;
    const cMid = isNightMode ? nightMid : dayMid;
    const cHigh = isNightMode ? nightHigh : dayHigh;
    const cRock = isNightMode ? nightRock : dayRock;
    const cSnow = isNightMode ? nightSnow : daySnow;
    const cSubmerged = isNightMode ? nightSubmerged : daySubmerged;
    const tmpColor = new THREE.Color();

    for (let i = 0; i < vertexCount; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);

      const inside = isPointInPolygon(vx, vz, coastXZ);
      const edgeDist = distanceToPolygonEdge(vx, vz, coastXZ);

      if (!inside) {
        const drop = Math.min(2.4, edgeDist * 2.6);
        posAttr.setY(i, -1.2 - drop);
        tmpColor.copy(cSubmerged);
      } else {
        const coastalFeather = Math.min(1, edgeDist / 0.48);
        const smoothFeather =
          coastalFeather * coastalFeather * (3 - 2 * coastalFeather);
        const rawHeight = getIslandHeightAtXZ(vx, vz);
        const finalY =
          ISLAND_BASE_HEIGHT +
          (rawHeight - ISLAND_BASE_HEIGHT) * smoothFeather;
        posAttr.setY(i, finalY);

        const relH = finalY - ISLAND_BASE_HEIGHT;
        const eps = 0.15;
        const slope = Math.hypot(
          (getIslandHeightAtXZ(vx + eps, vz) -
            getIslandHeightAtXZ(vx - eps, vz)) /
            (2 * eps),
          (getIslandHeightAtXZ(vx, vz + eps) -
            getIslandHeightAtXZ(vx, vz - eps)) /
            (2 * eps)
        );

        // Elevation color bands: coastal plain -> subtropical forest -> alpine cypress -> rock -> light snow
        if (relH < 0.06) {
          tmpColor.copy(cBeach).lerp(cPlain, relH / 0.06);
        } else if (relH < 0.36) {
          tmpColor.copy(cPlain).lerp(cLow, (relH - 0.06) / 0.3);
        } else if (relH < 0.88) {
          tmpColor.copy(cLow).lerp(cMid, (relH - 0.36) / 0.52);
        } else if (relH < 1.38) {
          tmpColor.copy(cMid).lerp(cHigh, (relH - 0.88) / 0.5);
        } else {
          tmpColor.copy(cHigh);
        }

        // Broad western plains vs steep eastern Taroko/Qingshui marble cliffs
        if (vx < 0.4 && relH < 0.35) {
          const plainMix =
            smoothstep(0.4, -1.8, vx) * smoothstep(0.35, 0.04, relH);
          tmpColor.lerp(cPlain, plainMix * 0.8);
        }
        if (vx > 0.45 && edgeDist < 0.58 && relH > 0.05) {
          tmpColor.lerp(cRock, smoothstep(0.58, 0.04, edgeDist) * 0.58);
        }

        // Steep mountain slopes expose alpine slate rock
        tmpColor.lerp(
          cRock,
          smoothstep(0.52, 1.35, slope) * (relH > 0.2 ? 0.72 : 0.14)
        );

        // High alpine rock transition (above ~2,800m equivalent)
        if (relH > 1.25) {
          tmpColor.lerp(cRock, smoothstep(1.25, 1.75, relH) * 0.65);
        }

        // Subtle light snow only on the very highest summits (Yushan & Xueshan > 1.72)
        if (relH > 1.72) {
          const snow =
            smoothstep(1.72, 1.98, relH) *
            (1 - smoothstep(0.85, 1.55, slope));
          tmpColor.lerp(cSnow, snow * 0.68);
        }

        const ao =
          (0.82 + 0.18 * smoothstep(0.02, 0.7, relH)) *
          (1 - smoothstep(0.2, 1.1, slope) * 0.06);
        const grain = 0.94 + shadeVariation(vx, vz) * 0.09;
        tmpColor.multiplyScalar(ao * grain);
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
      offshoreMeshes: offshore,
    };
  }, [isNightMode, TERRAIN_REVISION]);

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
