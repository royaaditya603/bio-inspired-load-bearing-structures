// ============================================================
// deformationModel.ts — Conceptual deformation proxy
// ============================================================
// IMPORTANT: Visual deformation is exaggerated for illustration.
// It is NOT a validated structural displacement calculation.
// ============================================================

import { clamp, safeNumber } from "./normalize";
import { computeNormalizedLoad } from "./loadModel";
import { computeRelativeStiffness } from "./stressModel";
import { EPSILON, GEOMETRY_SCALE } from "./constants";

/**
 * Compliance proxy: 1 / E_rel
 * Higher compliance → more flexible structure.
 */
export function computeCompliance(relativeDensity: number): number {
  const E_rel = computeRelativeStiffness(relativeDensity);
  return safeNumber(1.0 / Math.max(E_rel, EPSILON), 10);
}

/**
 * Global visual deformation (exaggerated, scene units).
 *
 * δ_visual = deformationScale × F_norm × compliance × geometryScale
 *
 * Bounded to [0, maxDelta] to prevent runaway.
 */
export function computeDeformation(
  F: number,
  relativeDensity: number,
  deformationScale: number,
  orientationFactor = 1.0,
  maxDelta = 2.0
): number {
  const F_norm = computeNormalizedLoad(F);
  const compliance = computeCompliance(relativeDensity);
  // Orientation: less-aligned structures are conceptually softer
  const orientMod = 1.0 + 0.3 * (1.0 - clamp(orientationFactor, 0, 1));
  const raw =
    deformationScale * F_norm * compliance * GEOMETRY_SCALE * orientMod * 0.05;
  return safeNumber(clamp(raw, 0, maxDelta), 0);
}

/**
 * Local deformation for an individual element.
 * δ_i = δ_global × D_i
 *
 * @param globalDeformation Global visual deformation
 * @param demand Local demand D_i ∈ [0,1]
 */
export function computeLocalDeformation(
  globalDeformation: number,
  demand: number
): number {
  return safeNumber(globalDeformation * demand, 0);
}

/**
 * Deformation displacement vector (downward, Y-axis, scene units).
 * Points in the direction of the applied load.
 */
export function computeDeformationVector(
  y: number,
  globalDeformation: number,
  demand: number
): [number, number, number] {
  // Elements near y=0 (support) have zero deformation;
  // elements near y=1 (load point) have maximum deformation.
  const localDelta = computeLocalDeformation(globalDeformation, demand);
  const yFactor = clamp(y, 0, 1); // normalised vertical position
  return [0, -localDelta * yFactor, 0];
}
