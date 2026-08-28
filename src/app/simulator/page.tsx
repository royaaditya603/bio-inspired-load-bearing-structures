"use client";

// ============================================================
// simulator/page.tsx — Main interactive 3D simulator
// ============================================================

import React from "react";
import { SimulationProvider } from "@/components/simulation/SimulationContext";
import { SimulatorPanel } from "@/components/simulation/SimulatorPanel";
import { SceneWrapper } from "@/components/models/SceneWrapper";
import { MetricCard } from "@/components/ui/MetricCard";
import { DiagnosticsPanel } from "@/components/ui/DiagnosticsPanel";
import { useSimulation } from "@/components/simulation/SimulationContext";
import styles from "./simulator.module.css";

function SimulatorContent() {
  const { state, output } = useSimulation();

  return (
    <div className={styles.layout}>
      {/* ── 3D Viewport ──────────────────────────────────── */}
      <div className={styles.viewport}>
        <div className={styles.viewportHeader}>
          <div className={styles.modelBadge}>
            {state.modelType === "triangle" && "▲ Triangular Grid (Isogrid)"}
            {state.modelType === "square" && "■ Square Grid (Orthogrid)"}
            {state.modelType === "circle" && "● Circular Grid (Porous Matrix)"}
            {state.modelType === "honeycomb" && "⬡ Honeycomb Structure (Periodic)"}
            {state.modelType === "bone" && "⁜ Bone-Inspired Lattice (Anisotropic)"}
            {state.modelType === "solid" && "▪ Solid Baseline (Monolithic)"}
          </div>
          <div className={styles.viewportNote}>
            <span>Exaggerated deformation for visualization</span>
            <span className={styles.dot}>·</span>
            <span>Relative / Conceptual Stress Index</span>
            <span className={styles.dot}>·</span>
            <a
              href="/comparison"
              style={{ color: "#3A88C8", fontWeight: 700, textDecoration: "none" }}
            >
              ▲ ■ ● ⬡ Geometry Comparison →
            </a>
          </div>
        </div>

        <div className={styles.canvas}>
          <SceneWrapper height="100%" />
        </div>

        {/* ── Metric strip ─────────────────────────────── */}
        <div className={styles.metrics}>
          <MetricCard
            label="Stress Index"
            value={output.stressIndex}
            unit=" /100"
            sublabel="Relative / Conceptual"
            accent="yellow"
            size="md"
          />
          <MetricCard
            label="Deformation"
            value={output.deformation}
            unit=" su"
            sublabel="Visual proxy (exaggerated)"
            accent="blue"
            size="md"
          />
          <MetricCard
            label="Relative Density"
            value={output.relativeDensity}
            sublabel="ρ* / ρ solid"
            accent="blue"
            size="md"
          />
          <MetricCard
            label="Porosity"
            value={output.porosity}
            sublabel="Void fraction"
            accent="green"
            size="md"
          />
          <MetricCard
            label="Estimated Mass"
            value={output.estimatedMassG}
            unit=" g"
            sublabel="Approx. (PA12 assumed)"
            accent="blue"
            size="md"
          />
          <MetricCard
            label="Eff. Stiffness"
            value={output.effectiveStiffness}
            sublabel="Normalized [0–1]"
            accent="yellow"
            size="md"
          />
        </div>
      </div>

      {/* ── Right control panel ───────────────────────────── */}
      <SimulatorPanel />

      {/* ── Dev diagnostics ──────────────────────────────── */}
      <DiagnosticsPanel />
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <SimulationProvider>
      <SimulatorContent />
    </SimulationProvider>
  );
}
