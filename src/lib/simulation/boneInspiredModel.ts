// ============================================================
// boneInspiredModel.ts — Trabecular-inspired strut lattice
// ============================================================
// Generates an ENGINEERED STRUCTURAL LATTICE inspired by
// trabecular bone — NOT a literal anatomical femur model.
// ============================================================

import type { StrutElement } from "./types";
import { clamp, safeNumber, normalize } from "./normalize";
import {
  RHO_LATTICE_MIN,
  RHO_LATTICE_MAX,
  ALPHA,
  ORIENTATION_BASE,
  ORIENTATION_GAIN,
  MIN_ORIENTATION_FACTOR,
  EPSILON,
  STIFFNESS_EXPONENT,
  MATERIAL_PA12,
} from "./constants";
import { computeNormalizedLoad } from "./loadModel";

// ─── Deterministic pseudo-random (seeded) ────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Orientation / load-path factor ──────────────────────────

/** Primary load direction (downward, Y-axis in world space) */
const LOAD_DIR: [number, number, number] = [0, -1, 0];

/**
 * Compute dot-product alignment of a strut with the primary load direction.
 * Returns |cos θ| so both aligned and anti-aligned struts count equally.
 */
export function computeAlignment(
  dx: number,
  dy: number,
  dz: number
): number {
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < EPSILON) return 0;
  const nx = dx / len, ny = dy / len, nz = dz / len;
  const dot = nx * LOAD_DIR[0] + ny * LOAD_DIR[1] + nz * LOAD_DIR[2];
  return safeNumber(Math.abs(dot), 0);
}

/**
 * Orientation efficiency factor O_i.
 * O_i = orientationBase + orientationGain × alignment_i
 */
export function computeOrientationFactor(alignment: number): number {
  return clamp(
    ORIENTATION_BASE + ORIENTATION_GAIN * alignment,
    MIN_ORIENTATION_FACTOR,
    1.0
  );
}

// ─── Local demand field ───────────────────────────────────────

/**
 * Compute local demand D_i for a strut.
 *
 * D_i = normalize(W_i × L_i × O_i, D_min, D_max)
 *
 * W_i = 1 + β × z_norm  (load-position influence)
 * L_i = load-path factor (simplified: alignment with load)
 * O_i = orientationBase + orientationGain × alignment_i
 *
 * @param z_norm Normalised vertical position of strut midpoint [0,1]
 * @param alignment Strut alignment with load direction [0,1]
 * @param F_norm Normalised applied load [0,1]
 */
export function computeLocalDemand(
  z_norm: number,
  alignment: number,
  F_norm: number,
  beta = 0.6
): number {
  const W_i = 1 + beta * z_norm;
  const L_i = 0.4 + 0.6 * alignment; // load-path influence
  const O_i = computeOrientationFactor(alignment);
  const raw = W_i * L_i * O_i * F_norm;
  // Normalise: raw range is roughly [0, (1+β)×1×1×1] = [0, 1.6]
  return clamp(safeNumber(raw / 1.6, 0), 0, 1);
}

// ─── Local density from demand ────────────────────────────────

/**
 * Local relative density from local demand.
 * ρ_i = clamp(ρ_base × (1 + α × (D_i − 0.5)), ρ_min, ρ_max)
 */
export function computeLocalDensity(
  demand: number,
  rho_base: number
): number {
  const raw = rho_base * (1 + ALPHA * (demand - 0.5));
  return clamp(safeNumber(raw, rho_base), RHO_LATTICE_MIN, RHO_LATTICE_MAX);
}

// ─── Strut thickness from local density ──────────────────────

/**
 * Strut radius from local relative density.
 * t_i = t_base × sqrt(ρ_i / ρ_base)
 */
export function computeStrutRadius(
  localDensity: number,
  rho_base: number,
  r_base: number
): number {
  if (rho_base < EPSILON) return r_base;
  const raw = r_base * Math.sqrt(localDensity / rho_base);
  return clamp(safeNumber(raw, r_base * 0.5), r_base * 0.3, r_base * 2.0);
}

// ─── Stiffness proxy ─────────────────────────────────────────

/**
 * Bone-inspired effective relative stiffness.
 * E_rel_bone = ρ_eff^n × orientationFactor
 */
export function computeBoneRelativeStiffness(
  rho_eff: number,
  orientationFactor: number
): number {
  const rho = clamp(rho_eff, EPSILON, 1.0);
  const oFac = clamp(orientationFactor, MIN_ORIENTATION_FACTOR, 1.0);
  return safeNumber(Math.pow(rho, STIFFNESS_EXPONENT) * oFac, EPSILON);
}

// ─── Strut network generation ─────────────────────────────────

/**
 * Generate the bone-inspired strut network.
 *
 * The network is a CONCEPTUAL ENGINEERED LATTICE inspired by trabecular bone.
 * It is irregular by design, with variable cell size, strut thickness,
 * orientation, and local density responding to the applied load.
 *
 * Topology:
 * - Random node positions seeded for reproducibility
 * - Nodes are connected to nearby neighbours within a cutoff radius
 * - Orientation-responsive (preferred vertical struts in high-load areas)
 *
 * @param cellSizeMm    Cell characteristic length in mm
 * @param cellCount     Approx number of cells across one axis
 * @param F             Applied load in N
 * @param orientationDeg Primary orientation angle in degrees
 * @param rho_base      Base relative density
 * @param seed          Random seed for reproducibility
 */
export function generateStrutNetwork(
  cellSizeMm: number,
  cellCount: number,
  F: number,
  orientationDeg: number,
  rho_base: number,
  seed = 42
): StrutElement[] {
  const rand = seededRandom(seed);

  const gridN = clamp(Math.round(cellCount), 2, 8);
  const span = clamp(cellSizeMm, 5, 50) / 10; // mm → scene units
  const totalSpan = gridN * span;
  const half = totalSpan / 2;

  const F_norm = computeNormalizedLoad(F);
  const r_base = clamp(span * 0.12, 0.04, 0.4);

  // Orientation preference angle (convert to radians)
  const oriRad = (clamp(orientationDeg, 0, 90) * Math.PI) / 180;

  // ─── Generate nodes ───────────────────────────────────────
  // Regular grid with controlled random jitter
  const nodes: [number, number, number][] = [];
  const jitterScale = span * 0.35;

  for (let ix = 0; ix <= gridN; ix++) {
    for (let iy = 0; iy <= gridN; iy++) {
      for (let iz = 0; iz <= gridN; iz++) {
        const bx = -half + ix * span;
        const by = -half + iy * span;
        const bz = -half + iz * span;
        // Jitter: more near centre (trabecular-like density variation)
        const r = Math.sqrt(bx * bx + bz * bz) / half;
        const j = jitterScale * (0.3 + 0.7 * r);
        nodes.push([
          bx + (rand() - 0.5) * j,
          by + (rand() - 0.5) * j * 0.5,
          bz + (rand() - 0.5) * j,
        ]);
      }
    }
  }

  // ─── Connect nearby node pairs ────────────────────────────
  const cutoff = span * 1.8;
  const struts: StrutElement[] = [];
  let id = 0;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const [x1, y1, z1] = nodes[i];
      const [x2, y2, z2] = nodes[j];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dz = z2 - z1;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > cutoff || dist < EPSILON) continue;

      // Strut midpoint
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const mz = (z1 + z2) / 2;

      // Normalised vertical position of midpoint [0,1]
      const z_norm = normalize(my, -half, half);

      // Alignment with load direction
      const alignment = computeAlignment(dx, dy, dz);

      // Demand field
      const demand = computeLocalDemand(z_norm, alignment, F_norm);

      // Local density
      const localDensity = computeLocalDensity(demand, rho_base);

      // Strut radius
      const radius = computeStrutRadius(localDensity, rho_base, r_base);

      struts.push({
        id: id++,
        startX: x1,
        startY: y1,
        startZ: z1,
        endX: x2,
        endY: y2,
        endZ: z2,
        length: dist,
        demand,
        localDensity,
        radius,
        alignment,
      });
    }
  }

  return struts;
}

/**
 * Compute the average orientation factor across all struts.
 */
export function computeAverageOrientationFactor(
  struts: StrutElement[]
): number {
  if (struts.length === 0) return MIN_ORIENTATION_FACTOR;
  const sum = struts.reduce(
    (acc, s) => acc + computeOrientationFactor(s.alignment),
    0
  );
  return safeNumber(sum / struts.length, MIN_ORIENTATION_FACTOR);
}

/**
 * Compute the average relative density across all struts.
 */
export function computeAverageRelativeDensity(
  struts: StrutElement[]
): number {
  if (struts.length === 0) return RHO_LATTICE_MIN;
  const sum = struts.reduce((acc, s) => acc + s.localDensity, 0);
  return safeNumber(sum / struts.length, RHO_LATTICE_MIN);
}

/**
 * Estimate total solid volume of strut network (m³).
 * V_solid ≈ Σ π r_i² L_i × 0.85 (node overlap correction)
 */
export function computeStrutNetworkVolume(struts: StrutElement[]): number {
  let V = 0;
  const sceneToM = 0.01; // scene units → metres (1 su = 10 mm)
  for (const s of struts) {
    const r = s.radius * sceneToM;
    const l = s.length * sceneToM;
    V += Math.PI * r * r * l;
  }
  return safeNumber(V * 0.85, 0);
}
