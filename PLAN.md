aeroForge-G3: Implementation Plan

Project: aeroForge-G3 (Autonomous Generative Aerospace Engineering)
Target Model: Google Gemini 3 API
Core Stack: Genesis (Physics), build123d (CAD), LangGraph (Orchestration)
Version: 1.0.0

1. System Initialization & Infrastructure

1.1. Environment Setup

Task: Configure the Python environment and verify hardware acceleration.

File: requirements.txt

Action: Create file with the following dependencies:

# Core Physics & Geometry
genesis-world>=0.3.0       # Universal Physics Engine
build123d>=0.5.0           # Programmatic CAD Kernel
numpy>=1.24.0
scipy>=1.10.0

# AI & Orchestration
langgraph                  # Agent State Machine
langchain                  # Framework
langchain-google-genai     # Gemini 3 Adapter
pydantic>=2.0

# Visualization & UI
streamlit>=1.32.0
stpyvista                  # 3D Mesh Rendering for Streamlit
vtk                        # Visualization Toolkit
panel                      # Interactive Dashboards
watchdog                   # File monitoring


1.2. Directory Structure

Task: Initialize the project filesystem to enforce separation of concerns between generation, simulation, and orchestration.

Action: Execute the following mkdir structure:

mkdir -p aeroForge-G3/agents
mkdir -p aeroForge-G3/core
mkdir -p aeroForge-G3/output/meshes
mkdir -p aeroForge-G3/output/urdf
mkdir -p aeroForge-G3/output/logs
touch aeroForge-G3/app.py
touch aeroForge-G3/main.py


2. Core Library Implementation

2.1. Geometric Kernel Wrapper

File: core/geometry.py
Objective: Abstract complex build123d export logic and URDF generation.

Class: SceneBuilder

Method: export_assembly(part: Compound, name: str) -> List[str]

Logic: Iterate recursively through the assembly. Export each solid as an STL to output/meshes/. Return list of filenames.

Method: generate_urdf(links: List[str], joints: List[Dict]) -> str

Logic: Construct a valid URDF XML string linking the exported STLs. Define <inertial> properties based on volume * density.

2.2. Physics Engine Wrapper

File: core/physics.py
Objective: Interface with Genesis to run headless simulations.

Class: SimRunner

Method: __init__(backend='gpu')

Logic: Call gs.init(backend=gs.gpu) to enable CUDA/Vulkan acceleration.

Method: load_environment(urdf_path: str, terrain: str)

Logic: Initialize gs.Scene. Load the agent-generated robot via gs.morphs.URDF. Add terrain (e.g., gs.morphs.Plane).

Method: run_episode(steps: int = 1000) -> Dict

Logic: Execute scene.step() in a loop. Capture link.get_pos() and link.get_vel() at each step. Return a dictionary of time-series data.

2.3. State Management

File: core/state.py
Objective: Define the shared memory for the LangGraph agents.

Schema: AeroForgeState(TypedDict)

mission_prompt: str (User's high-level goal)

cad_code: str (Current Python script for the design)

urdf_path: str (Location of the compiled robot)

simulation_metrics: Dict (Max stress, drag coefficient, stability score)

errors: List[str] (Syntax errors or physics explosions)

iteration: int (Cycle counter)

3. Agent Implementation

3.1. The Designer (CAD Expert)

File: agents/designer.py
Model: Gemini 3 (Optimized for Code)

Role: Translate requirements into build123d code.

System Prompt: "You are a mechanical engineer proficient in build123d. You must output valid Python code. Use Builder mode. Always define a part variable."

Tool Access: core.geometry.SceneBuilder.

Failure Recovery: If state['errors'] contains Python syntax errors, the Designer receives the stack trace and must regenerate the code.

3.2. The Simulator (Physics Expert)

File: agents/simulator.py
Model: Gemini 3 (Optimized for Reasoning)

Role: Configure the test environment and interpret Genesis logs.

System Prompt: "You are a test pilot and physicist. Configure the Genesis simulation settings (gravity, friction, dt). Analyze the telemetry data."

Logic:

Call core.physics.SimRunner.

Run the simulation.

Analyze the returned time-series data.

Output a critique: "The drone is unstable on the Z-axis," or "Structural failure detected at T=0.5s."

3.3. The Supervisor (Project Manager)

File: agents/supervisor.py
Model: Gemini 3 (High Reasoning)

Role: Decision node for the graph.

Logic:

Condition A: iteration > 10 → Terminate (Prevent infinite loops).

Condition B: simulation_metrics meet target → Terminate (Success).

Condition C: errors exist → Route to Designer.

Condition D: Metrics are sub-optimal → Route to Designer with specific feedback from Simulator.

4. Orchestration & Execution

4.1. Graph Assembly

File: main.py
Objective: Wire the agents into a runnable graph.

Action:

Import StateGraph from langgraph.

Add Nodes: designer, simulator, supervisor.

Define Edges:

supervisor → designer

designer → simulator

simulator → supervisor

Compile graph to app.

4.2. User Interface

File: app.py
Objective: Provide a frontend for the Hackathon Demo.

Framework: Streamlit

Features:

Chat Input: "Design a high-speed rotor for Mars atmosphere."

3D Viewer: Use stpyvista to render the contents of aeroForge-G3/output/meshes/.

Live Telemetry: st.line_chart streaming velocity/acceleration data from the Genesis run.

Code Preview: Side-by-side view of the generated build123d code.

5. Deployment Instructions

Install Dependencies:

pip install -r requirements.txt


Set API Keys:

export GOOGLE_API_KEY="your_gemini_3_key"


Run the Application:

streamlit run app.py
