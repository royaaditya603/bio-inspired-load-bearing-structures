// ============================================================
// normalize.ts — clamp and normalize utilities
// ============================================================

import { LOAD_MIN_N, LOAD_MAX_N, EPSILON } from "./constants";

/**
 * Clamp x to [min, max].
 * Safe against NaN: returns min if x is NaN.
 */
export function clamp(x: number, min: number, max: number): number {
  if (!isFinite(x) || isNaN(x)) return min;
  return Math.max(min, Math.min(max, x));
}

/**
 * Normalize x from [xmin, xmax] → [0, 1].
 * Guards against division by zero.
 */
export function normalize(x: number, xmin: number, xmax: number): number {
  const range = xmax - xmin;
  if (Math.abs(range) < EPSILON) return 0;
  return clamp((x - xmin) / range, 0, 1);
}

/**
 * Linearly interpolate between a and b by t ∈ [0,1].
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Normalize applied load F to [0,1] using the simulation load range.
 */
export function normalizeLoad(F: number): number {
  return normalize(F, LOAD_MIN_N, LOAD_MAX_N);
}

/**
 * Guard a computed number against NaN/Infinity.
 * Returns fallback if the value is not finite.
 */
export function safeNumber(x: number, fallback = 0): number {
  return isFinite(x) && !isNaN(x) ? x : fallback;
}
