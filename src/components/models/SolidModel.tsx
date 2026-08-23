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

  // Stress colour: pastel blue to pastel golden yellow under high load
  const stressColor = useMemo(() => {
    if (!showStress) return new THREE.Color("#7FBEEB");
    const d = clamp(output.stressIndex / 100, 0, 1);
    const r = (1 - d) * 0.498 + d * 0.961;
    const g = (1 - d) * 0.745 + d * 0.820;
    const b = (1 - d) * 0.922 + d * 0.400;
    return new THREE.Color(r, g, b);
  }, [showStress, output.stressIndex]);

  return (
    <group>
      <mesh castShadow receiveShadow scale={[1, scaleY, 1]}>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial
          color={stressColor}
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
      {/* Subtle edge wireframe overlay */}
      <mesh scale={[1, scaleY, 1]}>
        <boxGeometry args={[4, 3, 4]} />
        <meshBasicMaterial
          color="#1C4C74"
          wireframe
          opacity={0.15}
          transparent
        />
      </mesh>
    </group>
  );
}
