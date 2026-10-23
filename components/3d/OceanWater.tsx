"use client";

import { useEffect, useMemo, useRef } from "react";
import { markLoadStage } from "./loadProgress";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  buildCoastDistanceTexture,
  buildShoreRibbon,
  COAST_MIN,
  COAST_SIZE,
  OCEAN_HORIZON_DAY,
  OCEAN_HORIZON_NIGHT,
  oceanFragmentShader,
  oceanVertexShader,
} from "./island/oceanBuilder";

interface OceanWaterProps {
  isNightMode: boolean;
}

const SHALLOW_DAY = new THREE.Color("#4ed4ea");
const SHALLOW_NIGHT = new THREE.Color("#0e3b5c");
const DEEP_DAY = new THREE.Color(OCEAN_HORIZON_DAY);
const DEEP_NIGHT = new THREE.Color(OCEAN_HORIZON_NIGHT);
const FOAM_DAY = new THREE.Color("#f4fbff");
const FOAM_NIGHT = new THREE.Color("#7dd3fc");
const scratchShallow = new THREE.Color();
const scratchDeep = new THREE.Color();
const scratchFoam = new THREE.Color();

export function OceanWater({ isNightMode }: OceanWaterProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useEffect(() => {
    markLoadStage("ocean");
  }, []);
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
        <planeGeometry args={[480, 480, 64, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={uniforms}
          fog={false}
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
