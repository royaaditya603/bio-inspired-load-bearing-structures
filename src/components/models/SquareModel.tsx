"use client";

// ============================================================
// SquareModel.tsx — 3D Orthogonal Square Cellular Grid (Orthogrid)
// Repeated connected 3D square lattice with omnidirectional deformation,
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
import { THRESHOLD_SQUARE_N } from "@/lib/simulation/constants";

interface SqCellData {
  id: number;
  initialPos: [number, number, number];
  outwardDir: THREE.Vector3;
  velocity: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
}

function generateSquareCells(cellCount: number): SqCellData[] {
  const cells: SqCellData[] = [];
  let id = 0;
  const count = clamp(Math.round(cellCount), 3, 6);
  const size = 3.2 / count;

  for (let r = -count / 2; r < count / 2; r++) {
    for (let c = -count / 2; c < count / 2; c++) {
      const x = c * size + size / 2;
      const z = r * size + size / 2;
      const pos = new THREE.Vector3(x, 0, z);
      const dir = pos.clone().normalize();
      dir.x += (Math.sin(id * 1.8) - 0.5) * 0.4;
      dir.y += 0.4 + Math.abs(Math.cos(id * 2.2)) * 0.6;
      dir.z += (Math.cos(id * 1.4) - 0.5) * 0.4;
      dir.normalize();

      cells.push({
        id: id++,
        initialPos: [x, 0, z],
        outwardDir: dir,
        velocity: dir.clone().multiplyScalar(2.3 + (id % 4) * 0.5),
        rotAxis: new THREE.Vector3(Math.sin(id * 2.3), Math.cos(id * 1.9), Math.sin(id * 3.5)).normalize(),
        rotSpeed: 1.6 + (id % 3) * 1.1,
      });
    }
  }

  return cells;
}

export function SquareModel() {
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

  const cells = useMemo(() => generateSquareCells(cellCount), [cellCount]);
  const groupRef = useRef<THREE.Group>(null);
  const burstRef = useRef<THREE.Mesh>(null);

  const isFailed = loadN >= THRESHOLD_SQUARE_N;
  const [animTime, setAnimTime] = useState(0);
  const animTimeRef = useRef(0);

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

  const count = clamp(Math.round(cellCount), 3, 6);
  const size = 3.2 / count;
  const outerS = size / 2;
  const wtRatio = clamp(wallThicknessMm / cellSizeMm, 0.08, 0.45);
  const innerS = Math.max(outerS * (1 - wtRatio), outerS * 0.2);
  const height = 1.8;

  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-outerS, -outerS);
    shape.lineTo(outerS, -outerS);
    shape.lineTo(outerS, outerS);
    shape.lineTo(-outerS, outerS);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-innerS, -innerS);
    hole.lineTo(innerS, -innerS);
    hole.lineTo(innerS, innerS);
    hole.lineTo(-innerS, innerS);
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
  }, [outerS, innerS, height]);

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
          const demand = clamp(spatialFactor * (loadN / THRESHOLD_SQUARE_N), 0, 1);

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
              rotation={[Math.PI / 2, 0, 0]}
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

      {isFailed && animTime < 2.5 && (
        <mesh ref={burstRef} position={[loadPosX, 0.5, loadPosZ]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial color="#E05252" transparent opacity={0.7} wireframe />
        </mesh>
      )}

      {isFailed && (
        <group position={[0, 4.0, 0]}>
          <Text position={[0, 0, 0]} fontSize={0.34} color="#E05252" anchorX="center" anchorY="middle">
            ⚠ STRUCTURAL FAILURE: SQUARE LATTICE COLLAPSED
          </Text>
          <Text position={[0, -0.4, 0]} fontSize={0.22} color="#62748A" anchorX="center" anchorY="middle">
            {`(Square threshold: ${THRESHOLD_SQUARE_N} N exceeded)`}
          </Text>
        </group>
      )}
    </group>
  );
}
