// ============================================================
// honeycombModel.ts — Honeycomb geometry and omnidirectional math
// ============================================================

import type { HexCell } from "./types";
import { clamp, safeNumber, normalize } from "./normalize";
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
 * This is a conceptual thin-wall approximation, not an exact formula.
 *
 * @param wallThickness t in the same units as cellSize
 * @param cellSize l (characteristic cell length)
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

// ─── Hex grid generation ─────────────────────────────────────

/**
 * Axial-to-Cartesian for pointy-top hexagonal grid.
 * q, r are axial hex coordinates.
 * size is the circumradius of the hex.
 */
function hexToCartesian(
  q: number,
  r: number,
  size: number
): [number, number] {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (3 / 2) * r;
  return [x, y];
}

/**
 * Generate hex cell centers for a grid of approximate `gridRadius` rings.
 */
function generateHexCenters(
  gridRadius: number,
  cellSizeScene: number
): [number, number][] {
  const centers: [number, number][] = [];
  for (let q = -gridRadius; q <= gridRadius; q++) {
    const r1 = Math.max(-gridRadius, -q - gridRadius);
    const r2 = Math.min(gridRadius, -q + gridRadius);
    for (let r = r1; r <= r2; r++) {
      centers.push(hexToCartesian(q, r, cellSizeScene));
    }
  }
  return centers;
}

/**
 * Generate the full honeycomb cell dataset with omnidirectional 3D spatial and directional load influence.
 *
 * @param cellSizeMm      Cell circumradius in mm (converted to scene units: ÷10)
 * @param wallThicknessMm Wall thickness in mm
 * @param cellCount       Number of rings (not total cells)
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
  const cellSizeScene = clamp(cellSizeMm, 5, 50) / 10; // mm → scene units
  const gridRadius = clamp(Math.round(cellCount), 1, 10);
  const centers = generateHexCenters(gridRadius, cellSizeScene);

  const F_norm = computeNormalizedLoad(F);
  const rho_rel = computeHoneycombRelativeDensity(wallThicknessMm, cellSizeMm);
  const [ndx, ndy, ndz] = computeNormalizedLoadDirection(loadDirX, loadDirY, loadDirZ);

  return centers.map(([x, z], id) => {
    // 3D Spatial proximity influence to (loadPosX, loadPosY, loadPosZ)
    const spatialFactor = compute3DLoadSpatialInfluence(x, 0, z, loadPosX, loadPosY, loadPosZ);

    // Directional participation factor:
    // Honeycomb has high axial stiffness along Y (ndy) and lateral bending response along X/Z (ndx, ndz)
    const cellNormalY = 1.0;
    const axialAlign = Math.abs(ndy * cellNormalY);
    const lateralAlign = Math.sqrt(ndx * ndx + ndz * ndz);
    // Lateral loads cause higher localized bending demand on cell walls
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
 * Approximation: each hex cell wall contributes a thin-walled tube segment.
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
