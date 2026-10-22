"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface OceanWaterProps {
  isNightMode: boolean;
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.65 + uTime * 1.2) * cos(pos.y * 0.55 + uTime * 0.9) * 0.045;
    float wave2 = sin(pos.x * 1.4 - uTime * 1.6 + pos.y * 1.1) * 0.02;
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
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    // Radial distance from island center (approx scaled ellipse for Taiwan)
    vec2 p = vec2(vWorldPos.x / 8.5, vWorldPos.z / 14.5);
    float dist = length(p);

    // Subtle animated ripple pattern
    float ripple = sin(vWorldPos.x * 2.2 + uTime * 1.8) * cos(vWorldPos.z * 2.0 - uTime * 1.4);
    float caustic = smoothstep(0.62, 0.95, sin(vWorldPos.x * 3.1 + ripple + uTime) * cos(vWorldPos.z * 2.9 - uTime * 1.1));

    // Mix shallow coastal turquoise with deeper Pacific blue
    float depthFactor = smoothstep(0.45, 2.2, dist);
    vec3 waterColor = mix(uShallowColor, uDeepColor, depthFactor);

    // Shoreline foam bands around the island perimeter
    float foamBand1 = smoothstep(0.06, 0.0, abs(dist - 0.72 + sin(uTime * 1.5 + vWorldPos.z) * 0.03));
    float foamBand2 = smoothstep(0.04, 0.0, abs(dist - 0.88 + cos(uTime * 1.2 + vWorldPos.x) * 0.025)) * 0.55;
    float foam = clamp(foamBand1 + foamBand2 + caustic * 0.14 * (1.0 - depthFactor), 0.0, 1.0);

    vec3 finalColor = mix(waterColor, uFoamColor, foam * 0.45);
    gl_FragColor = vec4(finalColor, 0.94);
  }
`;

export function OceanWater({ isNightMode }: OceanWaterProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallowColor: {
        value: new THREE.Color(isNightMode ? "#0e3b5c" : "#38d9e8"),
      },
      uDeepColor: {
        value: new THREE.Color(isNightMode ? "#061529" : "#0b84c4"),
      },
      uFoamColor: {
        value: new THREE.Color(isNightMode ? "#38bdf8" : "#ffffff"),
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += delta;

    const targetShallow = new THREE.Color(
      isNightMode ? "#0e3b5c" : "#38d9e8"
    );
    const targetDeep = new THREE.Color(isNightMode ? "#061529" : "#0b84c4");
    const targetFoam = new THREE.Color(isNightMode ? "#38bdf8" : "#ffffff");

    matRef.current.uniforms.uShallowColor.value.lerp(targetShallow, 0.08);
    matRef.current.uniforms.uDeepColor.value.lerp(targetDeep, 0.08);
    matRef.current.uniforms.uFoamColor.value.lerp(targetFoam, 0.08);
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      receiveShadow
    >
      <planeGeometry args={[95, 95, 96, 96]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
