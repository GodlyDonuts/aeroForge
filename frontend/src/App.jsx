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
    <div className="min-h-screen bg-spacex-pattern relative text-spacex-text font-sans">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-spacex-bg border-b border-spacex-border">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white text-black flex items-center justify-center text-xl font-bold rounded-sm">
              AF
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white uppercase">
                aeroForge <span className="text-spacex-text-dim text-sm font-normal">G3</span>
              </h1>
              <p className="text-[10px] text-spacex-text-dim uppercase tracking-[0.2em] mt-0.5">
                Hypersonic Design Platform
              </p>
            </div>
          </div>

          {/* Status Section */}
          <div className="flex items-center gap-8">
            {/* System Status */}
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <div className="text-[10px] uppercase tracking-wider font-mono text-spacex-text-dim">
                System: <span className="text-success">ONLINE</span>
              </div>
            </div>

            {/* Mission ID */}
            {currentMissionId && (
              <div className="px-3 py-1 border border-spacex-border rounded-sm">
                <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider inline-block mr-2">Mission</div>
                <div className="text-xs font-bold font-mono text-white inline-block">
                  {currentMissionId}
                </div>
              </div>
            )}

            {/* Mission Status */}
            <div className="px-3 py-1 border border-spacex-border rounded-sm min-w-[120px] text-center">
              <div className={`text-xs font-bold uppercase tracking-wider font-mono ${isRunning ? 'text-warning' :
                missionStatus?.status === 'complete' ? 'text-success' :
                  missionStatus?.status === 'failed' ? 'text-error' :
                    'text-spacex-text-dim'
                }`}>
                {isRunning ? 'RUNNING...' :
                  missionStatus?.status === 'complete' ? 'COMPLETE' :
                    missionStatus?.status === 'failed' ? 'FAILED' :
                      'READY'}
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
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-spacex-bg border-t border-spacex-border">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-6">
            <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider font-mono">
              Build v3.0 // <span className="text-white">PROD</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-spacex-text-dim font-mono">
              API: <span className="text-success">CONNECTED</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
