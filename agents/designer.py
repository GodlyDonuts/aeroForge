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
   - Use Box() for rectangular fuselage
   - Size: ~100-150mm length, ~80-120mm width, ~40-60mm height
   - Position at origin (0, 0, 0)
   - Use align parameter: align=(Align.CENTER, Align.CENTER, Align.CENTER)

2. FOUR ARMS (Structure)
   - Extend in X pattern (45-degree angles) for better stability
   - Use Cylinder() for tubular arms
   - Dimensions: length ~150-250mm, radius ~8-12mm
   - Align each arm properly and rotate to 45, 135, 225, 315 degrees
   - Height should be centered vertically

3. FOUR MOTOR MOUNTS (End of arms)
   - Create cylindrical motor mounts at arm ends
   - Use Cylinder() with radius ~20-30mm, height ~8-12mm
   - Position at the end of each arm (extend beyond arm tip)
   - Use align=(Align.CENTER, Align.CENTER, Align.CENTER)

COMPONENT-BASED GENERATION RULES:
1. ALWAYS use BuildPart context: with BuildPart() as builder:
2. Define ALL components inside the BuildPart context
3. Use the + operator to combine components (fuselage + arm1 + arm2 + ...)
4. The final assembly is automatically stored in builder.part
5. After BuildPart, extract it: part = builder.part
6. Center the fuselage at origin using align parameter

CORRECT BUILD123D SYNTAX:
- For positioning: use Pos(x, y, z) * shape or shape.located(Pos(x, y, z))
- For rotation: use Rot(axis=Axis.Z, angle=degrees) * shape
- For alignment: Box(length, width, height, align=(Align.CENTER, Align.CENTER, Align.CENTER))
- Access final part: part = builder.part

MANDATORY CODE STRUCTURE:
```python
from build123d import *

# Initialize BuildPart context
with BuildPart() as builder:
    # COMPONENT 1: FUSELAGE (centered at origin)
    fuselage = Box(length=120, width=100, height=40,
                   align=(Align.CENTER, Align.CENTER, Align.CENTER))

    # COMPONENT 2: FOUR ARMS in X configuration
    arm_length = 180
    arm_radius = 10
    arm_height = 10

    # Arm positions at 45-degree intervals
    arm_1 = Cylinder(radius=arm_radius, height=arm_height,
                     align=(Align.CENTER, Align.CENTER, Align.CENTER))
    # Rotate 45 degrees around Z axis using Rot(0, 0, 45)
    arm_1 = Rot(0, 0, 45) * Pos(arm_length/2, arm_length/2, 0) * arm_1

    arm_2 = Cylinder(radius=arm_radius, height=arm_height,
                     align=(Align.CENTER, Align.CENTER, Align.CENTER))
    arm_2 = Rot(0, 0, 135) * Pos(-arm_length/2, arm_length/2, 0) * arm_2

    arm_3 = Cylinder(radius=arm_radius, height=arm_height,
                     align=(Align.CENTER, Align.CENTER, Align.CENTER))
    arm_3 = Rot(0, 0, 225) * Pos(-arm_length/2, -arm_length/2, 0) * arm_3

    arm_4 = Cylinder(radius=arm_radius, height=arm_height,
                     align=(Align.CENTER, Align.CENTER, Align.CENTER))
    arm_4 = Rot(0, 0, 315) * Pos(arm_length/2, -arm_length/2, 0) * arm_4

    # COMPONENT 3: MOTOR MOUNTS at arm ends
    mount_radius = 25
    mount_height = 8

    mount_1 = Cylinder(radius=mount_radius, height=mount_height,
                       align=(Align.CENTER, Align.CENTER, Align.CENTER))
    mount_1 = Pos(arm_length/2 + 30, arm_length/2 + 30, 0) * mount_1

    mount_2 = Cylinder(radius=mount_radius, height=mount_height,
                       align=(Align.CENTER, Align.CENTER, Align.CENTER))
    mount_2 = Pos(-arm_length/2 - 30, arm_length/2 + 30, 0) * mount_2

    mount_3 = Cylinder(radius=mount_radius, height=mount_height,
                       align=(Align.CENTER, Align.CENTER, Align.CENTER))
    mount_3 = Pos(-arm_length/2 - 30, -arm_length/2 - 30, 0) * mount_3

    mount_4 = Cylinder(radius=mount_radius, height=mount_height,
                       align=(Align.CENTER, Align.CENTER, Align.CENTER))
    mount_4 = Pos(arm_length/2 + 30, -arm_length/2 - 30, 0) * mount_4

    # ASSEMBLE ALL COMPONENTS (union is automatic with + operator)
    full_assembly = fuselage + arm_1 + arm_2 + arm_3 + arm_4 + mount_1 + mount_2 + mount_3 + mount_4

# Extract final part from builder
part = builder.part
```

DESIGN ADJUSTMENTS:
- Increase arm length for larger drones or heavier payloads
- Increase arm radius/thickness for heavy-lift applications
- Make fuselage larger for bigger payloads
- Motor mount radius depends on motor size

VALIDATION CHECKS:
1. Final part variable MUST be defined
2. All shapes must be created inside BuildPart context
3. Use correct build123d API (Box, Cylinder, align, Pos, Rot, Axis, Align)
4. No arbitrary positioning - use Pos() and Rot()
5. Component dimensions should be realistic for aerospace

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
