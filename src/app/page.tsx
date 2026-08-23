import React from "react";
import Link from "next/link";
import styles from "./home.module.css";

const FEATURES = [
  {
    icon: "⬡",
    title: "Honeycomb Structure",
    desc: "Regular hexagonal cellular geometry inspired by bee honeycombs. Optimal wall thickness and cell size distribute compressive loads efficiently with minimum material perimeter.",
    href: "/simulator",
    accentColor: "#F8E7A6",
    badge: "Periodic Regular",
  },
  {
    icon: "⁜",
    title: "Bone-Inspired Lattice",
    desc: "Irregular trabecular network mimicking cancellous bone. Material distribution dynamically adapts to local structural demand through a biological remodelling optimization analogy.",
    href: "/simulator",
    accentColor: "#A9D8F5",
    badge: "Anisotropic Adaptive",
  },
  {
    icon: "▪",
    title: "Solid Baseline",
    desc: "Dense continuous structural block as reference standard. Demonstrates the material efficiency and mass reduction achieved by introducing intentional porous architectures.",
    href: "/comparison",
    accentColor: "#BFE3D0",
    badge: "Dense Monolithic",
  },
];

const PRINCIPLES = [
  { icon: "⚖", title: "Structural Efficiency", desc: "Maximize compressive load capacity per unit of component mass." },
  { icon: "◎", title: "Material Distribution", desc: "Place material exclusively along principal structural stress paths." },
  { icon: "⟳", title: "Adaptive Remodelling", desc: "Biological inspiration: deposit where stressed, resorb where unloaded." },
  { icon: "◈", title: "Cellular Geometry", desc: "Cellular networks prevent crack propagation and catastrophic buckling." },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="badge badge-blue">University Biomimicry Engineering</span>
              <span className="badge badge-yellow">Conceptual Simulation</span>
            </div>
            <h1 className={styles.heroTitle}>
              Bio-Inspired<br />
              <span className="gradient-text">Load-Bearing</span><br />
              Structures
            </h1>
            <p className={styles.heroDesc}>
              Explore how biological cellular architectures — from bee honeycombs to
              trabecular bone — achieve high strength-to-weight performance through geometry,
              porosity, and adaptive material organization.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/simulator" className="btn btn-yellow">
                ▶ Launch Simulator
              </Link>
              <Link href="/comparison" className="btn btn-outline">
                ◈ View Comparison
              </Link>
              <Link href="/research" className="btn btn-ghost">
                📄 Research Literature
              </Link>
            </div>

            {/* Key stats */}
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>3000 N</span>
                <span className={styles.statLabel}>Peak Load Capacity<br/>(Naboni &amp; Kunic 2019)</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>185 g</span>
                <span className={styles.statLabel}>Lattice Brick Mass<br/>(Lab Benchmark)</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>~1600×</span>
                <span className={styles.statLabel}>Load-to-Weight Ratio<br/>(Reported)</span>
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className={styles.heroVisual}>
            <div className={styles.hexGrid}>
              {Array.from({ length: 19 }).map((_, i) => (
                <div
                  key={i}
                  className={styles.hexCell}
                  style={{
                    background: i % 3 === 0 ? "rgba(248, 231, 166, 0.45)" : "rgba(169, 216, 245, 0.45)",
                    borderColor: i % 3 === 0 ? "#E8D58C" : "#A9D8F5",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="section" style={{ background: "#EEF4F8" }}>
        <div className="container">
          <div className={`section-title ${styles.sectionTitle}`}>
            <h2>Structural Strategies</h2>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <Link
                href={f.href}
                key={f.title}
                className="card card-hover"
                style={{
                  textDecoration: "none",
                  borderTop: `4px solid ${f.accentColor}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "2rem", color: "#243447" }}>{f.icon}</span>
                  <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>{f.badge}</span>
                </div>
                <h3 style={{ color: "#243447", marginBottom: "0.5rem", fontSize: "1.15rem" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "#62748A" }}>{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Principles ─────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className={`section-title ${styles.sectionTitle}`}>
            <h2>Engineering Principles</h2>
          </div>
          <div className="grid-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>{p.icon}</div>
                <h4 style={{ color: "#1C4C74", marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "#62748A" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data Flow Diagram ──────────────────────────────── */}
      <section className="section" style={{ background: "#EEF4F8" }}>
        <div className="container">
          <div className={`section-title ${styles.sectionTitle}`}>
            <h2>Simulation Data Flow</h2>
          </div>
          <div className={styles.dataFlow}>
            {[
              "User Input",
              "Simulation State",
              "Mathematical Model",
              "Local Demand / Stress",
              "Material Distribution",
              "3D Geometry",
              "Metrics + Visualization",
            ].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div className={styles.flowStep}>
                  <div className={styles.flowNum}>{i + 1}</div>
                  <div className={styles.flowLabel}>{step}</div>
                </div>
                {i < arr.length - 1 && <div className={styles.flowArrow}>→</div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.25rem" }}>
            <Link href="/simulator" className="btn btn-yellow">
              ▶ Experience the 3D Simulation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Disclaimer ─────────────────────────────────────── */}
      <section style={{ padding: "1.5rem 0" }}>
        <div className="container">
          <div className="disclaimer">
            <strong>⚠ Scientific Disclaimer:</strong> Conceptual browser simulation.
            Stress and deformation outputs are relative visual/engineering proxies and are not
            validated FEM results. Experimental data shown separately from simulation output.
            Based on: Naboni R. &amp; Kunic A. (2019), <em>Bone-Inspired 3D Printed Structures for
            Construction Applications.</em>
          </div>
        </div>
      </section>
    </div>
  );
}
