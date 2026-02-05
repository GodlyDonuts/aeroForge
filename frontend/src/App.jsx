import React, { useState } from 'react';
import MissionInput from './components/MissionInput';
import Visualizer3D from './components/Visualizer3D';
import TelemetryTerminal from './components/TelemetryTerminal';
import './index.css';

function App() {
  const [currentMissionId, setCurrentMissionId] = useState(null);
  const [missionStatus, setMissionStatus] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="min-h-screen bg-spacex-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-cyan-400 bg-clip-text text-transparent">
                aeroForge-G3
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Mission Control</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success-green animate-pulse-glow"></div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Systems Online</span>
            </div>

            {currentMissionId && (
              <div className="glass-panel px-4 py-2 border border-neon-blue/30">
                <span className="text-xs text-neon-blue font-mono">MISSION: {currentMissionId}</span>
              </div>
            )}

            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Status</div>
              <div className={`text-sm font-bold uppercase ${
                isRunning ? 'text-warning-yellow' :
                missionStatus?.status === 'complete' ? 'text-success-green' :
                missionStatus?.status === 'failed' ? 'text-alert-red' :
                'text-gray-400'
              }`}>
                {isRunning ? 'RUNNING' :
                 missionStatus?.status === 'complete' ? 'COMPLETE' :
                 missionStatus?.status === 'failed' ? 'FAILED' :
                 'STANDBY'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-8 min-h-screen">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Panel - Mission Input & Terminal */}
          <div className="col-span-4 flex flex-col gap-6">
            <MissionInput
              currentMissionId={currentMissionId}
              onMissionStart={(missionId) => {
                setCurrentMissionId(missionId);
                setIsRunning(true);
                setMissionStatus(null);
                setTelemetryData(null);
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

          {/* Right Panel - 3D Visualizer */}
          <div className="col-span-8">
            <Visualizer3D
              missionId={currentMissionId}
              missionStatus={missionStatus}
              telemetryData={telemetryData}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
