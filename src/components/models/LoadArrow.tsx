"use client";

// ============================================================
// LoadArrow.tsx — Visual applied load indicator in 3D scene
// ============================================================

import React from "react";
import { Text } from "@react-three/drei";
import { computeLoadArrowScale } from "@/lib/simulation/loadModel";

interface LoadArrowProps {
  loadN: number;
}

export function LoadArrow({ loadN }: LoadArrowProps) {
  const scale = computeLoadArrowScale(loadN);
  const arrowLength = 1.5 * scale;
  const shaftRadius = 0.04 * scale;
  const headRadius = 0.12 * scale;
  const headLength = 0.35 * scale;
  const y = 4.5; // above structure

  return (
    <group position={[0, y, 0]}>
      {/* Load label */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.28}
        color="#F2C94C"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {`↓ ${loadN} N APPLIED LOAD`}
      </Text>

      {/* Arrow shaft */}
      <mesh position={[0, -arrowLength / 2, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, arrowLength, 8]} />
        <meshStandardMaterial color="#F2C94C" roughness={0.3} />
      </mesh>

      {/* Arrow head */}
      <mesh position={[0, -arrowLength - headLength / 2, 0]}>
        <coneGeometry args={[headRadius, headLength, 8]} />
        <meshStandardMaterial color="#F2C94C" roughness={0.3} />
      </mesh>
    </group>
  );
}
