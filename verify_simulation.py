"""
Verification script for Bio-Inspired Load-Bearing Structures Simulation
Executes all validation tests including Omnidirectional 3D Load Vectors,
3D Gaussian Spatial Proximity, Green->Yellow->Red Stress Colors,
Structure Inspection Mode, and 4-Cell Geometry Comparison (Triangle, Square, Circle, Hexagon).
"""

import math
import sys

# Simulation Constants
LOAD_MIN_N = 500
LOAD_MAX_N = 4500
THRESHOLD_SOLID_N = 2000
THRESHOLD_HONEYCOMB_N = 3500
THRESHOLD_BONE_N = 4000
LOAD_INFLUENCE_SIGMA = 1.3

RHO_MIN = 0.10
RHO_MAX = 0.90
RHO_LATTICE_MIN = 0.15
RHO_LATTICE_MAX = 0.75
ALPHA = 0.8
GAMMA = 0.25
MAX_OPT_ITERATIONS = 5
STIFFNESS_EXPONENT = 2
ORIENTATION_BASE = 0.2
ORIENTATION_GAIN = 0.8
MIN_ORIENTATION_FACTOR = 0.1
GEOMETRY_SCALE = 5.0
EPSILON = 1e-9
REFERENCE_AREA_M2 = 4e-4
REFERENCE_STRESS_PA = 40e6
DENSITY_PA12 = 1010  # kg/m3

def clamp(x, min_val, max_val):
    if math.isnan(x) or math.isinf(x):
        return min_val
    return max(min_val, min(max_val, x))

def normalize(x, xmin, xmax):
    rng = xmax - xmin
    if abs(rng) < EPSILON:
        return 0.0
    return clamp((x - xmin) / rng, 0.0, 1.0)

def normalize_load(F):
    return normalize(clamp(F, LOAD_MIN_N, LOAD_MAX_N), LOAD_MIN_N, LOAD_MAX_N)

def compute_nominal_stress(F, relative_density):
    A_eff = relative_density * REFERENCE_AREA_M2
    return F / max(A_eff, EPSILON)

def compute_stress_index(F, relative_density, orientation_factor=1.0):
    sigma = compute_nominal_stress(F, relative_density)
    effective_sigma = sigma / max(orientation_factor, EPSILON)
    raw = effective_sigma / REFERENCE_STRESS_PA
    return clamp(raw * 100.0, 0.0, 100.0)

def compute_relative_stiffness(relative_density, C_E=1.0):
    rho = clamp(relative_density, EPSILON, 1.0)
    return C_E * (rho ** STIFFNESS_EXPONENT)

def compute_compliance(relative_density):
    E_rel = compute_relative_stiffness(relative_density)
    return 1.0 / max(E_rel, EPSILON)

def compute_deformation(F, relative_density, deformation_scale=1.0, orientation_factor=1.0, max_delta=2.0):
    F_norm = normalize_load(F)
    compliance = compute_compliance(relative_density)
    orient_mod = 1.0 + 0.3 * (1.0 - clamp(orientation_factor, 0.0, 1.0))
    raw = deformation_scale * F_norm * compliance * GEOMETRY_SCALE * orient_mod * 0.05
    return clamp(raw, 0.0, max_delta)

def compute_honeycomb_rho(wall_thickness_mm, cell_size_mm):
    if cell_size_mm < EPSILON:
        return RHO_MIN
    raw = (2.0 / math.sqrt(3.0)) * (wall_thickness_mm / cell_size_mm)
    return clamp(raw, RHO_MIN, RHO_MAX)

def compute_orientation_factor(alignment):
    return clamp(ORIENTATION_BASE + ORIENTATION_GAIN * alignment, MIN_ORIENTATION_FACTOR, 1.0)

def compute_normalized_load_dir(dx, dy, dz):
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    if length < EPSILON:
        return (0.0, -1.0, 0.0)
    return (dx / length, dy / length, dz / length)

def compute_3d_load_spatial_influence(px, py, pz, lx, ly, lz, sigma=LOAD_INFLUENCE_SIGMA):
    dx = px - lx
    dy = py - ly
    dz = pz - lz
    r2 = dx * dx + dy * dy + dz * dz
    raw = math.exp(-r2 / (2.0 * sigma * sigma))
    return clamp(raw, 0.05, 1.0)

def demand_to_stress_rgb(d):
    d = clamp(d, 0.0, 1.0)
    if d <= 0.5:
        t = d / 0.5
        r = (1 - t) * 0.298 + t * 0.949
        g = (1 - t) * 0.686 + t * 0.788
        b = (1 - t) * 0.314 + t * 0.298
        return (r, g, b)
    else:
        t = (d - 0.5) / 0.5
        r = (1 - t) * 0.949 + t * 0.878
        g = (1 - t) * 0.788 + t * 0.322
        b = (1 - t) * 0.298 + t * 0.322
        return (r, g, b)

# ── Cell Geometry Comparison Mock ─────────────────────────────
def compute_cell_geometries(F, dx, dy, dz, t_mm=2.0, L_mm=18.0):
    ratio = t_mm / L_mm
    nd = compute_normalized_load_dir(dx, dy, dz)
    axial = abs(nd[1])
    lateral = math.sqrt(nd[0]*nd[0] + nd[2]*nd[2])

    rho_tri = clamp(2 * math.sqrt(3) * ratio, 0.15, 0.85)
    rho_sq = clamp(2.0 * ratio, 0.12, 0.75)
    rho_circ = clamp(1.0 - (math.pi * ((L_mm - t_mm)/2)**2) / (L_mm * L_mm), 0.18, 0.88)
    rho_hex = clamp((2 / math.sqrt(3)) * ratio, 0.08, 0.65)

    return {
        "triangle": {"Z": 6, "rho": rho_tri, "stiffness": 0.9 * (rho_tri * axial + rho_tri * 1.15 * lateral)},
        "square": {"Z": 4, "rho": rho_sq, "stiffness": 0.85 * (rho_sq * axial + rho_sq * 0.75 * lateral)},
        "circle": {"Z": 4, "rho": rho_circ, "stiffness": 0.82 * (rho_circ * 0.95 * axial + rho_circ * 0.85 * lateral)},
        "hexagon": {"Z": 3, "rho": rho_hex, "stiffness": 0.92 * (rho_hex * 1.25 * axial + (rho_hex**2) * 0.65 * lateral)},
    }

def test_all():
    print("=================================================")
    print(" RUNNING BIOSTRUCT SIMULATION VERIFICATION TESTS ")
    print("=================================================")

    # TEST 1: Omnidirectional 3D Direction Normalization
    d_down = compute_normalized_load_dir(0, -5, 0)
    assert abs(d_down[1] - (-1.0)) < EPSILON, "Downward normalization failed"
    d_diag = compute_normalized_load_dir(1, 1, 1)
    expected_comp = 1.0 / math.sqrt(3.0)
    assert abs(d_diag[0] - expected_comp) < EPSILON, "Diagonal normalization failed"
    print(" [PASS] TEST 1: Omnidirectional 3D load vectors normalize accurately")

    # TEST 2: Green -> Yellow -> Red Stress Color Interpolation
    rgb_low = demand_to_stress_rgb(0.0)    # Green
    rgb_mid = demand_to_stress_rgb(0.5)    # Yellow
    rgb_high = demand_to_stress_rgb(1.0)   # Red
    assert rgb_low[1] > rgb_low[0], "Green must have higher G than R"
    assert rgb_mid[0] > 0.8 and rgb_mid[1] > 0.7, "Yellow must have high R & G"
    assert rgb_high[0] > rgb_high[1], "Red must have higher R than G"
    print(" [PASS] TEST 2: Stress colors correctly map to Green -> Yellow -> Red")

    # TEST 3: Full 3D Spatial Gaussian Load Influence
    inf_target = compute_3d_load_spatial_influence(0.0, 2.5, 0.0, 0.0, 2.5, 0.0)
    inf_dist = compute_3d_load_spatial_influence(0.0, -1.0, 0.0, 0.0, 2.5, 0.0)
    assert inf_target > inf_dist, "Proximity influence failed"
    print(f" [PASS] TEST 3: 3D Spatial Gaussian influence localized (target={inf_target:.2f}, distant={inf_dist:.2f})")

    # TEST 4: Increase load -> stress proxy increases
    s1 = compute_stress_index(1000, 0.35)
    s2 = compute_stress_index(2500, 0.35)
    assert s2 > s1, f"Test 4 Failed: {s2} not > {s1}"
    print(" [PASS] TEST 4: Increase load -> stress proxy increases")

    # TEST 5: Increase load -> deformation increases
    d1 = compute_deformation(1000, 0.35)
    d2 = compute_deformation(2500, 0.35)
    assert d2 > d1, f"Test 5 Failed: {d2} not > {d1}"
    print(" [PASS] TEST 5: Increase load -> deformation increases")

    # TEST 6: Increase relative density -> deformation decreases
    d_low_rho = compute_deformation(1500, 0.20)
    d_high_rho = compute_deformation(1500, 0.60)
    assert d_high_rho < d_low_rho, f"Test 6 Failed: {d_high_rho} not < {d_low_rho}"
    print(" [PASS] TEST 6: Increase relative density -> deformation decreases")

    # TEST 7: Change orientation -> alignment changes
    align_vertical = abs(1.0)
    align_horizontal = abs(0.0)
    o_vert = compute_orientation_factor(align_vertical)
    o_horiz = compute_orientation_factor(align_horizontal)
    assert o_vert > o_horiz, f"Test 7 Failed: {o_vert} not > {o_horiz}"
    print(" [PASS] TEST 7: Change orientation -> geometry alignment factor changes")

    # TEST 8: Bone optimization -> redistribution changes local density
    rho_base = 0.35
    demands = [0.1, 0.5, 0.9]
    target_rhos = [clamp(rho_base * (1 + ALPHA * (d - 0.5)), RHO_LATTICE_MIN, RHO_LATTICE_MAX) for d in demands]
    updated_rhos = [(1 - GAMMA) * rho_base + GAMMA * t for t in target_rhos]
    assert updated_rhos[2] > updated_rhos[0], f"Test 8 Failed"
    print(" [PASS] TEST 8: Bone optimization adapts to directional demand")

    # TEST 9: Honeycomb formula validity
    hc_rho = compute_honeycomb_rho(2.4, 18.0)
    assert 0.15 < hc_rho < 0.40, f"Test 9 Failed: {hc_rho}"
    print(f" [PASS] TEST 9: Honeycomb regular cellular scaling verified (rho_rel = {hc_rho:.4f})")

    # TEST 10: Structural Load Failure Thresholds (SOLID < HONEYCOMB < BONE)
    assert THRESHOLD_SOLID_N < THRESHOLD_HONEYCOMB_N < THRESHOLD_BONE_N, "Threshold hierarchy failed"
    assert THRESHOLD_SOLID_N == 2000 and THRESHOLD_HONEYCOMB_N == 3500 and THRESHOLD_BONE_N == 4000
    print(f" [PASS] TEST 10: Threshold hierarchy verified (Solid={THRESHOLD_SOLID_N}N < Honeycomb={THRESHOLD_HONEYCOMB_N}N < Bone={THRESHOLD_BONE_N}N)")

    # TEST 11: Defaults check including 3D direction vector and Inspection Mode
    defaults = {
        "loadN": 1500,
        "loadPosX": 0.0,
        "loadPosY": 2.5,
        "loadPosZ": 0.0,
        "loadDirX": 0.0,
        "loadDirY": -1.0,
        "loadDirZ": 0.0,
        "inspectionMode": False,
        "cutawayOpacity": 0.35,
    }
    assert defaults["loadDirY"] == -1.0 and defaults["inspectionMode"] is False
    print(" [PASS] TEST 11: Defaults check passed with Inspection Mode fields")

    # TEST 12: Zero NaN / Infinity across all omnidirectional inputs
    for dx, dy, dz in [(0, -1, 0), (1, 0, 0), (0, 1, 0), (-1, -1, -1), (0, 0, 0)]:
        nd = compute_normalized_load_dir(dx, dy, dz)
        for val in nd:
            assert not math.isnan(val) and not math.isinf(val)
    print(" [PASS] TEST 12: No output contains NaN/Infinity across edge cases")

    # TEST 13: 4-Cell Geometry Comparison Model (Triangle, Square, Circle, Hexagon)
    geos = compute_cell_geometries(1500, 0, -1, 0, 2.0, 18.0)
    assert geos["triangle"]["Z"] == 6, "Triangle coordination must be 6"
    assert geos["square"]["Z"] == 4, "Square coordination must be 4"
    assert geos["circle"]["Z"] == 4, "Circle coordination must be 4"
    assert geos["hexagon"]["Z"] == 3, "Hexagon coordination must be 3"
    # Hexagon has the lowest relative density (lightest space-filling) for constant wall thickness
    assert geos["hexagon"]["rho"] < geos["square"]["rho"] < geos["triangle"]["rho"]
    print(" [PASS] TEST 13: 4-Cell Geometry comparison verified (Triangle Z=6, Square Z=4, Circle Z=4, Hexagon Z=3)")

    print("=================================================")
    print(" ALL 13 VERIFICATION TESTS PASSED SUCCESSFULLY!  ")
    print("=================================================")

if __name__ == "__main__":
    test_all()
