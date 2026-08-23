"use client";

// ============================================================
// LoadArrow.tsx — Visual applied load indicator in 3D scene
// Dynamically follows 3D XYZ load position with high visibility
// ============================================================

import React from "react";
import { Text } from "@react-three/drei";
import { computeLoadArrowScale } from "@/lib/simulation/loadModel";

interface LoadArrowProps {
  loadN: number;
  posX?: number;
  posY?: number;
  posZ?: number;
}

export function LoadArrow({ loadN, posX = 0, posY = 2.5, posZ = 0 }: LoadArrowProps) {
  const scale = computeLoadArrowScale(loadN);
  const arrowLength = 1.6 * scale;
  const shaftRadius = 0.07 * scale;
  const headRadius = 0.17 * scale;
  const headLength = 0.45 * scale;
  const arrowBaseY = posY + 1.2;

  return (
    <group position={[posX, arrowBaseY, posZ]}>
      {/* High-contrast Load Label with coordinate readout */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.3}
        color="#1C4C74"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {`↓ ${loadN} N LOAD (${posX >= 0 ? "+" : ""}${posX.toFixed(2)}, ${posZ >= 0 ? "+" : ""}${posZ.toFixed(2)})`}
      </Text>

      {/* Target point indicator on surface */}
      <mesh position={[0, -arrowLength - headLength, 0]}>
        <ringGeometry args={[0.08, 0.22, 16]} />
        <meshBasicMaterial color="#E5A812" side={2} />
      </mesh>

      {/* Arrow shaft with rich amber/golden yellow material */}
      <mesh position={[0, -arrowLength / 2, 0]} castShadow>
        <cylinderGeometry args={[shaftRadius, shaftRadius, arrowLength, 16]} />
        <meshStandardMaterial
          color="#E5A812"
          roughness={0.25}
          metalness={0.15}
          emissive="#D49405"
          emissiveIntensity={0.2}
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
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}
