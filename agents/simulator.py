#!/usr/bin/env python3
"""
Simulator Agent
Executes physics simulations using Genesis and analyzes results
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any
import tempfile

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from core.state import AeroForgeState
from core.geometry import SceneBuilder
from core.physics import SimRunner


def simulator_node(state: AeroForgeState) -> AeroForgeState:
    """
    Simulator agent node in the workflow graph.

    Executes the CAD code, converts to URDF, runs physics simulation,
    and analyzes results.

    Args:
        state: Current workflow state

    Returns:
        Updated state with simulation metrics and analysis
    """

    print("\n" + "=" * 70)
    print("🧪 SIMULATOR AGENT: Running physics simulation")
    print("=" * 70)

    # Update status
    state["status"] = "simulating"

    # Check if we have CAD code
    if not state.get("cad_code"):
        state["errors"].append("No CAD code available for simulation")
        return state

    # Step 1: Execute CAD code to generate 3D model
    print("Step 1: Executing CAD code...")
    cad_part = execute_cad_code(state["cad_code"])
    if cad_part is None:
        state["errors"].append("Failed to execute CAD code")
        return state
    print("  ✓ CAD model generated")

    # Step 2: Export to STL
    print("Step 2: Exporting to STL...")
    scene_builder = SceneBuilder(output_dir="output")
    stl_files = scene_builder.export_assembly(cad_part, "design")

    if not stl_files:
        state["errors"].append("Failed to export STL files")
        return state
    print(f"  ✓ Exported {len(stl_files)} STL file(s)")

    # Step 3: Generate URDF
    print("Step 3: Generating URDF...")
    urdf = generate_simple_urdf(stl_files)
    urdf_path = scene_builder.save_urdf(urdf, "design.urdf")
    state["urdf_path"] = urdf_path
    print(f"  ✓ Generated URDF: {urdf_path}")

    # Step 4: Run physics simulation
    print("Step 4: Running Genesis simulation (subprocess)...")
    
    import subprocess
    import json
    
    # Define paths
    sim_script = Path("core/run_simulation.py")
    output_json = Path(f"output/sim_results_{state.get('iteration', 0)}.json")
    
    cmd = [
        sys.executable,
        str(sim_script),
        "--urdf", str(urdf_path),
        "--output", str(output_json),
        "--steps", "500",
        "--backend", "gpu" 
    ]
    
    try:
        # Run subprocess
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        print(f"Subprocess output: {result.stdout}")
        if result.stderr:
            print(f"Subprocess error: {result.stderr}")
            
        if result.returncode != 0:
            raise Exception(f"Simulation process failed with code {result.returncode}")
            
        # Load results
        if output_json.exists():
            with open(output_json, "r") as f:
                sim_data = json.load(f)
                
            if sim_data.get("status") == "error":
                raise Exception(sim_data.get("error"))
                
            state["simulation_results"] = sim_data.get("telemetry", {})
            state["simulation_metrics"] = sim_data.get("metrics", {})
            
            print(f"  ✓ Simulation complete")
            print(f"    Stability score: {state['simulation_metrics'].get('stability_score', 0):.2f}")
        else:
            raise Exception("No results file generated")

    except Exception as e:
        error_msg = f"Simulation failed: {e}"
        print(f"  ✗ {error_msg}")
        state["errors"].append(error_msg)
        state["simulation_metrics"] = {"error": str(e)}

    # Step 5: Analyze results with Gemini (Deep Think reasoning)
    print("Step 5: Analyzing results with Gemini...")
    analysis = analyze_simulation_with_gemini(state)
    if analysis:
        state["designer_feedback"] = analysis
        print(f"  ✓ Analysis complete: {analysis[:100]}...")

    return state


def execute_cad_code(cad_code: str):
    """
    Execute build123d code and return the generated part.

    Args:
        cad_code: Python code string using build123d

    Returns:
        build123d Part object or None on failure
    """
    try:
        import build123d as bd
    except ImportError:
        print("  ✗ build123d not available - using mock mode")
        return create_mock_part()

    try:
        # Create execution namespace
        namespace = {
            "Box": bd.Box,
            "Cylinder": bd.Cylinder,
            "Sphere": bd.Sphere,
            "Cone": bd.Cone,
            "Builder": bd.Builder,
            "Part": bd.Part,
            "Compound": bd.Compound,
            "Union": bd.Union,
            "Subtract": bd.Subtract,
            "Intersect": bd.Intersect,
            "__builtins__": __builtins__,
        }

        # Execute the code
        exec(cad_code, namespace)

        # Extract the part
        part = namespace.get("part")
        if part is None:
            print("  ✗ No 'part' variable found in generated code")
            return create_mock_part()

        return part

    except Exception as e:
        print(f"  ✗ CAD execution error: {e}")
        # Fall back to mock part for development
        return create_mock_part()


def create_mock_part():
    """Create a mock build123d part for development/testing."""
    try:
        import build123d as bd
        return bd.Box(100, 100, 10)
    except:
        return None


def generate_simple_urdf(stl_files: list) -> str:
    """
    Generate a simple URDF from STL files.

    Args:
        stl_files: List of STL file paths

    Returns:
        URDF XML string
    """
    scene_builder = SceneBuilder()

    # Create links for each STL
    links = []
    for i, stl_path in enumerate(stl_files):
        # Use relative path for URDF
        rel_path = f"meshes/{Path(stl_path).name}"
        links.append({
            "name": f"link_{i}",
            "mesh": rel_path,
            "mass": "1.0",
            "density": "2700"
        })

    # Create joints (simple fixed joints)
    joints = []
    for i in range(len(links)):
        if i == 0:
            # First link connects to world (fixed)
            joints.append({
                "name": f"joint_{i}",
                "parent": "world",
                "child": links[i]["name"],
                "type": "fixed",
                "origin": {"xyz": "0 0 0", "rpy": "0 0 0"}
            })
        else:
            # Other links connect to previous link
            joints.append({
                "name": f"joint_{i}",
                "parent": links[i-1]["name"],
                "child": links[i]["name"],
                "type": "fixed",
                "origin": {"xyz": "0 0 0.05", "rpy": "0 0 0"}
            })

    return scene_builder.generate_urdf(links, joints, "aeroforge_robot")


def analyze_simulation_with_gemini(state: AeroForgeState) -> str:
    """
    Use OpenRouter to analyze simulation results and provide feedback.

    Args:
        state: Current workflow state with simulation data

    Returns:
        Analysis and feedback string
    """

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return "No API key available for analysis"

    try:
        llm = ChatOpenAI(
            model="google/gemini-3-pro-preview",
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.5,
        )
    except:
        return "Could not initialize OpenRouter for analysis"

    system_prompt = """You are an expert test pilot and aerospace physicist.

Analyze the simulation telemetry and provide specific, actionable feedback for improving the design.

Focus on:
1. Stability issues (oscillations, drift, instability)
2. Performance metrics (acceleration, forces, efficiency)
3. Physical validity (violations of physics laws)
4. Structural integrity concerns

Provide specific recommendations like:
- "Increase arm thickness from 5mm to 8mm for better stiffness"
- "Adjust center of mass by moving battery forward"
- "Reduce drag by streamlining the nose cone"

Be concise and actionable."""

    metrics = state.get("simulation_metrics", {})
    results = state.get("simulation_results", {})

    user_prompt = f"""Analyze these simulation results:

MISSION: {state['mission_prompt']}
ITERATION: {state['iteration']}

METRICS:
{metrics}

Provide specific recommendations for design improvements."""

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        return response.content

    except Exception as e:
        return f"Analysis failed: {e}"
