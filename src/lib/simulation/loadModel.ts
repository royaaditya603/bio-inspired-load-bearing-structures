// ============================================================
// loadModel.ts — Omnidirectional 3D applied load & spatial influence
// ============================================================

import { clamp, normalizeLoad, safeNumber } from "./normalize";
import {
  LOAD_MIN_N,
  LOAD_MAX_N,
  LOAD_INFLUENCE_SIGMA,
  LOAD_POS_X_MIN,
  LOAD_POS_X_MAX,
  LOAD_POS_Y_MIN,
  LOAD_POS_Y_MAX,
  LOAD_POS_Z_MIN,
  LOAD_POS_Z_MAX,
  EPSILON,
} from "./constants";

/** Validated load value clamped to simulation range */
export function clampLoad(F: number): number {
  return clamp(safeNumber(F, 1500), LOAD_MIN_N, LOAD_MAX_N);
}

/** Clamp load position coordinates to valid scene bounds */
export function clampLoadPosition(x: number, y: number, z: number): [number, number, number] {
  return [
    clamp(safeNumber(x, 0), LOAD_POS_X_MIN, LOAD_POS_X_MAX),
    clamp(safeNumber(y, 2.5), LOAD_POS_Y_MIN, LOAD_POS_Y_MAX),
    clamp(safeNumber(z, 0), LOAD_POS_Z_MIN, LOAD_POS_Z_MAX),
  ];
}

/**
 * Normalize 3D load direction vector (dx, dy, dz).
 * Defaults to (0, -1, 0) downward if magnitude is near zero.
 */
export function computeNormalizedLoadDirection(
  dx: number,
  dy: number,
  dz: number
): [number, number, number] {
  const x = safeNumber(dx, 0);
  const y = safeNumber(dy, -1);
  const z = safeNumber(dz, 0);
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len < EPSILON) {
    return [0, -1, 0];
  }
  return [x / len, y / len, z / len];
}

/**
 * Normalized load value F_norm ∈ [0,1].
 * F_norm = 0 at minimum load, 1 at maximum load.
 */
export function computeNormalizedLoad(F: number): number {
  return normalizeLoad(clampLoad(F));
}

/**
 * Visual arrow scale for the load indicator.
 * Returns a value in [0.45, 1.2] for rendering.
 */
export function computeLoadArrowScale(F: number): number {
  return 0.45 + 0.65 * computeNormalizedLoad(F);
}

/**
 * Full 3D Localized Gaussian spatial load influence factor:
 * d(r) = exp(-r² / (2σ²))
 *
 * @param px Structural point X
 * @param py Structural point Y
 * @param pz Structural point Z
 * @param loadX Applied load X
 * @param loadY Applied load Y
 * @param loadZ Applied load Z
 * @param sigma Gaussian influence radius (default LOAD_INFLUENCE_SIGMA)
 * @returns Spatial factor ∈ [0.05, 1.0]
 */
export function compute3DLoadSpatialInfluence(
  px: number,
  py: number,
  pz: number,
  loadX: number,
  loadY: number,
  loadZ: number,
  sigma = LOAD_INFLUENCE_SIGMA
): number {
  const dx = px - loadX;
  const dy = py - loadY;
  const dz = pz - loadZ;
  const r2 = dx * dx + dy * dy + dz * dz;
  const raw = Math.exp(-r2 / (2 * sigma * sigma));
  return safeNumber(clamp(raw, 0.05, 1.0), 0.5);
}

/**
 * Legacy 2D (XZ) Gaussian spatial load influence factor for horizontal slices.
 */
export function computeLoadSpatialInfluence(
  px: number,
  pz: number,
  loadX: number,
  loadZ: number,
  sigma = LOAD_INFLUENCE_SIGMA
): number {
  const dx = px - loadX;
  const dz = pz - loadZ;
  const r2 = dx * dx + dz * dz;
  const raw = Math.exp(-r2 / (2 * sigma * sigma));
  return safeNumber(clamp(raw, 0.05, 1.0), 0.5);
}

/**
 * Computes directional alignment factor: |dot(v_elem, v_loadDir)|
 *
 * @param ex Element direction vector X
 * @param ey Element direction vector Y
 * @param ez Element direction vector Z
 * @param ldx Normalized load direction X
 * @param ldy Normalized load direction Y
 * @param ldz Normalized load direction Z
 */
export function computeDirectionalAlignment(
  ex: number,
  ey: number,
  ez: number,
  ldx: number,
  ldy: number,
  ldz: number
): number {
  const eLen = Math.sqrt(ex * ex + ey * ey + ez * ez);
  if (eLen < EPSILON) return 0.5;
  const nx = ex / eLen, ny = ey / eLen, nz = ez / eLen;
  const dot = nx * ldx + ny * ldy + nz * ldz;
  return safeNumber(Math.abs(dot), 0.5);
}

/**
 * Projects a user-selected 3D coordinate (x, y, z) onto the bounding box exterior surface
 * to ensure the load application point is always on the model surface, never buried inside.
 */
export function projectToBoundingSurface(
  x: number,
  y: number,
  z: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
): [number, number, number] {
  const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;

  // Clamp within bounds
  const cx = clamp(x, minX, maxX);
  const cy = clamp(y, minY, maxY);
  const cz = clamp(z, minZ, maxZ);

  // Distances to each face
  const dLeft = Math.abs(cx - minX);
  const dRight = Math.abs(maxX - cx);
  const dBottom = Math.abs(cy - minY);
  const dTop = Math.abs(maxY - cy);
  const dBack = Math.abs(cz - minZ);
  const dFront = Math.abs(maxZ - cz);

  const minDist = Math.min(dLeft, dRight, dBottom, dTop, dBack, dFront);

  if (minDist === dTop) return [cx, maxY, cz];
  if (minDist === dBottom) return [cx, minY, cz];
  if (minDist === dLeft) return [minX, cy, cz];
  if (minDist === dRight) return [maxX, cy, cz];
  if (minDist === dFront) return [cx, cy, maxZ];
  return [cx, cy, minZ];
}
