#!/usr/bin/env python3
"""
aeroForge-G3 FastAPI Server
Backend server handling mission workflows, status, and results
"""

import os
import sys
import asyncio
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Load environment variables
load_dotenv()

# Import existing aeroForge modules
from core.state import AeroForgeState, create_initial_state
from agents.designer import designer_node
from agents.simulator import simulator_node
from agents.supervisor import supervisor_node
from main import build_graph

# ============================================================================
# Data Models
# ============================================================================

class MissionRequest(BaseModel):
    """Mission request from frontend"""
    prompt: str
    max_iterations: int = 4


class MissionResponse(BaseModel):
    """Response when mission is submitted"""
    mission_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    """Current workflow status"""
    mission_id: str
    status: str
    iteration: int
    current_agent: str
    logs: List[str]
    errors: List[str]
    simulation_metrics: Dict[str, Any]


class ResultsResponse(BaseModel):
    """Generated results"""
    mission_id: str
    status: str
    files: List[str]
    metrics: Dict[str, Any]


# ============================================================================
# Mission Manager
# ============================================================================

class MissionManager:
    """Manages active and completed missions"""

    def __init__(self):
        self.active_missions: Dict[str, Dict] = {}
        self.completed_missions: Dict[str, Dict] = {}
        self.output_dir = Path("output")
        self.output_dir.mkdir(exist_ok=True)

    def create_mission(self, mission_id: str, prompt: str, max_iterations: int = 4) -> Dict:
        """Create a new mission"""
        mission = {
            "mission_id": mission_id,
            "prompt": prompt,
            "status": "initializing",
            "iteration": 0,
            "current_agent": "none",
            "logs": [],
            "errors": [],
            "simulation_metrics": {},
            "max_iterations": max_iterations,
            "state": create_initial_state(prompt),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        self.active_missions[mission_id] = mission
        return mission

    def update_mission(self, mission_id: str, **updates):
        """Update mission status"""
        if mission_id in self.active_missions:
            self.active_missions[mission_id].update(updates)
            self.active_missions[mission_id]["updated_at"] = datetime.now().isoformat()

    def add_log(self, mission_id: str, log: str):
        """Add a log entry"""
        if mission_id in self.active_missions:
            self.active_missions[mission_id]["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] {log}")

    def add_error(self, mission_id: str, error: str):
        """Add an error entry"""
        if mission_id in self.active_missions:
            self.active_missions[mission_id]["errors"].append(error)
            self.active_missions[mission_id]["logs"].append(f"[ERROR] {error}")

    def complete_mission(self, mission_id: str, success: bool = True):
        """Mark mission as complete"""
        if mission_id in self.active_missions:
            mission = self.active_missions.pop(mission_id)
            mission["status"] = "complete" if success else "failed"
            mission["completed_at"] = datetime.now().isoformat()
            self.completed_missions[mission_id] = mission

    def get_mission(self, mission_id: str) -> Optional[Dict]:
        """Get mission by ID"""
        return self.active_missions.get(mission_id) or self.completed_missions.get(mission_id)

    def get_generated_files(self, mission_id: str) -> List[str]:
        """Get list of generated files for a mission"""
        files = []

        # Check for STL files
        mesh_dir = self.output_dir / "meshes"
        if mesh_dir.exists():
            for stl in mesh_dir.glob("*.stl"):
                files.append(str(stl))

        # Check for URDF files
        urdf_dir = self.output_dir / "urdf"
        if urdf_dir.exists():
            for urdf in urdf_dir.glob("*.urdf"):
                files.append(str(urdf))

        return files


# Global mission manager
mission_manager = MissionManager()


# ============================================================================
# Background Workflow Runner
# ============================================================================

async def run_workflow_async(mission_id: str, mission: Dict):
    """
    Run the aeroForge workflow asynchronously

    Args:
        mission_id: Unique mission identifier
        mission: Mission data dictionary
    """

    try:
        mission_manager.update_mission(mission_id, status="running", current_agent="supervisor")
        mission_manager.add_log(mission_id, "Building LangGraph workflow...")

        # Build the workflow graph
        graph = build_graph()
        state = mission["state"]

        max_iterations = mission["max_iterations"]

        # Run iterations
        for i in range(max_iterations):
            mission_manager.update_mission(mission_id, iteration=i + 1)

            # Designer Agent
            mission_manager.update_mission(mission_id, current_agent="designer", status="designing")
            mission_manager.add_log(mission_id, f"🔨 Designer Agent: Generating CAD code (Iteration {i + 1})...")

            state = designer_node(state)

            if state.get("errors"):
                for error in state["errors"]:
                    mission_manager.add_error(mission_id, error)
                mission_manager.add_log(mission_id, "Designer encountered errors")

            if state.get("cad_code"):
                mission_manager.add_log(mission_id, f"✓ CAD code generated ({len(state['cad_code'])} chars)")

            # Simulator Agent
            mission_manager.update_mission(mission_id, current_agent="simulator", status="simulating")
            mission_manager.add_log(mission_id, f"🧪 Simulator Agent: Running physics simulation...")

            state = simulator_node(state)

            if state.get("errors"):
                for error in state["errors"]:
                    mission_manager.add_error(mission_id, error)

            if state.get("simulation_metrics"):
                mission_manager.update_mission(mission_id, simulation_metrics=state["simulation_metrics"])
                metrics = state["simulation_metrics"]
                mission_manager.add_log(mission_id,
                    f"✓ Simulation complete - Stability: {metrics.get('stability_score', 0):.2f}, "
                    f"Max Accel: {metrics.get('max_acceleration', 0):.2f} m/s²"
                )

            # Supervisor Agent
            mission_manager.update_mission(mission_id, current_agent="supervisor", status="analyzing")
            mission_manager.add_log(mission_id, "👥 Supervisor Agent: Analyzing results...")

            decision = supervisor_node(state)

            if decision.get("next") == "finish":
                mission_manager.add_log(mission_id, "✓ Design approved - Workflow complete")
                mission_manager.update_mission(mission_id, status="complete")
                mission_manager.complete_mission(mission_id, success=True)
                return
            elif i < max_iterations - 1:
                mission_manager.add_log(mission_id, f"🔄 Iterating for improvement (Iteration {i + 2})...")
                state["designer_feedback"] = state.get("designer_feedback", "Improve design based on metrics")
            else:
                mission_manager.add_log(mission_id, f"⚠ Max iterations reached ({max_iterations})")
                mission_manager.complete_mission(mission_id, success=True)
                return

            # Small delay to prevent overwhelming the API
            await asyncio.sleep(0.5)

    except Exception as e:
        mission_manager.add_error(mission_id, f"Workflow failed: {str(e)}")
        mission_manager.add_log(mission_id, "✗ Workflow crashed")
        mission_manager.complete_mission(mission_id, success=False)


def run_workflow_background(mission_id: str, mission: Dict):
    """Background task wrapper for workflow execution"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(run_workflow_async(mission_id, mission))
    finally:
        loop.close()


# ============================================================================
# FastAPI Application
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager"""
    print("🚀 aeroForge-G3 Server starting...")
    print(f"📁 Output directory: {Path('output').absolute()}")
    yield
    print("🛑 aeroForge-G3 Server shutting down...")


app = FastAPI(
    title="aeroForge-G3 API",
    description="Autonomous Generative Aerospace Engineering Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "aeroForge-G3",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "POST /api/mission": "Submit a new mission",
            "GET /api/status/{mission_id}": "Get mission status",
            "GET /api/results/{mission_id}": "Get mission results",
            "GET /api/files/{file_path:path}": "Download generated files"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/mission", response_model=MissionResponse)
async def submit_mission(request: MissionRequest, background_tasks: BackgroundTasks):
    """
    Submit a new mission for processing

    Args:
        request: Mission request with prompt and settings
        background_tasks: FastAPI background tasks

    Returns:
        Mission response with mission ID
    """

    # Check for OpenRouter API key
    if not os.getenv("OPENROUTER_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file"
        )

    # Generate unique mission ID
    mission_id = str(uuid.uuid4())[:8]

    # Create mission
    mission = mission_manager.create_mission(
        mission_id,
        request.prompt,
        request.max_iterations
    )

    mission_manager.add_log(mission_id, f"Mission created: {request.prompt[:100]}...")
    mission_manager.add_log(mission_id, "Starting workflow...")

    # Start workflow in background
    background_tasks.add_task(run_workflow_background, mission_id, mission)

    return MissionResponse(
        mission_id=mission_id,
        status="queued",
        message=f"Mission submitted with ID: {mission_id}"
    )


@app.get("/api/status/{mission_id}", response_model=StatusResponse)
async def get_status(mission_id: str):
    """
    Get current status of a mission

    Args:
        mission_id: Mission identifier

    Returns:
        Current mission status with logs and metrics
    """

    mission = mission_manager.get_mission(mission_id)

    if not mission:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} not found")

    return StatusResponse(
        mission_id=mission_id,
        status=mission["status"],
        iteration=mission["iteration"],
        current_agent=mission["current_agent"],
        logs=mission["logs"],
        errors=mission["errors"],
        simulation_metrics=mission.get("simulation_metrics", {})
    )


@app.get("/api/results/{mission_id}", response_model=ResultsResponse)
async def get_results(mission_id: str):
    """
    Get generated results for a mission

    Args:
        mission_id: Mission identifier

    Returns:
        Results with file list and metrics
    """

    mission = mission_manager.get_mission(mission_id)

    if not mission:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} not found")

    files = mission_manager.get_generated_files(mission_id)

    return ResultsResponse(
        mission_id=mission_id,
        status=mission["status"],
        files=files,
        metrics=mission.get("simulation_metrics", {})
    )


@app.get("/api/files/{file_path:path}")
async def get_file(file_path: str):
    """
    Download generated files (STL, URDF, etc.)

    Args:
        file_path: Relative path to file

    Returns:
        File response
    """

    # Security check - ensure path is within output directory
    output_dir = Path("output").resolve()
    requested_path = (Path.cwd() / file_path).resolve()

    try:
        requested_path.relative_to(output_dir)
    except ValueError:
        raise HTTPException(status_code=403, detail="Access denied: Path outside output directory")

    if not requested_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        requested_path,
        media_type="application/octet-stream",
        filename=requested_path.name
    )


@app.get("/api/metrics/{mission_id}")
async def get_metrics(mission_id: str):
    """
    Get detailed simulation metrics for a mission

    Args:
        mission_id: Mission identifier

    Returns:
        Detailed metrics including telemetry data
    """

    mission = mission_manager.get_mission(mission_id)

    if not mission:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} not found")

    state = mission.get("state", {})
    simulation_results = state.get("simulation_results", {})

    return {
        "mission_id": mission_id,
        "metrics": mission.get("simulation_metrics", {}),
        "telemetry": {
            "time": simulation_results.get("time", []),
            "positions": simulation_results.get("positions", []),
            "velocities": simulation_results.get("velocities", []),
            "forces": simulation_results.get("forces", []),
            "energies": simulation_results.get("energies", [])
        }
    }


@app.get("/api/code/{mission_id}")
async def get_generated_code(mission_id: str):
    """
    Get generated CAD code for a mission

    Args:
        mission_id: Mission identifier

    Returns:
        Generated Python code
    """

    mission = mission_manager.get_mission(mission_id)

    if not mission:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} not found")

    state = mission.get("state", {})
    cad_code = state.get("cad_code", "")

    return {
        "mission_id": mission_id,
        "code": cad_code,
        "iteration": mission.get("iteration", 0)
    }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 70)
    print("🚀 aeroForge-G3 FastAPI Server")
    print("=" * 70)
    print(f"📍 Server: http://localhost:8000")
    print(f"📚 API Docs: http://localhost:8000/docs")
    print(f"📊 OpenAPI: http://localhost:8000/openapi.json")
    print("=" * 70)
    print()

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
