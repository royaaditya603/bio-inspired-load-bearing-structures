// ============================================================
// constants.ts — Simulation defaults, ranges, material props
// ============================================================

import type { MaterialProperties, SimulationState } from "./types";

// ─── Conceptual Structural Load Failure Thresholds ──────────
// SOLID < HONEYCOMB < BONE-INSPIRED
// Conceptual simulation assumptions only (not universal material limits)
export const THRESHOLD_SOLID_N = 2000;
export const THRESHOLD_HONEYCOMB_N = 3500;
export const THRESHOLD_BONE_N = 4000;

// ─── Load range ──────────────────────────────────────────────
export const LOAD_MIN_N = 500;
export const LOAD_MAX_N = 4500;

// ─── 3D Load Position Bounds ─────────────────────────────────
export const LOAD_POS_X_MIN = -2.0;
export const LOAD_POS_X_MAX = 2.0;
export const LOAD_POS_Y_MIN = -2.0;
export const LOAD_POS_Y_MAX = 3.5;
export const LOAD_POS_Z_MIN = -2.0;
export const LOAD_POS_Z_MAX = 2.0;

// ─── 3D Load Direction Bounds ────────────────────────────────
export const LOAD_DIR_MIN = -1.0;
export const LOAD_DIR_MAX = 1.0;

/** Gaussian spatial influence radius σ for localized load demand */
export const LOAD_INFLUENCE_SIGMA = 1.3;

// ─── Stress Colors (Green -> Yellow -> Red) ──────────────────
export const STRESS_COLOR_LOW = "#4CAF50";    // Green
export const STRESS_COLOR_MID = "#F2C94C";    // Yellow
export const STRESS_COLOR_HIGH = "#E05252";   // Red

// ─── Porosity / density ranges ───────────────────────────────
export const RHO_MIN = 0.10;
export const RHO_MAX = 0.90;
export const RHO_LATTICE_MIN = 0.15;
export const RHO_LATTICE_MAX = 0.75;

// ─── Optimization parameters ─────────────────────────────────
/** Redistribution sensitivity α */
export const ALPHA = 0.8;
/** Optimization step size γ */
export const GAMMA = 0.25;
/** Maximum optimization iterations */
export const MAX_OPT_ITERATIONS = 5;

// ─── Stiffness power-law exponent ────────────────────────────
/** n = 2 for bending-dominated cellular materials (Gibson-Ashby) */
export const STIFFNESS_EXPONENT = 2;

// ─── Orientation/load-path factors ───────────────────────────
export const ORIENTATION_BASE = 0.2;
export const ORIENTATION_GAIN = 0.8;
export const MIN_ORIENTATION_FACTOR = 0.1;

// ─── Deformation proxy scaling ───────────────────────────────
export const GEOMETRY_SCALE = 5.0; // scene-unit scale for visual deformation
export const EPSILON = 1e-9;

// ─── Default simulation state ────────────────────────────────
export const DEFAULT_STATE: SimulationState = {
  modelType: "honeycomb",
  loadN: 1500,
  loadPosX: 0.0,
  loadPosY: 2.5,
  loadPosZ: 0.0,
  loadDirX: 0.0,
  loadDirY: -1.0,
  loadDirZ: 0.0,
  porosity: 0.65,
  relativeDensity: 0.35,
  orientationDeg: 60,
  cellSizeMm: 18,
  wallThicknessMm: 2.4,
  cellCount: 6,
  deformationScale: 1.0,
  showStress: true,
  showDeformation: true,
  showLoadArrows: true,
  inspectionMode: false,
  cutawayOpacity: 0.35,
  optimizationRunning: false,
  optimizationIteration: 0,
};

// ─── Assumed material: PA12 / nylon-like (3D printed) ────────
// SIMULATION ASSUMPTION — not measured from Naboni & Kunic (2019)
export const MATERIAL_PA12: MaterialProperties = {
  name: "PA12 / Nylon-like (SIMULATION ASSUMPTION)",
  density: 1010,          // kg/m³
  youngsModulus: 1.7e9,   // Pa
  poissonRatio: 0.39,
  yieldStrength: 48e6,    // Pa — reference scale only
};

/** Reference effective cross-sectional area for stress proxy (m²) */
export const REFERENCE_AREA_M2 = 4e-4; // 20 mm × 20 mm section

/** Reference bounding volume for mass estimation (m³) */
export const BOUNDING_VOLUME_M3 = 8e-5; // ~80 mm × 40 mm × 25 mm lattice brick

/** Reference stress scale (Pa) — NOT a failure criterion */
export const REFERENCE_STRESS_PA = 40e6;

// ─── Presets ─────────────────────────────────────────────────
export const PRESETS = {
  lightweight: {
    loadN: 800,
    loadPosX: 0.0,
    loadPosY: 2.5,
    loadPosZ: 0.0,
    loadDirX: 0.0,
    loadDirY: -1.0,
    loadDirZ: 0.0,
    porosity: 0.78,
    relativeDensity: 0.22,
    wallThicknessMm: 1.5,
    cellSizeMm: 22,
    cellCount: 8,
    deformationScale: 1.5,
    orientationDeg: 60,
  },
  balanced: {
    loadN: 1500,
    loadPosX: 0.0,
    loadPosY: 2.5,
    loadPosZ: 0.0,
    loadDirX: 0.0,
    loadDirY: -1.0,
    loadDirZ: 0.0,
    porosity: 0.65,
    relativeDensity: 0.35,
    wallThicknessMm: 2.4,
    cellSizeMm: 18,
    cellCount: 6,
    deformationScale: 1.0,
    orientationDeg: 60,
  },
  highLoad: {
    loadN: 2800,
    loadPosX: 0.0,
    loadPosY: 2.5,
    loadPosZ: 0.0,
    loadDirX: 0.0,
    loadDirY: -1.0,
    loadDirZ: 0.0,
    porosity: 0.40,
    relativeDensity: 0.60,
    wallThicknessMm: 4.0,
    cellSizeMm: 14,
    cellCount: 5,
    deformationScale: 0.6,
    orientationDeg: 45,
  },
} as const;
