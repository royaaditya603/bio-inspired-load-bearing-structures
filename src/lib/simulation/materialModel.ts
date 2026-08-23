// ============================================================
// materialModel.ts — Material properties and mass estimation
// ============================================================

import type { MaterialProperties } from "./types";
import {
  MATERIAL_PA12,
  BOUNDING_VOLUME_M3,
  REFERENCE_AREA_M2,
} from "./constants";
import { safeNumber } from "./normalize";

/** Get the assumed material properties for the simulation */
export function getMaterial(): MaterialProperties {
  return MATERIAL_PA12;
}

/**
 * Estimate solid material volume from strut geometry.
 * Approximation: V_solid = Σ π (d_i/2)² · L_i
 * Node overlap correction: multiply by 0.85 (approximate)
 *
 * @param struts Array of { radius, length } objects
 * @returns Estimated solid volume in m³
 */
export function estimateSolidVolumeFromStruts(
  struts: { radius: number; length: number }[]
): number {
  let V = 0;
  for (const s of struts) {
    V += Math.PI * s.radius * s.radius * s.length;
  }
  // Node overlap correction (approximate)
  return safeNumber(V * 0.85, 0);
}

/**
 * Estimate solid material volume from relative density and bounding volume.
 * Used when explicit geometry is not available.
 */
export function estimateSolidVolumeFromDensity(
  relativeDensity: number,
  boundingVolume = BOUNDING_VOLUME_M3
): number {
  return safeNumber(relativeDensity * boundingVolume, 0);
}

/**
 * Estimate mass in grams.
 * @param solidVolumeM3 Solid volume in m³
 * @param rho_s Material density in kg/m³
 */
export function estimateMassGrams(
  solidVolumeM3: number,
  rho_s = MATERIAL_PA12.density
): number {
  return safeNumber(solidVolumeM3 * rho_s * 1000, 0); // kg → g
}

/**
 * Effective cross-sectional area for stress proxy.
 * If geometry-derived area is not available, return the reference.
 */
export function getEffectiveArea(
  relativeDensity: number,
  refArea = REFERENCE_AREA_M2
): number {
  // For lattice: effective area scales with relative density
  return safeNumber(relativeDensity * refArea, refArea * 0.1);
}
