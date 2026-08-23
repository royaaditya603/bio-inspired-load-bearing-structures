// ============================================================
// optimization.ts — Iterative material redistribution
// ============================================================
// Inspired by bone remodelling:
//   high demand → material deposition (higher local density)
//   low demand  → material resorption (lower local density)
//
// This is a CONCEPTUAL optimization analogy, NOT SIMP/topology
// optimization or certified structural optimization.
// ============================================================

import type { StrutElement } from "./types";
import { clamp, safeNumber } from "./normalize";
import {
  ALPHA,
  GAMMA,
  MAX_OPT_ITERATIONS,
  RHO_LATTICE_MIN,
  RHO_LATTICE_MAX,
  EPSILON,
} from "./constants";
import {
  computeLocalDemand,
  computeLocalDensity,
  computeStrutRadius,
  computeAlignment,
  computeOrientationFactor,
} from "./boneInspiredModel";
import { computeNormalizedLoad } from "./loadModel";
import { normalize } from "./normalize";

export interface OptimizationResult {
  struts: StrutElement[];
  iteration: number;
  averageDensity: number;
  convergenceDelta: number;
}

/**
 * Run a single optimization iteration on the strut network.
 *
 * For each strut i:
 * 1. Compute D_i (local demand)
 * 2. Compute ρ_target_i = ρ_base × (1 + α × (D_i − 0.5))
 * 3. Update ρ_new_i = (1 − γ) × ρ_old_i + γ × ρ_target_i
 * 4. Update radius t_i = t_base × sqrt(ρ_new_i / ρ_base)
 *
 * @param struts Current strut elements
 * @param rho_base Base relative density
 * @param r_base Base strut radius
 * @param F Applied force in N
 * @param half Half-span of the lattice (for normalisation)
 */
export function runOptimizationIteration(
  struts: StrutElement[],
  rho_base: number,
  r_base: number,
  F: number,
  half: number
): StrutElement[] {
  const F_norm = computeNormalizedLoad(F);

  return struts.map((s) => {
    // Strut midpoint vertical position, normalised
    const my = (s.startY + s.endY) / 2;
    const z_norm = normalize(my, -half, half);

    const alignment = computeAlignment(
      s.endX - s.startX,
      s.endY - s.startY,
      s.endZ - s.startZ
    );

    const demand = computeLocalDemand(z_norm, alignment, F_norm);

    // Target density
    const rho_target = clamp(
      rho_base * (1 + ALPHA * (demand - 0.5)),
      RHO_LATTICE_MIN,
      RHO_LATTICE_MAX
    );

    // Gradual update
    const rho_new = clamp(
      (1 - GAMMA) * s.localDensity + GAMMA * rho_target,
      RHO_LATTICE_MIN,
      RHO_LATTICE_MAX
    );

    // Updated radius
    const newRadius = computeStrutRadius(rho_new, rho_base, r_base);

    return {
      ...s,
      demand,
      localDensity: rho_new,
      radius: newRadius,
      alignment,
    };
  });
}

/**
 * Run multiple optimization iterations.
 *
 * @param struts Initial strut network
 * @param rho_base Base relative density
 * @param r_base Base strut radius (scene units)
 * @param F Applied force in N
 * @param half Half-span of the lattice (scene units)
 * @param numIterations Number of iterations to run (max MAX_OPT_ITERATIONS)
 */
export function runOptimization(
  struts: StrutElement[],
  rho_base: number,
  r_base: number,
  F: number,
  half: number,
  numIterations = MAX_OPT_ITERATIONS
): OptimizationResult {
  let current = [...struts];
  const iters = clamp(numIterations, 1, MAX_OPT_ITERATIONS);
  let prevAvg = 0;
  let delta = 0;

  for (let i = 0; i < iters; i++) {
    current = runOptimizationIteration(current, rho_base, r_base, F, half);

    const avg =
      current.reduce((acc, s) => acc + s.localDensity, 0) /
      Math.max(current.length, 1);
    delta = Math.abs(avg - prevAvg);
    prevAvg = avg;
  }

  const averageDensity = safeNumber(prevAvg, rho_base);
  const convergenceDelta = safeNumber(delta, 0);

  return {
    struts: current,
    iteration: iters,
    averageDensity,
    convergenceDelta,
  };
}
