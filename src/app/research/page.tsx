import React from "react";
import Link from "next/link";
import styles from "./research.module.css";

export default function ResearchPage() {
  return (
    <div className="container section">
      <div className="section-title">
        <h2>Research &amp; Biomimetic Foundations</h2>
      </div>

      <div className={styles.introBlock}>
        <p className={styles.leadText}>
          This project investigates how biological cellular architectures achieve extraordinary structural
          efficiency through functional material grading, morphology, and load-path orientation.
        </p>
      </div>

      {/* ── Research Paper Reference ─────────────────────── */}
      <div className={`card ${styles.paperCard}`}>
        <div className={styles.badgeRow}>
          <span className="badge badge-yellow">Primary Literature Source</span>
          <span className="badge badge-blue">Additive Manufacturing &amp; Biomimicry</span>
        </div>
        <h3 className={styles.paperTitle}>
          Bone-Inspired 3D Printed Structures for Construction Applications
        </h3>
        <p className={styles.paperAuthors}>
          <strong>Authors:</strong> Roberto Naboni &amp; Anja Kunic (2019)
        </p>
        <div className={styles.paperSummary}>
          <p>
            The research investigates cellular solids designed with trabecular bone-inspired morphological
            logic, manufactured using large-scale Additive Manufacturing (AM). By translating bone remodelling
            principles into continuous material density variations, the authors demonstrated high strength-to-weight
            ratios in compressive load-bearing architectural components.
          </p>
        </div>

        {/* Paper Experimental Benchmarks */}
        <div className={styles.benchmarkHeader}>
          <h4>Experimental Benchmarks (Source Paper Data)</h4>
          <span className={styles.sourceTag}>Physical Lab Measurements</span>
        </div>
        <div className="grid-3" style={{ marginTop: "1rem" }}>
          <div className={styles.metricBox}>
            <div className={styles.metricVal}>185 g</div>
            <div className={styles.metricLabel}>Lattice Brick Mass</div>
            <div className={styles.metricSub}>3D printed polymer test component</div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricVal}>up to 3000 N</div>
            <div className={styles.metricLabel}>Compression Resistance</div>
            <div className={styles.metricSub}>Peak load before structural failure</div>
          </div>
          <div className={styles.metricBox}>
            <div className={styles.metricVal}>~1600×</div>
            <div className={styles.metricLabel}>Load-to-Weight Ratio</div>
            <div className={styles.metricSub}>Supports over 1600 times its own mass</div>
          </div>
        </div>
        <div className={styles.envelopeStat}>
          <strong>Full-Scale Cellular Envelope:</strong> 11 kg/m² weight-to-area ratio achieved in architectural envelope prototypes.
        </div>
      </div>

      {/* ── Biological Inspiration vs Engineering Analogy ── */}
      <div className="section-title" style={{ marginTop: "3rem" }}>
        <h2>Biological Principles to Computational Models</h2>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🦴</span>
            <h3>Trabecular Bone Architecture</h3>
          </div>
          <p className={styles.cardBody}>
            Bone is a hierarchically structured porous material. Cancellous (trabecular) bone consists of
            an irregular 3D network of rod- and plate-like struts.
          </p>
          <ul className={styles.list}>
            <li><strong>Anisotropic Alignment:</strong> Trabeculae naturally align along primary principal stress trajectories (Wolff&apos;s Law).</li>
            <li><strong>Density Gradient:</strong> Porosity increases in low-stress cores (lightweighting) and decreases near cortical shells and loading zones.</li>
            <li><strong>Damage Tolerance:</strong> Irregular cell topology arrests micro-crack propagation and prevents catastrophic buckling.</li>
          </ul>
        </div>

        <div className="card">
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>⬡</span>
            <h3>Honeycomb Hexagonal Geometry</h3>
          </div>
          <p className={styles.cardBody}>
            Natural honeycombs represent the optimal 2D space-filling tessellation with minimum perimeter
            for a given area (the Honeycomb Conjecture).
          </p>
          <ul className={styles.list}>
            <li><strong>Uniform High Out-of-Plane Stiffness:</strong> Maximises compressive axial load-bearing capacity along prismatic cell walls.</li>
            <li><strong>Gibson-Ashby Scaling:</strong> Relative density scales as {"ρ* / ρs ≈ (2/√3)(t / l)"}.</li>
            <li><strong>Regular Periodic Topology:</strong> Predictable crushing mechanics and uniform energy absorption properties.</li>
          </ul>
        </div>
      </div>

      {/* ── Remodelling Analogy Table ──────────────────────── */}
      <div className={`card ${styles.analogyCard}`} style={{ marginTop: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem", color: "#F2C94C" }}>
          Biological Remodelling vs Computational Optimization
        </h3>
        <div className={styles.analogyGrid}>
          <div className={styles.analogyCol}>
            <div className={styles.analogyHead}>Biological Process</div>
            <div className={styles.analogyItem}>
              <strong>Mechanosensation:</strong> Osteocytes detect local interstitial fluid flow &amp; strain energy.
            </div>
            <div className={styles.analogyItem}>
              <strong>Deposition (Osteoblasts):</strong> High mechanical strain triggers localized bone mineral deposition.
            </div>
            <div className={styles.analogyItem}>
              <strong>Resorption (Osteoclasts):</strong> Low mechanical strain leads to osteoclastic enzymatic bone removal.
            </div>
          </div>

          <div className={styles.analogyCol}>
            <div className={styles.analogyHead}>Engineered Simulation Analogy</div>
            <div className={styles.analogyItem}>
              <strong>Local Demand Proxy:</strong> Computed from load-path factor, vertical position, and orientation alignment.
            </div>
            <div className={styles.analogyItem}>
              <strong>Material Thickening:</strong> High demand yields target relative density increase and strut radius thickening.
            </div>
            <div className={styles.analogyItem}>
              <strong>Iterative Redistribution:</strong> Step-wise density update {"ρ(k+1) = (1 - γ)ρ(k) + γ·ρ_target"}.
            </div>
          </div>
        </div>
      </div>

      {/* ── Mathematical Formulation Overview ────────────── */}
      <div className="section-title" style={{ marginTop: "3rem" }}>
        <h2>Mathematical Formulation in This Simulation</h2>
      </div>

      <div className="grid-3">
        <div className="card">
          <h4 style={{ color: "#86CFF5", marginBottom: "0.5rem" }}>1. Orientation Factor</h4>
          <p className={styles.formulaDesc}>
            Measures strut axis alignment with the primary downward force vector:
          </p>
          <div className={styles.equation}>
            {"alignment_i = |v_strut,i · v_load|"}
          </div>
          <div className={styles.equation}>
            {"O_i = O_base + O_gain · alignment_i"}
          </div>
        </div>

        <div className="card">
          <h4 style={{ color: "#86CFF5", marginBottom: "0.5rem" }}>2. Local Demand &amp; Density</h4>
          <p className={styles.formulaDesc}>
            Spatial demand distribution based on load position, load-path, and orientation:
          </p>
          <div className={styles.equation}>
            {"D_i = norm(W_i · L_i · O_i · F_norm)"}
          </div>
          <div className={styles.equation}>
            {"ρ_i = clamp(ρ_base · [1 + α(D_i - 0.5)], ρ_min, ρ_max)"}
          </div>
        </div>

        <div className="card">
          <h4 style={{ color: "#86CFF5", marginBottom: "0.5rem" }}>3. Effective Stiffness &amp; Compliance</h4>
          <p className={styles.formulaDesc}>
            Non-linear Gibson-Ashby power-law bending-dominated stiffness scaling:
          </p>
          <div className={styles.equation}>
            {"E_rel = C_E · (ρ_rel)^2 · O_factor"}
          </div>
          <div className={styles.equation}>
            {"δ_visual = scale · F_norm · (1 / E_rel)"}
          </div>
        </div>
      </div>

      {/* ── Scientific Disclaimer Box ──────────────────────── */}
      <div className="disclaimer" style={{ marginTop: "2.5rem" }}>
        <strong>Scientific &amp; Educational Disclaimer:</strong> This application is an educational conceptual simulator designed to demonstrate qualitative biomimetic design principles, material efficiency, and geometric load-responsiveness. The numerical values, stress proxies, and visual deformation outputs are mathematical proxies for pedagogical visualization and are not certified finite-element analysis (FEA) or laboratory-validated engineering specifications. Experimental benchmark figures are cited directly from Naboni &amp; Kunic (2019).
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <Link href="/simulator" className="btn btn-yellow" style={{ marginRight: "1rem" }}>
          ▶ Interactive 3D Simulator
        </Link>
        <Link href="/comparison" className="btn btn-outline">
          ◈ View Comparison Matrix
        </Link>
      </div>
    </div>
  );
}
