"use client";

import { useMemo } from "react";
import { getIslandHeightAtXZ } from "@/lib/data/coordinates";
import { getCityById } from "@/lib/data/selectors";

const DASH = 1.15;
const GAP = 0.62;

/** Dashed optional branch from Kaohsiung to Kenting. Not a full route tube. */
export function KentingDetourLine() {
  const dashes = useMemo(() => {
    const from = getCityById("kaohsiung");
    const to = getCityById("kenting");
    const dx = to.worldX - from.worldX;
    const dz = to.worldZ - from.worldZ;
    const total = Math.hypot(dx, dz);
    const yaw = Math.atan2(dx, dz);
    const segments: { position: [number, number, number]; length: number }[] = [];
    for (let traveled = 0; traveled < total; traveled += DASH + GAP) {
      const length = Math.min(DASH, total - traveled);
      const t = (traveled + length / 2) / total;
      const x = from.worldX + dx * t;
      const z = from.worldZ + dz * t;
      segments.push({
        position: [x, getIslandHeightAtXZ(x, z) + 0.42, z],
        length,
      });
    }
    return { yaw, segments };
  }, []);

  return (
    <group>
      {dashes.segments.map((seg, index) => (
        <mesh
          key={index}
          position={seg.position}
          rotation={[0, dashes.yaw, 0]}
          renderOrder={20}
        >
          <boxGeometry args={[0.72, 0.12, seg.length]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.95}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
