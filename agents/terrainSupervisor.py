#!/usr/bin/env python3
"""
Designer Agent - Component-Based Generation Strategy
Generates structured drone assemblies with fuselage, arms, and motor mounts
"""

import os
import sys
from typing import Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from core.state import AeroForgeState
from core.geometry import SceneBuilder


def generate_template_cad(prompt: str, iteration: int) -> str:
    """
    Generate a template CAD code for demo mode when API is unavailable.
    Creates mission-appropriate drone designs.

    Args:
        prompt: Mission requirements
        iteration: Current iteration number

    Returns:
        build123d Python code string
    """
    prompt_lower = prompt.lower()

    # Analyze mission requirements
    is_medical = "medical" in prompt_lower or "rescue" in prompt_lower or "delivery" in prompt_lower
    is_himalayan = "himalayan" in prompt_lower or "altitude" in prompt_lower or "mountain" in prompt_lower
    is_racing = "racing" in prompt_lower or "speed" in prompt_lower or "fast" in prompt_lower
    is_heavy = "heavy" in prompt_lower or "cargo" in prompt_lower or "lift" in prompt_lower

    # Base dimensions for different drone types
    if is_medical or is_himalayan:
        fuselage_len = 140
        fuselage_width = 100
        fuselage_height = 45
        arm_len = 200
        arm_thick = 12
        mount_radius = 30
        mount_height = 10
    elif is_racing:
        fuselage_len = 100
        fuselage_width = 40
        fuselage_height = 20
        arm_len = 120
        arm_thick = 6
        mount_radius = 20
        mount_height = 6
    elif is_heavy:
        fuselage_len = 180
        fuselage_width = 120
        fuselage_height = 60
        arm_len = 250
        arm_thick = 15
        mount_radius = 35
        mount_height = 12
    else:
        # Default quadcopter
        fuselage_len = 120
        fuselage_width = 80
        fuselage_height = 30
        arm_len = 180
        arm_thick = 10
        mount_radius = 25
        mount_height = 8

    # Adjust for iterations (optimization)
    if iteration > 1:
        arm_thick = int(arm_thick * 1.1)  # Thicker arms for stability
        mount_radius = int(mount_radius * 1.05)

    template = f"""from build123d import *

# Initialize BuildPart context
with BuildPart() as builder:
    # COMPONENT 1: FUSELAGE (centered at origin)
    fuselage = Box(length={fuselage_len}, width={fuselage_width}, height={fuselage_height},
                   align=(Align.CENTER, Align.CENTER, Align.CENTER))

    # COMPONENT 2: FOUR ARMS in X configuration
    arm_length = {arm_len}
    arm_radius = {arm_thick}

    # Arm 1 - 45 degrees
    arm_1 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_length)
    arm_1 = Rot(0, 0, 45) * arm_1

    # Arm 2 - 135 degrees
    arm_2 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_length)
    arm_2 = Rot(0, 0, 135) * arm_2

    # Arm 3 - 225 degrees
    arm_3 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_length)
    arm_3 = Rot(0, 0, 225) * arm_3

    # Arm 4 - 315 degrees
    arm_4 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_length)
    arm_4 = Rot(0, 0, 315) * arm_4

    # COMPONENT 3: MOTOR MOUNTS at arm ends
    mount_radius = {mount_radius}
    mount_height = {mount_height}

    mount_1 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_1 = Rot(0, 0, 45) * mount_1

    mount_2 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_2 = Rot(0, 0, 135) * mount_2

    mount_3 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_3 = Rot(0, 0, 225) * mount_3

    mount_4 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_4 = Rot(0, 0, 315) * mount_4

    # ASSEMBLE ALL COMPONENTS
    full_assembly = fuselage + arm_1 + arm_2 + arm_3 + arm_4 + mount_1 + mount_2 + mount_3 + mount_4

# Extract final part from builder
part = builder.part
"""
    return template


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
    is_demo_mode = os.getenv("DEMO_MODE", "false").lower() == "true"
    has_mock_key = api_key and api_key.startswith("sk-or-v1-mock")

    if not api_key or has_mock_key:
        if is_demo_mode or has_mock_key:
            print("  ℹ️ Demo/Mock Mode: Using preset CAD template")
            # Generate a template based on mission
            state["cad_code"] = generate_template_cad(state["mission_prompt"], state.get("iteration", 1))
            state["design_history"].append(state["cad_code"])
            print(f"  ✓ Template CAD code generated ({len(state['cad_code'])} chars)")
            return state
        else:
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
   - Use Cylinder() for tubular arms, rotate to lie on XY plane
   - Dimensions: length ~150-250mm, radius ~8-12mm
   - Align each arm properly and rotate to 45, 135, 225, 315 degrees

3. FOUR MOTOR MOUNTS (End of arms)
   - Create cylindrical motor mounts at arm ends
   - Use Cylinder() with radius ~20-30mm, height ~8-12mm
   - Position at the end of each arm (extend beyond arm tip)

COMPONENT-BASED GENERATION RULES:
1. ALWAYS use: with BuildPart() as builder:
2. Define ALL components inside the BuildPart context
3. Combine components using the + operator
4. The final assembly is stored in builder.part
5. DO NOT create a separate 'part' variable - use builder.part only
6. Center the fuselage at origin using align parameter

CRITICAL ROTATION SYNTAX:
- Rot(x, y, z) where x, y, z are degrees
- Rot(90, 0, 0) rotates around X axis by 90°
- Rot(0, 90, 0) rotates around Y axis by 90°
- Rot(0, 0, 45) rotates around Z axis by 45°

CORRECT BUILD123D SYNTAX:
- For positioning: Pos(x, y, z) * shape
- For rotation: Rot(x, y, z) * shape
- For alignment: Box(length, width, height, align=(Align.CENTER, Align.CENTER, Align.CENTER))
- Extract final part: part = builder.part (after BuildPart context exits)

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
    arm_height = arm_length  # Cylinder length becomes arm length

    # For horizontal arms (lying on XY plane), rotate cylinder around Y
    arm_1 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_height)
    arm_1 = Rot(0, 0, 45) * arm_1  # Rotate to 45-degree position

    arm_2 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_height)
    arm_2 = Rot(0, 0, 135) * arm_2  # Rotate to 135-degree position

    arm_3 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_height)
    arm_3 = Rot(0, 0, 225) * arm_3  # Rotate to 225-degree position

    arm_4 = Rot(0, 90, 0) * Pos(arm_length/2, 0, 0) * Cylinder(radius=arm_radius, height=arm_height)
    arm_4 = Rot(0, 0, 315) * arm_4  # Rotate to 315-degree position

    # COMPONENT 3: MOTOR MOUNTS at arm ends (horizontal cylinders)
    mount_radius = 25
    mount_height = 8

    mount_1 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_1 = Rot(0, 0, 45) * mount_1

    mount_2 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_2 = Rot(0, 0, 135) * mount_2

    mount_3 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_3 = Rot(0, 0, 225) * mount_3

    mount_4 = Pos(arm_length, 0, 0) * Cylinder(radius=mount_radius, height=mount_height)
    mount_4 = Rot(0, 0, 315) * mount_4

    # ASSEMBLE ALL COMPONENTS (union is automatic with + operator)
    full_assembly = fuselage + arm_1 + arm_2 + arm_3 + arm_4 + mount_1 + mount_2 + mount_3 + mount_4

# Extract final part from builder AFTER context exits
part = builder.part
```

DESIGN ADJUSTMENTS:
- Increase arm length for larger drones or heavier payloads
- Increase arm radius/thickness for heavy-lift applications
- Make fuselage larger for bigger payloads
- Motor mount radius depends on motor size

VALIDATION CHECKS:
1. Final 'part' variable MUST be defined as: part = builder.part
2. All shapes must be created inside BuildPart context
3. Use correct build123d API (Box, Cylinder, align, Pos, Rot)
4. For horizontal arms: Rot(0, 90, 0) rotates cylinder to lie on XY plane
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
