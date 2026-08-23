import React from "react";
import Link from "next/link";
import styles from "./home.module.css";

const FEATURES = [
  {
    icon: "⬡",
    title: "Honeycomb Structure",
    desc: "Regular hexagonal cellular geometry inspired by bee honeycombs. Optimal wall thickness and cell size distribute loads efficiently with minimal material.",
    href: "/simulator",
    color: "#4EA9E0",
  },
  {
    icon: "⁜",
    title: "Bone-Inspired Lattice",
    desc: "Irregular trabecular network mimicking cancellous bone. Material distribution adapts to local structural demand through a conceptual optimization analogy.",
    href: "/simulator",
    color: "#F2C94C",
  },
  {
    icon: "▪",
    title: "Solid Baseline",
    desc: "Dense monolithic structure as the reference case. Compare performance metrics against cellular alternatives for the same applied load.",
    href: "/comparison",
    color: "#86CFF5",
  },
];

const PRINCIPLES = [
  { icon: "⚖", title: "Structural Efficiency", desc: "Achieve more load-bearing capacity per unit of material mass." },
  { icon: "◎", title: "Material Distribution", desc: "Place material only where structural demand is highest." },
  { icon: "⟳", title: "Adaptive Remodelling", desc: "Biologically-inspired redistribution: deposit where stressed, resorb where idle." },
  { icon: "◈", title: "Cellular Geometry", desc: "Cellular topology provides multiple load paths and graceful failure modes." },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className="badge badge-blue">University Biomimicry Project</span>
              <span className="badge badge-yellow">Conceptual Simulation</span>
            </div>
            <h1 className={styles.heroTitle}>
              Bio-Inspired<br />
              <span className="gradient-text">Load-Bearing</span><br />
              Structures
            </h1>
            <p className={styles.heroDesc}>
              Explore how nature&apos;s engineering principles — from honeybee geometry to
              trabecular bone architecture — produce extraordinary structural efficiency
              from minimal material.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/simulator" className="btn btn-yellow">
                ▶ Launch Simulator
              </Link>
              <Link href="/comparison" className="btn btn-outline">
                ◈ View Comparison
              </Link>
              <Link href="/research" className="btn btn-ghost">
                📄 Research
              </Link>
            </div>

            {/* Key stats */}
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>3000 N</span>
                <span className={styles.statLabel}>Compression resistance<br/>(Naboni & Kunic, 2019)</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>185 g</span>
                <span className={styles.statLabel}>Lattice brick mass<br/>(experimental reference)</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>~1600×</span>
                <span className={styles.statLabel}>Load-to-weight ratio<br/>(paper reported)</span>
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
                    opacity: 0.3 + (i % 7) * 0.1,
                    background: i % 3 === 0
                      ? "rgba(242,201,76,0.15)"
                      : "rgba(78,169,224,0.1)",
                    borderColor: i % 3 === 0
                      ? "rgba(242,201,76,0.3)"
                      : "rgba(78,169,224,0.25)",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="section" style={{ background: "#0D2447" }}>
        <div className="container">
          <div className={`section-title ${styles.sectionTitle}`}>
            <h2>Structural Strategies</h2>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <Link href={f.href} key={f.title} className="card card-hover" style={{ textDecoration: "none" }}>
                <div style={{ fontSize: "2.2rem", color: f.color, marginBottom: "0.75rem" }}>
                  {f.icon}
                </div>
                <h3 style={{ color: "#F4F8FC", marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>{f.desc}</p>
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
                <h4 style={{ color: "#86CFF5", marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                  {p.title}
                </h4>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.55 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data flow diagram ──────────────────────────────── */}
      <section className="section" style={{ background: "#0D2447" }}>
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
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/simulator" className="btn btn-yellow">
              ▶ Experience the Simulation
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
            Based on: Naboni R. & Kunic A. (2019), <em>Bone-Inspired 3D Printed Structures for
            Construction Applications.</em>
          </div>
        </div>
      </section>
    </div>
  );
}
