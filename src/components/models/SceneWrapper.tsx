"use client";

// ============================================================
// SceneWrapper.tsx — React Three Fiber Canvas wrapper
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
      <ambientLight intensity={0.8} color="#FFFFFF" />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.2}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-6, 6, -6]} intensity={0.5} color="#DCEFFA" />
      <directionalLight position={[0, -6, 0]} intensity={0.3} color="#FFF5CF" />
    </>
  );
}

function SceneGrid() {
  return (
    <Grid
      position={[0, -3.5, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#D7E2EA"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#B8CBD8"
      fadeDistance={20}
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
        maxDistance={30}
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
        camera={{ position: [8, 6, 8], fov: 45, near: 0.1, far: 200 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{
          background: "linear-gradient(180deg, #F7F9FC 0%, #EEF4F8 100%)",
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
