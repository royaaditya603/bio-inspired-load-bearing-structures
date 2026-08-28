// ============================================================
// types.ts — Shared interfaces for the bio-inspired simulation
// ============================================================

export type ModelType = "triangle" | "square" | "circle" | "honeycomb" | "bone" | "solid";

/** Central simulation state — single source of truth */
export interface SimulationState {
  modelType: ModelType;
  loadN: number;           // Applied load in Newtons [500–4500]
  loadPosX: number;        // Applied load 3D X position [-2.0, 2.0]
  loadPosY: number;        // Applied load 3D Y position [0.5, 3.5]
  loadPosZ: number;        // Applied load 3D Z position [-2.0, 2.0]
  loadDirX: number;        // Applied load 3D direction X [-1.0, 1.0]
  loadDirY: number;        // Applied load 3D direction Y [-1.0, 1.0]
  loadDirZ: number;        // Applied load 3D direction Z [-1.0, 1.0]
  porosity: number;        // Void fraction [0–1]
  relativeDensity: number; // Solid fraction [0–1]
  orientationDeg: number;  // Primary strut orientation [0–90]
  cellSizeMm: number;      // Cell characteristic length in mm
  wallThicknessMm: number; // Wall/strut thickness in mm
  cellCount: number;       // Number of cells across one axis
  deformationScale: number;// Visual deformation multiplier
  showStress: boolean;
  showDeformation: boolean;
  showLoadArrows: boolean;
  inspectionMode: boolean; // Structure inspection cutaway / internal visibility mode
  cutawayOpacity: number;  // Opacity of outer surface in cutaway mode [0.1–0.9]
  optimizationRunning: boolean;
  optimizationIteration: number;
}

/** Isotropic linear-elastic material properties */
export interface MaterialProperties {
  name: string;
  density: number;       // kg/m³
  youngsModulus: number; // Pa
  poissonRatio: number;
  yieldStrength: number; // Pa — reference scale only
}

/** One strut element in the bone-inspired network */
export interface StrutElement {
  id: number;
  startX: number;
  startY: number;
  startZ: number;
  endX: number;
  endY: number;
  endZ: number;
  /** Direction vector magnitude (pre-normalised length in scene units) */
  length: number;
  /** Local demand index D_i ∈ [0,1] */
  demand: number;
  /** Local relative density ρ_i ∈ [ρ_min, ρ_max] */
  localDensity: number;
  /** Visual radius in scene units */
  radius: number;
  /** Alignment with load direction [0,1] */
  alignment: number;
}

/** One hexagonal cell element in the honeycomb network */
export interface HexCell {
  id: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  demand: number;
  localDensity: number;
}

/** Result from the comparison engine */
export interface ComparisonResult {
  modelType: ModelType;
  relativeDensity: number;
  porosity: number;
  materialFraction: number;
  stressIndex: number;      // 0–100 conceptual index
  deformation: number;      // visual proxy in mm
  estimatedMassG: number;   // grams
  effectiveStiffness: number; // normalized [0–1]
  failureThresholdN: number;  // conceptual failure threshold [N]
  isFailed: boolean;          // whether current load exceeds threshold
}

/** Output produced by the full simulation run */
export interface SimulationOutput {
  stressIndex: number;
  deformation: number;
  relativeDensity: number;
  porosity: number;
  materialFraction: number;
  estimatedMassG: number;
  effectiveStiffness: number;
  failureThresholdN: number;
  isFailed: boolean;
  struts?: StrutElement[];
  hexCells?: HexCell[];
  optimizationIteration: number;
}
