"use client";

// ============================================================
// HoneycombModel.tsx — Regular hexagonal cellular 3D structure
// ============================================================

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import {
  generateHoneycombCells,
  computeHoneycombRelativeDensity,
} from "@/lib/simulation/honeycombModel";
import { computeDeformation } from "@/lib/simulation/deformationModel";
import { clamp } from "@/lib/simulation/normalize";

// ── Stress-to-colour mapping (blue → yellow) ──────────────────
function stressToColor(demand: number): THREE.Color {
  // 0 = deep blue, 1 = bright yellow
  const d = clamp(demand, 0, 1);
  const r = d * 0.945 + (1 - d) * 0.306;
  const g = d * 0.788 + (1 - d) * 0.663;
  const b = (1 - d) * 0.875 + d * 0.298;
  return new THREE.Color(r, g, b);
}

// ── Hexagonal prism geometry ──────────────────────────────────
function createHexPrismGeometry(circumRadius: number, height: number, wallThickness: number): THREE.BufferGeometry {
  // We create a hollow hex prism as an ExtrudeGeometry with a hexagonal shape minus inner void
  const outerR = circumRadius;
  const innerR = Math.max(circumRadius - wallThickness, circumRadius * 0.1);

  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = outerR * Math.cos(angle);
    const y = outerR * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  // Hole (inner void)
  const hole = new THREE.Path();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = innerR * Math.cos(angle);
    const y = innerR * Math.sin(angle);
    if (i === 0) hole.moveTo(x, y);
    else hole.lineTo(x, y);
  }
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geo.center();
  return geo;
}

export function HoneycombModel() {
  const { state, output } = useSimulation();
  const {
    loadN,
    cellSizeMm,
    wallThicknessMm,
    cellCount,
    showStress,
    showDeformation,
    deformationScale,
    relativeDensity,
  } = state;

  const meshRef = useRef<THREE.InstancedMesh>(null);

  // ── Generate cell data ─────────────────────────────────────
  const cells = useMemo(
    () => generateHoneycombCells(cellSizeMm, wallThicknessMm, cellCount, loadN),
    [cellSizeMm, wallThicknessMm, cellCount, loadN]
  );

  // ── Geometry (shared, reused for instancing) ───────────────
  const { geometry, circumRadius } = useMemo(() => {
    const circumRadius = clamp(cellSizeMm, 5, 50) / 10 * 0.48;
    const wt = clamp(wallThicknessMm, 0.5, 8) / 10;
    const height = 2.0; // fixed prism height in scene units
    const geo = createHexPrismGeometry(circumRadius, height, wt);
    return { geometry: geo, circumRadius };
  }, [cellSizeMm, wallThicknessMm]);

  // ── Global deformation for animation ──────────────────────
  const rho = computeHoneycombRelativeDensity(wallThicknessMm, cellSizeMm);
  const globalDeform = computeDeformation(loadN, rho, deformationScale, 0.85);

  // ── Build instance matrices and colours ───────────────────
  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();
    const HEIGHT = 2.0;

    for (const cell of cells) {
      const deformY = showDeformation
        ? -cell.demand * globalDeform * cell.centerZ * 0.1
        : 0;

      dummy.position.set(cell.centerX, cell.centerY + deformY, cell.centerZ);
      dummy.rotation.set(Math.PI / 2, 0, 0); // lay hex flat on X-Z plane
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());

      const color = showStress
        ? stressToColor(cell.demand)
        : new THREE.Color("#4EA9E0");
      colors.push(color);
    }
    return { matrices, colors };
  }, [cells, showStress, showDeformation, globalDeform]);

  // ── Apply matrices & colours to InstancedMesh ─────────────
  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      mesh.setColorAt(i, colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors]);

  if (cells.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, cells.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          vertexColors
          roughness={0.35}
          metalness={0.15}
          envMapIntensity={0.6}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
