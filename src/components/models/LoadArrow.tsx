"use client";

// ============================================================
// LoadArrow.tsx — Visual applied load indicator in 3D scene
// High-visibility load vector for projector / classroom presentation
// ============================================================

import React from "react";
import { Text } from "@react-three/drei";
import { computeLoadArrowScale } from "@/lib/simulation/loadModel";

interface LoadArrowProps {
  loadN: number;
}

export function LoadArrow({ loadN }: LoadArrowProps) {
  const scale = computeLoadArrowScale(loadN);
  const arrowLength = 1.6 * scale;
  const shaftRadius = 0.065 * scale;
  const headRadius = 0.16 * scale;
  const headLength = 0.45 * scale;
  const y = 4.6; // above structure

  return (
    <group position={[0, y, 0]}>
      {/* High-contrast Load Label */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.32}
        color="#1C4C74"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {`↓ ${loadN} N APPLIED LOAD`}
      </Text>

      {/* Arrow shaft with rich amber/golden yellow material */}
      <mesh position={[0, -arrowLength / 2, 0]} castShadow>
        <cylinderGeometry args={[shaftRadius, shaftRadius, arrowLength, 16]} />
        <meshStandardMaterial
          color="#E5A812"
          roughness={0.25}
          metalness={0.15}
          emissive="#D49405"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Arrow head */}
      <mesh position={[0, -arrowLength - headLength / 2, 0]} castShadow>
        <coneGeometry args={[headRadius, headLength, 16]} />
        <meshStandardMaterial
          color="#E5A812"
          roughness={0.25}
          metalness={0.15}
          emissive="#D49405"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}
