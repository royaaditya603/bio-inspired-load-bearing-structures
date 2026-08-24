"use client";

// ============================================================
// LoadArrow.tsx — Omnidirectional 3D Applied Load Indicator
// Always visible on external surface, never buried inside geometry
// ============================================================

import React, { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { computeLoadArrowScale, computeNormalizedLoadDirection } from "@/lib/simulation/loadModel";

interface LoadArrowProps {
  loadN: number;
  posX?: number;
  posY?: number;
  posZ?: number;
  dirX?: number;
  dirY?: number;
  dirZ?: number;
}

export function LoadArrow({
  loadN,
  posX = 0,
  posY = 2.5,
  posZ = 0,
  dirX = 0,
  dirY = -1,
  dirZ = 0,
}: LoadArrowProps) {
  const scale = computeLoadArrowScale(loadN);
  const arrowLength = 1.6 * scale;
  const shaftRadius = 0.075 * scale;
  const headRadius = 0.18 * scale;
  const headLength = 0.45 * scale;
  const totalLength = arrowLength + headLength;

  // Normalized direction along which force is applied into the structure
  const [ndx, ndy, ndz] = useMemo(
    () => computeNormalizedLoadDirection(dirX, dirY, dirZ),
    [dirX, dirY, dirZ]
  );

  const { targetPoint, tailPoint, quaternion, labelPos } = useMemo(() => {
    const dir = new THREE.Vector3(ndx, ndy, ndz).normalize();
    const target = new THREE.Vector3(posX, posY, posZ);

    // Arrow tail starts outside the surface along -dir
    const tail = target.clone().sub(dir.clone().multiplyScalar(totalLength));

    // Calculate rotation to align cylinder (which is oriented along +Y) with dir
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);

    // Position label near arrow tail
    const label = tail.clone().sub(dir.clone().multiplyScalar(0.4));

    return {
      targetPoint: target,
      tailPoint: tail,
      quaternion: quat,
      labelPos: label,
    };
  }, [posX, posY, posZ, ndx, ndy, ndz, totalLength]);

  return (
    <group>
      {/* Target surface contact ring */}
      <mesh
        position={[targetPoint.x, targetPoint.y, targetPoint.z]}
        quaternion={quaternion}
      >
        <ringGeometry args={[0.06, 0.22, 16]} />
        <meshBasicMaterial color="#E5A812" side={THREE.DoubleSide} />
      </mesh>

      {/* Group centered at tail, pointing along dir towards target */}
      <group position={[tailPoint.x, tailPoint.y, tailPoint.z]} quaternion={quaternion}>
        {/* Arrow shaft */}
        <mesh position={[0, arrowLength / 2, 0]} castShadow>
          <cylinderGeometry args={[shaftRadius, shaftRadius, arrowLength, 16]} />
          <meshStandardMaterial
            color="#E5A812"
            roughness={0.25}
            metalness={0.15}
            emissive="#D49405"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Arrow head pointing forward towards target */}
        <mesh position={[0, arrowLength + headLength / 2, 0]} castShadow>
          <coneGeometry args={[headRadius, headLength, 16]} />
          <meshStandardMaterial
            color="#E5A812"
            roughness={0.25}
            metalness={0.15}
            emissive="#D49405"
            emissiveIntensity={0.25}
          />
        </mesh>
      </group>

      {/* High-contrast Load Label with coordinate and direction readout */}
      <Text
        position={[labelPos.x, labelPos.y + 0.35, labelPos.z]}
        fontSize={0.28}
        color="#1C4C74"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {`↓ ${loadN} N [DIR: ${ndx >= 0 ? "+" : ""}${ndx.toFixed(1)}, ${ndy >= 0 ? "+" : ""}${ndy.toFixed(1)}, ${ndz >= 0 ? "+" : ""}${ndz.toFixed(1)}]`}
      </Text>
    </group>
  );
}
