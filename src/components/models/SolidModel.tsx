"use client";

// ============================================================
// SolidModel.tsx — Staggered Brick Masonry Structure
// Features omnidirectional deformation, Green->Yellow->Red stress colors,
// cursor raycasting, and the Easter Egg explosion!
// ============================================================

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { clamp } from "@/lib/simulation/normalize";
import {
  compute3DLoadSpatialInfluence,
} from "@/lib/simulation/loadModel";
import { computeOmnidirectionalDeformationVector } from "@/lib/simulation/deformationModel";
import { demandToStressRGB } from "@/lib/simulation/stressModel";
import { THRESHOLD_SOLID_N } from "@/lib/simulation/constants";

interface BrickData {
  id: number;
  initialPos: [number, number, number];
  size: [number, number, number];
  outwardDir: THREE.Vector3;
  velocity: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
}

// ── Brick grid generator ─────────────────────────────────────
function generateBricks(): BrickData[] {
  const bricks: BrickData[] = [];
  let id = 0;

  const courses = 6; // 6 vertical layers
  const brickHeight = 0.44;
  const mortarGap = 0.04;
  const brickWidth = 0.94;
  const brickDepth = 0.94;
  const startY = -1.35;

  for (let c = 0; c < courses; c++) {
    const y = startY + c * (brickHeight + mortarGap);
    const isStaggered = c % 2 === 1;

    for (let zIdx = -1; zIdx <= 1; zIdx++) {
      const z = zIdx * (brickDepth + mortarGap);

      if (!isStaggered) {
        // 4 standard bricks across X
        for (let xIdx = -1.5; xIdx <= 1.5; xIdx += 1.0) {
          const x = xIdx * (brickWidth + mortarGap);
          const pos = new THREE.Vector3(x, y, z);
          const dir = pos.clone().normalize();
          dir.x += (Math.sin(id * 1.7) - 0.5) * 0.4;
          dir.y += 0.3 + Math.abs(Math.cos(id * 2.3)) * 0.6; // upward initial impulse
          dir.z += (Math.cos(id * 1.3) - 0.5) * 0.4;
          dir.normalize();

          const speed = 2.2 + (id % 5) * 0.5;
          const rotAxis = new THREE.Vector3(
            Math.sin(id * 3.1),
            Math.cos(id * 2.7),
            Math.sin(id * 1.9)
          ).normalize();

          bricks.push({
            id: id++,
            initialPos: [x, y, z],
            size: [brickWidth, brickHeight, brickDepth],
            outwardDir: dir,
            velocity: dir.clone().multiplyScalar(speed),
            rotAxis,
            rotSpeed: 1.5 + (id % 4) * 1.2,
          });
        }
      } else {
        // Staggered: 1 half brick + 3 full bricks + 1 half brick
        const halfWidth = (brickWidth - mortarGap) / 2;
        const xPositions = [-1.75, -0.98, 0, 0.98, 1.75];
        const widths = [halfWidth, brickWidth, brickWidth, brickWidth, halfWidth];

        for (let i = 0; i < xPositions.length; i++) {
          const x = xPositions[i];
          const w = widths[i];
          const pos = new THREE.Vector3(x, y, z);
          const dir = pos.clone().normalize();
          dir.x += (Math.sin(id * 1.9) - 0.5) * 0.4;
          dir.y += 0.35 + Math.abs(Math.cos(id * 2.1)) * 0.6;
          dir.z += (Math.cos(id * 1.5) - 0.5) * 0.4;
          dir.normalize();

          const speed = 2.4 + (id % 5) * 0.5;
          const rotAxis = new THREE.Vector3(
            Math.sin(id * 2.3),
            Math.cos(id * 3.7),
            Math.sin(id * 1.1)
          ).normalize();

          bricks.push({
            id: id++,
            initialPos: [x, y, z],
            size: [w, brickHeight, brickDepth],
            outwardDir: dir,
            velocity: dir.clone().multiplyScalar(speed),
            rotAxis,
            rotSpeed: 1.8 + (id % 4) * 1.1,
          });
        }
      }
    }
  }

  return bricks;
}

export function SolidModel() {
  const { state, output, setParam } = useSimulation();
  const {
    loadN,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
    showDeformation,
    showStress,
    deformationScale,
  } = state;

  const bricks = useMemo(() => generateBricks(), []);
  const brickGroupRef = useRef<THREE.Group>(null);
  const burstRef = useRef<THREE.Mesh>(null);

  // Failure condition check:
  // Load exceeds 2000 N AND load is placed near structure centre (|X| < 0.6, |Z| < 0.6)
  const isCenterLoad = Math.abs(loadPosX) < 0.6 && Math.abs(loadPosZ) < 0.6;
  const isExploded = loadN >= THRESHOLD_SOLID_N && isCenterLoad;

  const [animTime, setAnimTime] = useState(0);
  const animTimeRef = useRef(0);

  // Reset animation time when explosion condition toggles
  useEffect(() => {
    if (!isExploded) {
      animTimeRef.current = 0;
      setAnimTime(0);
    }
  }, [isExploded, loadN]);

  // Animation loop for brick explosion physics
  useFrame((_, delta) => {
    if (!isExploded) return;

    if (animTimeRef.current < 3.5) {
      animTimeRef.current += delta;
      setAnimTime(animTimeRef.current);
    }

    const t = Math.min(animTimeRef.current, 3.5);
    const gravity = -4.5;
    const damping = Math.exp(-t * 0.75);

    // Update burst shockwave ring
    if (burstRef.current) {
      const burstScale = 1.0 + t * 4.5;
      burstRef.current.scale.set(burstScale, burstScale, burstScale);
      const burstMat = burstRef.current.material as THREE.MeshBasicMaterial;
      if (burstMat) {
        burstMat.opacity = Math.max(0, 0.8 - t * 0.7);
      }
    }

    // Animate each brick mesh
    if (brickGroupRef.current) {
      const meshes = brickGroupRef.current.children;
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i] as THREE.Mesh;
        const b = bricks[i];
        if (!b) continue;

        const progressT = Math.min(t, 2.5);
        const curX = b.initialPos[0] + b.velocity.x * progressT * damping;
        const curY = Math.max(
          -3.2 + b.size[1] / 2, // ground collision floor
          b.initialPos[1] + b.velocity.y * progressT + 0.5 * gravity * progressT * progressT
        );
        const curZ = b.initialPos[2] + b.velocity.z * progressT * damping;

        mesh.position.set(curX, curY, curZ);

        const angle = b.rotSpeed * progressT * damping;
        mesh.quaternion.setFromAxisAngle(b.rotAxis, angle);
      }
    }
  });

  // Global deformation proxy
  const globalDeform = output.deformation * deformationScale;

  return (
    <group>
      {/* ── Brick masonry meshes ────────────────────────────── */}
      <group
        ref={brickGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          setParam("loadPosX", parseFloat(e.point.x.toFixed(2)));
          setParam("loadPosY", parseFloat(e.point.y.toFixed(2)));
          setParam("loadPosZ", parseFloat(e.point.z.toFixed(2)));
        }}
      >
        {bricks.map((b) => {
          const [bx, by, bz] = b.initialPos;

          // 3D Spatial localized deformation when not exploded
          let [vx, vy, vz] = [0, 0, 0];
          const spatialFactor = compute3DLoadSpatialInfluence(
            bx,
            by,
            bz,
            loadPosX,
            loadPosY,
            loadPosZ
          );
          const demand = clamp(spatialFactor * (loadN / THRESHOLD_SOLID_N), 0, 1);

          if (showDeformation && !isExploded) {
            [vx, vy, vz] = computeOmnidirectionalDeformationVector(
              globalDeform,
              demand,
              spatialFactor,
              loadDirX,
              loadDirY,
              loadDirZ
            );
          }

          // Stress color: Green -> Yellow -> Red
          let brickColor = "#A9D8F5";
          if (showStress) {
            const [r, g, bVal] = demandToStressRGB(demand);
            brickColor = new THREE.Color(r, g, bVal).getStyle();
          }

          return (
            <mesh
              key={b.id}
              position={[bx + vx, by + vy, bz + vz]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[b.size[0], b.size[1], b.size[2]]} />
              <meshStandardMaterial
                color={brickColor}
                roughness={0.45}
                metalness={0.05}
              />
            </mesh>
          );
        })}
      </group>

      {/* ── Expanding burst shockwave effect during explosion ── */}
      {isExploded && animTime < 2.5 && (
        <mesh ref={burstRef} position={[loadPosX, 0.5, loadPosZ]}>
          <sphereGeometry args={[1.2, 24, 24]} />
          <meshBasicMaterial
            color="#E05252"
            transparent
            opacity={0.7}
            wireframe
          />
        </mesh>
      )}

      {/* ── 3D Failure status badge ─────────────────────────── */}
      {isExploded && (
        <group position={[0, 4.0, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.34}
            color="#E05252"
            anchorX="center"
            anchorY="middle"
          >
            ⚠ STRUCTURAL FAILURE: MASONRY COLLAPSED
          </Text>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.22}
            color="#62748A"
            anchorX="center"
            anchorY="middle"
          >
            {`(Solid threshold: ${THRESHOLD_SOLID_N} N exceeded at center load point)`}
          </Text>
        </group>
      )}
    </group>
  );
}
