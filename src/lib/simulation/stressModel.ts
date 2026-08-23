// ============================================================
// stressModel.ts — Conceptual stress proxy
// ============================================================
// IMPORTANT: These are RELATIVE / CONCEPTUAL indices, NOT
// validated FEM stress results. See disclaimer in the UI.
// ============================================================

import { clamp, safeNumber } from "./normalize";
import {
  REFERENCE_STRESS_PA,
  STIFFNESS_EXPONENT,
  EPSILON,
} from "./constants";
import { getEffectiveArea } from "./materialModel";

/**
 * Nominal average stress proxy.
 * σ_nominal = F / A_eff
 *
 * @param F Applied force in Newtons
 * @param relativeDensity For computing effective area
 * @returns Nominal stress in Pa (conceptual proxy)
 */
export function computeNominalStress(
  F: number,
  relativeDensity: number
): number {
  const A_eff = getEffectiveArea(relativeDensity);
  return safeNumber(F / Math.max(A_eff, EPSILON), 0);
}

/**
 * Conceptual stress index mapped to [0, 100].
 * stressIndex = 100 × clamp(σ_nominal / σ_reference, 0, 1)
 *
 * NOT a real failure index. Reference stress is a scale only.
 */
export function computeStressIndex(
  F: number,
  relativeDensity: number,
  orientationFactor = 1.0
): number {
  const sigma = computeNominalStress(F, relativeDensity);
  // Orientation reduces effective stress transfer efficiency
  const effectiveSigma = sigma / Math.max(orientationFactor, EPSILON);
  const raw = effectiveSigma / REFERENCE_STRESS_PA;
  return safeNumber(clamp(raw * 100, 0, 100), 0);
}

/**
 * Local stress index for an individual element.
 * Used for colouring individual struts/cells.
 *
 * @param demand Local demand D_i ∈ [0,1]
 * @param globalStressIndex Global stress index [0,100]
 * @returns Local stress index [0,100]
 */
export function computeLocalStressIndex(
  demand: number,
  globalStressIndex: number
): number {
  return safeNumber(clamp(demand * globalStressIndex * 1.2, 0, 100), 0);
}

/**
 * Power-law relative stiffness.
 * E_rel = C_E × ρ_rel^n
 *
 * @param relativeDensity ρ_rel ∈ (0,1]
 * @param C_E Calibration constant (default 1)
 * @returns Normalized effective stiffness ∈ (0,1]
 */
export function computeRelativeStiffness(
  relativeDensity: number,
  C_E = 1.0
): number {
  const rho = clamp(relativeDensity, EPSILON, 1.0);
  return safeNumber(C_E * Math.pow(rho, STIFFNESS_EXPONENT), EPSILON);
}

/**
 * Effective Young's modulus in Pa.
 * E_eff = E_s × E_rel
 */
export function computeEffectiveModulus(
  relativeDensity: number,
  E_s: number,
  C_E = 1.0
): number {
  return safeNumber(E_s * computeRelativeStiffness(relativeDensity, C_E), EPSILON);
}
