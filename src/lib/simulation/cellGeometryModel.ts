// ============================================================
// cellGeometryModel.ts — Mathematical models for 4 Cell Geometries
// Compares: 1. Triangle | 2. Square | 3. Circle | 4. Hexagon
// Evaluated under controlled, constant boundary and loading conditions.
// ============================================================

import { clamp, safeNumber } from "./normalize";
import {
  MATERIAL_PA12,
  REFERENCE_AREA_M2,
  REFERENCE_STRESS_PA,
  EPSILON,
  LOAD_MIN_N,
  LOAD_MAX_N,
} from "./constants";
import { computeNormalizedLoad, computeNormalizedLoadDirection } from "./loadModel";

export type CellShape = "triangle" | "square" | "circle" | "hexagon";

export interface CellGeometryResult {
  shape: CellShape;
  name: string;
  symbol: string;
  coordinationNumber: number; // Nodal connectivity Z
  relativeDensity: number;    // rho* / rho_s
  porosity: number;           // 1 - relativeDensity
  estimatedMassG: number;     // grams
  effectiveStiffness: number; // Normalized [0–1]
  stressIndex: number;        // Conceptual stress proxy [0–100]
  deformation: number;        // Visual deformation proxy in su
  axialEfficiency: number;    // Axial stiffness / mass ratio
  shearEfficiency: number;    // Shear resistance score
  failureThresholdN: number;  // Conceptual failure load [N]
  isFailed: boolean;
  topologyDescription: string;
  strengthCharacteristics: string;
}

/**
 * Compute performance metrics for all 4 cellular topologies under controlled conditions.
 *
 * Controlled inputs held constant across all 4:
 * - Load magnitude F [N]
 * - 3D Load direction (loadDirX, loadDirY, loadDirZ)
 * - 3D Load position (loadPosX, loadPosY, loadPosZ)
 * - Wall thickness t [mm]
 * - Cell footprint characteristic span L [mm]
 * - Material properties (PA12 polymer)
 */
export function computeCellGeometryComparison(
  loadN: number,
  loadDirX = 0,
  loadDirY = -1,
  loadDirZ = 0,
  wallThicknessMm = 2.0,
  cellSizeMm = 18.0
): CellGeometryResult[] {
  const F = clamp(loadN, LOAD_MIN_N, LOAD_MAX_N);
  const F_norm = computeNormalizedLoad(F);
  const [ndx, ndy, ndz] = computeNormalizedLoadDirection(loadDirX, loadDirY, loadDirZ);

  // Directional load decomposition
  const axialFactor = Math.abs(ndy); // Vertical out-of-plane alignment [0, 1]
  const lateralFactor = Math.sqrt(ndx * ndx + ndz * ndz); // In-plane shear/lateral alignment [0, 1]

  const t = clamp(wallThicknessMm, 0.5, 6.0);
  const L = clamp(cellSizeMm, 8.0, 35.0);
  const ratio = t / L;

  // Solid block volume & reference mass (40mm x 40mm x 40mm = 6.4e-5 m3)
  const blockVolumeM3 = 6.4e-5;
  const solidMassG = blockVolumeM3 * MATERIAL_PA12.density * 1000; // ~64.64 g

  // 1. TRIANGLE (Isogrid - Equilateral Triangular Grid)
  // Relative density rho_tri ≈ 2 * sqrt(3) * (t/L)
  const rho_tri = clamp(2 * Math.sqrt(3) * ratio, 0.15, 0.85);
  const z_tri = 6; // Coordination number (6 struts per node)
  // High in-plane shear stiffness due to triangulation, higher relative density
  const stiff_tri = safeNumber(
    0.9 * (rho_tri * axialFactor + rho_tri * 1.15 * lateralFactor),
    EPSILON
  );
  const mass_tri = solidMassG * rho_tri;
  const stress_tri = clamp(
    (F / (rho_tri * REFERENCE_AREA_M2 * REFERENCE_STRESS_PA * (0.8 + 0.4 * axialFactor))) * 100,
    0,
    100
  );
  const deform_tri = clamp(
    (F_norm / Math.max(stiff_tri, 0.05)) * 0.18,
    0.01,
    2.0
  );
  const fail_tri = 3800;

  // 2. SQUARE (Orthogrid - Regular Square Grid)
  // Relative density rho_sq ≈ 2 * (t/L)
  const rho_sq = clamp(2.0 * ratio, 0.12, 0.75);
  const z_sq = 4; // Coordination number
  // Stiff along orthogonal axes, compliant under diagonal shear
  const shearPenalty = 0.55 + 0.45 * Math.abs(ndx * ndz);
  const stiff_sq = safeNumber(
    0.85 * (rho_sq * axialFactor + rho_sq * 0.75 * lateralFactor * shearPenalty),
    EPSILON
  );
  const mass_sq = solidMassG * rho_sq;
  const stress_sq = clamp(
    (F / (rho_sq * REFERENCE_AREA_M2 * REFERENCE_STRESS_PA * (0.75 + 0.35 * axialFactor))) * 100,
    0,
    100
  );
  const deform_sq = clamp(
    (F_norm / Math.max(stiff_sq, 0.05)) * 0.22,
    0.01,
    2.0
  );
  const fail_sq = 3200;

  // 3. CIRCLE (Circular Voids in Continuous Solid Matrix)
  // Circular hollow voids (square packing of cylinders: rho = 1 - pi*(L-t)^2 / (4*L^2))
  const holeR = Math.max((L - t) / 2, 0.1);
  const voidFractionCirc = (Math.PI * holeR * holeR) / (L * L);
  const rho_circ = clamp(1.0 - voidFractionCirc, 0.18, 0.88);
  const z_circ = 4; // Tangential contact points
  // Stress concentrations around circular boundaries (Kt ≈ 2.5 - 3.0)
  const stressConcentrationFactor = 1.35;
  const stiff_circ = safeNumber(
    0.82 * (rho_circ * 0.95 * axialFactor + rho_circ * 0.85 * lateralFactor),
    EPSILON
  );
  const mass_circ = solidMassG * rho_circ;
  const stress_circ = clamp(
    (F / (rho_circ * REFERENCE_AREA_M2 * REFERENCE_STRESS_PA)) * 100 * stressConcentrationFactor,
    0,
    100
  );
  const deform_circ = clamp(
    (F_norm / Math.max(stiff_circ, 0.05)) * 0.20,
    0.01,
    2.0
  );
  const fail_circ = 3400;

  // 4. HEXAGON (Regular Honeycomb Grid)
  // Relative density rho_hex ≈ (2/sqrt(3)) * (t/L)
  const rho_hex = clamp((2 / Math.sqrt(3)) * ratio, 0.08, 0.65);
  const z_hex = 3; // Coordination number (minimum perimeter for space filling)
  // Superior strength-to-weight under out-of-plane axial compression; compliant in-plane bending
  const stiff_hex = safeNumber(
    0.92 * (rho_hex * 1.25 * axialFactor + Math.pow(rho_hex, 2) * 0.65 * lateralFactor),
    EPSILON
  );
  const mass_hex = solidMassG * rho_hex;
  const stress_hex = clamp(
    (F / (rho_hex * REFERENCE_AREA_M2 * REFERENCE_STRESS_PA * (0.85 + 0.5 * axialFactor))) * 100,
    0,
    100
  );
  const deform_hex = clamp(
    (F_norm / Math.max(stiff_hex, 0.05)) * 0.19,
    0.01,
    2.0
  );
  const fail_hex = 3500;

  return [
    {
      shape: "triangle",
      name: "Triangle (Isogrid)",
      symbol: "▲",
      coordinationNumber: z_tri,
      relativeDensity: rho_tri,
      porosity: 1 - rho_tri,
      estimatedMassG: mass_tri,
      effectiveStiffness: stiff_tri,
      stressIndex: stress_tri,
      deformation: deform_tri,
      axialEfficiency: stiff_tri / Math.max(mass_tri, 1),
      shearEfficiency: 0.95,
      failureThresholdN: fail_tri,
      isFailed: F >= fail_tri,
      topologyDescription: "Triangulated truss network with nodal coordination Z = 6. Statically determinate in-plane frame with stretching-dominated deformation.",
      strengthCharacteristics: "High in-plane shear & multi-axis rigidity; carries higher mass for identical wall thickness.",
    },
    {
      shape: "square",
      name: "Square (Orthogrid)",
      symbol: "■",
      coordinationNumber: z_sq,
      relativeDensity: rho_sq,
      porosity: 1 - rho_sq,
      estimatedMassG: mass_sq,
      effectiveStiffness: stiff_sq,
      stressIndex: stress_sq,
      deformation: deform_sq,
      axialEfficiency: stiff_sq / Math.max(mass_sq, 1),
      shearEfficiency: 0.55,
      failureThresholdN: fail_sq,
      isFailed: F >= fail_sq,
      topologyDescription: "Orthogonal biaxial lattice with coordination Z = 4. Ideal for aligned principal stress axes (0° / 90°).",
      strengthCharacteristics: "High orthogonal axial load capacity; susceptible to shear diamond-skewing under diagonal 45° loads.",
    },
    {
      shape: "circle",
      name: "Circle (Radial Porous)",
      symbol: "●",
      coordinationNumber: z_circ,
      relativeDensity: rho_circ,
      porosity: 1 - rho_circ,
      estimatedMassG: mass_circ,
      effectiveStiffness: stiff_circ,
      stressIndex: stress_circ,
      deformation: deform_circ,
      axialEfficiency: stiff_circ / Math.max(mass_circ, 1),
      shearEfficiency: 0.70,
      failureThresholdN: fail_circ,
      isFailed: F >= fail_circ,
      topologyDescription: "Array of circular cylindrical voids inside a continuous solid matrix with radial symmetry.",
      strengthCharacteristics: "Uniform radial pressure distribution; localized hoop stress concentrations at minimum wall junctions.",
    },
    {
      shape: "hexagon",
      name: "Hexagon (Honeycomb)",
      symbol: "⬡",
      coordinationNumber: z_hex,
      relativeDensity: rho_hex,
      porosity: 1 - rho_hex,
      estimatedMassG: mass_hex,
      effectiveStiffness: stiff_hex,
      stressIndex: stress_hex,
      deformation: deform_hex,
      axialEfficiency: stiff_hex / Math.max(mass_hex, 1),
      shearEfficiency: 0.65,
      failureThresholdN: fail_hex,
      isFailed: F >= fail_hex,
      topologyDescription: "Hexagonal tessellation with coordination Z = 3. Minimum perimeter per unit area for space filling (Honeycomb Conjecture).",
      strengthCharacteristics: "Highest load-to-weight ratio under out-of-plane compression; in-plane bending-dominated compliance under lateral load.",
    },
  ];
}
