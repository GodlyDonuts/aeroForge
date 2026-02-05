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
    <div className="min-h-screen bg-spacex-pattern relative">
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%]">
          <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[150px] animate-pulse" />
        </div>
        <div className="absolute bottom-[-50%] right-[-50%] w-[200%] h-[200%]">
          <div className="absolute bottom-[25%] right-[25%] w-[50%] h-[50%] bg-purple/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-0 border-b border-white/5 rounded-none">
        <div className="flex items-center justify-between px-8 py-5">
          {/* Logo Section */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-blue to-purple flex items-center justify-center text-2xl box-glow animate-float">
                🚀
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-blue to-purple blur-xl opacity-30" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-neon-blue via-cyan-light to-purple bg-clip-text text-transparent animate-text-shimmer">
                  aeroForge-G3
                </span>
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-medium mt-0.5">
                Autonomous Aerospace Design
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex items-center gap-8">
            {/* System Status */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-success-green animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-success-green blur-md animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">System</div>
                <div className="text-xs font-semibold text-success-green tracking-wide">ONLINE</div>
              </div>
            </div>

            {/* Mission ID */}
            {currentMissionId && (
              <div className="glass-panel px-5 py-2.5 border-neon-blue/20 animate-slide-down">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Mission</div>
                <div className="text-sm font-bold font-mono text-neon-blue tracking-wider">
                  {currentMissionId}
                </div>
              </div>
            )}

            {/* Mission Status */}
            <div className="glass-panel px-5 py-2.5 border-white/5 min-w-[140px]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Status</div>
              <div className={`text-sm font-bold uppercase tracking-wider ${
                isRunning ? 'text-warning-yellow animate-pulse' :
                missionStatus?.status === 'complete' ? 'text-success-green text-glow-green' :
                missionStatus?.status === 'failed' ? 'text-alert-red text-glow-red' :
                'text-gray-400'
              }`}>
                {isRunning ? '● RUNNING' :
                 missionStatus?.status === 'complete' ? '✓ COMPLETE' :
                 missionStatus?.status === 'failed' ? '✗ FAILED' :
                 '○ STANDBY'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-8 px-8 min-h-screen">
        <div className="grid grid-cols-12 gap-6 h-full max-w-[1800px] mx-auto">
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

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 glass-panel border-0 border-t border-white/5 rounded-none">
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-6">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">
              Build <span className="text-neon-blue font-mono">v3.0.0</span>
            </div>
            <div className="text-[10px] text-gray-600 uppercase tracking-wider">
              LangGraph <span className="text-purple font-mono">Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-gray-600">
              <span className="text-neon-blue font-mono">●</span> API Connected
            </div>
            <div className="text-[10px] text-gray-600">
              <span className="text-success-green font-mono">●</span> WebSocket Ready
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
