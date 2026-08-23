// ============================================================
// loadModel.ts — Applied load processing & 3D spatial influence
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
 * Normalized load value F_norm ∈ [0,1].
 * F_norm = 0 at minimum load, 1 at maximum load.
 */
export function computeNormalizedLoad(F: number): number {
  return normalizeLoad(clampLoad(F));
}

/**
 * Visual arrow scale for the load indicator.
 * Returns a value in [0.4, 1.2] for rendering.
 */
export function computeLoadArrowScale(F: number): number {
  return 0.45 + 0.65 * computeNormalizedLoad(F);
}

/**
 * Localized Gaussian spatial load influence factor d(r) = exp(-r² / (2σ²))
 *
 * @param px Structural point X
 * @param pz Structural point Z
 * @param loadX Applied load X
 * @param loadZ Applied load Z
 * @param sigma Gaussian influence radius (default LOAD_INFLUENCE_SIGMA)
 * @returns Spatial factor ∈ (0, 1]
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
