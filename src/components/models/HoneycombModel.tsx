"use client";

// ============================================================
// HoneycombModel.tsx — Continuous 3D Honeycomb Structural Grid
// Seamless hexagonal honeycomb core with omnidirectional deformation,
// Green->Yellow->Red stress colors, inspection cutaway, and failure destruction physics!
// ============================================================

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import {
  generateHoneycombCells,
  computeHoneycombRelativeDensity,
} from "@/lib/simulation/honeycombModel";
import { computeDeformation, computeOmnidirectionalDeformationVector } from "@/lib/simulation/deformationModel";
import { compute3DLoadSpatialInfluence } from "@/lib/simulation/loadModel";
import { demandToStressRGB } from "@/lib/simulation/stressModel";
import { clamp } from "@/lib/simulation/normalize";
import { THRESHOLD_HONEYCOMB_N } from "@/lib/simulation/constants";

function stressToColor(demand: number): THREE.Color {
  const [r, g, b] = demandToStressRGB(demand);
  const color = new THREE.Color();
  color.setRGB(r, g, b);
  return color;
}

const DEFAULT_STRUCTURAL_COLOR = new THREE.Color("#A9D8F5");

function createContinuousHexPrismGeometry(
  R: number,
  height: number,
  wallThicknessMm: number,
  cellSizeMm: number
): THREE.BufferGeometry {
  const outerR = R;
  const wtRatio = clamp(wallThicknessMm / cellSizeMm, 0.05, 0.45);
  const innerR = Math.max(outerR * (1 - wtRatio), outerR * 0.15);

  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = outerR * Math.cos(angle);
    const y = outerR * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

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
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

export function HoneycombModel() {
  const { state, output, setParam } = useSimulation();
  const {
    loadN,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
    cellSizeMm,
    wallThicknessMm,
    cellCount,
    showStress,
    showDeformation,
    deformationScale,
    inspectionMode,
    cutawayOpacity,
  } = state;

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const burstRef = useRef<THREE.Mesh>(null);

  const isFailed = loadN >= THRESHOLD_HONEYCOMB_N;
  const [animTime, setAnimTime] = useState(0);
  const animTimeRef = useRef(0);

  useEffect(() => {
    if (!isFailed) {
      animTimeRef.current = 0;
      setAnimTime(0);
    }
  }, [isFailed, loadN]);

  const cells = useMemo(
    () =>
      generateHoneycombCells(
        cellSizeMm,
        wallThicknessMm,
        cellCount,
        loadN,
        loadPosX,
        loadPosY,
        loadPosZ,
        loadDirX,
        loadDirY,
        loadDirZ
      ),
    [
      cellSizeMm,
      wallThicknessMm,
      cellCount,
      loadN,
      loadPosX,
      loadPosY,
      loadPosZ,
      loadDirX,
      loadDirY,
      loadDirZ,
    ]
  );

  const { geometry } = useMemo(() => {
    const gridRadius = clamp(Math.round(cellCount), 1, 6);
    const totalBlockSpan = 3.4;
    const R = totalBlockSpan / (gridRadius * 2 * Math.sqrt(3) * 0.55 + 1.2);
    const height = 1.8;
    const geo = createContinuousHexPrismGeometry(R, height, wallThicknessMm, cellSizeMm);
    return { geometry: geo };
  }, [cellSizeMm, wallThicknessMm, cellCount]);

  const rho = computeHoneycombRelativeDensity(wallThicknessMm, cellSizeMm);
  const globalDeform = computeDeformation(loadN, rho, deformationScale, 0.85);

  const explosionData = useMemo(() => {
    return cells.map((cell, idx) => {
      const pos = new THREE.Vector3(cell.centerX, cell.centerY, cell.centerZ);
      const dir = pos.clone().normalize();
      dir.x += (Math.sin(idx * 1.7) - 0.5) * 0.4;
      dir.y += 0.4 + Math.abs(Math.cos(idx * 2.3)) * 0.6;
      dir.z += (Math.cos(idx * 1.3) - 0.5) * 0.4;
      dir.normalize();
      return {
        velocity: dir.multiplyScalar(2.4 + (idx % 4) * 0.5),
        rotAxis: new THREE.Vector3(Math.sin(idx * 2.2), Math.cos(idx * 1.8), Math.sin(idx * 3.4)).normalize(),
        rotSpeed: 1.7 + (idx % 3) * 1.1,
      };
    });
  }, [cells]);

  useFrame((_, delta) => {
    if (!isFailed) return;

    if (animTimeRef.current < 3.5) {
      animTimeRef.current += delta;
      setAnimTime(animTimeRef.current);
    }

    const t = Math.min(animTimeRef.current, 3.5);
    const gravity = -4.5;
    const damping = Math.exp(-t * 0.75);

    if (burstRef.current) {
      const burstScale = 1.0 + t * 4.5;
      burstRef.current.scale.set(burstScale, burstScale, burstScale);
      const burstMat = burstRef.current.material as THREE.MeshBasicMaterial;
      if (burstMat) {
        burstMat.opacity = Math.max(0, 0.8 - t * 0.7);
      }
    }

    const mesh = meshRef.current;
    if (mesh) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const exp = explosionData[i];
        if (!cell || !exp) continue;

        const progressT = Math.min(t, 2.5);
        const curX = cell.centerX + exp.velocity.x * progressT * damping;
        const curY = Math.max(
          -3.2,
          cell.centerY + exp.velocity.y * progressT + 0.5 * gravity * progressT * progressT
        );
        const curZ = cell.centerZ + exp.velocity.z * progressT * damping;

        dummy.position.set(curX, curY, curZ);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        const angle = exp.rotSpeed * progressT * damping;
        dummy.rotateOnAxis(exp.rotAxis, angle);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    for (const cell of cells) {
      const spatialFactor = compute3DLoadSpatialInfluence(
        cell.centerX,
        cell.centerY,
        cell.centerZ,
        loadPosX,
        loadPosY,
        loadPosZ
      );

      let [vx, vy, vz] = [0, 0, 0];
      if (showDeformation && !isFailed) {
        [vx, vy, vz] = computeOmnidirectionalDeformationVector(
          globalDeform,
          cell.demand,
          spatialFactor,
          loadDirX,
          loadDirY,
          loadDirZ
        );
      }

      dummy.position.set(cell.centerX + vx, cell.centerY + vy, cell.centerZ + vz);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());

      const color = showStress
        ? stressToColor(cell.demand)
        : DEFAULT_STRUCTURAL_COLOR;
      colors.push(color);
    }
    return { matrices, colors };
  }, [
    cells,
    showStress,
    showDeformation,
    globalDeform,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
    isFailed,
  ]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || isFailed) return;
    for (let i = 0; i < matrices.length; i++) {
      mesh.setMatrixAt(i, matrices[i]);
      mesh.setColorAt(i, colors[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors, isFailed]);

  if (cells.length === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, cells.length]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setParam("loadPosX", parseFloat(e.point.x.toFixed(2)));
          setParam("loadPosY", parseFloat(e.point.y.toFixed(2)));
          setParam("loadPosZ", parseFloat(e.point.z.toFixed(2)));
        }}
      >
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.4}
          metalness={0.05}
          side={THREE.DoubleSide}
          transparent={inspectionMode}
          opacity={inspectionMode ? (cutawayOpacity ?? 0.35) : 1.0}
        />
      </instancedMesh>

      {isFailed && animTime < 2.5 && (
        <mesh ref={burstRef} position={[loadPosX, 0.5, loadPosZ]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color="#E05252" transparent opacity={0.7} wireframe />
        </mesh>
      )}

      {isFailed && (
        <group position={[0, 4.0, 0]}>
          <Text position={[0, 0, 0]} fontSize={0.34} color="#E05252" anchorX="center" anchorY="middle">
            ⚠ STRUCTURAL FAILURE: HONEYCOMB CRUSHED
          </Text>
          <Text position={[0, -0.4, 0]} fontSize={0.22} color="#62748A" anchorX="center" anchorY="middle">
            {`(Honeycomb threshold: ${THRESHOLD_HONEYCOMB_N} N exceeded)`}
          </Text>
        </group>
      )}
    </group>
  );
}
