"use client";

// ============================================================
// CellGeometryViewer.tsx — 3D Visualizer for 4 Cellular Topologies
// Renders connected 2D/3D extruded grids for Triangle, Square, Circle, Hexagon
// with real-time Green -> Yellow -> Red stress mapping and deformation.
// ============================================================

import React, { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";
import { demandToStressRGB } from "@/lib/simulation/stressModel";
import { compute3DLoadSpatialInfluence } from "@/lib/simulation/loadModel";
import { computeOmnidirectionalDeformationVector } from "@/lib/simulation/deformationModel";
import { clamp } from "@/lib/simulation/normalize";
import type { CellShape } from "@/lib/simulation/cellGeometryModel";
import { LoadArrow } from "./LoadArrow";

interface CellGridProps {
  shape: CellShape;
  loadN: number;
  loadPosX: number;
  loadPosY: number;
  loadPosZ: number;
  loadDirX: number;
  loadDirY: number;
  loadDirZ: number;
  wallThicknessMm: number;
  cellSizeMm: number;
  showStress: boolean;
  showDeformation: boolean;
  deformationScale: number;
  is3DExtruded?: boolean;
}

// ── Stress color mapper (Green -> Yellow -> Red) ──────────────
function getStressColor(demand: number): string {
  const [r, g, b] = demandToStressRGB(demand);
  return new THREE.Color(r, g, b).getStyle();
}

// ── 1. TRIANGLE GRID (Equilateral Triangular Isogrid) ──────────
function TriangleGridMesh({
  loadN,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
  showStress,
  showDeformation,
  deformationScale,
  is3DExtruded = true,
}: CellGridProps) {
  const height = is3DExtruded ? 1.6 : 0.15;
  const F_norm = clamp((loadN - 500) / 4000, 0, 1);

  // Generate equilateral triangle lattice elements
  const elements = useMemo(() => {
    const items: Array<{
      id: number;
      center: [number, number, number];
      points: [number, number][];
      rotation: number;
    }> = [];
    let id = 0;
    const side = 0.9;
    const h = (Math.sqrt(3) / 2) * side;
    const rows = 4;
    const cols = 5;

    for (let r = -rows / 2; r < rows / 2; r++) {
      for (let c = -cols / 2; c < cols / 2; c++) {
        const x = c * side + (Math.abs(r) % 2 === 1 ? side / 2 : 0);
        const z = r * h;
        // Upward pointing triangle
        items.push({
          id: id++,
          center: [x, 0, z],
          points: [
            [-side / 2, -h / 3],
            [side / 2, -h / 3],
            [0, (2 * h) / 3],
          ],
          rotation: 0,
        });
        // Inverted triangle
        items.push({
          id: id++,
          center: [x + side / 2, 0, z + h / 3],
          points: [
            [-side / 2, h / 3],
            [side / 2, h / 3],
            [0, (-2 * h) / 3],
          ],
          rotation: Math.PI,
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {elements.map((el) => {
        const [cx, cy, cz] = el.center;
        const spatialFactor = compute3DLoadSpatialInfluence(
          cx,
          cy,
          cz,
          loadPosX,
          loadPosY,
          loadPosZ
        );
        const demand = clamp(F_norm * (0.35 + 0.65 * spatialFactor) * 0.85, 0, 1);

        let [vx, vy, vz] = [0, 0, 0];
        if (showDeformation) {
          [vx, vy, vz] = computeOmnidirectionalDeformationVector(
            0.15 * deformationScale,
            demand,
            spatialFactor,
            loadDirX,
            loadDirY,
            loadDirZ
          );
        }

        const color = showStress ? getStressColor(demand) : "#A9D8F5";

        // Extrude hollow triangular cell
        const outerR = 0.42;
        const innerR = 0.28;
        const shape = new THREE.Shape();
        for (let i = 0; i < 3; i++) {
          const a = (i * 2 * Math.PI) / 3 - Math.PI / 2 + el.rotation;
          const px = outerR * Math.cos(a);
          const py = outerR * Math.sin(a);
          if (i === 0) shape.moveTo(px, py);
          else shape.lineTo(px, py);
        }
        shape.closePath();

        const hole = new THREE.Path();
        for (let i = 0; i < 3; i++) {
          const a = (i * 2 * Math.PI) / 3 - Math.PI / 2 + el.rotation;
          const px = innerR * Math.cos(a);
          const py = innerR * Math.sin(a);
          if (i === 0) hole.moveTo(px, py);
          else hole.lineTo(px, py);
        }
        hole.closePath();
        shape.holes.push(hole);

        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false,
        });
        geo.center();

        return (
          <mesh
            key={el.id}
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
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── 2. SQUARE GRID (Orthogonal Square Grid) ───────────────────
function SquareGridMesh({
  loadN,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
  showStress,
  showDeformation,
  deformationScale,
  is3DExtruded = true,
}: CellGridProps) {
  const height = is3DExtruded ? 1.6 : 0.15;
  const F_norm = clamp((loadN - 500) / 4000, 0, 1);

  const cells = useMemo(() => {
    const items: Array<{ id: number; center: [number, number, number] }> = [];
    let id = 0;
    const size = 0.72;
    const count = 4;
    for (let r = -count / 2; r < count / 2; r++) {
      for (let c = -count / 2; c < count / 2; c++) {
        items.push({
          id: id++,
          center: [c * size + size / 2, 0, r * size + size / 2],
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {cells.map((cell) => {
        const [cx, cy, cz] = cell.center;
        const spatialFactor = compute3DLoadSpatialInfluence(
          cx,
          cy,
          cz,
          loadPosX,
          loadPosY,
          loadPosZ
        );
        const demand = clamp(F_norm * (0.35 + 0.65 * spatialFactor) * 0.95, 0, 1);

        let [vx, vy, vz] = [0, 0, 0];
        if (showDeformation) {
          [vx, vy, vz] = computeOmnidirectionalDeformationVector(
            0.18 * deformationScale,
            demand,
            spatialFactor,
            loadDirX,
            loadDirY,
            loadDirZ
          );
        }

        const color = showStress ? getStressColor(demand) : "#A9D8F5";

        // Hollow square extrusion
        const outerS = 0.35;
        const innerS = 0.25;
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

        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false,
        });
        geo.center();

        return (
          <mesh
            key={cell.id}
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
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── 3. CIRCLE GRID (Circular Voids Array) ─────────────────────
function CircleGridMesh({
  loadN,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
  showStress,
  showDeformation,
  deformationScale,
  is3DExtruded = true,
}: CellGridProps) {
  const height = is3DExtruded ? 1.6 : 0.15;
  const F_norm = clamp((loadN - 500) / 4000, 0, 1);

  const cells = useMemo(() => {
    const items: Array<{ id: number; center: [number, number, number] }> = [];
    let id = 0;
    const pitch = 0.72;
    const count = 4;
    for (let r = -count / 2; r < count / 2; r++) {
      for (let c = -count / 2; c < count / 2; c++) {
        items.push({
          id: id++,
          center: [c * pitch + pitch / 2, 0, r * pitch + pitch / 2],
        });
      }
    }
    return items;
  }, []);

  return (
    <group>
      {cells.map((cell) => {
        const [cx, cy, cz] = cell.center;
        const spatialFactor = compute3DLoadSpatialInfluence(
          cx,
          cy,
          cz,
          loadPosX,
          loadPosY,
          loadPosZ
        );
        // Circular voids experience localized hoop stress concentrations
        const demand = clamp(F_norm * (0.35 + 0.65 * spatialFactor) * 1.05, 0, 1);

        let [vx, vy, vz] = [0, 0, 0];
        if (showDeformation) {
          [vx, vy, vz] = computeOmnidirectionalDeformationVector(
            0.17 * deformationScale,
            demand,
            spatialFactor,
            loadDirX,
            loadDirY,
            loadDirZ
          );
        }

        const color = showStress ? getStressColor(demand) : "#A9D8F5";

        // Square matrix with cylindrical circular hole
        const outerS = 0.35;
        const holeR = 0.26;
        const shape = new THREE.Shape();
        shape.moveTo(-outerS, -outerS);
        shape.lineTo(outerS, -outerS);
        shape.lineTo(outerS, outerS);
        shape.lineTo(-outerS, outerS);
        shape.closePath();

        const hole = new THREE.Path();
        const segments = 24;
        for (let i = 0; i < segments; i++) {
          const a = (i * 2 * Math.PI) / segments;
          const px = holeR * Math.cos(a);
          const py = holeR * Math.sin(a);
          if (i === 0) hole.moveTo(px, py);
          else hole.lineTo(px, py);
        }
        hole.closePath();
        shape.holes.push(hole);

        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false,
        });
        geo.center();

        return (
          <mesh
            key={cell.id}
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
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── 4. HEXAGON GRID (Continuous Connected Honeycomb Grid) ──────
function HexagonGridMesh({
  loadN,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
  showStress,
  showDeformation,
  deformationScale,
  is3DExtruded = true,
}: CellGridProps) {
  const height = is3DExtruded ? 1.6 : 0.15;
  const F_norm = clamp((loadN - 500) / 4000, 0, 1);

  const R = 0.42;
  const cells = useMemo(() => {
    const items: Array<{ id: number; center: [number, number, number] }> = [];
    let id = 0;
    const gridRadius = 2;
    for (let q = -gridRadius; q <= gridRadius; q++) {
      const r1 = Math.max(-gridRadius, -q - gridRadius);
      const r2 = Math.min(gridRadius, -q + gridRadius);
      for (let r = r1; r <= r2; r++) {
        const x = R * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
        const z = R * (3 / 2) * r;
        items.push({ id: id++, center: [x, 0, z] });
      }
    }
    return items;
  }, [R]);

  return (
    <group>
      {cells.map((cell) => {
        const [cx, cy, cz] = cell.center;
        const spatialFactor = compute3DLoadSpatialInfluence(
          cx,
          cy,
          cz,
          loadPosX,
          loadPosY,
          loadPosZ
        );
        const demand = clamp(F_norm * (0.35 + 0.65 * spatialFactor) * 0.90, 0, 1);

        let [vx, vy, vz] = [0, 0, 0];
        if (showDeformation) {
          [vx, vy, vz] = computeOmnidirectionalDeformationVector(
            0.16 * deformationScale,
            demand,
            spatialFactor,
            loadDirX,
            loadDirY,
            loadDirZ
          );
        }

        const color = showStress ? getStressColor(demand) : "#A9D8F5";

        const outerR = R;
        const innerR = R * 0.74; // Connected wall thickness
        const shape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const px = outerR * Math.cos(a);
          const py = outerR * Math.sin(a);
          if (i === 0) shape.moveTo(px, py);
          else shape.lineTo(px, py);
        }
        shape.closePath();

        const hole = new THREE.Path();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const px = innerR * Math.cos(a);
          const py = innerR * Math.sin(a);
          if (i === 0) hole.moveTo(px, py);
          else hole.lineTo(px, py);
        }
        hole.closePath();
        shape.holes.push(hole);

        const geo = new THREE.ExtrudeGeometry(shape, {
          depth: height,
          bevelEnabled: false,
        });
        geo.center();

        return (
          <mesh
            key={cell.id}
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
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Single Geometry Scene Canvas ──────────────────────────────
export function SingleGeometryCanvas({
  shape,
  loadN,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
  showStress = true,
  showDeformation = true,
  showLoadArrows = true,
  deformationScale = 1.0,
  wallThicknessMm = 2.0,
  cellSizeMm = 18.0,
  is3DExtruded = true,
  height = "320px",
}: CellGridProps & { showLoadArrows?: boolean; height?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#EEF4F8",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #D7E2EA",
        position: "relative",
      }}
    >
      <Canvas
        camera={{ position: [4.5, 4.5, 4.5], fov: 38, near: 0.05, far: 100 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={["#EEF4F8"]} />
        <ambientLight intensity={1.2} />
        <hemisphereLight args={["#FFFFFF", "#DCEFFA", 1.0]} position={[0, 10, 0]} />
        <directionalLight position={[6, 10, 6]} intensity={1.3} castShadow />
        <directionalLight position={[-6, 6, -6]} intensity={0.7} color="#E3F2FD" />

        <Grid
          position={[0, -1.8, 0]}
          args={[14, 14]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#D2E1EC"
          sectionSize={2.0}
          sectionThickness={1.2}
          sectionColor="#ADC7DC"
          fadeDistance={16}
        />

        {showLoadArrows && (
          <LoadArrow
            loadN={loadN}
            posX={loadPosX}
            posY={loadPosY}
            posZ={loadPosZ}
            dirX={loadDirX}
            dirY={loadDirY}
            dirZ={loadDirZ}
          />
        )}

        {shape === "triangle" && (
          <TriangleGridMesh
            shape="triangle"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
        )}
        {shape === "square" && (
          <SquareGridMesh
            shape="square"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
        )}
        {shape === "circle" && (
          <CircleGridMesh
            shape="circle"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
        )}
        {shape === "hexagon" && (
          <HexagonGridMesh
            shape="hexagon"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
        )}

        <OrbitControls
          makeDefault
          minDistance={1.0}
          maxDistance={18}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
}

// ── 4-Quadrant Simultaneous Side-by-Side 3D Canvas ────────────
export function QuadCellGeometryCanvas({
  loadN,
  loadPosX,
  loadPosY,
  loadPosZ,
  loadDirX,
  loadDirY,
  loadDirZ,
  showStress = true,
  showDeformation = true,
  showLoadArrows = true,
  deformationScale = 1.0,
  wallThicknessMm = 2.0,
  cellSizeMm = 18.0,
  is3DExtruded = true,
  height = "520px",
}: Omit<CellGridProps, "shape"> & { showLoadArrows?: boolean; height?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#EEF4F8",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #D7E2EA",
        position: "relative",
      }}
    >
      <Canvas
        camera={{ position: [0, 11, 14], fov: 42, near: 0.1, far: 150 }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={["#EEF4F8"]} />
        <ambientLight intensity={1.3} />
        <hemisphereLight args={["#FFFFFF", "#DCEFFA", 1.1]} position={[0, 15, 0]} />
        <directionalLight position={[10, 16, 10]} intensity={1.4} castShadow />
        <directionalLight position={[-10, 8, -10]} intensity={0.8} color="#E3F2FD" />

        <Grid
          position={[0, -1.8, 0]}
          args={[32, 32]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#D2E1EC"
          sectionSize={2.5}
          sectionThickness={1.2}
          sectionColor="#ADC7DC"
          fadeDistance={26}
        />

        {/* 1. TRIANGLE (Top-Left quadrant: X = -4.2, Z = -3.5) */}
        <group position={[-4.2, 0, -3.5]}>
          <Text position={[0, 1.8, 0]} fontSize={0.42} color="#1C4C74" anchorX="center">
            ▲ TRIANGLE (Isogrid)
          </Text>
          <TriangleGridMesh
            shape="triangle"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
          {showLoadArrows && (
            <LoadArrow
              loadN={loadN}
              posX={loadPosX}
              posY={loadPosY}
              posZ={loadPosZ}
              dirX={loadDirX}
              dirY={loadDirY}
              dirZ={loadDirZ}
            />
          )}
        </group>

        {/* 2. SQUARE (Top-Right quadrant: X = 4.2, Z = -3.5) */}
        <group position={[4.2, 0, -3.5]}>
          <Text position={[0, 1.8, 0]} fontSize={0.42} color="#1C4C74" anchorX="center">
            ■ SQUARE (Orthogrid)
          </Text>
          <SquareGridMesh
            shape="square"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
          {showLoadArrows && (
            <LoadArrow
              loadN={loadN}
              posX={loadPosX}
              posY={loadPosY}
              posZ={loadPosZ}
              dirX={loadDirX}
              dirY={loadDirY}
              dirZ={loadDirZ}
            />
          )}
        </group>

        {/* 3. CIRCLE (Bottom-Left quadrant: X = -4.2, Z = 3.5) */}
        <group position={[-4.2, 0, 3.5]}>
          <Text position={[0, 1.8, 0]} fontSize={0.42} color="#1C4C74" anchorX="center">
            ● CIRCLE (Radial Voids)
          </Text>
          <CircleGridMesh
            shape="circle"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
          {showLoadArrows && (
            <LoadArrow
              loadN={loadN}
              posX={loadPosX}
              posY={loadPosY}
              posZ={loadPosZ}
              dirX={loadDirX}
              dirY={loadDirY}
              dirZ={loadDirZ}
            />
          )}
        </group>

        {/* 4. HEXAGON (Bottom-Right quadrant: X = 4.2, Z = 3.5) */}
        <group position={[4.2, 0, 3.5]}>
          <Text position={[0, 1.8, 0]} fontSize={0.42} color="#1C4C74" anchorX="center">
            ⬡ HEXAGON (Honeycomb)
          </Text>
          <HexagonGridMesh
            shape="hexagon"
            loadN={loadN}
            loadPosX={loadPosX}
            loadPosY={loadPosY}
            loadPosZ={loadPosZ}
            loadDirX={loadDirX}
            loadDirY={loadDirY}
            loadDirZ={loadDirZ}
            wallThicknessMm={wallThicknessMm}
            cellSizeMm={cellSizeMm}
            showStress={showStress}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            is3DExtruded={is3DExtruded}
          />
          {showLoadArrows && (
            <LoadArrow
              loadN={loadN}
              posX={loadPosX}
              posY={loadPosY}
              posZ={loadPosZ}
              dirX={loadDirX}
              dirY={loadDirY}
              dirZ={loadDirZ}
            />
          )}
        </group>

        <OrbitControls
          makeDefault
          minDistance={2}
          maxDistance={35}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
