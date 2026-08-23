"use client";

// ============================================================
// BoneModel.tsx — Irregular trabecular-inspired strut lattice
// High-visibility, crisp variable-density lattice struts
// ============================================================

import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { clamp } from "@/lib/simulation/normalize";
import type { StrutElement } from "@/lib/simulation/types";

// ── Stress-to-colour mapping (Pastel Blue → Vibrant Yellow-Gold) ──
function demandToColor(demand: number): THREE.Color {
  const d = clamp(demand, 0, 1);
  // 0 = vibrant pastel blue (#4FA8E0), 1 = rich pastel yellow-gold (#F0C438)
  const r = (1 - d) * 0.31 + d * 0.94;
  const g = (1 - d) * 0.66 + d * 0.77;
  const b = (1 - d) * 0.88 + d * 0.22;
  return new THREE.Color(r, g, b);
}

// ── Cylinder matrix for a strut ───────────────────────────────
function strutMatrix(s: StrutElement, deformY: number): THREE.Matrix4 {
  const start = new THREE.Vector3(s.startX, s.startY, s.startZ);
  const end = new THREE.Vector3(s.endX, s.endY + deformY, s.endZ);
  const dir = end.clone().sub(start);
  const len = dir.length();
  const mid = start.clone().add(end).multiplyScalar(0.5);

  const dummy = new THREE.Object3D();
  dummy.position.copy(mid);

  // Align Y-axis cylinder to strut direction
  const up = new THREE.Vector3(0, 1, 0);
  const normDir = dir.clone().normalize();
  if (Math.abs(normDir.dot(up)) < 0.999) {
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normDir);
    dummy.quaternion.copy(quat);
  } else if (normDir.y < 0) {
    dummy.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
  }

  dummy.scale.set(s.radius, len / 2, s.radius);
  dummy.updateMatrix();
  return dummy.matrix.clone();
}

interface BoneInstancedProps {
  struts: StrutElement[];
  showStress: boolean;
  showDeformation: boolean;
  globalDeform: number;
}

function BoneInstanced({ struts, showStress, showDeformation, globalDeform }: BoneInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Shared cylinder geometry (reused for all struts)
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(1, 1, 2, 12, 1);
  }, []);

  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    for (const s of struts) {
      const deformY = showDeformation ? -s.demand * globalDeform * 0.15 : 0;
      matrices.push(strutMatrix(s, deformY));
      colors.push(
        showStress ? demandToColor(s.demand) : new THREE.Color("#4FA8E0")
      );
    }
    return { matrices, colors };
  }, [struts, showStress, showDeformation, globalDeform]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      mesh.setColorAt(i, colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  if (struts.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, struts.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.35}
        metalness={0.05}
      />
    </instancedMesh>
  );
}

export function BoneModel() {
  const { state, output } = useSimulation();
  const { showStress, showDeformation, deformationScale } = state;

  const struts = output.struts ?? [];
  const globalDeform = output.deformation * deformationScale;

  if (struts.length === 0) {
    return (
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#4FA8E0" />
      </mesh>
    );
  }

  return (
    <group>
      <BoneInstanced
        struts={struts}
        showStress={showStress}
        showDeformation={showDeformation}
        globalDeform={globalDeform}
      />
    </group>
  );
}
