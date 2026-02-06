<div align="center">

# 🚀 aeroForge-G3
### **Autonomous Generative Aerospace Engineering Platform**

**Transform Natural Language Into Flight-Ready Vehicles Using AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11](https://img.shields.io/badge/python-3.11+-green.svg)](https://www.python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.0+-orange.svg)](https://github.com/langchain-ai/langgraph)
[![Gemini 3](https://img.shields.io/badge/Gemini-3-Pro-purple.svg)](https://openrouter.ai/models)

---

**🏆 Gemini 3 Hackathon Submission | February 2025**

</div>

---

## ✨ Overview

**aeroForge-G3** is a revolutionary AI-powered aerospace engineering platform that transforms natural language requirements into **flight-ready vehicles** through autonomous design, simulation, and optimization.

### 🎯 The Vision

What if you could design a Mars exploration drone simply by saying:
> *"Design a quadcopter for Mars atmosphere with 2kg payload capacity, stable in high winds, operating 30+ minutes."*

**aeroForge-G3 makes this possible.**

Our system:
1. 🤖 **Understands** your mission requirements using advanced LLMs
2. 🎨 **Generates** production-ready CAD models autonomously
3. 🧪 **Simulates** real-world physics using GPU-accelerated engines
4. 🔄 **Iterates** and optimizes until design criteria are met
5. ✅ **Delivers** exportable STL files ready for manufacturing

---

## 🧠 Architecture

### Multi-Agent AI System

aeroForge-G3 uses a **three-agent collaborative architecture** powered by LangGraph:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mission Requirements                        │
│        "Design a high-speed racing drone reaching 150 km/h"    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🔨 DESIGNER AGENT                                              │
│  ──────────────────────────────────────────────────────────────│
│  • Parses natural language requirements                         │
│  • Generates build123d CAD code                                │
│  • Creates component-based assemblies                           │
│  • Adapts designs based on feedback                             │
│                                                                 │
│  AI Model: Google Gemini 3 Pro                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ CAD Code
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🧪 SIMULATOR AGENT                                             │
│  ──────────────────────────────────────────────────────────────│
│  • Executes CAD code to generate 3D models                      │
│  • Exports to STL and URDF formats                              │
│  • Runs Genesis physics simulations                            │
│  • Analyzes stability, forces, telemetry                       │
│                                                                 │
│  Physics Engine: Genesis (GPU-accelerated)                     │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Simulation Metrics
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  👥 SUPERVISOR AGENT                                            │
│  ──────────────────────────────────────────────────────────────│
│  • Evaluates simulation results                                 │
│  • Identifies design issues                                     │
│  • Generates actionable feedback                                │
│  • Decides: iterate or complete?                                │
│                                                                 │
│  Decision Engine: AI-powered test pilot                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                      ┌───────┴───────┐
                      │               │
                      ▼               ▼
            ✅ Complete           🔄 Iterate
            (Export STL)          (Refine Design)
```

---

## 🛠️ Technology Stack

### AI & Machine Learning
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **LLM** | Google Gemini 3 Pro | Natural language understanding & code generation |
| **API Gateway** | OpenRouter | Model access & orchestration |
| **Orchestration** | LangGraph | Multi-agent workflow management |
| **State Machine** | LangGraph Core | Agent communication & state tracking |

### CAD & Engineering
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **CAD Kernel** | build123d | Parametric 3D modeling |
| **Geometry Engine** | OpenCascade | Solid modeling & boolean operations |
| **File Formats** | STL, URDF | 3D export & simulation compatibility |

### Physics Simulation
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Physics Engine** | Genesis | GPU-accelerated multiphysics simulation |
| **Rendering** | Three.js / React Three Fiber | Real-time 3D visualization |
| **Telemetry** | Custom analysis engine | Force, velocity, energy calculations |

### Frontend & UI
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 18 + Vite | Modern, fast UI |
| **Styling** | Tailwind CSS | Utility-first design system |
| **3D Visualization** | @react-three/fiber | WebGL-based 3D rendering |
| **Design System** | Apple Glassmorphism | Premium, futuristic aesthetics |
| **Charts** | Recharts | Telemetry data visualization |

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Framework** | FastAPI | High-performance async API |
| **Server** | Uvicorn | ASGI web server |
| **Real-time Updates** | Polling with background tasks | Live workflow monitoring |

---

## 🎨 User Experience

### Industrial Minimalist UI (SpaceX-Style)

Our interface features a **strict industrial minimalist design** inspired by modern aerospace command centers (SpaceX, xAI):

- **Void Black** (#000000) - Primary background
- **Carbon Gray** (#111111) - Surface panels
- **SpaceX Gray** (#888888) - Borders and muted text
- **Signal White** (#ffffff) - High-contrast data
- **Functional Colors** - Success (Green), Warning (Yellow), Error (Red) - No neon glow.

### Key Features

1. ***🧠 Reasoning Engine ("Deep Think")***
   - Visualizes the AI's "internal monologue" (System 2 thinking).
   - Shows real-time engineering decisions (e.g., *"Optimizing moment of inertia..."*, *"Calculating Reynolds number..."*).
   - Builds trust by exposing the "Why" behind the design.

2. **📋 Mission Control Panel**
   - Natural language input
   - Technical parameter list
   - Iteration control slider

3. **💻 Telemetry Terminal**
   - High-contrast, low-latency logs
   - Unified datastream from all agents
   - Professional CLI aesthetic

4. **🎨 3D Visualizer**
   - Interactive orbit controls
   - **Environment Context** (Martian surface, Earth atmosphere)
   - Real-time CAD rendering
   - Grid overlay and scale reference

5. **📊 Live Telemetry**
   - 60Hz physics data visualization
   - Position, Velocity, and Energy graphs
   - Real-time stability metrics

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** (for frontend)
- **OpenRouter API Key** ([Get free key](https://openrouter.ai/keys))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/aeroforge-G3.git
cd aeroforge-G3

# 2. Backend setup
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Frontend setup
cd frontend
npm install
cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env and add: OPENROUTER_API_KEY=sk-or-v1-...
```

### Run the System

```bash
# Terminal 1: Backend server
python3 server.py
# → http://localhost:8000

# Terminal 2: Frontend UI
cd frontend
npm run dev
# → http://localhost:5173
```

### Launch Your First Mission

1. Open **http://localhost:5173**
2. Select a preset (e.g., "Mars Explorer")
3. Click **"🚀 Launch Mission"**
4. Watch the AI design, simulate, and optimize in real-time!

---

## 📸 Screenshots

### Mission Dashboard
```
┌────────────────────────────────────────────────────────────┐
│  🚀 aeroForge-G3          ● ONLINE   MISSION: a7b3c9d  RUN │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  📋 Mission      │  │  💻 Telemetry Terminal        │  │
│  │                  │  │                              │  │
│  │  "Design a       │  │  [14:23:01] [DESIGNER]       │  │
│  │   quadcopter     │  │  ✓ CAD code generated         │  │
│  │   for Mars..."    │  │  [14:23:02] [SIMULATOR]      │  │
│  │                  │  │  ✓ Simulation complete        │  │
│  │  [Launch Mission] │  │  [14:23:03] [SUPERVISOR]     │  │
│  │                  │  │  ✓ Analyzing results...       │  │
│  └──────────────────┘  └──────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │              🎨 3D Visualizer                       │  │
│  │                                                    │  │
│  │              (Interactive Drone Model)             │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 Example Missions

### Mars Exploration Drone
> "Design a quadcopter drone for Mars atmosphere with 2kg payload capacity. Must be stable in high winds and operate for at least 30 minutes. Use carbon fiber for lightweight construction."

**AI Generates:**
- Extended arm configuration for stability
- Reinforced fuselage for payload
- Aerodynamic motor cowls
- Center-of-mass optimization

### High-Speed Racing Drone
> "Design a racing drone capable of 150 km/h. Focus on aerodynamic efficiency and minimal drag. Use slim arms and streamlined fuselage."

**AI Generates:**
- Low-profile frame design
- Tapered arm geometry
- Reduced frontal area
- Optimized weight distribution

### Heavy-Lift Cargo Drone
> "Design an octocopter capable of carrying 20kg payload. Prioritize stability and structural integrity over speed."

**AI Generates:**
- 8-arm configuration for redundancy
- Thick structural members
- Distributed motor layout
- Reinforced motor mounts

---

## 🔬 Technical Deep Dive

### The Workflow Loop

```python
# Simplified workflow logic
for iteration in range(max_iterations):
    # 1. Designer generates CAD code
    cad_code = designer.generate(mission_prompt, feedback)

    # 2. Simulator executes and tests
    model = execute_cad(cad_code)
    metrics = genesis.simulate(model)

    # 3. Supervisor evaluates
    if metrics.stability > threshold and metrics.errors == 0:
        return model  # Design is complete

    # 4. Generate feedback for next iteration
    feedback = supervisor.analyze(metrics, mission_prompt)
```

### Component-Based Assembly

Our Designer Agent doesn't just create random shapes - it builds **structured assemblies**:

```python
with BuildPart() as builder:
    # Central fuselage
    fuselage = Box(length=120, width=80, height=40, align=CENTER)

    # Four tubular arms in X-pattern
    arms = [
        create_arm(angle=45),
        create_arm(angle=135),
        create_arm(angle=225),
        create_arm(angle=315)
    ]

    # Motor mounts at arm ends
    mounts = [create_mount(arm) for arm in arms]

    # Combine into assembly
    drone = fuselage + sum(arms) + sum(mounts)
```

### Simulation Metrics

The Genesis physics engine provides comprehensive telemetry:

- **Stability Score** - Oscillation damping ratio
- **Max Acceleration** - Peak g-forces experienced
- **Energy Efficiency** - Power-to-thrust ratio
- **Structural Stress** - Force distribution analysis
- **Center of Mass** - Balance and stability metric

---

## 🏆 Why aeroForge-G3 Wins

### 1. True Autonomy
Unlike traditional CAD tools that require expert operators, aeroForge-G3 takes **natural language** and produces **manufacturing-ready models**.

### 2. Real Physics
Every design is validated through **actual physics simulation**, not heuristic estimates. Stability is proven, not assumed.

### 3. Iterative Optimization
The system doesn't get it right on the first try - it **learns and improves** through multiple iterations until success criteria are met.

### 4. Beautiful Experience
Professional-grade UI with glassmorphism, real-time 3D visualization, and intuitive controls. Engineering doesn't have to be ugly.

### 5. Production Ready
Output includes **STL files ready for 3D printing**, **URDF for robotics simulation**, and **complete design history**.

### 6. Extensible Architecture
Built on **LangGraph** for easy agent addition, **LangChain** for LLM integration, and **FastAPI** for scalable deployment.

---

## 🚧 Roadmap

### v3.1 - Upcoming
- [ ] Multi-material support (carbon fiber, aluminum, composites)
- [ ] Aerodynamic CFD analysis integration
- [ ] Propeller/motor optimization
- [ ] Battery placement optimization

### v3.2 - Future
- [ ] Collaborative design (multi-user)
- [ ] Export to additional formats (STEP, OBJ)
- [ ] Integration with manufacturing APIs
- [ ] VR/AR design preview

### v4.0 - Vision
- [ ] Full aircraft generation (fixed-wing)
- [ ] Rocket stage optimization
- [ ] Satellite constellation design
- [ ] Integration with real-world testing

---

## 📚 Project Structure

```
aeroforge-G3/
├── 📁 agents/                 # AI Agents
│   ├── designer.py           # CAD code generation
│   ├── simulator.py          # Physics simulation
│   └── supervisor.py         # Decision orchestration
│
├── 📁 core/                   # Core libraries
│   ├── geometry.py           # CAD export & URDF generation
│   ├── physics.py            # Genesis physics wrapper
│   └── state.py              # LangGraph state schema
│
├── 📁 frontend/               # React UI
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── MissionInput.jsx
│   │   │   ├── TelemetryTerminal.jsx
│   │   │   ├── Visualizer3D.jsx
│   │   │   └── ...
│   │   ├── index.css         # Glassmorphism styles
│   │   └── App.jsx           # Main application
│   └── package.json
│
├── 📁 output/                 # Generated files
│   ├── meshes/               # STL exports
│   ├── urdf/                 # Physics models
│   └── logs/                 # Simulation data
│
├── 📄 server.py              # FastAPI backend
├── 📄 main.py                # LangGraph workflow
├── 📄 requirements.txt        # Python dependencies
└── 📄 README.md              # This file
```

---

## 🤝 Contributing

We welcome contributions! Areas of interest:

- 🎨 **New Agent Types** (CFD analyst, structural engineer)
- 🧪 **Physics Models** (additional simulation backends)
- 📊 **Visualization** (new chart types, AR/VR views)
- 🐛 **Bug Fixes** (report issues on GitHub)

---

## 📄 License

MIT License - feel free to use this project for research, commercial, or personal projects.

---

## 🙏 Acknowledgments

- **Google** for the incredible Gemini 3 model
- **LangChain** for the orchestration framework
- **Genesis Project** for the physics engine
- **build123d** for the CAD kernel
- **SpaceX** for the inspiring color palette
- The **Hackathon Judges** for your time and consideration

---

## 📬 Contact

- **Project**: aeroForge-G3
- **Hackathon**: Gemini 3 Hackathon 2025
- **Repository**: [github.com/your-username/aeroforge-G3](https://github.com/your-username/aeroforge-G3)

---

<div align="center">

**🚀 From Idea to Flight — Powered by AI**

*"The future of engineering isn't about drawing lines. It's about asking questions."*

</div>
