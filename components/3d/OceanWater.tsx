"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  OFFSHORE_ISLANDS,
  TAIWAN_COASTLINE_LAT_LNG,
} from "@/lib/data/taiwanGeo";
import { latLngToXZ } from "@/lib/data/coordinates";

interface OceanWaterProps {
  isNightMode: boolean;
}

const COAST_MIN = new THREE.Vector2(-15, -19);
const COAST_SIZE = new THREE.Vector2(30, 38);
const SDF_RES = 320;

const SHALLOW_DAY = new THREE.Color("#4ed4ea");
const SHALLOW_NIGHT = new THREE.Color("#0e3b5c");
const DEEP_DAY = new THREE.Color("#0b78b8");
const DEEP_NIGHT = new THREE.Color("#061529");
const FOAM_DAY = new THREE.Color("#f4fbff");
const FOAM_NIGHT = new THREE.Color("#7dd3fc");
const scratchShallow = new THREE.Color();
const scratchDeep = new THREE.Color();
const scratchFoam = new THREE.Color();

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

/**
 * Signed distance to the real Taiwan coastline, in world units.
 * Negative on land, positive at sea. Sampled by the water shader so foam
 * and shallow color follow the coast instead of a circle around the island.
 */
function buildCoastDistanceTexture(): THREE.DataTexture {
  const coast = TAIWAN_COASTLINE_LAT_LNG.map(([lat, lng]) => {
    const { x, z } = latLngToXZ(lat, lng);
    return [x, z] as const;
  });
  const offshorePolys = OFFSHORE_ISLANDS.map((isl) =>
    isl.polygonLatLng.map(([lat, lng]) => {
      const { x, z } = latLngToXZ(lat, lng);
      return [x, z] as const;
    })
  );
  const data = new Uint8Array(SDF_RES * SDF_RES * 4);
  for (let iz = 0; iz < SDF_RES; iz++) {
    const z = COAST_MIN.y + ((iz + 0.5) / SDF_RES) * COAST_SIZE.y;
    for (let ix = 0; ix < SDF_RES; ix++) {
      const x = COAST_MIN.x + ((ix + 0.5) / SDF_RES) * COAST_SIZE.x;
      let sd =
        distanceToPolygonEdge(x, z, coast) *
        (isPointInPolygon(x, z, coast) ? -1 : 1);
      for (const poly of offshorePolys) {
        const dOff =
          distanceToPolygonEdge(x, z, poly) *
          (isPointInPolygon(x, z, poly) ? -1 : 1);
        if (dOff < sd) sd = dOff;
      }
      const encoded = Math.max(0, Math.min(255, Math.round(((sd + 8) / 28) * 255)));
      const o = (iz * SDF_RES + ix) * 4;
      data[o] = encoded;
      data[o + 1] = encoded;
      data[o + 2] = encoded;
      data[o + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, SDF_RES, SDF_RES, THREE.RGBAFormat);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.flipY = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;

  void main() {
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.65 + uTime * 0.85) * cos(pos.y * 0.55 + uTime * 0.6) * 0.035;
    float wave2 = sin(pos.x * 1.35 - uTime * 1.1 + pos.y * 1.05) * 0.016;
    pos.z += wave1 + wave2;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallowColor;
  uniform vec3 uDeepColor;
  uniform vec3 uFoamColor;
  uniform sampler2D uCoast;
  uniform vec2 uCoastOrigin;
  uniform vec2 uCoastSize;
  varying vec3 vWorldPos;

  float coastDistance(vec2 xz) {
    vec2 uv = (xz - uCoastOrigin) / uCoastSize;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
      return 12.0;
    }
    return texture2D(uCoast, uv).r * 28.0 - 8.0;
  }

  void main() {
    float sd = coastDistance(vWorldPos.xz);

    float ripple = sin(vWorldPos.x * 1.8 + uTime * 0.9) * cos(vWorldPos.z * 1.6 - uTime * 0.7);
    float depthFactor = smoothstep(0.2, 5.5, max(sd, 0.0));
    vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);

    // Fine directional swell lines. Kept short and faint so they read as water, not rings.
    float waves = vWorldPos.x * 3.4 + vWorldPos.z * 1.6 + sin(vWorldPos.z * 1.3 + uTime * 0.55) * 0.35;
    float contour = 1.0 - smoothstep(0.0, 0.07, abs(fract(waves) - 0.5) - 0.46);
    float contourFade = smoothstep(0.25, 0.9, sd) * (1.0 - smoothstep(6.0, 12.0, sd));
    waterColor = mix(waterColor, uShallowColor * 1.08, contour * contourFade * 0.14);

    float shoreNoise = 0.72 + 0.28 * sin(vWorldPos.x * 7.5 + ripple + uTime * 1.4) * cos(vWorldPos.z * 6.4 - uTime);
    float shore = smoothstep(0.62, 0.04, sd) * smoothstep(-0.2, 0.08, sd);
    shore = clamp(shore * shoreNoise, 0.0, 1.0);

    vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    vec3 lightDir = normalize(vec3(0.45, 0.82, 0.32));
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 56.0);
    waterColor += vec3(1.0) * spec * (0.28 + (1.0 - depthFactor) * 0.15);

    vec3 finalColor = mix(waterColor, uFoamColor, shore * 0.82);
    float alpha = mix(0.9, 0.98, depthFactor);
    alpha = mix(alpha, 0.96, shore);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function buildShoreRibbon(): THREE.BufferGeometry {
  const coast = TAIWAN_COASTLINE_LAT_LNG.map(([lat, lng]) => {
    const { x, z } = latLngToXZ(lat, lng);
    return [x, z] as const;
  });
  const n = coast.length;
  let cx = 0;
  let cz = 0;
  for (const [x, z] of coast) {
    cx += x;
    cz += z;
  }
  cx /= n;
  cz /= n;

  const outward: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const prev = coast[(i - 1 + n) % n];
    const curr = coast[i];
    const next = coast[(i + 1) % n];
    const e1x = curr[0] - prev[0];
    const e1z = curr[1] - prev[1];
    const e2x = next[0] - curr[0];
    const e2z = next[1] - curr[1];
    const l1 = Math.hypot(e1x, e1z) || 1;
    const l2 = Math.hypot(e2x, e2z) || 1;
    let nx = e1z / l1 + e2z / l2;
    let nz = -e1x / l1 + -e2x / l2;
    const nl = Math.hypot(nx, nz) || 1;
    nx /= nl;
    nz /= nl;
    const away =
      (curr[0] + nx - cx) * (curr[0] + nx - cx) +
        (curr[1] + nz - cz) * (curr[1] + nz - cz) >
      (curr[0] - nx - cx) * (curr[0] - nx - cx) +
        (curr[1] - nz - cz) * (curr[1] - nz - cz);
    outward.push(away ? [nx, nz] : [-nx, -nz]);
  }

  const inner = 0.015;
  const outer = 0.16;
  const y = 0.05;
  const positions: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = coast[i];
    const b = coast[(i + 1) % n];
    const na = outward[i];
    const nb = outward[(i + 1) % n];
    const ax0 = a[0] + na[0] * inner;
    const az0 = a[1] + na[1] * inner;
    const ax1 = a[0] + na[0] * outer;
    const az1 = a[1] + na[1] * outer;
    const bx0 = b[0] + nb[0] * inner;
    const bz0 = b[1] + nb[1] * inner;
    const bx1 = b[0] + nb[0] * outer;
    const bz1 = b[1] + nb[1] * outer;
    positions.push(
      ax0, y, az0,
      ax1, y, az1,
      bx0, y, bz0,
      bx0, y, bz0,
      ax1, y, az1,
      bx1, y, bz1
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  return geometry;
}

export function OceanWater({ isNightMode }: OceanWaterProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const coastMap = useMemo(() => buildCoastDistanceTexture(), []);
  const shoreRibbon = useMemo(() => buildShoreRibbon(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallowColor: { value: SHALLOW_DAY.clone() },
      uDeepColor: { value: DEEP_DAY.clone() },
      uFoamColor: { value: FOAM_DAY.clone() },
      uCoast: { value: coastMap },
      uCoastOrigin: { value: COAST_MIN.clone() },
      uCoastSize: { value: COAST_SIZE.clone() },
    }),
    [coastMap]
  );

  useFrame((_, delta) => {
    const material = matRef.current;
    if (!material) return;
    material.uniforms.uTime.value += delta;
    scratchShallow.copy(isNightMode ? SHALLOW_NIGHT : SHALLOW_DAY);
    scratchDeep.copy(isNightMode ? DEEP_NIGHT : DEEP_DAY);
    scratchFoam.copy(isNightMode ? FOAM_NIGHT : FOAM_DAY);
    material.uniforms.uShallowColor.value.lerp(scratchShallow, 0.08);
    material.uniforms.uDeepColor.value.lerp(scratchDeep, 0.08);
    material.uniforms.uFoamColor.value.lerp(scratchFoam, 0.08);
  });

  return (
    <group>
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      receiveShadow
    >
      <planeGeometry args={[95, 95, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
    <mesh geometry={shoreRibbon}>
      <meshBasicMaterial
        color={isNightMode ? "#dbeafe" : "#ffffff"}
        transparent
        opacity={isNightMode ? 0.28 : 0.55}
        depthWrite={false}
      />
    </mesh>
    </group>
  );
}
