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
import {
  distanceToPolygonEdge,
  isPointInPolygon,
  shadeVariation,
  smoothstep,
} from "./polygonMath";

export const TERRAIN_REVISION = 16;

export const terrainVertexShader = /* glsl */ `
  attribute vec3 color;
  varying vec3 vColor;
  varying vec3 vNormal;
  void main() {
    vColor = color;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const terrainFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vNormal;
  void main() {
    vec3 lightDir = normalize(vec3(0.42, 0.86, 0.28));
    float wrap = dot(normalize(vNormal), lightDir) * 0.5 + 0.5;
    float shade = mix(0.58, 1.0, clamp(wrap, 0.0, 1.0));
    gl_FragColor = vec4(vColor * shade, 1.0);
  }
`;

export function buildIslandGeometries(isNightMode: boolean) {
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

  const dayBeach = new THREE.Color("#f3e3b2");
  const dayPlain = new THREE.Color("#84d464");
  const dayLow = new THREE.Color("#56bb63");
  const dayMid = new THREE.Color("#268e50");
  const dayHigh = new THREE.Color("#165f39");
  const dayRock = new THREE.Color("#28503c");
  const daySubmerged = new THREE.Color("#0c6fa8");

  const nightBeach = new THREE.Color("#2a3a52");
  const nightPlain = new THREE.Color("#1c4640");
  const nightLow = new THREE.Color("#163f3d");
  const nightMid = new THREE.Color("#14524a");
  const nightHigh = new THREE.Color("#1a6156");
  const nightRock = new THREE.Color("#5c7084");
  const nightSubmerged = new THREE.Color("#071525");

  const cBeach = isNightMode ? nightBeach : dayBeach;
  const cPlain = isNightMode ? nightPlain : dayPlain;
  const cLow = isNightMode ? nightLow : dayLow;
  const cMid = isNightMode ? nightMid : dayMid;
  const cHigh = isNightMode ? nightHigh : dayHigh;
  const cRock = isNightMode ? nightRock : dayRock;
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

      if (vx < 0.4 && relH < 0.35) {
        const plainMix =
          smoothstep(0.4, -1.8, vx) * smoothstep(0.35, 0.04, relH);
        tmpColor.lerp(cPlain, plainMix * 0.8);
      }
      if (vx > 0.45 && edgeDist < 0.58 && relH > 0.05) {
        tmpColor.lerp(cRock, smoothstep(0.58, 0.04, edgeDist) * 0.58);
      }

      tmpColor.lerp(
        cRock,
        smoothstep(0.7, 1.5, slope) * (relH > 0.45 ? 0.32 : 0.08)
      );

      if (relH > 1.0) {
        tmpColor.lerp(cRock, smoothstep(1.0, 1.45, relH) * 0.68);
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
}
