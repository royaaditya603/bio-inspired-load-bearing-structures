"use client";

// ============================================================
// TriangleModel.tsx — 3D Equilateral Triangular Cellular Grid (Isogrid)
// Repeated connected 3D triangular lattice with omnidirectional deformation,
// Green->Yellow->Red stress colors, inspection cutaway, and failure destruction physics!
// ============================================================

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { clamp } from "@/lib/simulation/normalize";
import { compute3DLoadSpatialInfluence } from "@/lib/simulation/loadModel";
import { computeOmnidirectionalDeformationVector } from "@/lib/simulation/deformationModel";
import { demandToStressRGB } from "@/lib/simulation/stressModel";
import { THRESHOLD_TRIANGLE_N } from "@/lib/simulation/constants";

interface TriCellData {
  id: number;
  initialPos: [number, number, number];
  rotation: number;
  outwardDir: THREE.Vector3;
  velocity: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
}

function generateTriangleCells(cellCount: number): TriCellData[] {
  const cells: TriCellData[] = [];
  let id = 0;
  const count = clamp(Math.round(cellCount), 3, 6);
  const side = 3.2 / count;
  const h = (Math.sqrt(3) / 2) * side;
  const rows = count;
  const cols = count + 1;

  for (let r = -rows / 2; r < rows / 2; r++) {
    for (let c = -cols / 2; c < cols / 2; c++) {
      const x = c * side + (Math.abs(r) % 2 === 1 ? side / 2 : 0);
      const z = r * h;

      // Upward triangle
      const posUp = new THREE.Vector3(x, 0, z);
      const dirUp = posUp.clone().normalize();
      dirUp.x += (Math.sin(id * 1.7) - 0.5) * 0.4;
      dirUp.y += 0.4 + Math.abs(Math.cos(id * 2.3)) * 0.6;
      dirUp.z += (Math.cos(id * 1.3) - 0.5) * 0.4;
      dirUp.normalize();

      cells.push({
        id: id++,
        initialPos: [x, 0, z],
        rotation: 0,
        outwardDir: dirUp,
        velocity: dirUp.clone().multiplyScalar(2.4 + (id % 4) * 0.6),
        rotAxis: new THREE.Vector3(Math.sin(id * 2.1), Math.cos(id * 1.7), Math.sin(id * 3.3)).normalize(),
        rotSpeed: 1.8 + (id % 3) * 1.2,
      });

      // Inverted triangle (fills space forming connected isogrid)
      const posInv = new THREE.Vector3(x + side / 2, 0, z + h / 3);
      const dirInv = posInv.clone().normalize();
      dirInv.x += (Math.sin(id * 1.9) - 0.5) * 0.4;
      dirInv.y += 0.4 + Math.abs(Math.cos(id * 2.5)) * 0.6;
      dirInv.z += (Math.cos(id * 1.5) - 0.5) * 0.4;
      dirInv.normalize();

      cells.push({
        id: id++,
        initialPos: [x + side / 2, 0, z + h / 3],
        rotation: Math.PI,
        outwardDir: dirInv,
        velocity: dirInv.clone().multiplyScalar(2.4 + (id % 4) * 0.6),
        rotAxis: new THREE.Vector3(Math.sin(id * 2.7), Math.cos(id * 1.9), Math.sin(id * 3.1)).normalize(),
        rotSpeed: 1.8 + (id % 3) * 1.2,
      });
    }
  }

  return cells;
}

export function TriangleModel() {
  const { state, output, setParam } = useSimulation();
  const {
    loadN,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
    wallThicknessMm,
    cellSizeMm,
    cellCount,
    showStress,
    showDeformation,
    deformationScale,
    inspectionMode,
    cutawayOpacity,
  } = state;

  const cells = useMemo(() => generateTriangleCells(cellCount), [cellCount]);
  const groupRef = useRef<THREE.Group>(null);
  const burstRef = useRef<THREE.Mesh>(null);

  // Failure condition check
  const isFailed = loadN >= THRESHOLD_TRIANGLE_N;
  const [animTime, setAnimTime] = useState(0);
  const animTimeRef = useRef(0);

  useEffect(() => {
    if (!isFailed) {
      animTimeRef.current = 0;
      setAnimTime(0);
    }
  }, [isFailed, loadN]);

  // Destruction physics loop
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

    if (groupRef.current) {
      const meshes = groupRef.current.children;
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i] as THREE.Mesh;
        const c = cells[i];
        if (!c) continue;

        const progressT = Math.min(t, 2.5);
        const curX = c.initialPos[0] + c.velocity.x * progressT * damping;
        const curY = Math.max(
          -3.2,
          c.initialPos[1] + c.velocity.y * progressT + 0.5 * gravity * progressT * progressT
        );
        const curZ = c.initialPos[2] + c.velocity.z * progressT * damping;

        mesh.position.set(curX, curY, curZ);
        const angle = c.rotSpeed * progressT * damping;
        mesh.quaternion.setFromAxisAngle(c.rotAxis, angle);
      }
    }
  });

  // Cell Geometry definition
  const count = clamp(Math.round(cellCount), 3, 6);
  const side = 3.2 / count;
  const outerR = side * 0.55;
  const wtRatio = clamp(wallThicknessMm / cellSizeMm, 0.08, 0.45);
  const innerR = Math.max(outerR * (1 - wtRatio), outerR * 0.2);
  const height = 1.8;

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const px = outerR * Math.cos(a);
      const py = outerR * Math.sin(a);
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();

    const hole = new THREE.Path();
    for (let i = 0; i < 3; i++) {
      const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const px = innerR * Math.cos(a);
      const py = innerR * Math.sin(a);
      if (i === 0) hole.moveTo(px, py);
      else hole.lineTo(px, py);
    }
    hole.closePath();
    shape.holes.push(hole);

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
    extrudeGeo.center();
    extrudeGeo.computeVertexNormals();
    return extrudeGeo;
  }, [outerR, innerR, height]);

  const globalDeform = output.deformation * deformationScale;

  return (
    <group>
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          setParam("loadPosX", parseFloat(e.point.x.toFixed(2)));
          setParam("loadPosY", parseFloat(e.point.y.toFixed(2)));
          setParam("loadPosZ", parseFloat(e.point.z.toFixed(2)));
        }}
      >
        {cells.map((c) => {
          const [cx, cy, cz] = c.initialPos;
          const spatialFactor = compute3DLoadSpatialInfluence(
            cx,
            cy,
            cz,
            loadPosX,
            loadPosY,
            loadPosZ
          );
          const demand = clamp(spatialFactor * (loadN / THRESHOLD_TRIANGLE_N), 0, 1);

          let [vx, vy, vz] = [0, 0, 0];
          if (showDeformation && !isFailed) {
            [vx, vy, vz] = computeOmnidirectionalDeformationVector(
              globalDeform,
              demand,
              spatialFactor,
              loadDirX,
              loadDirY,
              loadDirZ
            );
          }

          let color = "#A9D8F5";
          if (showStress) {
            const [r, g, bVal] = demandToStressRGB(demand);
            color = new THREE.Color(r, g, bVal).getStyle();
          }

          return (
            <mesh
              key={c.id}
              position={[cx + vx, cy + vy, cz + vz]}
              rotation={[Math.PI / 2, 0, c.rotation]}
              geometry={geo}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                metalness={0.05}
                side={THREE.DoubleSide}
                transparent={inspectionMode}
                opacity={inspectionMode ? (cutawayOpacity ?? 0.35) : 1.0}
              />
            </mesh>
          );
        })}
      </group>

      {/* Burst shockwave */}
      {isFailed && animTime < 2.5 && (
        <mesh ref={burstRef} position={[loadPosX, 0.5, loadPosZ]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color="#E05252" transparent opacity={0.7} wireframe />
        </mesh>
      )}

      {/* Failure badge */}
      {isFailed && (
        <group position={[0, 4.0, 0]}>
          <Text position={[0, 0, 0]} fontSize={0.34} color="#E05252" anchorX="center" anchorY="middle">
            ⚠ STRUCTURAL FAILURE: TRIANGULAR LATTICE FRACTURED
          </Text>
          <Text position={[0, -0.4, 0]} fontSize={0.22} color="#62748A" anchorX="center" anchorY="middle">
            {`(Triangle threshold: ${THRESHOLD_TRIANGLE_N} N exceeded)`}
          </Text>
        </group>
      )}
    </group>
  );
}
