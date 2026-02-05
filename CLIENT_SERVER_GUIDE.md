# Client-Server Architecture Setup Guide

## Quick Start

### Option A: Development Mode (Recommended)

**Step 1: Backend Setup**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server (Backend)
python server.py
```

The server will run at http://localhost:8000

**Step 2: Frontend Setup** (New Terminal)
```bash
cd frontend

# Install Node.js dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will run at http://localhost:5173

---

### Option B: Production Mode

**Backend:**
```bash
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist folder with nginx or any static file server
```

---

## Architecture Overview

```
┌─────────────────┐         API          ┌─────────────────┐
│   React + Vite  │◄────────────────────►│   FastAPI       │
│   Frontend      │   HTTP/REST          │   Backend       │
│   (Port 5173)   │                     │   (Port 8000)   │
└─────────────────┘                     └─────────────────┘
       │                                         │
       │ UI Thread                               │ Physics Thread
       │ (Fast, Non-blocking)                    │ (Can Block)
       └─────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │   Core Modules  │
                    │   (preserved)   │
                    │  - core/         │
                    │  - agents/       │
                    └─────────────────┘
```

---

## API Endpoints

### Mission Management

**Submit Mission**
```http
POST /api/mission
Content-Type: application/json

{
  "prompt": "Design a Mars drone...",
  "max_iterations": 4
}

Response:
{
  "mission_id": "abc12345",
  "status": "queued",
  "message": "Mission submitted with ID: abc12345"
}
```

**Get Mission Status**
```http
GET /api/status/{mission_id}

Response:
{
  "mission_id": "abc12345",
  "status": "running",
  "iteration": 2,
  "current_agent": "designer",
  "logs": ["[12:34:56] Mission created..."],
  "errors": [],
  "simulation_metrics": {...}
}
```

**Get Mission Results**
```http
GET /api/results/{mission_id}

Response:
{
  "mission_id": "abc12345",
  "status": "complete",
  "files": ["output/meshes/design_00.stl", "output/urdf/design.urdf"],
  "metrics": {
    "stability_score": 0.85,
    "max_acceleration": 2.5
  }
}
```

**Get Simulation Metrics**
```http
GET /api/metrics/{mission_id}

Response:
{
  "mission_id": "abc12345",
  "metrics": {...},
  "telemetry": {
    "time": [0, 0.01, 0.02, ...],
    "positions": [[0,0,1], [0.1,0,1.05], ...],
    "velocities": [[0,0,0], [10,0,5], ...],
    "forces": [[0,0,9.8], [0,0,19.8], ...],
    "energies": [9.8, 12.3, ...]
  }
}
```

**Get Generated Code**
```http
GET /api/code/{mission_id}

Response:
{
  "mission_id": "abc12345",
  "code": "from build123d import *\n...",
  "iteration": 4
}
```

**Download Files**
```http
GET /api/files/{file_path}

Example: /api/files/output/meshes/design_00.stl
```

---

## Frontend Components

### MissionControl
- Submit new missions
- Configure iteration limits
- Quick preset missions

### Terminal
- Real-time agent log streaming
- Status indicators
- Error display

### ThreeDViewer
- 3D STL visualization using React Three Fiber
- Orbit controls for camera manipulation
- Sci-fi grid overlay

### TelemetryCharts
- Position over time (X, Y, Z)
- Velocity over time (Vx, Vy, Vz)
- Energy over time

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check CORS settings in server.py
- Verify Vite proxy configuration in vite.config.js

### Missions not completing
- Check OPENROUTER_API_KEY is set in .env
- Verify API key has sufficient credits
- Check terminal logs for errors

### 3D Viewer not loading
- Ensure STL files exist in output/meshes/
- Check file permissions
- Verify React Three Fiber installation

---

## Development Tips

### Hot Reload
- Backend: Auto-reloads on file changes (FastAPI dev mode)
- Frontend: Auto-reloads on file changes (Vite dev mode)

### Debugging
```bash
# Backend: Set log level
python server.py  # Uses uvicorn reload, logs appear in terminal

# Frontend: Open browser dev tools
# React DevTools extension recommended
```

### Testing API Directly
```bash
# Submit a mission
curl -X POST http://localhost:8000/api/mission \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test mission","max_iterations":2}'

# Check status (replace with actual mission_id)
curl http://localhost:8000/api/status/abc12345

# View API docs
open http://localhost:8000/docs
```

---

## Migration from Streamlit

The Streamlit UI (`app.py`) is still available and functional:

```bash
streamlit run app.py
```

Both UIs can run simultaneously on different ports:
- Streamlit: http://localhost:8501
- React Frontend: http://localhost:5173
- FastAPI Backend: http://localhost:8000

---

## Performance Notes

### Backend
- Each mission runs in a background task
- Multiple missions can run concurrently
- Mission history stored in memory

### Frontend
- Polls status endpoint every 1 second
- Charts render only when data changes
- 3D viewer uses WebGL for hardware acceleration

---

## Next Steps

1. **Add WebSocket Support**: Replace polling with real-time WebSocket updates
2. **Add Database**: Store mission history in PostgreSQL or MongoDB
3. **Add Authentication**: User accounts and mission ownership
4. **Add File Upload**: Upload existing CAD/STL files for analysis
5. **Add Export Options**: Download CAD code, STL, URDF, BOM
