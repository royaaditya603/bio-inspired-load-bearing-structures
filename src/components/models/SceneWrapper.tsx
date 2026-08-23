"use client";

// ============================================================
// SceneWrapper.tsx — React Three Fiber Canvas wrapper
// High-visibility, bright pastel scientific engineering viewport
// ============================================================

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { HoneycombModel } from "./HoneycombModel";
import { BoneModel } from "./BoneModel";
import { SolidModel } from "./SolidModel";
import { LoadArrow } from "./LoadArrow";

function SceneLighting() {
  return (
    <>
      {/* High-intensity ambient light prevents unlit or dark faces */}
      <ambientLight intensity={1.3} color="#FFFFFF" />
      
      {/* Hemisphere light: bright sky + soft light blue ground fill */}
      <hemisphereLight
        args={["#FFFFFF", "#DCEFFA", 1.2]}
        position={[0, 20, 0]}
      />

      {/* Primary key light from top-right */}
      <directionalLight
        position={[10, 16, 10]}
        intensity={1.4}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      
      {/* Secondary fill light from opposite corner to eliminate dark shadows */}
      <directionalLight
        position={[-10, 8, -10]}
        intensity={0.9}
        color="#E3F2FD"
      />
      
      {/* Front-facing light for optimal model legibility */}
      <directionalLight
        position={[0, 4, 12]}
        intensity={0.7}
        color="#FFFFFF"
      />

      {/* Subtle upward bounce light for underside struts */}
      <directionalLight
        position={[0, -8, 0]}
        intensity={0.5}
        color="#EEF4F8"
      />
    </>
  );
}

function SceneGrid() {
  return (
    <Grid
      position={[0, -3.5, 0]}
      args={[26, 26]}
      cellSize={0.5}
      cellThickness={0.7}
      cellColor="#D2E1EC"
      sectionSize={2.5}
      sectionThickness={1.3}
      sectionColor="#ADC7DC"
      fadeDistance={24}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function SceneContent() {
  const { state } = useSimulation();
  const { modelType, showLoadArrows, loadN, loadPosX, loadPosY, loadPosZ } = state;

  return (
    <>
      {/* Explicit background color guarantees the viewport is never black */}
      <color attach="background" args={["#EEF4F8"]} />
      
      <SceneLighting />
      <SceneGrid />

      {/* 3D Load arrow tracking XYZ position */}
      {showLoadArrows && (
        <LoadArrow
          loadN={loadN}
          posX={loadPosX}
          posY={loadPosY}
          posZ={loadPosZ}
        />
      )}

      {/* 3D models */}
      {modelType === "honeycomb" && <HoneycombModel />}
      {modelType === "bone" && <BoneModel />}
      {modelType === "solid" && <SolidModel />}

      <OrbitControls
        makeDefault
        minDistance={3}
        maxDistance={28}
        dampingFactor={0.08}
        enableDamping
      />

      <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
        <GizmoViewport
          axisColors={["#D4A017", "#3A88C8", "#5BA8DE"]}
          labelColor="#243447"
        />
      </GizmoHelper>
    </>
  );
}

interface SceneWrapperProps {
  height?: string;
}

export function SceneWrapper({ height = "100%" }: SceneWrapperProps) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#EEF4F8",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #D7E2EA",
      }}
    >
      <Canvas
        camera={{ position: [9, 7.5, 9], fov: 40, near: 0.1, far: 200 }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
