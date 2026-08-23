"use client";

// ============================================================
// DiagnosticsPanel.tsx — Dev-only live simulation diagnostic
// ============================================================

import React, { useState } from "react";
import { useSimulation } from "@/components/simulation/SimulationContext";

export function DiagnosticsPanel() {
  const { state, output } = useSimulation();
  const [open, setOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 999,
        width: open ? 280 : "auto",
        fontFamily: '"Times New Roman", Times, serif',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "#FFFFFF",
          border: "1px solid #D7E2EA",
          borderRadius: 8,
          color: "#1C4C74",
          padding: "0.4rem 0.8rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: '"Times New Roman", Times, serif',
          display: "block",
          width: "100%",
          textAlign: "left",
          boxShadow: "0 2px 8px rgba(36, 52, 71, 0.08)",
        }}
      >
        🔬 DIAGNOSTICS {open ? "▼" : "▶"}
      </button>

      {open && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #D7E2EA",
            borderRadius: 8,
            padding: "0.75rem",
            marginTop: 4,
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: "0.78rem",
            color: "#243447",
            lineHeight: 1.7,
            boxShadow: "0 8px 24px rgba(36, 52, 71, 0.12)",
          }}
        >
          <div style={{ color: "#D4A017", fontWeight: 700, marginBottom: 4 }}>
            STATE
          </div>
          {(
            [
              ["Model", state.modelType],
              ["Load", `${state.loadN} N`],
              ["Porosity", state.porosity.toFixed(3)],
              ["Rel. Density", state.relativeDensity.toFixed(3)],
              ["Orientation", `${state.orientationDeg}°`],
              ["Cell Size", `${state.cellSizeMm} mm`],
              ["Wall Thickness", `${state.wallThicknessMm} mm`],
              ["Cell Count", state.cellCount],
              ["Deform Scale", state.deformationScale.toFixed(1)],
              ["Opt. Iteration", state.optimizationIteration],
            ] as [string, string | number][]
          ).map(([k, v]) => (
            <div key={k}>
              <span style={{ color: "#62748A", minWidth: 120, display: "inline-block" }}>
                {k}:
              </span>{" "}
              <span style={{ color: "#243447", fontWeight: 600 }}>{v}</span>
            </div>
          ))}

          <div style={{ color: "#D4A017", fontWeight: 700, margin: "8px 0 4px" }}>
            OUTPUT
          </div>
          {(
            [
              ["Stress Index", `${output.stressIndex.toFixed(1)} / 100`],
              ["Deformation", `${output.deformation.toFixed(4)} su`],
              ["Rel. Density", output.relativeDensity.toFixed(3)],
              ["Porosity", output.porosity.toFixed(3)],
              ["Mat. Fraction", output.materialFraction.toFixed(3)],
              ["Est. Mass", `${output.estimatedMassG.toFixed(1)} g`],
              ["Eff. Stiffness", output.effectiveStiffness.toFixed(4)],
              ["Struts", output.struts?.length ?? "N/A"],
              ["Hex Cells", output.hexCells?.length ?? "N/A"],
              ["Opt. Iter", output.optimizationIteration],
            ] as [string, string | number][]
          ).map(([k, v]) => (
            <div key={k}>
              <span style={{ color: "#62748A", minWidth: 120, display: "inline-block" }}>
                {k}:
              </span>{" "}
              <span
                style={{
                  color:
                    typeof v === "string" && v.includes("NaN") ? "#D9534F" : "#243447",
                  fontWeight: 600,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
