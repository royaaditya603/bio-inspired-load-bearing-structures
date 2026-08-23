"use client";

// ============================================================
// SceneWrapper.tsx — React Three Fiber Canvas wrapper
// ============================================================

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { HoneycombModel } from "./HoneycombModel";
import { BoneModel } from "./BoneModel";
import { SolidModel } from "./SolidModel";
import { LoadArrow } from "./LoadArrow";

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#c8dff5" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#4EA9E0" />
      <pointLight position={[0, -8, 0]} intensity={0.3} color="#F2C94C" />
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
      cellColor="#1a3a5c"
      sectionSize={2}
      sectionThickness={1}
      sectionColor="#294B6E"
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
          axisColors={["#F2C94C", "#4EA9E0", "#86CFF5"]}
          labelColor="#F4F8FC"
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
    <div style={{ width: "100%", height, background: "#071A36", borderRadius: 16, overflow: "hidden" }}>
      <Canvas
        camera={{ position: [8, 6, 8], fov: 45, near: 0.1, far: 200 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "linear-gradient(180deg, #071A36 0%, #050F20 100%)" }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
