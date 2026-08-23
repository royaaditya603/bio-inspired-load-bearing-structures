"use client";

// ============================================================
// SimulatorPanel.tsx — All simulation controls wired to context
// Includes 3D XYZ load coordinates, localized load, and failure indicator
// ============================================================

import React from "react";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { SliderControl } from "@/components/ui/SliderControl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { ModelType } from "@/lib/simulation/types";
import {
  PRESETS,
  MAX_OPT_ITERATIONS,
  LOAD_MIN_N,
  LOAD_MAX_N,
  LOAD_POS_X_MIN,
  LOAD_POS_X_MAX,
  LOAD_POS_Y_MIN,
  LOAD_POS_Y_MAX,
  LOAD_POS_Z_MIN,
  LOAD_POS_Z_MAX,
} from "@/lib/simulation/constants";
import styles from "./SimulatorPanel.module.css";

const MODEL_OPTIONS: { value: ModelType; label: string; icon: string }[] = [
  { value: "solid", label: "Solid (Brick)", icon: "▪" },
  { value: "honeycomb", label: "Honeycomb", icon: "⬡" },
  { value: "bone", label: "Bone-Inspired", icon: "⁜" },
];

export function SimulatorPanel() {
  const { state, output, setParam, reset, applyPreset, runOptimization } =
    useSimulation();

  const isBone = state.modelType === "bone";
  const isHoneycomb = state.modelType === "honeycomb";
  const isSolid = state.modelType === "solid";

  return (
    <aside className={styles.panel}>
      {/* ── Model selector ────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚙</span>
          <span>Structure Type</span>
        </div>
        <div className={styles.modelTabs}>
          {MODEL_OPTIONS.map(({ value, label, icon }) => (
            <button
              key={value}
              className={`${styles.modelTab} ${
                state.modelType === value ? styles.modelTabActive : ""
              }`}
              onClick={() => {
                setParam("modelType", value);
                setParam("optimizationIteration", 0);
              }}
            >
              <span className={styles.modelIcon}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Presets ───────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>★</span>
          <span>Presets</span>
        </div>
        <div className={styles.presetRow}>
          {(["lightweight", "balanced", "highLoad"] as const).map((p) => (
            <button
              key={p}
              className={`btn btn-outline btn-sm ${styles.presetBtn}`}
              onClick={() => applyPreset(p)}
            >
              {p === "lightweight" ? "Lightweight" : p === "balanced" ? "Balanced" : "High Load"}
            </button>
          ))}
        </div>
      </section>

      {/* ── Load Parameters (Applied load + 3D XYZ Position) ─ */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>↓</span>
          <span>Load Parameters</span>
        </div>

        <div className={styles.sliderStack}>
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

          {/* Coordinate Readout */}
          <div className={styles.coordReadout}>
            <span>Target: ({state.loadPosX >= 0 ? "+" : ""}{state.loadPosX.toFixed(2)}, {state.loadPosY.toFixed(2)}, {state.loadPosZ >= 0 ? "+" : ""}{state.loadPosZ.toFixed(2)})</span>
          </div>

          <SliderControl
            label="Load Position — X"
            value={state.loadPosX}
            min={LOAD_POS_X_MIN}
            max={LOAD_POS_X_MAX}
            step={0.05}
            accentColor="blue"
            onChange={(v) => setParam("loadPosX", parseFloat(v.toFixed(2)))}
          />

          <SliderControl
            label="Load Position — Y"
            value={state.loadPosY}
            min={LOAD_POS_Y_MIN}
            max={LOAD_POS_Y_MAX}
            step={0.05}
            accentColor="blue"
            onChange={(v) => setParam("loadPosY", parseFloat(v.toFixed(2)))}
          />

          <SliderControl
            label="Load Position — Z"
            value={state.loadPosZ}
            min={LOAD_POS_Z_MIN}
            max={LOAD_POS_Z_MAX}
            step={0.05}
            accentColor="blue"
            onChange={(v) => setParam("loadPosZ", parseFloat(v.toFixed(2)))}
          />
        </div>

        {/* Structural Load Threshold / Failure Indicator */}
        {output.isFailed && (
          <div className={styles.failureBanner}>
            <div style={{ fontWeight: 800 }}>
              {isSolid && "⚠ STRUCTURAL FAILURE"}
              {isHoneycomb && "⚠ HIGH STRESS EXCEEDED"}
              {isBone && "⚠ HIGH DEMAND REGIME"}
            </div>
            <div style={{ fontSize: "0.72rem", marginTop: 2 }}>
              {isSolid && `Masonry threshold (${output.failureThresholdN} N) exceeded at center.`}
              {isHoneycomb && `Honeycomb threshold (${output.failureThresholdN} N) exceeded.`}
              {isBone && `Bone lattice threshold (${output.failureThresholdN} N) exceeded.`}
            </div>
          </div>
        )}
      </section>

      {/* ── Geometry parameters ───────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>◈</span>
          <span>Geometry</span>
        </div>

        <div className={styles.sliderStack}>
          {!isSolid && (
            <>
              <SliderControl
                label="Cell Size"
                value={state.cellSizeMm}
                min={8}
                max={40}
                step={1}
                unit=" mm"
                onChange={(v) => setParam("cellSizeMm", v)}
              />
              <SliderControl
                label="Cell Count"
                value={state.cellCount}
                min={2}
                max={8}
                step={1}
                onChange={(v) => setParam("cellCount", v)}
              />
              {isHoneycomb && (
                <SliderControl
                  label="Wall Thickness"
                  value={state.wallThicknessMm}
                  min={0.5}
                  max={8}
                  step={0.1}
                  unit=" mm"
                  onChange={(v) => setParam("wallThicknessMm", v)}
                />
              )}
            </>
          )}

          {(isBone || isHoneycomb) && (
            <SliderControl
              label="Porosity"
              value={state.porosity}
              min={0.1}
              max={0.9}
              step={0.01}
              onChange={(v) => {
                setParam("porosity", v);
                setParam("relativeDensity", parseFloat((1 - v).toFixed(2)));
              }}
            />
          )}

          <SliderControl
            label="Relative Density"
            value={state.relativeDensity}
            min={0.1}
            max={0.9}
            step={0.01}
            disabled={isSolid}
            onChange={(v) => {
              setParam("relativeDensity", v);
              setParam("porosity", parseFloat((1 - v).toFixed(2)));
            }}
          />

          {isBone && (
            <SliderControl
              label="Orientation"
              value={state.orientationDeg}
              min={0}
              max={90}
              step={5}
              unit="°"
              onChange={(v) => setParam("orientationDeg", v)}
            />
          )}
        </div>
      </section>

      {/* ── Visualization ─────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>◎</span>
          <span>Visualization</span>
        </div>

        <div className={styles.sliderStack}>
          <SliderControl
            label="Deformation Scale"
            value={state.deformationScale}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => setParam("deformationScale", v)}
          />
        </div>

        <div className={styles.toggleStack}>
          <ToggleSwitch
            label="Show Stress Colours"
            checked={state.showStress}
            onChange={(v) => setParam("showStress", v)}
          />
          <ToggleSwitch
            label="Show Deformation"
            checked={state.showDeformation}
            onChange={(v) => setParam("showDeformation", v)}
          />
          <ToggleSwitch
            label="Show Load Arrows"
            checked={state.showLoadArrows}
            onChange={(v) => setParam("showLoadArrows", v)}
          />
        </div>
      </section>

      {/* ── Optimization (bone only) ───────────────────────── */}
      {isBone && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>⟳</span>
            <span>Remodelling Optimization</span>
          </div>
          <p className={styles.optDesc}>
            Iteratively redistributes material: high-demand struts thicken,
            low-demand struts thin. Inspired by bone remodelling.
          </p>
          <div className={styles.optProgress}>
            <div className={styles.optLabel}>
              Iteration {state.optimizationIteration} / {MAX_OPT_ITERATIONS}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(state.optimizationIteration / MAX_OPT_ITERATIONS) * 100}%`,
                }}
              />
            </div>
          </div>
          <button
            className={`btn btn-yellow ${styles.optBtn}`}
            onClick={runOptimization}
            disabled={state.optimizationIteration >= MAX_OPT_ITERATIONS}
          >
            ⟳ Optimize Structure
          </button>
        </section>
      )}

      {/* ── Stress legend ─────────────────────────────────── */}
      {state.showStress && (
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>◐</span>
            <span>Stress Scale</span>
          </div>
          <div className={styles.legendHeader}>
            <span className={styles.legendTitle}>CONCEPTUAL / RELATIVE STRESS INDEX</span>
          </div>
          <div className={styles.legendBar} />
          <div className={styles.legendLabels}>
            <span style={{ color: "#1C4C74", fontWeight: 700 }}>LOW</span>
            <span style={{ color: "#62748A", fontWeight: 600 }}>MODERATE</span>
            <span style={{ color: "#634B00", fontWeight: 700 }}>HIGH</span>
          </div>
          <div className={styles.legendColorLabels}>
            <span>Pastel Blue</span>
            <span>Blue-Yellow</span>
            <span>Pastel Yellow</span>
          </div>
        </section>
      )}

      {/* ── Actions ───────────────────────────────────────── */}
      <section className={styles.actions}>
        <button className="btn btn-primary" style={{ flex: 1 }}>
          ▶ Apply
        </button>
        <button className="btn btn-outline" onClick={reset} style={{ flex: 1 }}>
          ↺ Reset
        </button>
      </section>

      {/* ── Disclaimer ────────────────────────────────────── */}
      <div className="disclaimer" style={{ margin: "0 1rem 0.5rem" }}>
        <strong>⚠ Conceptual simulation.</strong> Stress and deformation outputs
        are relative visual/engineering proxies — not validated FEM results.
      </div>
    </aside>
  );
}
