"use client";

// ============================================================
// SolidModel.tsx — Solid baseline structural block
// High-visibility, crisp monolithic block with edge framing
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

  // Stress colour: bright pastel blue to rich golden yellow under high load
  const stressColor = useMemo(() => {
    if (!showStress) return new THREE.Color("#74B9FF");
    const d = clamp(output.stressIndex / 100, 0, 1);
    const color = new THREE.Color();
    const r = (1 - d) * 0.455 + d * 0.976;
    const g = (1 - d) * 0.725 + d * 0.792;
    const b = (1 - d) * 1.000 + d * 0.141;
    color.setRGB(r, g, b);
    return color;
  }, [showStress, output.stressIndex]);

  return (
    <group>
      <mesh castShadow receiveShadow scale={[1, scaleY, 1]}>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial
          color={stressColor}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {/* Crisp outer edge wireframe */}
      <mesh scale={[1.001, scaleY * 1.001, 1.001]}>
        <boxGeometry args={[4, 3, 4]} />
        <meshBasicMaterial
          color="#1C4C74"
          wireframe
          opacity={0.25}
          transparent
        />
      </mesh>
    </group>
  );
}
