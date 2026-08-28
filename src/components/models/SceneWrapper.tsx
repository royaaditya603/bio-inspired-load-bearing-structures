"use client";

// ============================================================
// SceneWrapper.tsx — React Three Fiber Canvas wrapper
// High-visibility pastel scientific engineering viewport with
// direct cursor raycasting, Structure Inspection Mode, deep dolly zoom,
// and Reset Camera View controls.
// ============================================================

import React, { Suspense, useState, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { HoneycombModel } from "./HoneycombModel";
import { BoneModel } from "./BoneModel";
import { SolidModel } from "./SolidModel";
import { LoadArrow } from "./LoadArrow";

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={1.35} color="#FFFFFF" />
      <hemisphereLight
        args={["#FFFFFF", "#DCEFFA", 1.2]}
        position={[0, 20, 0]}
      />
      <directionalLight
        position={[10, 16, 10]}
        intensity={1.4}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-10, 8, -10]}
        intensity={0.9}
        color="#E3F2FD"
      />
      <directionalLight
        position={[0, 4, 12]}
        intensity={0.75}
        color="#FFFFFF"
      />
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

function CursorHoverPreview({ hoverPoint }: { hoverPoint: THREE.Vector3 | null }) {
  if (!hoverPoint) return null;
  return (
    <group position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]}>
      {/* Semi-transparent cursor target ring */}
      <mesh>
        <ringGeometry args={[0.08, 0.26, 24]} />
        <meshBasicMaterial
          color="#F2C94C"
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Pulsing center point */}
      <mesh>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color="#E05252" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SceneContent({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { state, setParam } = useSimulation();
  const {
    modelType,
    showLoadArrows,
    loadN,
    loadPosX,
    loadPosY,
    loadPosZ,
    loadDirX,
    loadDirY,
    loadDirZ,
  } = state;

  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);

  const handlePointerMove = useCallback((e: any) => {
    e.stopPropagation();
    if (e.point) {
      setHoverPoint(e.point.clone());
    }
  }, []);

  const handlePointerOut = useCallback(() => {
    setHoverPoint(null);
  }, []);

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.point) {
        setParam("loadPosX", parseFloat(e.point.x.toFixed(2)));
        setParam("loadPosY", parseFloat(e.point.y.toFixed(2)));
        setParam("loadPosZ", parseFloat(e.point.z.toFixed(2)));
      }
    },
    [setParam]
  );

  return (
    <>
      <color attach="background" args={["#EEF4F8"]} />
      <SceneLighting />
      <SceneGrid />

      {/* Active 3D Omnidirectional Load Arrow */}
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

      {/* Interactive hover preview cursor */}
      <CursorHoverPreview hoverPoint={hoverPoint} />

      {/* Interactive model group with raycasting pointer handlers */}
      <group
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {modelType === "honeycomb" && <HoneycombModel />}
        {modelType === "bone" && <BoneModel />}
        {modelType === "solid" && <SolidModel />}
      </group>

      {/* OrbitControls with deep dolly zoom into internal cellular core */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={0.15}
        maxDistance={32}
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
  const { state, setParam } = useSimulation();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(8, 6.5, 8);
      controlsRef.current.update();
    }
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height,
        background: "#EEF4F8",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #D7E2EA",
        position: "relative",
      }}
    >
      {/* Viewport Top Helper / Control Overlay */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          zIndex: 10,
          display: "flex",
          gap: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(6px)",
            border: "1px solid #D7E2EA",
            borderRadius: 8,
            padding: "0.35rem 0.75rem",
            fontSize: "0.76rem",
            color: "#1C4C74",
            fontWeight: 600,
            pointerEvents: "none",
            fontFamily: '"Times New Roman", Times, serif',
            boxShadow: "0 2px 8px rgba(36, 52, 71, 0.06)",
          }}
        >
          💡 Click model to place load · Scroll to inspect internal lattice
        </div>

        {/* Quick Inspection Mode Badge */}
        {state.inspectionMode && (
          <div
            style={{
              background: "#FFF5CF",
              border: "1px solid #F5E5AD",
              borderRadius: 8,
              padding: "0.35rem 0.65rem",
              fontSize: "0.74rem",
              color: "#634B00",
              fontWeight: 700,
              fontFamily: '"Times New Roman", Times, serif',
            }}
          >
            🔬 Internal Inspection / Cutaway Active
          </div>
        )}
      </div>

      {/* Floating Viewport Actions (Reset View & Inspection Toggle) */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: "0.4rem",
        }}
      >
        <button
          onClick={() => setParam("inspectionMode", !state.inspectionMode)}
          className="btn btn-sm"
          style={{
            background: state.inspectionMode ? "#DCEFFA" : "rgba(255, 255, 255, 0.9)",
            border: state.inspectionMode ? "1px solid #3A88C8" : "1px solid #D7E2EA",
            color: state.inspectionMode ? "#1C4C74" : "#243447",
            padding: "0.35rem 0.7rem",
            fontSize: "0.76rem",
            fontWeight: 700,
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(36, 52, 71, 0.06)",
          }}
          title="Toggle internal structure cutaway transparency"
        >
          {state.inspectionMode ? "🔬 Cutaway: ON" : "🔬 Inspection Cutaway"}
        </button>

        <button
          onClick={resetCamera}
          className="btn btn-outline btn-sm"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid #D7E2EA",
            color: "#243447",
            padding: "0.35rem 0.7rem",
            fontSize: "0.76rem",
            fontWeight: 600,
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(36, 52, 71, 0.06)",
          }}
          title="Reset 3D camera to default isometric position"
        >
          ↺ Reset View
        </button>
      </div>

      <Canvas
        camera={{ position: [8, 6.5, 8], fov: 38, near: 0.01, far: 250 }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent controlsRef={controlsRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
