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
      {/* High ambient illumination ensures all faces are bright & clear */}
      <ambientLight intensity={1.1} color="#FFFFFF" />
      
      {/* Primary key light from top-right-front */}
      <directionalLight
        position={[8, 14, 8]}
        intensity={1.3}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light from opposite side to keep shadows soft & legible */}
      <directionalLight position={[-8, 7, -8]} intensity={0.75} color="#E3F2FD" />
      
      {/* Soft top-down light */}
      <directionalLight position={[0, 10, 0]} intensity={0.5} color="#FFFDE7" />
      
      {/* Subtle bottom bounce light for under-strut visibility */}
      <directionalLight position={[0, -6, 0]} intensity={0.4} color="#E8F4F8" />
    </>
  );
}

function SceneGrid() {
  return (
    <Grid
      position={[0, -3.5, 0]}
      args={[24, 24]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#D2E1EC"
      sectionSize={2.5}
      sectionThickness={1.2}
      sectionColor="#ADC7DC"
      fadeDistance={22}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function SceneContent() {
  const { state } = useSimulation();
  const { modelType, showLoadArrows, loadN } = state;

  return (
    <>
      <SceneLighting />
      <SceneGrid />

      {/* Load arrow above the structure */}
      {showLoadArrows && <LoadArrow loadN={loadN} />}

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
        boxShadow: "inset 0 0 30px rgba(169, 216, 245, 0.15)",
      }}
    >
      <Canvas
        camera={{ position: [8.5, 6.5, 8.5], fov: 42, near: 0.1, far: 200 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{
          background: "linear-gradient(180deg, #FBFDFF 0%, #EEF4F8 100%)",
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
