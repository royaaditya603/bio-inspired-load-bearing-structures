"use client";

// ============================================================
// SimulatorPanel.tsx — All simulation controls wired to context
// Includes Omnidirectional 3D Load (Position & Direction) and Green->Yellow->Red Stress Scale
// ============================================================

import React, { useMemo } from "react";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { SliderControl } from "@/components/ui/SliderControl";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import type { ModelType } from "@/lib/simulation/types";
import {
  MAX_OPT_ITERATIONS,
  LOAD_MIN_N,
  LOAD_MAX_N,
  LOAD_POS_X_MIN,
  LOAD_POS_X_MAX,
  LOAD_POS_Y_MIN,
  LOAD_POS_Y_MAX,
  LOAD_POS_Z_MIN,
  LOAD_POS_Z_MAX,
  LOAD_DIR_MIN,
  LOAD_DIR_MAX,
} from "@/lib/simulation/constants";
import { computeNormalizedLoadDirection } from "@/lib/simulation/loadModel";
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

  const [ndx, ndy, ndz] = useMemo(
    () =>
      computeNormalizedLoadDirection(
        state.loadDirX,
        state.loadDirY,
        state.loadDirZ
      ),
    [state.loadDirX, state.loadDirY, state.loadDirZ]
  );

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

      {/* ── Load Parameters (Applied load + 3D Position + 3D Direction) ─ */}
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

          {/* Subheading: Load Position */}
          <div className={styles.subHeading}>
            <span>Load Position</span>
            <span className={styles.coordReadoutSmall}>
              ({state.loadPosX >= 0 ? "+" : ""}{state.loadPosX.toFixed(2)}, {state.loadPosY >= 0 ? "+" : ""}{state.loadPosY.toFixed(2)}, {state.loadPosZ >= 0 ? "+" : ""}{state.loadPosZ.toFixed(2)})
            </span>
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

          {/* Subheading: Load Direction (Omnidirectional Vector) */}
          <div className={styles.subHeading} style={{ marginTop: "0.4rem" }}>
            <span>Load Direction (3D Vector)</span>
            <span className={styles.coordReadoutSmall}>
              [{ndx >= 0 ? "+" : ""}{ndx.toFixed(1)}, {ndy >= 0 ? "+" : ""}{ndy.toFixed(1)}, {ndz >= 0 ? "+" : ""}{ndz.toFixed(1)}]
            </span>
          </div>

          <SliderControl
            label="Direction — X (Side)"
            value={state.loadDirX}
            min={LOAD_DIR_MIN}
            max={LOAD_DIR_MAX}
            step={0.1}
            accentColor="blue"
            onChange={(v) => setParam("loadDirX", parseFloat(v.toFixed(1)))}
          />

          <SliderControl
            label="Direction — Y (Vertical)"
            value={state.loadDirY}
            min={LOAD_DIR_MIN}
            max={LOAD_DIR_MAX}
            step={0.1}
            accentColor="blue"
            onChange={(v) => setParam("loadDirY", parseFloat(v.toFixed(1)))}
          />

          <SliderControl
            label="Direction — Z (Depth)"
            value={state.loadDirZ}
            min={LOAD_DIR_MIN}
            max={LOAD_DIR_MAX}
            step={0.1}
            accentColor="blue"
            onChange={(v) => setParam("loadDirZ", parseFloat(v.toFixed(1)))}
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
            <div style={{ fontSize: "0.76rem", marginTop: 2 }}>
              {isSolid && `Masonry threshold (${output.failureThresholdN} N) exceeded.`}
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
          <ToggleSwitch
            label="Structure Inspection / Cutaway"
            checked={state.inspectionMode}
            onChange={(v) => setParam("inspectionMode", v)}
          />
        </div>

        {state.inspectionMode && (
          <div style={{ marginTop: "0.85rem" }}>
            <SliderControl
              label="Cutaway Opacity"
              value={state.cutawayOpacity ?? 0.35}
              min={0.1}
              max={0.8}
              step={0.05}
              onChange={(v) => setParam("cutawayOpacity", v)}
            />
            <p style={{ fontSize: "0.74rem", color: "#62748A", marginTop: "0.35rem", fontStyle: "italic" }}>
              Outer surface faded to inspect internal cellular/lattice core.
            </p>
          </div>
        )}
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

      {/* ── Stress legend (Green -> Yellow -> Red) ─────────── */}
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
            <span style={{ color: "#2E7D32", fontWeight: 700 }}>LOW</span>
            <span style={{ color: "#B78103", fontWeight: 700 }}>MODERATE</span>
            <span style={{ color: "#C62828", fontWeight: 700 }}>HIGH</span>
          </div>
          <div className={styles.legendColorLabels}>
            <span style={{ color: "#2E7D32" }}>Green (#4CAF50)</span>
            <span style={{ color: "#B78103" }}>Yellow (#F2C94C)</span>
            <span style={{ color: "#C62828" }}>Red (#E05252)</span>
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
