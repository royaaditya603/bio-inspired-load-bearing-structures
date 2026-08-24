// ============================================================
// deformationModel.ts — Conceptual omnidirectional deformation proxy
// ============================================================
// IMPORTANT: Visual deformation is exaggerated for illustration.
// It is NOT a validated structural displacement calculation.
// ============================================================

import { clamp, safeNumber } from "./normalize";
import { computeNormalizedLoad, computeNormalizedLoadDirection } from "./loadModel";
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
 * Omnidirectional 3D Deformation displacement vector in scene units.
 * Follows the 3D normalized load direction vector (dirX, dirY, dirZ).
 *
 * @param globalDeformation Global visual deformation
 * @param demand Local demand D_i ∈ [0,1]
 * @param spatialInfluence Gaussian spatial factor ∈ [0.05, 1.0]
 * @param dirX Load direction X
 * @param dirY Load direction Y
 * @param dirZ Load direction Z
 */
export function computeOmnidirectionalDeformationVector(
  globalDeformation: number,
  demand: number,
  spatialInfluence: number,
  dirX = 0,
  dirY = -1,
  dirZ = 0
): [number, number, number] {
  const [ndx, ndy, ndz] = computeNormalizedLoadDirection(dirX, dirY, dirZ);
  const mag = computeLocalDeformation(globalDeformation, demand) * spatialInfluence * 0.35;
  return [
    safeNumber(ndx * mag, 0),
    safeNumber(ndy * mag, 0),
    safeNumber(ndz * mag, 0),
  ];
}
