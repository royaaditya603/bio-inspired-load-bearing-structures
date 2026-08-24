// ============================================================
// honeycombModel.ts — Continuous 3D Honeycomb Structural Core Grid
// ============================================================

import type { HexCell } from "./types";
import { clamp, safeNumber } from "./normalize";
import {
  RHO_MIN,
  RHO_MAX,
  EPSILON,
  STIFFNESS_EXPONENT,
  MATERIAL_PA12,
} from "./constants";
import {
  computeNormalizedLoad,
  compute3DLoadSpatialInfluence,
  computeNormalizedLoadDirection,
} from "./loadModel";

// ─── Geometry math ───────────────────────────────────────────

/**
 * Relative density for a thin-walled regular hexagonal honeycomb.
 * ρ_rel ≈ (2/√3) × (t/l)
 *
 * SOURCE: Gibson & Ashby "Cellular Solids" approximation.
 */
export function computeHoneycombRelativeDensity(
  wallThickness: number,
  cellSize: number
): number {
  if (cellSize < EPSILON) return RHO_MIN;
  const raw = (2 / Math.sqrt(3)) * (wallThickness / cellSize);
  return clamp(safeNumber(raw, RHO_MIN), RHO_MIN, RHO_MAX);
}

/**
 * Porosity = 1 − ρ_rel
 */
export function computeHoneycombPorosity(relativeDensity: number): number {
  return clamp(1 - relativeDensity, 0, 1 - RHO_MIN);
}

/**
 * Conceptual honeycomb effective stiffness (power-law).
 * E_rel = ρ_rel^n
 */
export function computeHoneycombRelativeStiffness(
  relativeDensity: number
): number {
  const rho = clamp(relativeDensity, EPSILON, 1.0);
  return safeNumber(Math.pow(rho, STIFFNESS_EXPONENT), EPSILON);
}

/**
 * Effective Young's modulus for the honeycomb.
 */
export function computeHoneycombEffectiveModulus(
  relativeDensity: number
): number {
  return safeNumber(
    MATERIAL_PA12.youngsModulus * computeHoneycombRelativeStiffness(relativeDensity),
    EPSILON
  );
}

// ─── Continuous Hex Grid Generation ──────────────────────────

/**
 * Axial-to-Cartesian for pointy-top regular hexagonal grid.
 * Distance between adjacent cell centers is exactly sqrt(3) * R.
 *
 * @param q Axial coordinate q
 * @param r Axial coordinate r
 * @param R Circumradius of regular hexagon
 */
function hexToCartesian(
  q: number,
  r: number,
  R: number
): [number, number] {
  const x = R * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const z = R * (3 / 2) * r;
  return [x, z];
}

/**
 * Generate hex cell centers forming a continuous, compact 3D honeycomb grid.
 */
export function generateHexCenters(
  gridRadius: number,
  R: number
): [number, number][] {
  const centers: [number, number][] = [];
  for (let q = -gridRadius; q <= gridRadius; q++) {
    const r1 = Math.max(-gridRadius, -q - gridRadius);
    const r2 = Math.min(gridRadius, -q + gridRadius);
    for (let r = r1; r <= r2; r++) {
      centers.push(hexToCartesian(q, r, R));
    }
  }
  return centers;
}

/**
 * Generate the continuous honeycomb cell dataset with omnidirectional 3D load influence.
 *
 * @param cellSizeMm      Cell circumradius in mm
 * @param wallThicknessMm Wall thickness in mm
 * @param cellCount       Number of rings in compact grid
 * @param F               Applied load in N
 * @param loadPosX        Load 3D X position
 * @param loadPosY        Load 3D Y position
 * @param loadPosZ        Load 3D Z position
 * @param loadDirX        Load direction X
 * @param loadDirY        Load direction Y
 * @param loadDirZ        Load direction Z
 */
export function generateHoneycombCells(
  cellSizeMm: number,
  wallThicknessMm: number,
  cellCount: number,
  F: number,
  loadPosX = 0,
  loadPosY = 2.5,
  loadPosZ = 0,
  loadDirX = 0,
  loadDirY = -1,
  loadDirZ = 0
): HexCell[] {
  const gridRadius = clamp(Math.round(cellCount), 1, 6);
  // Compact continuous block: total block width ~ 3.4 units
  const totalBlockSpan = 3.4;
  const R = totalBlockSpan / (gridRadius * 2 * Math.sqrt(3) * 0.55 + 1.2);
  const centers = generateHexCenters(gridRadius, R);

  const F_norm = computeNormalizedLoad(F);
  const rho_rel = computeHoneycombRelativeDensity(wallThicknessMm, cellSizeMm);
  const [ndx, ndy, ndz] = computeNormalizedLoadDirection(loadDirX, loadDirY, loadDirZ);

  return centers.map(([x, z], id) => {
    // 3D Spatial proximity influence to (loadPosX, loadPosY, loadPosZ)
    const spatialFactor = compute3DLoadSpatialInfluence(x, 0, z, loadPosX, loadPosY, loadPosZ);

    // Directional participation factor:
    // Honeycomb has high axial stiffness along Y (ndy) and lateral bending response along X/Z (ndx, ndz)
    const axialAlign = Math.abs(ndy);
    const lateralAlign = Math.sqrt(ndx * ndx + ndz * ndz);
    const dirSensitivity = 0.8 * axialAlign + 1.2 * lateralAlign;

    // Demand D_i ∈ [0, 1]
    const demand = clamp(
      safeNumber(F_norm * (0.35 + 0.65 * spatialFactor) * (0.7 + 0.3 * dirSensitivity), 0),
      0,
      1
    );

    // Local density tracks demand
    const alpha = 0.8;
    const localDensity = clamp(
      rho_rel * (1 + alpha * (demand - 0.5)),
      0.10,
      0.90
    );

    return {
      id,
      centerX: x,
      centerY: 0,
      centerZ: z,
      demand,
      localDensity,
    } satisfies HexCell;
  });
}

/**
 * Compute total estimated solid volume from hex cell data.
 */
export function computeHoneycombSolidVolume(
  cells: HexCell[],
  wallThicknessMm: number,
  cellSizeMm: number
): number {
  if (cells.length === 0) return 0;
  const tS = wallThicknessMm / 1000; // mm → m
  const lS = cellSizeMm / 1000;      // mm → m
  const h = 0.025; // m
  const wallVolPerCell = 6 * lS * tS * h;
  return safeNumber(cells.length * wallVolPerCell * 0.5, 0); // 0.5: shared walls
}
