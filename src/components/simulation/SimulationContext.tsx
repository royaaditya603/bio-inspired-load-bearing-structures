"use client";

// ============================================================
// SimulationContext.tsx — Centralized simulation state
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import type { SimulationState, SimulationOutput } from "@/lib/simulation/types";
import {
  DEFAULT_STATE,
  PRESETS,
  MAX_OPT_ITERATIONS,
  THRESHOLD_SOLID_N,
  THRESHOLD_HONEYCOMB_N,
  THRESHOLD_BONE_N,
} from "@/lib/simulation/constants";
import { clamp, safeNumber } from "@/lib/simulation/normalize";
import { computeStressIndex, computeRelativeStiffness } from "@/lib/simulation/stressModel";
import { computeDeformation } from "@/lib/simulation/deformationModel";
import {
  computeHoneycombRelativeDensity,
  computeHoneycombPorosity,
  generateHoneycombCells,
  computeHoneycombSolidVolume,
} from "@/lib/simulation/honeycombModel";
import {
  generateStrutNetwork,
  computeAverageRelativeDensity,
  computeAverageOrientationFactor,
  computeStrutNetworkVolume,
  computeBoneRelativeStiffness,
} from "@/lib/simulation/boneInspiredModel";
import { runOptimization } from "@/lib/simulation/optimization";
import { estimateMassGrams } from "@/lib/simulation/materialModel";
import { MATERIAL_PA12 } from "@/lib/simulation/constants";

// ─── State ───────────────────────────────────────────────────

type Action =
  | { type: "SET_PARAM"; key: keyof SimulationState; value: number | boolean | string }
  | { type: "RESET" }
  | { type: "APPLY_PRESET"; preset: keyof typeof PRESETS }
  | { type: "RUN_OPTIMIZATION" }
  | { type: "SET_OPTIMIZATION_ITERATION"; iteration: number };

function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case "SET_PARAM":
      return { ...state, [action.key]: action.value };
    case "RESET":
      return { ...DEFAULT_STATE };
    case "APPLY_PRESET": {
      const preset = PRESETS[action.preset];
      return { ...state, ...preset, optimizationIteration: 0, optimizationRunning: false };
    }
    case "RUN_OPTIMIZATION":
      return { ...state, optimizationRunning: true };
    case "SET_OPTIMIZATION_ITERATION":
      return { ...state, optimizationIteration: action.iteration, optimizationRunning: false };
    default:
      return state;
  }
}

// ─── Context interface ────────────────────────────────────────

interface SimulationContextValue {
  state: SimulationState;
  output: SimulationOutput;
  dispatch: React.Dispatch<Action>;
  setParam: (key: keyof SimulationState, value: number | boolean | string) => void;
  reset: () => void;
  applyPreset: (preset: keyof typeof PRESETS) => void;
  runOptimization: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  // ── Compute simulation output ────────────────────────────
  const output = useMemo((): SimulationOutput => {
    const {
      loadN,
      loadPosX,
      loadPosZ,
      modelType,
      cellSizeMm,
      wallThicknessMm,
      cellCount,
      orientationDeg,
      deformationScale,
      optimizationIteration,
      relativeDensity,
    } = state;
    const rho_base = clamp(relativeDensity, 0.15, 0.75);

    if (modelType === "solid") {
      const rho = 1.0;
      const stressIndex = computeStressIndex(loadN, rho, 1.0);
      const deformation = computeDeformation(loadN, rho, deformationScale, 1.0);
      const massG = estimateMassGrams(1.0 * 8e-5, MATERIAL_PA12.density);
      const isFailed = loadN >= THRESHOLD_SOLID_N;
      return {
        stressIndex: safeNumber(stressIndex, 0),
        deformation: safeNumber(deformation, 0),
        relativeDensity: 1.0,
        porosity: 0.0,
        materialFraction: 1.0,
        estimatedMassG: safeNumber(massG, 0),
        effectiveStiffness: 1.0,
        failureThresholdN: THRESHOLD_SOLID_N,
        isFailed,
        optimizationIteration: 0,
      };
    }

    if (modelType === "honeycomb") {
      const rho = computeHoneycombRelativeDensity(wallThicknessMm, cellSizeMm);
      const porosity = computeHoneycombPorosity(rho);
      const stressIndex = computeStressIndex(loadN, rho, 0.85);
      const deformation = computeDeformation(loadN, rho, deformationScale, 0.85);
      const cells = generateHoneycombCells(cellSizeMm, wallThicknessMm, cellCount, loadN, loadPosX, loadPosZ);
      const solidVol = computeHoneycombSolidVolume(cells, wallThicknessMm, cellSizeMm);
      const massG = estimateMassGrams(solidVol, MATERIAL_PA12.density);
      const stiffness = computeRelativeStiffness(rho);
      const isFailed = loadN >= THRESHOLD_HONEYCOMB_N;
      return {
        stressIndex: safeNumber(stressIndex, 0),
        deformation: safeNumber(deformation, 0),
        relativeDensity: rho,
        porosity,
        materialFraction: rho,
        estimatedMassG: safeNumber(massG, 0),
        effectiveStiffness: safeNumber(stiffness, 0),
        failureThresholdN: THRESHOLD_HONEYCOMB_N,
        isFailed,
        hexCells: cells,
        optimizationIteration: 0,
      };
    }

    // bone
    const span = clamp(cellSizeMm, 5, 50) / 10;
    const gridN = clamp(Math.round(cellCount), 2, 8);
    const half = (gridN * span) / 2;
    const r_base = clamp(span * 0.12, 0.04, 0.4);

    let struts = generateStrutNetwork(cellSizeMm, cellCount, loadN, orientationDeg, rho_base, 42, loadPosX, loadPosZ);

    if (optimizationIteration > 0) {
      const result = runOptimization(struts, rho_base, r_base, loadN, half, optimizationIteration);
      struts = result.struts;
    }

    const avgRho = computeAverageRelativeDensity(struts);
    const avgOri = computeAverageOrientationFactor(struts);
    const porosity = clamp(1 - avgRho, 0, 1);
    const stiffness = computeBoneRelativeStiffness(avgRho, avgOri);
    const stressIndex = computeStressIndex(loadN, avgRho, avgOri);
    const deformation = computeDeformation(loadN, avgRho, deformationScale, avgOri);
    const solidVol = computeStrutNetworkVolume(struts);
    const massG = estimateMassGrams(solidVol, MATERIAL_PA12.density);
    const isFailed = loadN >= THRESHOLD_BONE_N;

    return {
      stressIndex: safeNumber(stressIndex, 0),
      deformation: safeNumber(deformation, 0),
      relativeDensity: safeNumber(avgRho, rho_base),
      porosity: safeNumber(porosity, 0),
      materialFraction: safeNumber(avgRho, rho_base),
      estimatedMassG: safeNumber(massG, 0),
      effectiveStiffness: safeNumber(stiffness, 0),
      failureThresholdN: THRESHOLD_BONE_N,
      isFailed,
      struts,
      optimizationIteration,
    };
  }, [state]);

  const setParam = useCallback(
    (key: keyof SimulationState, value: number | boolean | string) => {
      dispatch({ type: "SET_PARAM", key, value });
    },
    []
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const applyPreset = useCallback(
    (preset: keyof typeof PRESETS) => dispatch({ type: "APPLY_PRESET", preset }),
    []
  );

  const runOpt = useCallback(() => {
    const nextIter = Math.min(
      (state.optimizationIteration || 0) + 1,
      MAX_OPT_ITERATIONS
    );
    dispatch({ type: "SET_OPTIMIZATION_ITERATION", iteration: nextIter });
  }, [state.optimizationIteration]);

  const value = useMemo(
    () => ({ state, output, dispatch, setParam, reset, applyPreset, runOptimization: runOpt }),
    [state, output, dispatch, setParam, reset, applyPreset, runOpt]
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
