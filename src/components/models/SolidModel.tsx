"use client";

// ============================================================
// SolidModel.tsx — Solid baseline structural block
// ============================================================

import React, { useMemo } from "react";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { clamp } from "@/lib/simulation/normalize";
import { computeNormalizedLoad } from "@/lib/simulation/loadModel";

export function SolidModel() {
  const { state, output } = useSimulation();
  const { loadN, showDeformation, showStress, deformationScale } = state;

  // Deformation: compress slightly under load
  const F_norm = computeNormalizedLoad(loadN);
  const compressY = showDeformation ? -F_norm * 0.08 * deformationScale : 0;
  const scaleY = 1 + compressY;

  // Stress colour: yellow-tinted under high load
  const stressColor = useMemo(() => {
    if (!showStress) return new THREE.Color("#4EA9E0");
    const d = clamp(output.stressIndex / 100, 0, 1);
    const r = (1 - d) * 0.306 + d * 0.949;
    const g = (1 - d) * 0.663 + d * 0.788;
    const b = (1 - d) * 0.875 + d * 0.298;
    return new THREE.Color(r, g, b);
  }, [showStress, output.stressIndex]);

  return (
    <group>
      <mesh castShadow receiveShadow scale={[1, scaleY, 1]}>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial
          color={stressColor}
          roughness={0.3}
          metalness={0.2}
          envMapIntensity={0.8}
        />
      </mesh>
      {/* Wire frame overlay to show it's a solid */}
      <mesh scale={[1, scaleY, 1]}>
        <boxGeometry args={[4, 3, 4]} />
        <meshBasicMaterial
          color="#294B6E"
          wireframe
          opacity={0.25}
          transparent
        />
      </mesh>
    </group>
  );
}
