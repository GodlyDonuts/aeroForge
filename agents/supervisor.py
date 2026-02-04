#!/usr/bin/env python3
"""
Supervisor Agent
Decision node that routes workflow between Designer and Simulator
"""

import os
from typing import Literal, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from core.state import AeroForgeState


def supervisor_node(state: AeroForgeState) -> Dict[str, str]:
    """
    Supervisor agent node in the workflow graph.

    Makes decisions about whether to iterate or finish based on:
    - Simulation metrics
    - Error presence
    - Iteration count
    - Overall design quality

    Args:
        state: Current workflow state

    Returns:
        Dictionary with routing decision: {"next": "designer" | "finish"}
    """

    print("\n" + "=" * 70)
    print("👥 SUPERVISOR AGENT: Making workflow decision")
    print("=" * 70)

    # Update status
    state["status"] = "analyzing"

    # Check for termination conditions

    # Condition A: Max iterations reached
    # Reduced to 4 for free tier limits (20 RPD = ~5 iterations max)
    MAX_ITERATIONS = 4
    if state["iteration"] >= MAX_ITERATIONS:
        print(f"⚠ Max iterations ({MAX_ITERATIONS}) reached - stopping")
        print("  Reason: Preventing infinite loops")
        state["status"] = "complete"
        return {"next": "finish"}

    # Condition B: Critical errors
    if state.get("errors"):
        critical_errors = [e for e in state["errors"] if "fatal" in e.lower()]
        if critical_errors:
            print(f"✗ Critical error detected - stopping")
            print(f"  Error: {critical_errors[0]}")
            state["status"] = "failed"
            return {"next": "finish"}

    # Condition C: Analyze metrics and decide
    decision = analyze_with_gemini(state)

    if decision == "iterate":
        print("🔄 Routing to: DESIGNER (improve design)")
        state["status"] = "designing"
    else:
        print("✓ Routing to: FINISH (design approved)")
        state["status"] = "complete"

    return {"next": decision}


def analyze_with_gemini(state: AeroForgeState) -> Literal["iterate", "finish"]:
    """
    Use OpenRouter to decide whether to iterate or finish.

    Args:
        state: Current workflow state

    Returns:
        "iterate" to continue, "finish" to stop
    """

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        # No API key - use simple heuristic
        return simple_heuristic_decision(state)

    try:
        llm = ChatOpenAI(
            model="google/gemini-3-pro-preview",
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.3,
        )
    except Exception as e:
        print(f"  Could not initialize OpenRouter: {e}")
        return simple_heuristic_decision(state)

    system_prompt = """You are the Project Manager/Supervisor for the aeroForge-G3 engineering team.

Your role is to decide whether to continue iterating on a design or approve it for completion.

DECISION CRITERIA:
1. ITERATE if:
   - Stability score < 0.8
   - Max acceleration > 10 m/s² (unstable)
   - Position drift > 0.5 m
   - Specific issues identified by Simulator
   - Iteration count < 10

2. FINISH if:
   - Stability score >= 0.85
   - No critical errors
   - Metrics meet acceptable thresholds
   - Iteration count >= 3 (minimum iterations to validate)

You must respond with ONLY: "iterate" or "finish" (lowercase, no punctuation)."""

    metrics = state.get("simulation_metrics", {})
    feedback = state.get("designer_feedback", "")
    errors = state.get("errors", [])

    user_prompt = f"""DECISION NEEDED - Iteration {state['iteration']}

MISSION: {state['mission_prompt']}

SIMULATION METRICS:
{metrics}

DESIGNER FEEDBACK:
{feedback if feedback else 'None'}

ERRORS:
{errors if errors else 'None'}

Should we iterate (improve design) or finish (approve design)?

Respond with only: "iterate" or "finish\""""

    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        decision = response.content.strip().lower()

        # Validate response
        if decision in ["iterate", "finish"]:
            print(f"  OpenRouter decision: {decision.upper()}")
            return decision
        else:
            print(f"  ⚠ Invalid OpenRouter response: '{decision}', using heuristic")
            return simple_heuristic_decision(state)

    except Exception as e:
        print(f"  ⚠ OpenRouter analysis failed: {e}, using heuristic")
        return simple_heuristic_decision(state)


def simple_heuristic_decision(state: AeroForgeState) -> Literal["iterate", "finish"]:
    """
    Simple rule-based decision when Gemini is unavailable.

    Args:
        state: Current workflow state

    Returns:
        "iterate" or "finish"
    """

    metrics = state.get("simulation_metrics", {})
    iteration = state["iteration"]

    # Minimum iterations required (reduced for free tier)
    MIN_ITERATIONS = 2
    if iteration < MIN_ITERATIONS:
        print(f"  Minimum iterations not met ({iteration}/{MIN_ITERATIONS}) - iterating")
        return "iterate"

    # Check metrics
    stability = metrics.get("stability_score", 0)
    max_accel = metrics.get("max_acceleration", 100)
    position_drift = metrics.get("position_drift", 100)

    # Thresholds
    if stability < 0.85:
        print(f"  Low stability score ({stability:.2f} < 0.85) - iterating")
        return "iterate"

    if max_accel > 10:
        print(f"  High acceleration ({max_accel:.2f} > 10 m/s²) - iterating")
        return "iterate"

    if position_drift > 0.5:
        print(f"  High position drift ({position_drift:.2f} m) - iterating")
        return "iterate"

    # Check for errors
    if state.get("errors"):
        print(f"  Errors present - iterating")
        return "iterate"

    # All checks passed
    print(f"  ✓ Metrics acceptable - finishing")
    return "finish"
