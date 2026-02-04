# aeroForge-G3 Requirements Document

## Project Requirements

### User Mission Requirements

The system shall:
1. Accept natural language mission descriptions for aerospace components
2. Support predefined mission templates (Mars drone, high-speed drone, heavy-lift, surveillance)
3. Validate mission prompts for completeness
4. Store mission history for reference

### Functional Requirements

#### CAD Generation
1. Generate valid build123d Python code from natural language requirements
2. Use Builder mode consistently for all CAD generation
3. Handle parametric modeling with variables
4. Support assembly creation (multiple parts)
5. Export generated models to STL format
6. Calculate approximate mass from geometry
7. Handle geometric primitives: Box, Cylinder, Sphere, Cone
8. Support Boolean operations: union, subtract, intersect

#### Physics Simulation
1. Load URDF models into Genesis physics engine
2. Support GPU and CPU backends
3. Configure terrain (plane, rough)
4. Run configurable simulation episodes (100-2000 steps)
5. Capture telemetry: position, velocity, force, energy
6. Calculate stability metrics from telemetry
7. Detect physical violations (collisions, explosions)
8. Provide fallback mock simulation when Genesis unavailable

#### URDF Generation
1. Generate valid URDF XML from STL files
2. Calculate inertial properties (mass, inertia tensor)
3. Create visual elements for rendering
4. Create collision elements for physics
5. Define joints (fixed, revolute, prismatic)
6. Set appropriate gravity vector

#### Multi-Agent Orchestration
1. Designer agent generates CAD code
2. Simulator agent validates with physics
3. Supervisor agent decides iterations
4. Support iteration feedback (errors, metrics)
5. Prevent infinite loops (max 10 iterations)
6. Maintain state across iterations
7. Provide decision rationale

#### User Interface
1. Provide web-based interface (Streamlit)
2. Display mission input with presets
3. Show real-time workflow progress
4. Render 3D models (STL files)
5. Display simulation metrics dashboard
6. Show telemetry time-series charts
7. Preview generated code
8. Configure simulation settings
9. Input API key securely

### Non-Functional Requirements

#### Performance
1. CAD generation: < 10 seconds for simple models
2. Simulation: < 30 seconds for 500 steps
3. UI response time: < 1 second
4. Support up to 10 iterations per design

#### Reliability
1. 99% uptime for UI
2. Graceful degradation when dependencies missing
3. Clear error messages
4. Automatic fallback modes
5. No silent failures

#### Usability
1. Intuitive interface with minimal learning curve
2. Preset missions for quick starts
3. Clear visual feedback
4. Progress indicators
5. Help text and tooltips

#### Security
1. Secure API key handling (password input)
2. No credential storage
3. Sanitized code execution
4. Input validation

#### Maintainability
1. Modular code architecture
2. Comprehensive documentation
3. Type hints throughout
4. Clear separation of concerns
5. Version control friendly

### Technical Requirements

#### Dependencies
1. Python 3.10+
2. build123d >= 0.5.0
3. genesis-world >= 0.3.0
4. langgraph
5. langchain
6. langchain-google-genai
7. pydantic >= 2.0
8. streamlit >= 1.32.0
9. stpyvista
10. vtk

#### Hardware
1. NVIDIA GPU with CUDA 11+ (recommended)
2. 8GB RAM minimum
3. 500MB disk space

#### APIs
1. Google Gemini 3 API key required
2. Internet connection for AI services

### Constraints

#### Design Constraints
1. Must use build123d for CAD (not OpenSCAD)
2. Must use Genesis for physics (not alternatives)
3. Must use LangGraph for orchestration
4. Must use Streamlit for UI

#### Operational Constraints
1. Maximum 10 design iterations
2. Maximum 2000 simulation steps
3. Code must be Python 3.10+ compatible
4. No external servers required

### Validation Criteria

#### Success Metrics
1. Valid build123d code generation: 95%+
2. Successful STL export: 100%
3. Valid URDF generation: 100%
4. Simulation stability score >= 0.85 for acceptable designs
5. No crashes in normal operation

#### Acceptance Criteria
1. User can enter mission description
2. System generates CAD code
3. System runs simulation
4. System displays results
5. User can iterate on design
6. System terminates appropriately

### Future Enhancements (Out of Scope)

#### Phase 2 Features
1. Material property optimization
2. Aerodynamic CFD analysis
3. Multiple terrain types
4. Wind simulation
5. Component sourcing integration
6. Manufacturing export (STEP, IGES)
7. Design version control
8. Multi-user collaboration

#### Research Features
1. End-to-end gradient optimization
2. Genetic algorithm for design search
3. Reinforcement learning for control
4. Autonomous testing
5. Regulatory compliance checking

---

## Requirement Traceability Matrix

| Requirement | Component | Status |
|------------|-----------|--------|
| FR-CAD-1 | agents/designer.py | ✅ |
| FR-CAD-2 | agents/designer.py | ✅ |
| FR-CAD-3 | agents/designer.py | ✅ |
| FR-CAD-4 | core/geometry.py | ✅ |
| FR-CAD-5 | core/geometry.py | ✅ |
| FR-CAD-6 | core/geometry.py | ✅ |
| FR-PHYS-1 | core/physics.py | ✅ |
| FR-PHYS-2 | core/physics.py | ✅ |
| FR-PHYS-3 | core/physics.py | ✅ |
| FR-PHYS-4 | core/physics.py | ✅ |
| FR-PHYS-5 | core/physics.py | ✅ |
| FR-PHYS-6 | core/physics.py | ✅ |
| FR-PHYS-8 | core/physics.py | ✅ |
| FR-URDF-1 | core/geometry.py | ✅ |
| FR-URDF-2 | core/geometry.py | ✅ |
| FR-URDF-3 | core/geometry.py | ✅ |
| FR-URDF-4 | core/geometry.py | ✅ |
| FR-URDF-5 | core/geometry.py | ✅ |
| FR-AGENT-1 | agents/designer.py | ✅ |
| FR-AGENT-2 | agents/simulator.py | ✅ |
| FR-AGENT-3 | agents/supervisor.py | ✅ |
| FR-AGENT-4 | core/state.py | ✅ |
| FR-AGENT-5 | agents/supervisor.py | ✅ |
| FR-AGENT-6 | core/state.py | ✅ |
| FR-AGENT-7 | agents/supervisor.py | ✅ |
| FR-UI-1 | app.py | ✅ |
| FR-UI-2 | app.py | ✅ |
| FR-UI-3 | app.py | ✅ |
| FR-UI-4 | app.py | ✅ |
| FR-UI-5 | app.py | ✅ |
| FR-UI-6 | app.py | ✅ |
| FR-UI-7 | app.py | ✅ |
| FR-UI-8 | app.py | ✅ |
| FR-UI-9 | app.py | ✅ |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-02-04 | AI Assistant | Initial requirements document |

---

## Approval

This document has been reviewed and approved for implementation.

- [x] Requirements specification complete
- [x] Technical approach validated
- [x] Implementation plan approved
- [x] Quality criteria defined
