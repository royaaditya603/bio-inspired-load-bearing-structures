"use client";

// ============================================================
// BoneModel.tsx — Irregular trabecular-inspired strut lattice
// Supports 3D omnidirectional load vectors & Green->Yellow->Red stress
// ============================================================

import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { compute3DLoadSpatialInfluence } from "@/lib/simulation/loadModel";
import { computeOmnidirectionalDeformationVector } from "@/lib/simulation/deformationModel";
import { demandToStressRGB } from "@/lib/simulation/stressModel";
import type { StrutElement } from "@/lib/simulation/types";

// ── Stress-to-colour mapping: Green (#4CAF50) -> Yellow (#F2C94C) -> Red (#E05252) ──
function demandToColor(demand: number): THREE.Color {
  const [r, g, b] = demandToStressRGB(demand);
  const color = new THREE.Color();
  color.setRGB(r, g, b);
  return color;
}

const DEFAULT_STRUCTURAL_COLOR = new THREE.Color("#A9D8F5");

// ── Cylinder matrix for a strut under 3D omnidirectional deformation ──
function strutMatrix(
  s: StrutElement,
  deformVec: [number, number, number]
): THREE.Matrix4 {
  const [vx, vy, vz] = deformVec;
  const start = new THREE.Vector3(s.startX, s.startY, s.startZ);
  const end = new THREE.Vector3(s.endX + vx, s.endY + vy, s.endZ + vz);
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
  loadPosX: number;
  loadPosY: number;
  loadPosZ: number;
  loadDirX: number;
  loadDirY: number;
  loadDirZ: number;
}

function BoneInstanced({
  struts,
  showStress,
  showDeformation,
  globalDeform,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
}: BoneInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Shared cylinder geometry (reused for all struts)
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1, 1, 2, 12, 1);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    for (const s of struts) {
      const mx = (s.startX + s.endX) / 2;
      const my = (s.startY + s.endY) / 2;
      const mz = (s.startZ + s.endZ) / 2;

      // 3D Gaussian proximity to load application point
      const spatialFactor = compute3DLoadSpatialInfluence(
        mx,
        my,
        mz,
        loadPosX,
        loadPosY,
        loadPosZ
      );

      // 3D Omnidirectional displacement vector
      let deformVec: [number, number, number] = [0, 0, 0];
      if (showDeformation) {
        deformVec = computeOmnidirectionalDeformationVector(
          globalDeform,
          s.demand,
          spatialFactor,
          loadDirX,
          loadDirY,
          loadDirZ
        );
      }

      matrices.push(strutMatrix(s, deformVec));
      colors.push(
        showStress ? demandToColor(s.demand) : DEFAULT_STRUCTURAL_COLOR
      );
    }
    return { matrices, colors };
  }, [
    struts,
    showStress,
    showDeformation,
    globalDeform,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
  ]);

  useLayoutEffect(() => {
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
        color="#FFFFFF"
        roughness={0.4}
        metalness={0.05}
      />
    </instancedMesh>
  );
}

export function BoneModel() {
  const { state, output } = useSimulation();
  const {
    showStress,
    showDeformation,
    deformationScale,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
  } = state;

  const struts = output.struts ?? [];
  const globalDeform = output.deformation * deformationScale;

  if (struts.length === 0) {
    return (
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#A9D8F5" />
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
        loadPosX={loadPosX}
        loadPosY={loadPosY}
        loadPosZ={loadPosZ}
        loadDirX={loadDirX}
        loadDirY={loadDirY}
        loadDirZ={loadDirZ}
      />
    </group>
  );
}
