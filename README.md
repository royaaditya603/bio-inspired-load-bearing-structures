# Bio-Inspired Load-Bearing Structures

> **College Biomimicry Engineering Project & Conceptual Simulation Demonstrator**  
> Investigating structural efficiency in **Honeycomb** and **Bone-Inspired Trabecular** cellular geometries.

---

## 🏛 Project Overview

This project provides an educational, interactive 3D simulation comparing three structural strategies:
1. **Solid Baseline** — Continuous monolithic structural block (reference dense material).
2. **Honeycomb-Inspired Structure** — Regular hexagonal cellular network with uniform space-filling walls and high out-of-plane compressive stiffness.
3. **Bone-Inspired Trabecular Lattice** — Irregular open-cell network with localized density grading and load-responsive material redistribution.

The application couples user input parameters directly to mathematical structural models, updating local element demand, material thickness, deformation response, and 3D visual geometry in real time.

---

## 🚀 Key Features

- **Decoupled Simulation Engine**: Mathematical functions for load normalization, stress proxy indices, compliance, and material redistribution live in dedicated TypeScript modules (`src/lib/simulation/`).
- **Interactive 3D Viewport**: Built with Three.js and React Three Fiber using `InstancedMesh` for optimized rendering.
- **Dynamic Stress Visualisation**: Real-time blue-to-yellow stress proxy spectrum (\(D_i \in [0, 1]\)) mapped to individual struts and cell walls.
- **Biologically-Inspired Remodelling**: Iterative optimization redistributes material into high-demand load paths while thinning low-demand elements.
- **Comprehensive Comparison**: Side-by-side metric tables and charts comparing Solid vs Honeycomb vs Bone-inspired models under the same applied load.
- **Scientific Literature Citations**: Clear separation between experimental laboratory benchmarks (*Naboni & Kunic, 2019*) and conceptual browser simulation proxies.
- **Interactive Presentation Deck**: 10-slide presentation viewer with keyboard navigation (`←`/`→`/`Space`), fullscreen mode, and thumbnail navigation.

---

## 📐 Mathematical Formulation

### 1. Honeycomb Relative Density (Gibson & Ashby)
$$\frac{\rho^*}{\rho_s} \approx \frac{2}{\sqrt{3}} \left(\frac{t}{l}\right)$$

### 2. Strut Alignment & Orientation Factor
$$\text{alignment}_i = |\hat{v}_{\text{strut},i} \cdot \hat{v}_{\text{load}}|$$
$$O_i = O_{\text{base}} + O_{\text{gain}} \cdot \text{alignment}_i$$

### 3. Local Demand & Density Adaptation
$$D_i = \text{normalize}(W_i \cdot L_i \cdot O_i \cdot F_{\text{norm}})$$
$$\rho_i = \text{clamp}\left(\rho_{\text{base}}[1 + \alpha(D_i - 0.5)], \rho_{\min}, \rho_{\max}\right)$$

### 4. Remodelling Density Update
$$\rho_{k+1, i} = (1 - \gamma)\rho_{k, i} + \gamma \rho_{\text{target}, i}$$
$$t_i = t_{\text{base}} \sqrt{\frac{\rho_{k+1, i}}{\rho_{\text{base}}}}$$

### 5. Effective Stiffness & Visual Deformation
$$E_{\text{rel}} = C_E \cdot \rho_{\text{rel}}^n \cdot O_{\text{factor}}$$
$$\delta_{\text{visual}} = \text{Scale} \cdot F_{\text{norm}} \cdot \frac{1}{E_{\text{rel}}} \cdot \text{GeometryScale}$$

---

## 📂 Project Architecture

```
src/
├── app/
│   ├── layout.tsx             # Root layout with Inter font & navbar
│   ├── globals.css            # Dark Navy & Yellow theme styles
│   ├── page.tsx               # Home landing & biomimicry intro
│   ├── simulator/             # 3D interactive simulator page
│   ├── comparison/            # Solid vs Honeycomb vs Bone matrix
│   ├── research/              # Literature benchmarks & equations
│   └── presentation/          # 10-slide interactive project deck
├── components/
│   ├── models/                # 3D R3F components (Honeycomb, Bone, Solid, LoadArrow)
│   ├── simulation/            # Context provider & simulator control panel
│   └── ui/                    # Reusable controls (Sliders, Toggles, MetricCards, Diagnostics)
└── lib/
    └── simulation/            # Pure mathematical simulation modules (testable independently)
```

---

## 🛠 Running the Application

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm, pnpm, or yarn

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production (Vercel ready)
npm run build
```

---

## ⚠️ Scientific & Educational Disclaimer

This website is an **educational conceptual simulation**. Stress indices and deformation outputs are qualitative visual and engineering proxies designed to demonstrate biomimetic design concepts. They are not certified finite-element analysis (FEA) results or laboratory-validated engineering predictions.
