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
  const shaftRadius = 0.05 * scale;
  const headRadius = 0.14 * scale;
  const headLength = 0.4 * scale;
  const y = 4.5; // above structure

  return (
    <group position={[0, y, 0]}>
      {/* Load label */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.28}
        color="#243447"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {`↓ ${loadN} N APPLIED LOAD`}
      </Text>

      {/* Arrow shaft */}
      <mesh position={[0, -arrowLength / 2, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, arrowLength, 12]} />
        <meshStandardMaterial color="#D4A017" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Arrow head */}
      <mesh position={[0, -arrowLength - headLength / 2, 0]}>
        <coneGeometry args={[headRadius, headLength, 12]} />
        <meshStandardMaterial color="#D4A017" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}
