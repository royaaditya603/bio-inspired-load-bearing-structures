"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./presentation.module.css";

interface Slide {
  id: number;
  tag: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  callout?: string;
  stats?: { label: string; value: string }[];
  diagramType?: "honeycomb" | "bone" | "comparison" | "workflow" | "formula";
}

const SLIDES: Slide[] = [
  {
    id: 1,
    tag: "Biomimicry Engineering Project",
    title: "Bio-Inspired Load-Bearing Structures",
    subtitle: "Computational Modelling of Honeycomb & Trabecular Architectures for Structural Efficiency",
    bullets: [
      "College Engineering Project: Structural Biomimicry Demonstrator",
      "Investigating functional material distribution in biological cellular systems",
      "Real-time interactive 3D simulation comparing Solid vs Honeycomb vs Bone-Inspired strategies",
      "Translating natural optimization principles into additive manufacturing concepts",
    ],
    callout: "Key Question: How can geometry and localized density achieve superior load resistance with minimal mass?",
    stats: [
      { label: "Material Strategies", value: "3 Types" },
      { label: "Compression Peak", value: "3000 N" },
      { label: "Paper Reference", value: "Naboni 2019" },
    ],
  },
  {
    id: 2,
    tag: "Problem Statement & Motivation",
    title: "The Lightweighting Imperative in Modern Engineering",
    subtitle: "Overcoming the Inefficiency of Monolithic Structural Components",
    bullets: [
      "Traditional solid components distribute material uniformly regardless of internal stress paths.",
      "Results in excess mass in low-stress regions and susceptibility to catastrophic shear or buckling.",
      "Cellular solids introduce intentional porosity (void fraction) to reduce component weight dramatically.",
      "Challenge: Designing porous topologies that maintain high stiffness and predictable load distribution.",
    ],
    callout: "Biological systems have evolved over millions of years to achieve maximum mechanical performance per unit mass under specific loading regimes.",
    stats: [
      { label: "Target Porosity", value: "50% - 85%" },
      { label: "Solid Mass Penalty", value: "Up to 4×" },
    ],
    diagramType: "comparison",
  },
  {
    id: 3,
    tag: "Biological Model 1",
    title: "Honeycomb-Inspired Hexagonal Cellular Solids",
    subtitle: "Regular Geometric Tessellation & Prismatic Out-of-Plane Strength",
    bullets: [
      "Regular hexagonal prisms provide optimal space-filling with minimal wall perimeter (Honeycomb Conjecture).",
      "Relative density relationship (Gibson & Ashby): ρ* / ρs ≈ (2/√3)(t / l).",
      "High out-of-plane axial stiffness (Eeff = Es · (ρrel)^n) ideal for directional compressive loads.",
      "Predictable buckling and crushing energy absorption mechanisms across uniform cell walls.",
    ],
    callout: "Hexagonal geometry provides an ideal benchmark for regular, periodic lightweight structures.",
    stats: [
      { label: "Cell Topology", value: "Regular Hexagonal" },
      { label: "Stiffness Power n", value: "n ≈ 2" },
    ],
    diagramType: "honeycomb",
  },
  {
    id: 4,
    tag: "Biological Model 2",
    title: "Bone-Inspired Trabecular Architectures",
    subtitle: "Anisotropic, Irregular Cellular Networks Adapted to Multi-Axis Loads",
    bullets: [
      "Cancellous (trabecular) bone is an open-cell porous network of interconnected rods and plates.",
      "Anisotropic trabecular orientation naturally follows primary principal stress trajectories (Wolff's Law).",
      "High porosity in low-stress cores combined with dense struts in high-demand paths.",
      "Tortuous, irregular topology arrests micro-cracking and distributes stress across redundant load paths.",
    ],
    callout: "Unlike uniform honeycomb, bone-inspired lattices feature functional grading and local density adaptation.",
    stats: [
      { label: "Topology", value: "Irregular Lattice" },
      { label: "Density Range", value: "15% - 75%" },
    ],
    diagramType: "bone",
  },
  {
    id: 5,
    tag: "Optimization Algorithm",
    title: "Translating Biological Remodelling to Engineering Logic",
    subtitle: "Iterative Material Redistribution without Biological Agents",
    bullets: [
      "Biology: Osteocytes sense mechanical strain -> osteoblasts deposit bone, osteoclasts resorb bone.",
      "Engineering Proxy: High structural demand Di -> increase local density ρi; low demand -> reduce ρi.",
      "Local demand Di = normalize(Wi · Li · Oi · Fnorm) computed per individual strut.",
      "Relaxation update: ρ(k+1) = (1 - γ)ρ(k) + γ·ρtarget(Di) with step size γ = 0.25.",
      "Strut radius recalculation: ti = tbase · √(ρi / ρbase) updates physical 3D mesh.",
    ],
    callout: "Material is dynamically redistributed toward high-stress load channels across discrete iterations.",
    stats: [
      { label: "Convergence Steps", value: "5 Iterations" },
      { label: "Step Size γ", value: "0.25" },
    ],
    diagramType: "workflow",
  },
  {
    id: 6,
    tag: "Mathematical Modeling",
    title: "Governing Mathematical Formulations",
    subtitle: "Coupled Equations Driving Geometry, Stress, and Deformation",
    bullets: [
      "Strut Alignment: alignment_i = |v_strut,i · v_load| ∈ [0, 1].",
      "Orientation Efficiency: Oi = Obase + Ogain · alignment_i.",
      "Relative Stiffness (Gibson-Ashby proxy): Erel = CE · (ρeff)^2 · Oavg.",
      "Nominal Stress Index: Stress Index = 100 · clamp(σnominal / σreference, 0, 1).",
      "Visual Deformation: δvisual = Scale · Fnorm · (1 / Erel) · GeometryScale.",
    ],
    callout: "Every UI parameter directly feeds these equations, altering both computed metrics and 3D geometry.",
    diagramType: "formula",
  },
  {
    id: 7,
    tag: "Experimental Validation Benchmark",
    title: "Literature Reference Data (Naboni & Kunic, 2019)",
    subtitle: "Bone-Inspired 3D Printed Structures for Construction Applications",
    bullets: [
      "Physical testing of additive manufactured polymer trabecular components.",
      "Lattice Brick: Mass of 185 g withstood compressive loads up to 3000 N.",
      "Reported load-to-weight ratio of approximately 1600× the weight of the structure.",
      "Full-scale cellular building envelope achieved 11 kg/m² weight-to-area ratio.",
      "Separation of Data: Experimental lab results are preserved separately from conceptual simulation outputs.",
    ],
    callout: "Proves that additive manufacturing of trabecular geometries is feasible and structurally advantageous at construction scale.",
    stats: [
      { label: "Brick Mass", value: "185 g" },
      { label: "Peak Resistance", value: "3000 N" },
      { label: "Load/Weight Ratio", value: "~1600×" },
    ],
  },
  {
    id: 8,
    tag: "Comparative Evaluation",
    title: "Solid vs Honeycomb vs Bone-Inspired Matrix",
    subtitle: "Evaluating Performance Under Identical 1500 N Compressive Load",
    bullets: [
      "Solid: Maximum mass (100%), highest stiffness, zero lightweighting benefit.",
      "Honeycomb: ~65% mass reduction, highly rigid under unidirectional axial compression, uniform stress field.",
      "Bone-Inspired: ~60-70% mass reduction, load-responsive material distribution, superior multi-axial redundancy.",
      "Post-Optimization Bone Lattice: Lower peak stress concentration due to localized strut reinforcement.",
    ],
    callout: "Bone-inspired structures excel in variable/multi-directional load environments, while honeycombs excel in pure uniaxial compression.",
    stats: [
      { label: "Mass Savings", value: "60% - 75%" },
      { label: "Load Tested", value: "1500 N" },
    ],
    diagramType: "comparison",
  },
  {
    id: 9,
    tag: "Interactive Demonstrator",
    title: "Live Simulation Engine Architecture",
    subtitle: "Client-Side Responsive Simulation Built with Next.js & React Three Fiber",
    bullets: [
      "Modular TypeScript simulation engine decoupled from React UI components.",
      "InstancedMesh 3D rendering for smooth frame rates across hundreds of structural elements.",
      "Real-time blue-to-yellow stress spectrum visualization mapped to element demand.",
      "Deterministic parameter controls: Load (500-3000N), Porosity, Cell Size, Wall Thickness, Orientation.",
    ],
    callout: "Explore the live simulation in the Simulator tab to interactively test all structural models.",
    stats: [
      { label: "Renderer", value: "WebGL / Three.js" },
      { label: "UI Theme", value: "Pastel Scientific" },
    ],
  },
  {
    id: 10,
    tag: "Conclusions & Outlook",
    title: "Summary & Engineering Implications",
    subtitle: "Key Takeaways from Bio-Inspired Structural Design",
    bullets: [
      "Cellular geometry and functional grading allow drastic lightweighting without sacrificing structural integrity.",
      "Remodelling-inspired optimization provides a natural method for material redistribution along load paths.",
      "Additive manufacturing unlocks complex trabecular geometries previously impossible with subtractive methods.",
      "Future Outlook: Multi-material 3D printing, generative AI cellular synthesis, and self-sensing structural lattices.",
    ],
    callout: "Biomimicry provides a sustainable engineering paradigm: maximum strength, minimum material, optimal efficiency.",
    stats: [
      { label: "Project Status", value: "Complete" },
      { label: "Deployment", value: "Vercel" },
    ],
  },
];

export default function PresentationPage() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSlide = SLIDES[currentSlideIndex];
  const totalSlides = SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(Math.max(0, Math.min(index, totalSlides - 1)));
    setShowThumbnails(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, isFullscreen]);

  return (
    <div className="container section" ref={containerRef}>
      <div className={styles.topBar}>
        <div>
          <h2>Project Presentation Deck</h2>
          <p className={styles.deckSubtitle}>
            Bio-Inspired Load-Bearing Structures · University Engineering Biomimicry Project
          </p>
        </div>
        <div className={styles.topActions}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowThumbnails(!showThumbnails)}
          >
            ☰ Slide Index ({currentSlideIndex + 1}/{totalSlides})
          </button>
          <button className="btn btn-ghost btn-sm" onClick={toggleFullscreen}>
            {isFullscreen ? "Exit Fullscreen" : "⛶ Fullscreen (F)"}
          </button>
          <Link href="/simulator" className="btn btn-yellow btn-sm">
            ▶ Open Simulator
          </Link>
        </div>
      </div>

      {/* ── Slide Thumbnail Drawer ────────────────────────── */}
      {showThumbnails && (
        <div className={styles.thumbnailDrawer}>
          <div className={styles.thumbGrid}>
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                className={`${styles.thumbCard} ${
                  idx === currentSlideIndex ? styles.thumbActive : ""
                }`}
                onClick={() => goToSlide(idx)}
              >
                <div className={styles.thumbNum}>Slide {slide.id}</div>
                <div className={styles.thumbTitle}>{slide.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Slide Card ───────────────────────────────── */}
      <div className={`card ${styles.slideCard}`}>
        {/* Slide Header */}
        <div className={styles.slideHeader}>
          <span className="badge badge-yellow">{currentSlide.tag}</span>
          <span className={styles.slideCounter}>
            Slide {currentSlide.id} of {totalSlides}
          </span>
        </div>

        {/* Slide Title */}
        <h1 className={styles.slideTitle}>{currentSlide.title}</h1>
        {currentSlide.subtitle && (
          <h3 className={styles.slideSubtitle}>{currentSlide.subtitle}</h3>
        )}

        {/* Slide Content */}
        <div className={styles.slideContent}>
          <div className={styles.bulletsSection}>
            <ul className={styles.bulletList}>
              {currentSlide.bullets.map((b, i) => (
                <li key={i} className={styles.bulletItem}>
                  {b}
                </li>
              ))}
            </ul>

            {currentSlide.callout && (
              <div className={styles.calloutBox}>
                <strong>Takeaway:</strong> {currentSlide.callout}
              </div>
            )}
          </div>

          {/* Stats / Visual sidebar */}
          {currentSlide.stats && (
            <div className={styles.statsSidebar}>
              {currentSlide.stats.map((stat, i) => (
                <div key={i} className={styles.statPill}>
                  <div className={styles.statVal}>{stat.value}</div>
                  <div className={styles.statLbl}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slide Progress bar */}
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{
              width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
            }}
          />
        </div>

        {/* Slide Footer Controls */}
        <div className={styles.slideFooter}>
          <div className={styles.navButtons}>
            <button
              className="btn btn-outline"
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
            >
              ◀ Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={nextSlide}
              disabled={currentSlideIndex === totalSlides - 1}
            >
              Next ▶
            </button>
          </div>

          <div className={styles.keyHint}>
            Use <kbd>←</kbd> <kbd>→</kbd> or <kbd>Space</kbd> to navigate · <kbd>F</kbd> for fullscreen
          </div>
        </div>
      </div>
    </div>
  );
}
