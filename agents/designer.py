#!/usr/bin/env python3
"""
Designer Agent - Component-Based Generation Strategy
Generates structured drone assemblies with fuselage, arms, and motor mounts
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
    Designer agent node - Generates component-based drone assemblies.

    Args:
        state: Current workflow state

    Returns:
        Updated state with generated CAD code
    """

    print("\n" + "=" * 70)
    print("🔨 DESIGNER AGENT: Component-Based Drone Assembly Generation")
    print("=" * 70)

    # Update status
    state["status"] = "designing"
    state["iteration"] = state["iteration"] + 1

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        state["errors"].append("OPENROUTER_API_KEY not found")
        return state

    # Initialize OpenRouter model
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

    # Component-based generation system prompt
    system_prompt = """You are an expert aerospace CAD engineer specializing in build123d parametric modeling.

CRITICAL: You must generate a structured DRONE ASSEMBLY with the following components:

1. CENTRAL FUSELAGE (Body/Shell)
   - Create using Builder: with Builder() as builder:
   - Use Box() or extruded profiles
   - Size: ~100-200mm in length, ~60-100mm in width/height
   - Position at origin (0, 0, 0)

2. FOUR ARMS (Structure)
   - Extend outward in X pattern or + pattern
   - Use Cylinder() for tubular arms (length ~200-300mm, radius ~10-15mm)
   - Position at 90-degree intervals
   - Create and combine them into a single assembly

3. FOUR MOTOR MOUNTS (End of arms)
   - Create at the ends of each arm
   - Use Cylinder() or Box() for mount plates
   - Size: ~40-60mm diameter, ~10-15mm thick
   - Position flush with arm ends

COMPONENT-BASED GENERATION RULES:
1. ALWAYS use Builder mode: with Builder() as builder:
2. Define each component separately FIRST
3. Combine all components using builder.add(component1 + component2 + ...)
4. The final assembly MUST be stored in 'part' variable
5. Use Compound() or union operations to combine parts
6. Center the fuselage at origin
7. Ensure proper alignment of all components

MANDATORY CODE STRUCTURE:
```python
from build123d import *

# Initialize builder
with Builder() as builder:
    # COMPONENT 1: FUSELAGE
    # Define fuselage geometry here
    fuselage = Box(...)

    # COMPONENT 2: ARMS
    # Create 4 arms extending outward
    arm_1 = Cylinder(...).located(Pos(...))
    arm_2 = Cylinder(...).located(Pos(...))
    arm_3 = Cylinder(...).located(Pos(...))
    arm_4 = Cylinder(...).located(Pos(...))
    arms = arm_1 + arm_2 + arm_3 + arm_4

    # COMPONENT 3: MOTOR MOUNTS
    # Create mounts at arm ends
    mount_1 = Cylinder(...).located(Pos(...))
    mount_2 = Cylinder(...).located(Pos(...))
    mount_3 = Cylinder(...).located(Pos(...))
    mount_4 = Cylinder(...).located(Pos(...))
    mounts = mount_1 + mount_2 + mount_3 + mount_4

    # ASSEMBLE ALL COMPONENTS
    full_assembly = fuselage + arms + mounts

    # EXPORT FINAL PART
    builder.add(full_assembly)
    part = builder.part
```

DESIGN PARAMETERS FROM MISSION:
- Parse mission for payload requirements
- Adjust arm length based on thrust needs
- Adjust fuselage size based on payload volume
- Use realistic aerospace dimensions

VALIDATION CHECKS:
1. Final part must be a valid build123d Part or Compound
2. All components must be properly joined
3. No self-intersections or gaps
4. Reasonable center of mass near fuselage center

Return ONLY valid Python code. No explanations. No markdown code blocks."""

    # User prompt with mission requirements
    feedback = state.get("designer_feedback", "")
    iteration = state.get("iteration", 1)

    if iteration == 1:
        user_prompt = f"""Generate a complete drone assembly with component-based structure.

MISSION REQUIREMENTS:
{state['mission_prompt']}

Create a drone with:
1. Central fuselage (body/shell)
2. Four arms extending outward
3. Four motor mounts at arm ends

Use realistic aerospace dimensions and proper build123d Builder mode."""
    else:
        user_prompt = f"""Refine the drone assembly based on simulation feedback.

MISSION: {state['mission_prompt']}
ITERATION: {iteration}

FEEDBACK FROM SIMULATION:
{feedback if feedback else 'No specific feedback. Optimize for stability and aerodynamics.'}

Improve the design while maintaining the component structure (fuselage + 4 arms + 4 mounts).

Return ONLY the improved Python code."""

    # Call AI
    try:
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        response = llm.invoke(messages)
        generated_code = response.content

        # Clean up response
        if "```python" in generated_code:
            generated_code = generated_code.split("```python")[1].split("```")[0].strip()
        elif "```" in generated_code:
            generated_code = generated_code.split("```")[1].split("```")[0].strip()

        # Store in state
        state["cad_code"] = generated_code
        state["design_history"].append(generated_code)

        print(f"✓ Component-based assembly generated (iteration {iteration})")
        print(f"  Code length: {len(generated_code)} characters")

        # Validate code
        try:
            compile(generated_code, '<string>', 'exec')
            print("  ✓ Code syntax is valid")

            # Verify component structure
            has_builder = "with Builder()" in generated_code
            has_fuselage = any(word in generated_code.lower() for word in ["fuselage", "body", "shell", "box"])
            has_arms = "arm" in generated_code.lower()
            has_mount = "mount" in generated_code.lower()

            if has_builder:
                print("  ✓ Builder mode detected")
            if has_fuselage:
                print("  ✓ Fuselage component detected")
            if has_arms:
                print("  ✓ Arms components detected")
            if has_mount:
                print("  ✓ Motor mount components detected")

            if not all([has_builder, has_fuselage, has_arms, has_mount]):
                print("  ⚠ Warning: Some components may be missing")

        except SyntaxError as e:
            print(f"  ✗ Syntax error: {e}")
            state["errors"].append(f"Syntax error: {e}")

    except Exception as e:
        error_msg = f"Designer agent failed: {e}"
        print(f"✗ {error_msg}")
        state["errors"].append(error_msg)

    return state
