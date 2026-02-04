#!/usr/bin/env python3
"""
aeroForge-G3 Main Entry Point
Autonomous Generative Aerospace Engineering
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from core.state import AeroForgeState
from agents.designer import designer_node
from agents.simulator import simulator_node
from agents.supervisor import supervisor_node

from langgraph.graph import StateGraph, END


def build_graph():
    """Build and compile the LangGraph StateGraph for aeroForge-G3."""

    # Initialize the state graph with our AeroForgeState schema
    workflow = StateGraph(AeroForgeState)

    # Add nodes for each agent
    workflow.add_node("designer", designer_node)
    workflow.add_node("simulator", simulator_node)
    workflow.add_node("supervisor", supervisor_node)

    # Set entry point
    workflow.set_entry_point("designer")

    # Define edges
    # Designer -> Simulator (CAD generation complete, move to testing)
    workflow.add_edge("designer", "simulator")

    # Simulator -> Supervisor (Testing complete, need decision)
    workflow.add_edge("simulator", "supervisor")

    # Supervisor -> Designer (iteration needed) or END (finished)
    workflow.add_conditional_edges(
        "supervisor",
        supervisor_node,
        {
            "iterate": "designer",  # Go back for another iteration
            "finish": END           # Complete the workflow
        }
    )

    return workflow.compile()


def main():
    """Main execution function."""
    import os
    from dotenv import load_dotenv
    
    # Load environment variables
    load_dotenv()

    # Check for required environment variables
    if not os.getenv("OPENROUTER_API_KEY"):
        print("ERROR: OPENROUTER_API_KEY environment variable not set")
        print("Please set it with: export OPENROUTER_API_KEY='your_key'")
        sys.exit(1)

    print("=" * 70)
    print("aeroForge-G3: Autonomous Generative Aerospace Engineering")
    print("=" * 70)

    # Build the workflow graph
    print("\nBuilding agent workflow...")
    graph = build_graph()

    # Initialize state
    initial_state = AeroForgeState(
        mission_prompt="",
        cad_code="",
        urdf_path="",
        simulation_metrics={},
        errors=[],
        iteration=0,
        status="initialized"
    )

    # Run the workflow (will be integrated with UI)
    print("Workflow ready for execution via app.py")
    print("\nTo start the application: streamlit run app.py")


if __name__ == "__main__":
    main()
