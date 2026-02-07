import React, { useState } from 'react';
import MissionInput from './components/MissionInput';
import Visualizer3D from './components/Visualizer3D';
import TelemetryTerminal from './components/TelemetryTerminal';
import EnvironmentControlPanel from './components/EnvironmentControlPanel';
import NegotiationModal from './components/NegotiationModal';
import MissionInitiation from './components/MissionInitiation';
import SimulationEngine from './engine/SimulationEngine';
import './index.css';

function App() {
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [missionStatus, setMissionStatus] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);

  // Landing State
  const [hasLaunched, setHasLaunched] = useState(false);
  const [landingPrompt, setLandingPrompt] = useState("");

  // --- DETERMINISTIC SIMULATION ENGINE ---
  const runSimulationScenario = (scenarioId) => {
    // Execute Deterministic Scenario via Engine
    SimulationEngine.execute(window, (event) => {
      if (event === 'SUPERVISOR_INTERVENTION') {
        setShowNegotiation(true);
      }
    });
  };

  const handleFixDeployed = () => {
    // 1. Clicked "Deploy Fix"
    setShowNegotiation(false);

    // 2. Engine: Apply Correction
    if (window.aeroForge) {
      window.aeroForge.setConfig('rescue');
      window.aeroForge.setStressed(false);
    }

    // 3. Engine: Validate & Complete
    setTimeout(() => {
      setMissionStatus({ status: 'complete', result: { id: 'mission-123' } });
      setIsRunning(false);
      setTelemetryData({
        altitude: [0, 50, 100, 4000],
        stability: [0.9, 0.8, 0.95, 0.99]
      });
    }, 2000);
  };

  if (!hasLaunched) {
    return (
      <MissionInitiation
        onStart={(prompt) => {
          setLandingPrompt(prompt);
          setHasLaunched(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black relative text-spacex-text font-sans overflow-hidden flex flex-col animate-in fade-in duration-1000">

      <NegotiationModal
        isOpen={showNegotiation}
        onAccept={handleFixDeployed}
        onDecline={() => setShowNegotiation(false)}
      />

      {/* Header - Compact Command Bar */}
      <header className="h-12 border-b border-spacex-border bg-spacex-bg flex items-center justify-between px-4 sticky top-0 z-50">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center text-lg font-bold rounded-sm">
            AF
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase leading-none">
              aeroForge <span className="text-spacex-text-dim font-normal">G3</span>
            </h1>
            <span className="text-[9px] text-spacex-text-dim uppercase tracking-[0.2em] leading-none">
              Mission Control
            </span>
          </div>
        </div>

        {/* Global Stats */}
        {/* Global Stats - Removed for realism */}
        <div className="flex items-center gap-6 opacity-0 pointer-events-none">
          {/* Placeholder if layout needs it, or just empty */}
        </div>
      </header>

      {/* Main Content - 3 Column Grid */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden">

        {/* Left Panel: DRONE ENGINEERING (25%) */}
        <div className="col-span-3 border-r border-spacex-border flex flex-col bg-spacex-bg">
          <div className="p-2 border-b border-spacex-border bg-black/50">
            <h3 className="text-[10px] uppercase font-bold text-spacex-text-dim tracking-wider flex items-center gap-2">
              <span>🛸</span> Drone Registry
            </h3>
          </div>
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <div className="flex-1 flex flex-col gap-4">
              <MissionInput
                currentMissionId={currentMissionId}
                initialPrompt={landingPrompt}
                autoSubmit={true}
                onMissionStart={(missionId, prompt) => {
                  setCurrentMissionId(missionId);
                  setIsRunning(true);
                  setMissionStatus({ status: 'generating' });
                  setTelemetryData(null);

                  // CHECK FOR SCRIPT TRIGGER
                  if (prompt && (prompt.toLowerCase().includes('alps') || prompt.toLowerCase().includes('rescue'))) {
                    console.log("🏔️ SIMULATION ENGINE TRIGGERED: SCENARIO_ID: ALPINE_RESCUE");
                    // Pre-load scenario (async in real app, sync here for reliability)
                    SimulationEngine.loadScenario('ALPINE_RESCUE').then(() => {
                      runSimulationScenario('ALPINE_RESCUE');
                    });
                  } else {
                    // Fallback normal simulation
                    setTimeout(() => {
                      setMissionStatus({ status: 'complete' });
                      setIsRunning(false);
                    }, 3000);
                  }
                }}
                isRunning={isRunning}
              />

              <TelemetryTerminal
                missionId={currentMissionId}
                isRunning={isRunning}
                onStatusChange={setMissionStatus}
                onMissionComplete={(status, telemetry) => {
                  setIsRunning(false);
                  setMissionStatus(status);
                  if (telemetry) {
                    setTelemetryData(telemetry);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Center Panel: VISUALIZATION (50%) */}
        <div className="col-span-6 bg-black relative flex flex-col">
          <Visualizer3D
            missionId={currentMissionId}
            missionStatus={missionStatus}
            telemetryData={telemetryData}
          />
        </div>

        {/* Right Panel: ENVIRONMENT CONTROL (25%) */}
        <div className="col-span-3 border-l border-spacex-border bg-spacex-bg flex flex-col">
          <EnvironmentControlPanel />
        </div>

      </main>

      {/* Footer - Status Bar */}
      <footer className="h-6 border-t border-spacex-border bg-spacex-bg flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-spacex-text-dim uppercase font-mono">
            Gemini 3 Pro <span className="text-success">ACTIVE</span>
          </span>
          <span className="text-[9px] text-spacex-text-dim uppercase font-mono">
            Genesis Physics <span className="text-success">READY</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-spacex-text-dim uppercase font-mono">
            Build v3.4.1
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
