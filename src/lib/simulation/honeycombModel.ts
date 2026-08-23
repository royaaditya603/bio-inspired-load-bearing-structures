// ============================================================
// honeycombModel.ts — Honeycomb geometry and structural math
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
import { computeLocalStressIndex } from "./stressModel";
import { computeNormalizedLoad } from "./loadModel";

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
 * Generate the full honeycomb cell dataset.
 *
 * Scene coordinates are centred at origin.
 * Y (Three.js) is used for vertical positioning,
 * the hex grid is laid out in the X–Z plane.
 *
 * @param cellSizeMm    Cell circumradius in mm (converted to scene units: ÷10)
 * @param wallThicknessMm Wall thickness in mm
 * @param cellCount     Number of rings (not total cells)
 * @param F             Applied load in N
 */
export function generateHoneycombCells(
  cellSizeMm: number,
  wallThicknessMm: number,
  cellCount: number,
  F: number
): HexCell[] {
  const cellSizeScene = clamp(cellSizeMm, 5, 50) / 10; // mm → scene units
  const gridRadius = clamp(Math.round(cellCount), 1, 10);
  const centers = generateHexCenters(gridRadius, cellSizeScene);

  const F_norm = computeNormalizedLoad(F);
  const rho_rel = computeHoneycombRelativeDensity(wallThicknessMm, cellSizeMm);

  // Build bounding box to normalize positions
  let minY = Infinity,
    maxY = -Infinity;
  for (const [, y] of centers) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const yRange = maxY - minY || 1;

  return centers.map(([x, z], id) => {
    // Normalized vertical position [0 (bottom support) → 1 (top load)]
    const z_norm = normalize(z, minY, maxY);

    // Load-position influence: top of structure sees higher primary demand
    // β = 0.6 (load-path sensitivity parameter)
    const beta = 0.6;
    const W_i = 1 + beta * z_norm;

    // Demand = W_i * F_norm, clamped to [0,1]
    const demand = clamp(safeNumber(W_i * F_norm, 0), 0, 1);

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
  // 6 walls per hex, each ≈ l × t × (some height h assumed 25mm)
  const h = 0.025; // m
  const wallVolPerCell = 6 * lS * tS * h;
  return safeNumber(cells.length * wallVolPerCell * 0.5, 0); // 0.5: shared walls
}
