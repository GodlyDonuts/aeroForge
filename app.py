#!/usr/bin/env python3
"""
aeroForge-G3 Streamlit Application
UI for autonomous aerospace design and simulation
"""

import os
import sys
import time
from pathlib import Path
import streamlit as st
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from core.state import AeroForgeState, create_initial_state
from core.geometry import SceneBuilder
from core.physics import SimRunner
from agents.designer import designer_node
from agents.simulator import simulator_node
from agents.supervisor import supervisor_node
from main import build_graph


# Page configuration
st.set_page_config(
    page_title="aeroForge-G3",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-title {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 1rem;
    }
    .metric-card {
        background: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    .status-success {
        color: #00cc00;
        font-weight: bold;
    }
    .status-error {
        color: #cc0000;
        font-weight: bold;
    }
    .status-working {
        color: #ff9900;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)


def render_header():
    """Render application header."""
    st.markdown('<div class="main-title">🚀 aeroForge-G3</div>', unsafe_allow_html=True)
    st.markdown("""
    <div style="text-align: center; color: #666; margin-bottom: 2rem;">
        Autonomous Generative Aerospace Engineering Platform<br>
        <small>Powered by Gemini 3 + Genesis Physics Engine</small>
    </div>
    """, unsafe_allow_html=True)


def render_sidebar():
    """Render sidebar with settings and status."""
    with st.sidebar:
        st.header("⚙️ Configuration")

        # API Key
        api_key = st.text_input(
            "Google API Key",
            type="password",
            help="Enter your Gemini API key"
        )
        if api_key:
            os.environ["GOOGLE_API_KEY"] = api_key

        st.divider()

        # Simulation settings
        st.header("🎮 Simulation Settings")
        backend = st.selectbox(
            "Physics Backend",
            ["gpu", "cpu"],
            help="GPU is faster but requires CUDA"
        )
        sim_steps = st.slider(
            "Simulation Steps",
            min_value=100,
            max_value=2000,
            value=500,
            step=100
        )

        st.divider()

        # System info
        st.header("ℹ️ System Info")
        try:
            import genesis as gs
            st.success("✓ Genesis installed")
        except:
            st.warning("✗ Genesis not available (using mock mode)")

        try:
            import build123d
            st.success("✓ build123d installed")
        except:
            st.warning("✗ build123d not available")


def render_mission_input():
    """Render mission prompt input area."""
    st.header("📋 Mission Requirements")

    # Preset missions
    preset_missions = {
        "Custom": "",
        "Mars Drone": "Design a quadcopter drone for Mars atmosphere with 2kg payload capacity. Must be stable in high winds and operate for at least 30 minutes.",
        "High-Speed Drone": "Design a high-speed racing drone capable of reaching 150 km/h. Focus on aerodynamic efficiency and minimal drag.",
        "Heavy Lift Drone": "Design an octocopter heavy-lift drone capable of carrying 20kg payload. Prioritize stability and structural integrity.",
        "Surveillance Drone": "Design a stealth surveillance drone with long endurance (4+ hours) and low acoustic signature."
    }

    selected_preset = st.selectbox(
        "Select preset mission or enter custom:",
        list(preset_missions.keys())
    )

    mission_prompt = st.text_area(
        "Mission Description",
        value=preset_missions[selected_preset],
        height=150,
        placeholder="Describe the aerospace design requirements...",
        help="Be specific about payload, environment, performance requirements, etc."
    )

    return mission_prompt


def render_3d_viewer(state):
    """Render 3D mesh viewer using stpyvista."""
    st.header("🎨 3D Model Viewer")

    if not state.get("urdf_path"):
        st.info("No model generated yet. Run the workflow to create a design.")
        return

    st.info("3D viewer requires generated STL files in output/meshes/")
    st.write(f"URDF Path: {state.get('urdf_path')}")

    # Check for mesh files
    mesh_dir = Path("output/meshes")
    if mesh_dir.exists():
        mesh_files = list(mesh_dir.glob("*.stl"))
        if mesh_files:
            st.write(f"Found {len(mesh_files)} mesh file(s):")
            for mesh_file in mesh_files:
                st.write(f"  • {mesh_file.name}")
        else:
            st.warning("No STL files found")
    else:
        st.warning("Mesh directory not created yet")


def render_metrics(metrics):
    """Render simulation metrics."""
    st.header("📊 Simulation Metrics")

    if not metrics:
        st.info("No metrics available. Run simulation first.")
        return

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        stability = metrics.get("stability_score", 0)
        st.metric(
            "Stability Score",
            f"{stability:.2f}",
            delta=f"{stability*100:.0f}%",
            delta_color="normal" if stability >= 0.8 else "inverse"
        )

    with col2:
        max_accel = metrics.get("max_acceleration", 0)
        st.metric(
            "Max Acceleration",
            f"{max_accel:.2f} m/s²",
            help="Maximum acceleration observed"
        )

    with col3:
        drift = metrics.get("position_drift", 0)
        st.metric(
            "Position Drift",
            f"{drift:.3f} m",
            delta="Low" if drift < 0.5 else "High",
            delta_color="normal" if drift < 0.5 else "inverse"
        )

    with col4:
        energy = metrics.get("energy_efficiency", 0)
        if energy:
            st.metric(
                "Energy Efficiency",
                f"{energy:.2f}",
                help="Ratio of useful work to energy consumed"
            )

    # Additional details
    with st.expander("Detailed Metrics"):
        st.json(metrics)


def render_code_viewer(state):
    """Render code preview panel."""
    st.header("💻 Generated Code")

    if not state.get("cad_code"):
        st.info("No code generated yet.")
        return

    # Show code
    st.code(
        state["cad_code"],
        language="python",
        line_numbers=True
    )

    # Code statistics
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Lines of Code", len(state["cad_code"].split("\n")))
    with col2:
        st.metric("Characters", len(state["cad_code"]))
    with col3:
        st.metric("Iterations", state.get("iteration", 0))


def render_progress_section(state):
    """Render workflow progress and feedback."""
    st.header("🔄 Workflow Progress")

    # Status badge
    status = state.get("status", "initialized")
    status_colors = {
        "initialized": "blue",
        "designing": "orange",
        "simulating": "orange",
        "analyzing": "orange",
        "complete": "green",
        "failed": "red"
    }

    st.markdown(
        f'<span class="status-{status_colors.get(status, "blue")}">Status: {status.upper()}</span>',
        unsafe_allow_html=True
    )

    # Progress bar
    progress = min(state.get("iteration", 0) / 10, 1.0)
    st.progress(progress, text=f"Iteration {state.get('iteration', 0)}/10")

    # Feedback
    feedback = state.get("designer_feedback")
    if feedback:
        st.subheader("💡 Designer Feedback")
        st.info(feedback)

    # Errors
    errors = state.get("errors", [])
    if errors:
        st.subheader("⚠️ Errors & Warnings")
        for error in errors:
            st.error(error)


def render_telemetry_charts(state):
    """Render live telemetry charts."""
    st.header("📈 Telemetry Data")

    results = state.get("simulation_results")
    if not results:
        st.info("No telemetry data available. Run simulation first.")
        return

    if results.get("mock"):
        st.warning("Using mock simulation data (Genesis not available)")

    tabs = st.tabs(["Position", "Velocity", "Forces", "Energy"])

    with tabs[0]:
        if results.get("positions"):
            positions = results["positions"]
            import pandas as pd
            df = pd.DataFrame(positions, columns=["X", "Y", "Z"])
            df["Time"] = results["time"]
            df = df.set_index("Time")
            st.line_chart(df)

    with tabs[1]:
        if results.get("velocities"):
            velocities = results["velocities"]
            import pandas as pd
            df = pd.DataFrame(velocities, columns=["VX", "VY", "VZ"])
            df["Time"] = results["time"]
            df = df.set_index("Time")
            st.line_chart(df)

    with tabs[2]:
        if results.get("forces"):
            forces = results["forces"]
            import pandas as pd
            df = pd.DataFrame(forces, columns=["FX", "FY", "FZ"])
            df["Time"] = results["time"]
            df = df.set_index("Time")
            st.line_chart(df)

    with tabs[3]:
        if results.get("energies"):
            energies = results["energies"]
            import pandas as pd
            df = pd.DataFrame({"Energy": energies})
            df["Time"] = results["time"]
            df = df.set_index("Time")
            st.line_chart(df)


def run_workflow_graph(mission_prompt: str, state: dict) -> dict:
    """
    Execute the LangGraph workflow.

    Args:
        mission_prompt: User's mission requirements
        state: Current workflow state

    Returns:
        Updated workflow state
    """

    # Initialize if needed
    if not state:
        state = create_initial_state(mission_prompt)

    # Build graph
    graph = build_graph()

    # Execute with progress
    with st.spinner("Running design workflow..."):
        progress_bar = st.progress(0)
        status_text = st.empty()

        max_iterations = 10
        for i in range(max_iterations):
            status_text.text(f"Running iteration {i+1}/{max_iterations}...")

            # Execute one iteration
            state = designer_node(state)
            progress_bar.progress(0.25)

            if state.get("errors"):
                break

            state = simulator_node(state)
            progress_bar.progress(0.5)

            if state.get("errors"):
                break

            # Supervisor decides
            decision = supervisor_node(state)
            progress_bar.progress(0.75)

            status_text.text(f"Iteration {i+1} complete. Decision: {decision.get('next')}")

            # Check if finished
            if decision.get("next") == "finish":
                progress_bar.progress(1.0)
                break

            progress_bar.progress((i + 1) / max_iterations)

        status_text.text("Workflow complete!")

    return state


def main():
    """Main application entry point."""
    render_header()

    # Sidebar
    render_sidebar()

    # Mission input
    mission_prompt = render_mission_input()

    # Run button
    run_col, _ = st.columns([1, 3])
    with run_col:
        run_clicked = st.button(
            "🚀 Launch Design",
            type="primary",
            use_container_width=True
        )

    # Initialize session state
    if "workflow_state" not in st.session_state:
        st.session_state.workflow_state = None

    # Run workflow
    if run_clicked:
        if not mission_prompt.strip():
            st.error("Please enter a mission description")
            return

        if not os.getenv("GOOGLE_API_KEY"):
            st.error("Please enter your Google API Key in the sidebar")
            return

        with st.spinner("Initializing aeroForge-G3..."):
            st.session_state.workflow_state = run_workflow_graph(
                mission_prompt,
                st.session_state.workflow_state
            )

    # Render results if workflow ran
    if st.session_state.workflow_state:
        state = st.session_state.workflow_state

        # Main content area
        col1, col2 = st.columns([1, 1])

        with col1:
            render_3d_viewer(state)

        with col2:
            render_metrics(state)
            render_progress_section(state)

        # Telemetry charts
        render_telemetry_charts(state)

        # Code viewer (expandable)
        with st.expander("View Generated Code"):
            render_code_viewer(state)


if __name__ == "__main__":
    main()
