#!/usr/bin/env python3
"""
Designer Agent
Generates build123d CAD code from mission requirements using OpenRouter
"""

import os
import sys
from typing import Dict, Any
from pathlib import Path

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from core.state import AeroForgeState
from core.geometry import SceneBuilder


def designer_node(state: AeroForgeState) -> AeroForgeState:
    """
    Designer agent node in the workflow graph.

    Translates mission requirements (and feedback) into build123d CAD code.

    Args:
        state: Current workflow state

    Returns:
        Updated state with generated CAD code
    """

    print("\n" + "=" * 70)
    print("🔨 DESIGNER AGENT: Generating CAD code")
    print("=" * 70)

    # Update status
    state["status"] = "designing"
    state["iteration"] = state["iteration"] + 1

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        state["errors"].append("OPENROUTER_API_KEY not found")
        return state

    # Initialize OpenRouter model (using Google Gemini 3 Pro for code generation)
    try:
        llm = ChatOpenAI(
            model="google/gemini-3-pro-preview",
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=0.7,
        )
    except Exception as e:
        state["errors"].append(f"Failed to initialize OpenRouter: {e}")
        return state

    # Construct prompt
    system_prompt = """You are an expert mechanical engineer specializing in build123d CAD programming.

Your task is to generate valid Python code using the build123d library to create 3D models.

CRITICAL RULES:
1. Always use Builder mode: `with Builder() as builder:`
2. Define a final `part` variable that contains your complete model
3. Use precise dimensions (in millimeters unless specified otherwise)
4. Ensure all geometry is valid (no self-intersections, closed shapes)
5. Use appropriate geometric primitives: Box, Cylinder, Cone, Sphere
6. Use union, subtract, and intersect operations carefully
7. Add comments explaining key design decisions
8. For aerospace parts, consider aerodynamics and weight reduction

BUILD123D PATTERN:
```python
from build123d import *

# Always use Builder mode
with Builder() as builder:
    # Create base shape
    base = Box(100, 50, 5)
    
    # Add features
    holes = Cylinder(5, 10)
    builder.add(base - holes)
    
    # Final part assignment
    part = builder.part
```

IMPORTANT: Your code must execute without errors and produce a valid part object."""

    # Build user prompt based on iteration
    if state["iteration"] == 1:
        user_prompt = f"""Generate build123d Python code for the following aerospace design:

MISSION REQUIREMENTS:
{state['mission_prompt']}

Create a complete, manufacturable 3D model. Focus on:
- Structural integrity
- Weight optimization
- Aerodynamic considerations

Return ONLY the Python code, no explanations."""
    else:
        user_prompt = f"""Revise the build123d Python code based on simulation feedback:

MISSION REQUIREMENTS:
{state['mission_prompt']}

PREVIOUS DESIGN ISSUES/FEEDBACK:
{state.get('designer_feedback', 'No specific feedback')}

PREVIOUS ITERATION {state['iteration'] - 1} CODE:
{state.get('cad_code', 'No previous code')}

PREVIOUS ERRORS:
{state.get('errors', [])}

Generate improved code that addresses the feedback. Return ONLY the Python code."""

    # Call Gemini
    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        generated_code = response.content

        # Clean up response (remove markdown code blocks if present)
        if "```python" in generated_code:
            generated_code = generated_code.split("```python")[1].split("```")[0].strip()
        elif "```" in generated_code:
            generated_code = generated_code.split("```")[1].split("```")[0].strip()

        # Save to state
        state["cad_code"] = generated_code
        state["design_history"].append(generated_code)

        print(f"✓ Generated CAD code (iteration {state['iteration']})")
        print(f"  Code length: {len(generated_code)} characters")

        # Validate code by attempting to parse
        try:
            compile(generated_code, '<string>', 'exec')
            print("  ✓ Code syntax is valid")
        except SyntaxError as e:
            print(f"  ✗ Syntax error detected: {e}")
            state["errors"].append(f"Syntax error: {e}")

    except Exception as e:
        error_msg = f"Designer agent failed: {e}"
        print(f"✗ {error_msg}")
        state["errors"].append(error_msg)

    return state
