import React from "react";
import Link from "next/link";
import styles from "./research.module.css";

export default function ResearchPage() {
  return (
    <div className="container section">
      <div className="section-title">
        <h2>Research &amp; Literature Foundations</h2>
      </div>

      <div className={styles.introBlock}>
        <p className={styles.leadText}>
          This project investigates how biological cellular architectures achieve superior structural
          efficiency through load-responsive functional material grading, morphology, and directional
          strut orientation. Below is the scientific literature and research hierarchy that grounds
          this simulation.
        </p>
      </div>

      {/* ── Visual Flow: From Bone to Engineering ───────── */}
      <div className={`card ${styles.flowCard}`}>
        <h3 className={styles.flowTitle}>From Biological Remodelling to Additive Engineering</h3>
        <div className={styles.bioFlow}>
          {[
            { step: "BONE", desc: "Hierarchical living porous organ", color: "#A9D8F5" },
            { step: "TRABECULAR ARCHITECTURE", desc: "Open-cell irregular cancellous network", color: "#DCEFFA" },
            { step: "LOAD-RESPONSIVE ORGANIZATION", desc: "Wolff's Law: alignment along principal stresses", color: "#F8E7A6" },
            { step: "ENGINEERED LATTICE", desc: "Density-graded additive manufactured component", color: "#BFE3D0" },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.step}>
              <div className={styles.bioNode} style={{ borderTop: `4px solid ${item.color}` }}>
                <div className={styles.bioNodeTitle}>{item.step}</div>
                <div className={styles.bioNodeDesc}>{item.desc}</div>
              </div>
              {idx < arr.length - 1 && <div className={styles.bioArrow}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          1. PRIMARY TECHNICAL RESEARCH — Naboni & Kunic (2019)
         ══════════════════════════════════════════════════════ */}
      <div className={styles.sourceCategoryHeader}>
        <span className={styles.sourceCategoryNumber}>1</span>
        <h3 className={styles.sourceCategoryTitle}>Primary Technical Research</h3>
      </div>

      <div className={styles.primaryPaperCard}>
        <div className={styles.badgeRow}>
          <span className="badge badge-yellow">★ Main Technical Source</span>
          <span className="badge badge-blue">Additive Manufacturing &amp; Construction</span>
        </div>
        <h3 className={styles.paperTitle}>
          Bone-Inspired 3D Printed Structures for Construction Applications
        </h3>
        <p className={styles.paperAuthors}>
          <strong>Authors:</strong> Roberto Naboni &amp; Anja Kunic (2019)
        </p>

        <a
          href="https://www.researchgate.net/publication/336049352_Bone-inspired_3D_printed_structures_for_construction_applications"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkButton}
        >
          ↗ View on ResearchGate (Naboni &amp; Kunic 2019)
        </a>

        <div className={styles.paperSummary}>
          <p>
            This paper serves as the <strong>primary technical foundation</strong> for this project. The authors
            develop a computational framework translating trabecular bone morphological logic and remodelling
            principles into continuous material density variations, fabricated via large-scale additive manufacturing.
            It provides direct empirical and computational grounding for:
          </p>
        </div>

        <div className={styles.topicsList}>
          {[
            "Bone-inspired load-bearing structures",
            "Trabecular / cellular architecture",
            "Porosity & relative density distribution",
            "Structural orientation & load-path alignment",
            "Bone remodelling as biological inspiration",
            "Computational design & finite-element modeling",
            "Topology optimization",
            "Additive manufacturing of lattice structures",
            "Architectural construction applications",
          ].map((topic) => (
            <span key={topic} className={styles.topicTag}>
              ✓ {topic}
            </span>
          ))}
        </div>

        {/* Paper Experimental Benchmarks */}
        <div className={styles.benchmarkHeader}>
          <h4>Experimental Values Reported in Naboni &amp; Kunic (2019)</h4>
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

      {/* ══════════════════════════════════════════════════════
          2. SECONDARY SOURCE — Buccino et al. (2021)
         ══════════════════════════════════════════════════════ */}
      <div className={styles.sourceCategoryHeader}>
        <span className={styles.sourceCategoryNumber}>2</span>
        <h3 className={styles.sourceCategoryTitle}>Supporting Bio-Inspired Design Literature</h3>
      </div>

      <div className={styles.secondaryPaperCard}>
        <div className={styles.badgeRow}>
          <span className="badge badge-blue">Supporting Literature</span>
          <span className="badge badge-yellow">Biomimetic Concepts</span>
        </div>
        <h3 className={styles.paperTitle}>
          Down to the Bone: A Novel Bio-Inspired Design Concept
        </h3>
        <p className={styles.paperAuthors}>
          <strong>Authors:</strong> Buccino et al. (2021)
        </p>

        <a
          href="https://www.researchgate.net/publication/353537718_Down_to_the_Bone_A_Novel_Bio-Inspired_Design_Concept"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkButton}
        >
          ↗ View on ResearchGate (Buccino et al. 2021)
        </a>

        <div className={styles.paperSummary}>
          <p>
            Provides secondary conceptual support examining broader bone-inspired engineering paradigms.
            This paper investigates multiscale bone hierarchical architecture, biomimetic design concepts,
            and cross-disciplinary applications of bone-derived structural mechanics.
          </p>
        </div>

        <div className={styles.topicsList}>
          {[
            "Broader bone-inspired design principles",
            "Multiscale bone architecture",
            "Biomimetic structural concepts",
            "Cross-disciplinary engineering applications",
          ].map((topic) => (
            <span key={topic} className={styles.topicTag}>
              ◈ {topic}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          3. HISTORICAL / MATERIALS CONTEXT SOURCE
         ══════════════════════════════════════════════════════ */}
      <div className={styles.sourceCategoryHeader}>
        <span className={styles.sourceCategoryNumber}>3</span>
        <h3 className={styles.sourceCategoryTitle}>Engineering Materials &amp; Historical Context</h3>
      </div>

      <div className={styles.timelineCard}>
        <div className={styles.badgeRow}>
          <span className="badge badge-blue">Historical Context</span>
          <span className="badge badge-yellow">Materials Evolution</span>
        </div>
        <h3 className={styles.paperTitle}>
          Brief Timeline of the Relative Importance of Engineering Materials Worldwide
        </h3>
        <p className={styles.paperAuthors}>
          <strong>Source:</strong> Materials Development Evolution Timeline (ResearchGate)
        </p>

        <a
          href="https://www.researchgate.net/figure/Brief-timeline-of-the-relative-importance-of-engineering-materials-worldwide-adapted_fig1_348433094"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkButton}
        >
          ↗ View Figure on ResearchGate (Materials Timeline)
        </a>

        <div className={styles.paperSummary}>
          <p>
            Provides historical and technological context charting the evolution of engineering materials
            from monolithic masonry, timber, and metals toward modern cellular solids, functional composites,
            and architected metamaterials.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          4. VIDEO / VISUAL REFERENCES
         ══════════════════════════════════════════════════════ */}
      <div className={styles.sourceCategoryHeader}>
        <span className={styles.sourceCategoryNumber}>4</span>
        <h3 className={styles.sourceCategoryTitle}>Visual &amp; Video References</h3>
      </div>

      <div className={styles.videoGrid}>
        <div className={styles.videoCard}>
          <span className={styles.videoBadge}>Visual Demonstration 1</span>
          <div className={styles.videoTitle}>Bio-Inspired Structural Video Reference</div>
          <p className={styles.videoDesc}>
            Supplementary visual reference demonstrating load-bearing structural behavior and cellular geometry.
          </p>
          <a
            href="https://www.youtube.com/watch?v=e2ET_-pdZaw"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoLink}
          >
            ▶ youtube.com/watch?v=e2ET_-pdZaw
          </a>
        </div>

        <div className={styles.videoCard}>
          <span className={styles.videoBadge}>Visual Demonstration 2</span>
          <div className={styles.videoTitle}>Cellular Additive Manufacturing Reference</div>
          <p className={styles.videoDesc}>
            Supplementary visual demonstration on lattice construction and additive design principles.
          </p>
          <a
            href="https://youtu.be/XK7NZMZ4YDs"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoLink}
          >
            ▶ youtu.be/XK7NZMZ4YDs
          </a>
        </div>

        <div className={styles.videoCard}>
          <span className={styles.videoBadge}>Visual Demonstration 3</span>
          <div className={styles.videoTitle}>Structural Mechanics Context Reference</div>
          <p className={styles.videoDesc}>
            Supplementary video resource demonstrating mechanical testing and load-path responsiveness.
          </p>
          <a
            href="https://youtu.be/kIHgosSM-nI"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoLink}
          >
            ▶ youtu.be/kIHgosSM-nI
          </a>
        </div>
      </div>

      {/* ── Biological Principles: Bone vs Honeycomb ──────── */}
      <div className="section-title" style={{ marginTop: "3rem" }}>
        <h2>Biological Principles to Computational Models</h2>
      </div>

      <div className="grid-2">
        <div className="card" style={{ borderTop: "4px solid #A9D8F5" }}>
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

        <div className="card" style={{ borderTop: "4px solid #F8E7A6" }}>
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
      <div className={`card ${styles.analogyCard}`} style={{ marginTop: "1.75rem" }}>
        <h3 style={{ marginBottom: "1.25rem", color: "#1C4C74" }}>
          Biological Remodelling vs Computational Optimization
        </h3>
        <div className={styles.analogyGrid}>
          <div className={styles.analogyCol}>
            <div className={styles.analogyHead} style={{ color: "#1C4C74", borderBottomColor: "#A9D8F5" }}>
              Biological Process
            </div>
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
            <div className={styles.analogyHead} style={{ color: "#634B00", borderBottomColor: "#F8E7A6" }}>
              Engineered Simulation Analogy
            </div>
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
          <h4 style={{ color: "#1C4C74", marginBottom: "0.5rem" }}>1. Orientation Factor</h4>
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
          <h4 style={{ color: "#1C4C74", marginBottom: "0.5rem" }}>2. Local Demand &amp; Density</h4>
          <p className={styles.formulaDesc}>
            Spatial demand distribution based on load position, load-path, and orientation:
          </p>
          <div className={styles.equation}>
            {"D_i = norm(W_i · L_i · O_i · S_i · F_norm)"}
          </div>
          <div className={styles.equation}>
            {"ρ_i = clamp(ρ_base · [1 + α(D_i - 0.5)], ρ_min, ρ_max)"}
          </div>
        </div>

        <div className="card">
          <h4 style={{ color: "#1C4C74", marginBottom: "0.5rem" }}>3. Effective Stiffness &amp; Compliance</h4>
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
        <strong>Research vs Conceptual Simulation Disclaimer:</strong> The experimental benchmark figures
        (185 g mass, up to 3000 N compression resistance, ~1600× load-to-weight ratio, 11 kg/m² envelope)
        are cited directly from <em>Naboni &amp; Kunic (2019)</em>. This website is an educational conceptual
        simulator designed to demonstrate qualitative biomimetic design principles and geometric
        responsiveness. The numerical outputs and visual deformation are mathematical proxies for pedagogical
        illustration and do not reproduce or replace physical testing or finite-element analysis (FEA).
      </div>

      <div style={{ textAlign: "center", marginTop: "2.25rem" }}>
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
