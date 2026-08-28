"use client";

// ============================================================
// BoneModel.tsx — Compact trabecular-inspired strut lattice
// Supports cursor raycasting, omnidirectional load, Green->Yellow->Red stress,
// Structure Inspection Mode, and failure destruction physics!
// ============================================================

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { compute3DLoadSpatialInfluence } from "@/lib/simulation/loadModel";
import { computeOmnidirectionalDeformationVector } from "@/lib/simulation/deformationModel";
import { demandToStressRGB } from "@/lib/simulation/stressModel";
import { THRESHOLD_BONE_N } from "@/lib/simulation/constants";
import type { StrutElement } from "@/lib/simulation/types";

function demandToColor(demand: number): THREE.Color {
  const [r, g, b] = demandToStressRGB(demand);
  const color = new THREE.Color();
  color.setRGB(r, g, b);
  return color;
}

const DEFAULT_STRUCTURAL_COLOR = new THREE.Color("#A9D8F5");

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
  isFailed: boolean;
  animTime: number;
  loadN: number;
  inspectionMode?: boolean;
  cutawayOpacity?: number;
  onSelectPosition?: (pos: THREE.Vector3) => void;
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
  isFailed,
  animTime,
  loadN,
  inspectionMode = false,
  cutawayOpacity = 0.35,
  onSelectPosition,
}: BoneInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1, 1, 2, 12, 1);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const explosionData = useMemo(() => {
    return struts.map((s, idx) => {
      const mx = (s.startX + s.endX) / 2;
      const my = (s.startY + s.endY) / 2;
      const mz = (s.startZ + s.endZ) / 2;
      const pos = new THREE.Vector3(mx, my, mz);
      const dir = pos.clone().normalize();
      dir.x += (Math.sin(idx * 1.5) - 0.5) * 0.4;
      dir.y += 0.4 + Math.abs(Math.cos(idx * 2.1)) * 0.6;
      dir.z += (Math.cos(idx * 1.7) - 0.5) * 0.4;
      dir.normalize();
      return {
        velocity: dir.multiplyScalar(2.5 + (idx % 4) * 0.5),
        rotAxis: new THREE.Vector3(Math.sin(idx * 2.3), Math.cos(idx * 1.7), Math.sin(idx * 3.1)).normalize(),
        rotSpeed: 1.8 + (idx % 3) * 1.2,
      };
    });
  }, [struts]);

  useFrame(() => {
    if (!isFailed || !meshRef.current) return;
    const mesh = meshRef.current;
    const t = Math.min(animTime, 3.5);
    const gravity = -4.5;
    const damping = Math.exp(-t * 0.75);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < struts.length; i++) {
      const s = struts[i];
      const exp = explosionData[i];
      if (!s || !exp) continue;

      const progressT = Math.min(t, 2.5);
      const mx = (s.startX + s.endX) / 2;
      const my = (s.startY + s.endY) / 2;
      const mz = (s.startZ + s.endZ) / 2;

      const curX = mx + exp.velocity.x * progressT * damping;
      const curY = Math.max(-3.2, my + exp.velocity.y * progressT + 0.5 * gravity * progressT * progressT);
      const curZ = mz + exp.velocity.z * progressT * damping;

      dummy.position.set(curX, curY, curZ);
      const angle = exp.rotSpeed * progressT * damping;
      dummy.quaternion.setFromAxisAngle(exp.rotAxis, angle);
      dummy.scale.set(s.radius, s.length / 2, s.radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];

    for (const s of struts) {
      const mx = (s.startX + s.endX) / 2;
      const my = (s.startY + s.endY) / 2;
      const mz = (s.startZ + s.endZ) / 2;

      const spatialFactor = compute3DLoadSpatialInfluence(
        mx,
        my,
        mz,
        loadPosX,
        loadPosY,
        loadPosZ
      );

      let deformVec: [number, number, number] = [0, 0, 0];
      if (showDeformation && !isFailed) {
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

  if (struts.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, struts.length]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectPosition) onSelectPosition(e.point);
      }}
    >
      <meshStandardMaterial
        color="#FFFFFF"
        roughness={0.4}
        metalness={0.05}
        transparent={inspectionMode}
        opacity={inspectionMode ? (cutawayOpacity ?? 0.5) : 1.0}
      />
    </instancedMesh>
  );
}

export function BoneModel() {
  const { state, output, setParam } = useSimulation();
  const {
    loadN,
    showStress,
    showDeformation,
    deformationScale,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
    inspectionMode,
    cutawayOpacity,
  } = state;

  const struts = output.struts ?? [];
  const globalDeform = output.deformation * deformationScale;

  const isFailed = loadN >= THRESHOLD_BONE_N;
  const [animTime, setAnimTime] = useState(0);
  const animTimeRef = useRef(0);
  const burstRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!isFailed) {
      animTimeRef.current = 0;
      setAnimTime(0);
    }
  }, [isFailed, loadN]);

  useFrame((_, delta) => {
    if (!isFailed) return;
    if (animTimeRef.current < 3.5) {
      animTimeRef.current += delta;
      setAnimTime(animTimeRef.current);
    }
    const t = Math.min(animTimeRef.current, 3.5);
    if (burstRef.current) {
      const burstScale = 1.0 + t * 4.5;
      burstRef.current.scale.set(burstScale, burstScale, burstScale);
      const burstMat = burstRef.current.material as THREE.MeshBasicMaterial;
      if (burstMat) burstMat.opacity = Math.max(0, 0.8 - t * 0.7);
    }
  });

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
        isFailed={isFailed}
        animTime={animTime}
        loadN={loadN}
        inspectionMode={inspectionMode}
        cutawayOpacity={cutawayOpacity}
        onSelectPosition={(pt) => {
          setParam("loadPosX", parseFloat(pt.x.toFixed(2)));
          setParam("loadPosY", parseFloat(pt.y.toFixed(2)));
          setParam("loadPosZ", parseFloat(pt.z.toFixed(2)));
        }}
      />

      {isFailed && animTime < 2.5 && (
        <mesh ref={burstRef} position={[loadPosX, 0.5, loadPosZ]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color="#E05252" transparent opacity={0.7} wireframe />
        </mesh>
      )}

      {isFailed && (
        <group position={[0, 4.0, 0]}>
          <Text position={[0, 0, 0]} fontSize={0.34} color="#E05252" anchorX="center" anchorY="middle">
            ⚠ STRUCTURAL FAILURE: BONE LATTICE YIELDED
          </Text>
          <Text position={[0, -0.4, 0]} fontSize={0.22} color="#62748A" anchorX="center" anchorY="middle">
            {`(Bone lattice threshold: ${THRESHOLD_BONE_N} N exceeded)`}
          </Text>
        </group>
      )}
    </group>
  );
}
