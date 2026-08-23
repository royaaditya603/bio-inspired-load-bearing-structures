// ============================================================
// loadModel.ts — Applied load processing
// ============================================================

import { clamp, normalizeLoad, safeNumber } from "./normalize";
import { LOAD_MIN_N, LOAD_MAX_N } from "./constants";

/** Validated load value clamped to simulation range */
export function clampLoad(F: number): number {
  return clamp(safeNumber(F, 1500), LOAD_MIN_N, LOAD_MAX_N);
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
 * Returns a value in [0.4, 1.0] for rendering.
 */
export function computeLoadArrowScale(F: number): number {
  return 0.4 + 0.6 * computeNormalizedLoad(F);
}
