import React, { useState, useEffect } from 'react';
import MissionControl from './components/MissionControl';
import Terminal from './components/Terminal';
import ThreeDViewer from './components/ThreeDViewer';
import TelemetryCharts from './components/TelemetryCharts';
import './App.css';

function App() {
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [missionStatus, setMissionStatus] = useState(null);
  const [missionResults, setMissionResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">aeroForge-G3</span>
          </div>
          <div className="header-controls">
            <div className="connection-status">
              <span className="status-indicator"></span>
              <span className="status-text">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Left Panel - Mission Control & Terminal */}
        <div className="panel left-panel">
          <MissionControl
            currentMissionId={currentMissionId}
            onMissionStart={(missionId) => {
              setCurrentMissionId(missionId);
              setIsRunning(true);
              setMissionResults(null);
            }}
          />
          <Terminal
            missionId={currentMissionId}
            isRunning={isRunning}
            onStatusChange={setMissionStatus}
            onMissionComplete={() => {
              setIsRunning(false);
              // Fetch results
              if (currentMissionId) {
                // Results will be fetched in the mission control component
              }
            }}
          />
        </div>

        {/* Right Panel - 3D Viewer & Telemetry */}
        <div className="panel right-panel">
          <ThreeDViewer missionId={currentMissionId} missionStatus={missionStatus} />
          <TelemetryCharts missionId={currentMissionId} missionStatus={missionStatus} />
        </div>
      </div>
    </div>
  );
}

export default App;
