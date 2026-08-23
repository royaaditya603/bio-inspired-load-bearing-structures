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
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "#1a1a2e",
          border: "1px solid #4EA9E0",
          borderRadius: 8,
          color: "#4EA9E0",
          padding: "0.4rem 0.8rem",
          fontSize: "0.75rem",
          cursor: "pointer",
          fontFamily: "monospace",
          display: "block",
          width: "100%",
          textAlign: "left",
        }}
      >
        🔬 DIAGNOSTICS {open ? "▼" : "▶"}
      </button>

      {open && (
        <div
          style={{
            background: "rgba(5, 15, 32, 0.97)",
            border: "1px solid #294B6E",
            borderRadius: 8,
            padding: "0.75rem",
            marginTop: 4,
            fontFamily: "monospace",
            fontSize: "0.7rem",
            color: "#86CFF5",
            lineHeight: 1.7,
          }}
        >
          <div style={{ color: "#F2C94C", fontWeight: 700, marginBottom: 4 }}>
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
              <span style={{ color: "#A9BCD2", minWidth: 120, display: "inline-block" }}>
                {k}:
              </span>{" "}
              <span style={{ color: "#F4F8FC" }}>{v}</span>
            </div>
          ))}

          <div style={{ color: "#F2C94C", fontWeight: 700, margin: "8px 0 4px" }}>
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
              <span style={{ color: "#A9BCD2", minWidth: 120, display: "inline-block" }}>
                {k}:
              </span>{" "}
              <span
                style={{
                  color:
                    typeof v === "string" && v.includes("NaN") ? "#FF6B6B" : "#F4F8FC",
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
