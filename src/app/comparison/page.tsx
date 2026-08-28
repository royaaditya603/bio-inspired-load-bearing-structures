"use client";

// ============================================================
// comparison/page.tsx — Structural Strategy & Cell Geometry Comparison
// Mode 1: Solid vs Honeycomb vs Bone-Inspired
// Mode 2: Triangle vs Square vs Circle vs Hexagon (Cell Geometry Comparison)
// ============================================================

import React, { useState, useMemo } from "react";
import { SimulationProvider, useSimulation } from "@/components/simulation/SimulationContext";
import { computeComparison } from "@/lib/simulation/comparison";
import { computeCellGeometryComparison, type CellGeometryResult } from "@/lib/simulation/cellGeometryModel";
import { SliderControl } from "@/components/ui/SliderControl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  SingleGeometryCanvas,
  QuadCellGeometryCanvas,
} from "@/components/models/CellGeometryViewer";
import type { ComparisonResult } from "@/lib/simulation/types";
import {
  LOAD_MIN_N,
  LOAD_MAX_N,
  LOAD_DIR_MIN,
  LOAD_DIR_MAX,
} from "@/lib/simulation/constants";
import styles from "./comparison.module.css";

// ── Model Constants for Mode 1 ───────────────────────────────
const MODEL_NAMES: Record<string, string> = {
  solid: "▪ Solid (Brick)",
  honeycomb: "⬡ Honeycomb",
  bone: "⁜ Bone-Inspired",
};

const MODEL_COLORS: Record<string, string> = {
  solid: "#3A88C8",
  honeycomb: "#D4A017",
  bone: "#2E9B66",
};

const MODEL_BG_ACCENTS: Record<string, string> = {
  solid: "#DCEFFA",
  honeycomb: "#FFF5CF",
  bone: "#E5F6ED",
};

const METRICS_MODE_1: Array<{
  key: keyof ComparisonResult;
  label: string;
  unit?: string;
  higherIsBetter?: boolean;
}> = [
  { key: "relativeDensity", label: "Relative Density", higherIsBetter: false },
  { key: "porosity", label: "Porosity", higherIsBetter: true },
  { key: "materialFraction", label: "Material Fraction", higherIsBetter: false },
  { key: "stressIndex", label: "Stress Index", unit: "/100", higherIsBetter: false },
  { key: "deformation", label: "Deformation", unit: " su", higherIsBetter: false },
  { key: "estimatedMassG", label: "Est. Mass", unit: " g", higherIsBetter: false },
  { key: "effectiveStiffness", label: "Eff. Stiffness", higherIsBetter: true },
  { key: "failureThresholdN", label: "Failure Threshold", unit: " N", higherIsBetter: true },
];

const GEO_COLORS: Record<string, string> = {
  triangle: "#E05252",
  square: "#3A88C8",
  circle: "#8E44AD",
  hexagon: "#D4A017",
};

function BarChart({
  results,
  metricKey,
  unit,
}: {
  results: ComparisonResult[];
  metricKey: keyof ComparisonResult;
  unit?: string;
}) {
  const values = results.map((r) => Number(r[metricKey]));
  const maxVal = Math.max(...values, 0.001);

  return (
    <div className={styles.barChart}>
      {results.map((r) => {
        const val = Number(r[metricKey]);
        const pct = (val / maxVal) * 100;
        return (
          <div key={r.modelType} className={styles.barRow}>
            <span className={styles.barLabel}>{MODEL_NAMES[r.modelType]}</span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${pct}%`,
                  background: MODEL_COLORS[r.modelType],
                }}
              />
            </div>
            <span className={styles.barValue} style={{ color: MODEL_COLORS[r.modelType] }}>
              {isFinite(val) ? val.toFixed(val > 10 ? 0 : 3) : "—"}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GeoBarChart({
  results,
  metricKey,
  unit,
}: {
  results: CellGeometryResult[];
  metricKey: keyof CellGeometryResult;
  unit?: string;
}) {
  const values = results.map((r) => Number(r[metricKey]));
  const maxVal = Math.max(...values, 0.001);

  return (
    <div className={styles.barChart}>
      {results.map((r) => {
        const val = Number(r[metricKey]);
        const pct = (val / maxVal) * 100;
        return (
          <div key={r.shape} className={styles.barRow}>
            <span className={styles.barLabel}>
              {r.symbol} {r.name.split(" ")[0]}
            </span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{
                  width: `${pct}%`,
                  background: GEO_COLORS[r.shape] || "#3A88C8",
                }}
              />
            </div>
            <span className={styles.barValue} style={{ color: GEO_COLORS[r.shape] || "#3A88C8" }}>
              {isFinite(val) ? val.toFixed(val > 10 ? 0 : 3) : "—"}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonContent() {
  const { state, setParam } = useSimulation();
  const [comparisonMode, setComparisonMode] = useState<"strategies" | "geometries">("strategies");
  const [geoViewMode, setGeoViewMode] = useState<"quad" | "individual">("quad");
  const [is3DExtruded, setIs3DExtruded] = useState(true);

  // Strategy comparison (Mode 1)
  const strategyResults = useMemo(() => computeComparison(state), [state]);

  // Geometry comparison (Mode 2)
  const geoResults = useMemo(
    () =>
      computeCellGeometryComparison(
        state.loadN,
        state.loadDirX,
        state.loadDirY,
        state.loadDirZ,
        state.wallThicknessMm,
        state.cellSizeMm
      ),
    [
      state.loadN,
      state.loadDirX,
      state.loadDirY,
      state.loadDirZ,
      state.wallThicknessMm,
      state.cellSizeMm,
    ]
  );

  return (
    <div className="container section">
      {/* ── Mode Switcher Tabs ──────────────────────────────── */}
      <div className="section-title">
        <h2>Structural &amp; Topological Comparisons</h2>
      </div>

      <div className={styles.modeTabs}>
        <button
          className={`${styles.modeTab} ${
            comparisonMode === "strategies" ? styles.modeTabActive : ""
          }`}
          onClick={() => setComparisonMode("strategies")}
        >
          ▪ ⬡ ⁜ Structural Strategies (Solid / Honeycomb / Bone)
        </button>
        <button
          className={`${styles.modeTab} ${
            comparisonMode === "geometries" ? styles.modeTabActive : ""
          }`}
          onClick={() => setComparisonMode("geometries")}
        >
          ▲ ■ ● ⬡ Cell Geometry Comparison (Triangle / Square / Circle / Hexagon)
        </button>
      </div>

      {/* ======================================================
          MODE 1: STRUCTURAL STRATEGY COMPARISON
      ====================================================== */}
      {comparisonMode === "strategies" && (
        <>
          <p className={styles.intro}>
            All three structural strategies are evaluated under the{" "}
            <span style={{ color: "#D4A017", fontWeight: 700 }}>same applied load</span>. Metrics are
            generated by the mathematical simulation engine — not hard-coded.
          </p>

          {/* ── Load control ───────────────────────────────────── */}
          <div className={`card ${styles.loadControl}`}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              <span style={{ color: "#243447", fontSize: "0.85rem", fontWeight: 700, minWidth: 100 }}>
                Applied Load:
              </span>
              <div style={{ flex: 1, minWidth: 220 }}>
                <SliderControl
                  label="Load Force"
                  value={state.loadN}
                  min={LOAD_MIN_N}
                  max={LOAD_MAX_N}
                  step={50}
                  unit=" N"
                  accentColor="yellow"
                  onChange={(v) => setParam("loadN", v)}
                />
              </div>
              <span style={{ color: "#D4A017", fontWeight: 800, fontSize: "1.3rem" }}>
                {state.loadN} N
              </span>
            </div>
          </div>

          {/* ── Summary table ──────────────────────────────────── */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Metric</th>
                  {strategyResults.map((r) => (
                    <th key={r.modelType} style={{ color: MODEL_COLORS[r.modelType] }}>
                      {MODEL_NAMES[r.modelType]}
                    </th>
                  ))}
                  <th>Best Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {METRICS_MODE_1.map(({ key, label, unit, higherIsBetter }) => {
                  const values = strategyResults.map((r) => Number(r[key]));
                  const bestVal = higherIsBetter
                    ? Math.max(...values)
                    : Math.min(...values);

                  return (
                    <tr key={key}>
                      <td className={styles.metricName}>{label}</td>
                      {strategyResults.map((r) => {
                        const val = Number(r[key]);
                        const isBest = Math.abs(val - bestVal) < 0.001;
                        return (
                          <td
                            key={r.modelType}
                            className={`${styles.metricVal} ${isBest ? styles.best : ""}`}
                            style={isBest ? { color: MODEL_COLORS[r.modelType] } : {}}
                          >
                            {isFinite(val) ? val.toFixed(val > 10 ? (val > 100 ? 0 : 1) : 3) : "—"}
                            {unit}
                          </td>
                        );
                      })}
                      <td className={styles.bestBadge}>
                        {strategyResults.find((r) => {
                          const val = Number(r[key]);
                          return Math.abs(val - bestVal) < 0.001;
                        }) && (
                          <span
                            className="badge"
                            style={{
                              background:
                                MODEL_BG_ACCENTS[
                                  strategyResults.find((r) => Math.abs(Number(r[key]) - bestVal) < 0.001)!.modelType
                                ],
                              color:
                                MODEL_COLORS[
                                  strategyResults.find((r) => Math.abs(Number(r[key]) - bestVal) < 0.001)!.modelType
                                ],
                              border: `1px solid ${
                                MODEL_COLORS[
                                  strategyResults.find((r) => Math.abs(Number(r[key]) - bestVal) < 0.001)!.modelType
                                ]
                              }`,
                              fontSize: "0.68rem",
                            }}
                          >
                            {
                              MODEL_NAMES[
                                strategyResults.find((r) => Math.abs(Number(r[key]) - bestVal) < 0.001)!.modelType
                              ]
                            }
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Bar charts ─────────────────────────────────────── */}
          <div className="grid-3" style={{ marginTop: "2rem" }}>
            {METRICS_MODE_1.slice(0, 6).map(({ key, label, unit }) => (
              <div key={key} className="card">
                <h4
                  style={{
                    color: "#62748A",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "0.85rem",
                  }}
                >
                  {label}
                </h4>
                <BarChart results={strategyResults} metricKey={key} unit={unit} />
              </div>
            ))}
          </div>

          {/* ── Experimental reference ─────────────────────────── */}
          <div className={`card ${styles.expCard}`} style={{ marginTop: "2rem" }}>
            <div className={styles.expHeader}>
              <span className="badge badge-yellow">📄 Experimental Reference Benchmark</span>
              <span style={{ color: "#62748A", fontSize: "0.75rem" }}>
                Roberto Naboni &amp; Anja Kunic (2019)
              </span>
            </div>
            <h3 style={{ color: "#243447", margin: "0.75rem 0 0.5rem", fontSize: "1.15rem" }}>
              Bone-Inspired 3D Printed Structures for Construction Applications
            </h3>
            <div className="grid-3" style={{ marginTop: "1rem" }}>
              {[
                { label: "Lattice Brick Mass", value: "185 g", note: "Measured test piece" },
                { label: "Compression Resistance", value: "up to 3000 N", note: "Peak measured load" },
                { label: "Load-to-Weight Ratio", value: "~1600×", note: "Reported efficiency" },
              ].map((item) => (
                <div key={item.label} className={styles.statBox}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#D4A017", letterSpacing: "-0.02em" }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#243447", marginTop: "0.25rem" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#62748A" }}>{item.note}</div>
                </div>
              ))}
            </div>
            <div className="disclaimer" style={{ marginTop: "1.25rem" }}>
              These are <strong>source experimental values</strong> from Naboni &amp; Kunic (2019).
              They are NOT used as hidden calibration constants. Browser simulation values are
              generated independently and shown separately below.
            </div>
          </div>
        </>
      )}

      {/* ======================================================
          MODE 2: CELL GEOMETRY COMPARISON (▲ ■ ● ⬡)
      ====================================================== */}
      {comparisonMode === "geometries" && (
        <>
          <p className={styles.intro}>
            Compare four regular cellular topologies —{" "}
            <strong>TRIANGLE | SQUARE | CIRCLE | HEXAGON</strong> — under strictly controlled conditions.
            Footprint dimensions, material (PA12), wall thickness, and boundary constraints remain identical.
          </p>

          {/* ── Controlled Load & Geometry Controls ──────────── */}
          <div className={`card ${styles.loadControl}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.85rem" }}>
              <div>
                <span className="badge badge-yellow">Controlled Experimental Setup</span>
                <span style={{ fontSize: "0.85rem", color: "#62748A", marginLeft: "0.5rem" }}>
                  Material: PA12 (1010 kg/m³, 1.7 GPa) · Footprint: 40×40 mm
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={`btn btn-sm ${geoViewMode === "quad" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setGeoViewMode("quad")}
                >
                  ▦ 4-Quadrant View
                </button>
                <button
                  className={`btn btn-sm ${geoViewMode === "individual" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setGeoViewMode("individual")}
                >
                  ◫ Individual Cards
                </button>
                <button
                  className={`btn btn-sm ${is3DExtruded ? "btn-yellow" : "btn-outline"}`}
                  onClick={() => setIs3DExtruded(!is3DExtruded)}
                >
                  {is3DExtruded ? "3D Extruded Panels" : "2D Planar Grids"}
                </button>
              </div>
            </div>

            <div className={styles.geoControls}>
              <SliderControl
                label="Applied Load"
                value={state.loadN}
                min={LOAD_MIN_N}
                max={LOAD_MAX_N}
                step={50}
                unit=" N"
                accentColor="yellow"
                onChange={(v) => setParam("loadN", v)}
              />
              <SliderControl
                label="Wall Thickness"
                value={state.wallThicknessMm}
                min={0.5}
                max={5.0}
                step={0.1}
                unit=" mm"
                onChange={(v) => setParam("wallThicknessMm", v)}
              />
              <SliderControl
                label="Direction — X (Shear)"
                value={state.loadDirX}
                min={LOAD_DIR_MIN}
                max={LOAD_DIR_MAX}
                step={0.1}
                accentColor="blue"
                onChange={(v) => setParam("loadDirX", parseFloat(v.toFixed(1)))}
              />
              <SliderControl
                label="Direction — Y (Axial)"
                value={state.loadDirY}
                min={LOAD_DIR_MIN}
                max={LOAD_DIR_MAX}
                step={0.1}
                accentColor="blue"
                onChange={(v) => setParam("loadDirY", parseFloat(v.toFixed(1)))}
              />
            </div>
          </div>

          {/* ── 3D Viewport / Models ─────────────────────────── */}
          {geoViewMode === "quad" ? (
            <QuadCellGeometryCanvas
              loadN={state.loadN}
              loadPosX={state.loadPosX}
              loadPosY={state.loadPosY}
              loadPosZ={state.loadPosZ}
              loadDirX={state.loadDirX}
              loadDirY={state.loadDirY}
              loadDirZ={state.loadDirZ}
              wallThicknessMm={state.wallThicknessMm}
              cellSizeMm={state.cellSizeMm}
              showStress={state.showStress}
              showDeformation={state.showDeformation}
              deformationScale={state.deformationScale}
              is3DExtruded={is3DExtruded}
            />
          ) : (
            <div className={styles.geometryGrid}>
              {geoResults.map((r) => (
                <div key={r.shape} className={styles.geometryCard}>
                  <div className={styles.geoCardHeader}>
                    <div className={styles.geoSymbolBadge} style={{ color: GEO_COLORS[r.shape] }}>
                      <span>{r.symbol}</span>
                      <span>{r.name}</span>
                    </div>
                    <span className="badge badge-blue">Z = {r.coordinationNumber}</span>
                  </div>

                  <SingleGeometryCanvas
                    shape={r.shape}
                    loadN={state.loadN}
                    loadPosX={state.loadPosX}
                    loadPosY={state.loadPosY}
                    loadPosZ={state.loadPosZ}
                    loadDirX={state.loadDirX}
                    loadDirY={state.loadDirY}
                    loadDirZ={state.loadDirZ}
                    wallThicknessMm={state.wallThicknessMm}
                    cellSizeMm={state.cellSizeMm}
                    showStress={state.showStress}
                    showDeformation={state.showDeformation}
                    deformationScale={state.deformationScale}
                    is3DExtruded={is3DExtruded}
                    height="240px"
                  />

                  <div style={{ fontSize: "0.82rem", color: "#62748A", lineHeight: 1.6 }}>
                    <div>Relative Density: <strong style={{ color: "#243447" }}>{(r.relativeDensity * 100).toFixed(1)}%</strong></div>
                    <div>Est. Mass: <strong style={{ color: "#243447" }}>{r.estimatedMassG.toFixed(1)} g</strong></div>
                    <div>Stress Index: <strong style={{ color: "#243447" }}>{r.stressIndex.toFixed(1)} /100</strong></div>
                    <div>Deformation: <strong style={{ color: "#243447" }}>{r.deformation.toFixed(4)} su</strong></div>
                    <div>Stiffness: <strong style={{ color: "#243447" }}>{r.effectiveStiffness.toFixed(3)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Summary Comparison Table ─────────────────────── */}
          <div className={styles.tableWrap} style={{ marginTop: "2rem" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Topological Metric</th>
                  {geoResults.map((r) => (
                    <th key={r.shape} style={{ color: GEO_COLORS[r.shape] }}>
                      {r.symbol} {r.name}
                    </th>
                  ))}
                  <th>Optimal Topology</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.metricName}>Nodal Coordination (Z)</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      Z = {r.coordinationNumber}
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-yellow">Triangle (Z=6 Rigid)</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>Relative Density (ρ*)</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {(r.relativeDensity * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-blue">Hexagon (Lightest)</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>Porosity (Void Fraction)</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {(r.porosity * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-blue">Hexagon (Max Voids)</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>Estimated Mass</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {r.estimatedMassG.toFixed(1)} g
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-blue">Hexagon (Min Mass)</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>Stress Index (Proxy)</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {r.stressIndex.toFixed(1)} /100
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-green">Triangle / Hexagon</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>Effective Stiffness</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {r.effectiveStiffness.toFixed(3)}
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-yellow">Triangle (High Shear)</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>Axial Load-to-Weight Ratio</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {r.axialEfficiency.toFixed(3)}
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-yellow">Hexagon (Max Out-of-Plane)</span>
                  </td>
                </tr>
                <tr>
                  <td className={styles.metricName}>In-Plane Shear Resistance</td>
                  {geoResults.map((r) => (
                    <td key={r.shape} className={styles.metricVal}>
                      {(r.shearEfficiency * 100).toFixed(0)}%
                    </td>
                  ))}
                  <td className={styles.bestBadge}>
                    <span className="badge badge-yellow">Triangle (Isogrid Truss)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Comparative Bar Charts ───────────────────────── */}
          <div className="grid-3" style={{ marginTop: "2rem" }}>
            <div className="card">
              <h4 style={{ color: "#62748A", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                Relative Density (Lower is Lighter)
              </h4>
              <GeoBarChart results={geoResults} metricKey="relativeDensity" />
            </div>
            <div className="card">
              <h4 style={{ color: "#62748A", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                Effective Stiffness (Higher is Stiffer)
              </h4>
              <GeoBarChart results={geoResults} metricKey="effectiveStiffness" />
            </div>
            <div className="card">
              <h4 style={{ color: "#62748A", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.85rem" }}>
                Estimated Mass (g)
              </h4>
              <GeoBarChart results={geoResults} metricKey="estimatedMassG" unit=" g" />
            </div>
          </div>

          {/* ── Mandatory Scientific Explanation Panel ───────── */}
          <div className={styles.explanationCallout}>
            <div className={styles.explanationQuote}>
              &ldquo;Changing cellular geometry changes load paths, connectivity and material distribution. The comparison demonstrates how topology influences structural behaviour.&rdquo;
            </div>
            <div className={styles.explanationText}>
              <strong>Topological Mechanics Analysis:</strong>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <li>
                  <strong>▲ Triangle (Isogrid):</strong> Fully triangulated nodal coordination (Z = 6) provides stretching-dominated in-plane shear stiffness and eliminates pin-joint kinematics, but carries higher relative density for identical wall thickness.
                </li>
                <li>
                  <strong>■ Square (Orthogrid):</strong> Provides exceptional biaxial capacity when loads align directly with cell walls (0° / 90°), but exhibits lower shear resistance under 45° diagonal loading due to parallelogram bending.
                </li>
                <li>
                  <strong>● Circle (Radial Matrix):</strong> Distributes internal hydraulic or omnidirectional radial pressure uniformly, but geometric contact vertices create localized stress concentration zones (Kt ≈ 2.5–3.0) at minimal wall junctions.
                </li>
                <li>
                  <strong>⬡ Hexagon (Honeycomb):</strong> Minimizes wall perimeter per unit enclosed area (Honeycomb Conjecture, Z = 3), maximizing out-of-plane compressive strength-to-weight ratio. Under lateral in-plane loads, walls deform via bending.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <SimulationProvider>
      <ComparisonContent />
    </SimulationProvider>
  );
}
