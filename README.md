# aeroForge-G3 🚀

Autonomous Generative Aerospace Engineering Platform powered by Gemini 3, Genesis Physics Engine, and build123d.

## Overview

aeroForge-G3 is an AI-driven aerospace design system that uses multi-agent architecture to:
- Translate natural language requirements into CAD models
- Simulate designs in a high-fidelity physics engine
- Iteratively optimize based on real-world physics constraints

## Architecture

### Multi-Agent System

1. **Designer Agent** - Generates build123d CAD code from requirements
2. **Simulator Agent** - Runs Genesis physics simulations
3. **Supervisor Agent** - Orchestrates iterations and makes decisions

### Technology Stack

- **AI Models**: Gemini 3 Pro & Flash (Deep Think reasoning)
- **CAD Kernel**: build123d (parametric Python CAD)
- **Physics Engine**: Genesis (GPU-accelerated multiphysics)
- **Orchestration**: LangGraph (state machine)
- **UI**: Streamlit + stpyvista (3D visualization)

## Installation

### Prerequisites

- Python 3.10+
- NVIDIA GPU with CUDA (for Genesis GPU acceleration, optional)
- Google Gemini API Key

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd aeroForge-G3
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set API Key:
```bash
export GOOGLE_API_KEY='your_api_key_here'
```

## Usage

### Web Interface

Launch the Streamlit application:

```bash
streamlit run app.py
```

The web interface provides:
- Mission prompt input
- Real-time workflow visualization
- 3D model viewer
- Telemetry charts
- Code preview

### Command Line

Run a single mission:

```python
python main.py
```

### Example Mission

```
Design a quadcopter drone for Mars atmosphere with 2kg payload capacity.
Must be stable in high winds and operate for at least 30 minutes.
```

## Project Structure

```
aeroForge-G3/
├── agents/              # Agent implementations
│   ├── designer.py      # CAD generation agent
│   ├── simulator.py     # Physics simulation agent
│   └── supervisor.py    # Decision orchestration
├── core/                # Core libraries
│   ├── geometry.py      # CAD export & URDF generation
│   ├── physics.py       # Genesis physics engine wrapper
│   └── state.py         # LangGraph state schema
├── output/              # Generated files
│   ├── meshes/          # STL exports
│   ├── urdf/            # URDF models
│   └── logs/            # Simulation logs
├── app.py               # Streamlit UI
├── main.py              # Workflow entry point
└── requirements.txt     # Dependencies
```

## Workflow

1. **Input**: User provides mission requirements
2. **Design**: Designer agent generates build123d code
3. **Simulation**: Simulator agent runs Genesis physics
4. **Analysis**: Supervisor evaluates results
5. **Iteration**: Loop until criteria met or max iterations reached

## Configuration

### Simulation Settings

Adjust in `app.py` sidebar or environment variables:
- `PHYSICS_BACKEND`: gpu or cpu
- `SIMULATION_STEPS`: Number of simulation steps (default: 500)

### Agent Settings

Modify in agent files:
- `MAX_ITERATIONS`: Maximum design iterations (default: 10)
- Stability thresholds in `supervisor.py`

## Output Files

- **STL Files**: 3D printable meshes in `output/meshes/`
- **URDF Files**: Physics simulation models in `output/urdf/`
- **Simulation Data**: Telemetry logs and metrics

## Development

### Testing

Run with mock simulation (no Genesis required):

```bash
python -c "from core.physics import SimRunner; s = SimRunner('cpu'); print(s._run_mock_simulation(100, 0.01))"
```

### Adding New Agents

1. Create agent file in `agents/`
2. Define node function with signature `def agent_node(state: AeroForgeState) -> AeroForgeState`
3. Register in `main.py` workflow graph

## Troubleshooting

### Genesis Not Found

Genesis may fail to initialize if GPU drivers are missing. The system automatically falls back to mock simulation mode.

### build123d Installation Issues

build123d requires OCP (OpenCascade Python). If installation fails:
```bash
pip install build123d[ocp]
```

### API Key Errors

Ensure `GOOGLE_API_KEY` is set in environment before running.

## License

MIT License - See LICENSE file

## Acknowledgments

- Google Gemini 3 for AI reasoning
- Genesis Project for physics simulation
- build123d for CAD kernel
- LangGraph for orchestration

## Citation

If you use aeroForge-G3 in research, please cite:

```
aeroForge-G3: Autonomous Generative Aerospace Engineering Platform
Gemini 3 Hackathon, February 2026
```
