import React, { useState, useEffect, useRef } from 'react';
import { pollMissionStatus } from '../api';

function TelemetryTerminal({ missionId, isRunning, onStatusChange, onMissionComplete }) {
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (!missionId || !isRunning) return;

    pollMissionStatus(
      missionId,
      (statusResponse) => {
        setStatus(statusResponse);

        // Add new logs
        if (statusResponse.logs.length > logs.length) {
          const newLogs = statusResponse.logs.slice(logs.length);
          setLogs(statusResponse.logs);
        }

        // Check for new errors
        if (statusResponse.errors.length > errors.length) {
          setErrors(statusResponse.errors);
        }

        // Notify parent
        if (onStatusChange) {
          onStatusChange(statusResponse);
        }

        // Check if complete
        if (statusResponse.status === 'complete' || statusResponse.status === 'failed') {
          if (onMissionComplete) {
            onMissionComplete(statusResponse);
          }
        }

        // Auto-scroll
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      },
      1000,
      300
    );
  }, [missionId, isRunning]);

  if (!missionId) {
    return (
      <div className="glass-panel flex-1 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💻</div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Telemetry Terminal</h2>
              <p className="text-xs text-gray-500">Real-time agent communication</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">📡</div>
            <div className="text-sm text-gray-500">Waiting for mission...</div>
          </div>
        </div>
      </div>
    );
  }

  const getAgentIcon = (agent) => {
    const icons = {
      'designer': '🔨',
      'simulator': '🧪',
      'supervisor': '👥',
      'none': '🤖'
    };
    return icons[agent] || '🤖';
  };

  const getAgentColor = (agent) => {
    const colors = {
      'designer': 'text-neon-blue',
      'simulator': 'text-success-green',
      'supervisor': 'text-warning-yellow',
      'none': 'text-gray-400'
    };
    return colors[agent] || 'text-gray-400';
  };

  return (
    <div className="glass-panel flex-1 flex flex-col overflow-hidden">
      {/* Terminal Header */}
      <div className="p-6 border-b border-white/10 bg-spacex-black/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💻</div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Telemetry Terminal</h2>
              <p className="text-xs text-gray-500">Real-time agent communication</p>
            </div>
          </div>

          {status && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getAgentIcon(status.current_agent)}</span>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Active Agent</div>
                  <div className={`text-sm font-bold uppercase ${getAgentColor(status.current_agent)}`}>
                    {status.current_agent}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Iteration</div>
                <div className="text-sm font-bold text-neon-blue">
                  {status.iteration} / {status.max_iterations || 4}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        {status && (
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-1 bg-spacex-gray rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${(status.iteration / (status.max_iterations || 4)) * 100}%`,
                  background: status.status === 'complete'
                    ? 'linear-gradient(90deg, #00ff88, #00f0ff)'
                    : status.status === 'failed'
                    ? 'linear-gradient(90deg, #ff4d4d, #ffaa00)'
                    : 'linear-gradient(90deg, #00f0ff, #7b2cbf)',
                }}
              />
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                status.status === 'complete'
                  ? 'text-success-green'
                  : status.status === 'failed'
                  ? 'text-alert-red'
                  : 'text-warning-yellow'
              }`}
            >
              {status.status}
            </span>
          </div>
        )}
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs"
      >
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-neon-blue font-bold">INITIALIZING...</div>
            </div>
          </div>
        )}

        {logs.map((log, index) => {
          const parts = log.split(' ');
          const timestamp = parts[0] || '';
          const agent = parts[1]?.replace('[', '').replace(']', '') || '';
          const content = parts.slice(2).join(' ') || log;
          const isError = content.includes('✗') || content.includes('ERROR');
          const isSuccess = content.includes('✓') || content.includes('complete');

          return (
            <div key={index} className="terminal-entry mb-2 leading-relaxed">
              <span className="text-gray-600">[{timestamp}]</span>
              {agent && (
                <span className={`ml-2 font-bold ${getAgentColor(agent)}`}>
                  [{agent}]
                </span>
              )}
              <span
                className={`ml-2 ${
                  isError
                    ? 'text-alert-red'
                    : isSuccess
                    ? 'text-success-green'
                    : 'text-gray-300'
                }`}
              >
                {content}
              </span>
            </div>
          );
        })}

        {errors.length > 0 && (
          <div className="mt-6 pt-4 border-t border-alert-red/30">
            <div className="text-xs text-alert-red font-bold uppercase tracking-wider mb-3">
              ⚠ Errors Detected
            </div>
            {errors.map((error, index) => (
              <div key={index} className="terminal-entry mb-2 text-alert-red">
                ✗ {error}
              </div>
            ))}
          </div>
        )}

        {status?.status === 'complete' && (
          <div className="mt-6 pt-4 border-t border-success-green/30 animate-fade-in">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-success-green font-bold text-lg uppercase tracking-wider">
                Mission Complete
              </div>
              <div className="text-xs text-gray-500 mt-2">
                All systems nominal. Check the 3D visualizer for results.
              </div>
            </div>
          </div>
        )}

        {status?.status === 'failed' && (
          <div className="mt-6 pt-4 border-t border-alert-red/30 animate-fade-in">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">❌</div>
              <div className="text-alert-red font-bold text-lg uppercase tracking-wider">
                Mission Failed
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Check the errors above and try again.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="p-4 border-t border-white/10 bg-spacex-black/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-green animate-pulse"></div>
          <span className="text-xs text-gray-500 font-mono">
            {isRunning ? '● LIVE' : '○ STANDBY'}
          </span>
          <span className="text-xs text-gray-600 ml-auto font-mono">
            {logs.length} LOG ENTRIES
          </span>
        </div>
      </div>
    </div>
  );
}

export default TelemetryTerminal;
