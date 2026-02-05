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

  const getAgentGradient = (agent) => {
    const gradients = {
      'designer': 'from-neon-blue to-cyan',
      'simulator': 'from-success-green to-cyan',
      'supervisor': 'from-warning-yellow to-orange',
      'none': 'from-gray-400 to-gray-500'
    };
    return gradients[agent] || gradients['none'];
  };

  if (!missionId) {
    return (
      <div className="glass-panel flex-1 flex flex-col min-h-[400px]">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-purple/20 border border-neon-blue/30 flex items-center justify-center text-2xl box-glow">
                💻
              </div>
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider">Telemetry Terminal</h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Real-time Agent Communication</p>
              </div>
            </div>

            <div className="glass-panel px-4 py-2 border-white/5">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Status</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">STANDBY</div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-spacex-gray to-spacex-dark border border-white/5 flex items-center justify-center">
              <div className="text-5xl animate-float">📡</div>
            </div>
            <h3 className="text-base font-bold text-white mb-2 tracking-wider">AWAITING MISSION</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Launch a mission to view real-time telemetry and agent logs
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[400px]">
      {/* Terminal Header */}
      <div className="p-6 border-b border-white/5 bg-spacex-black/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-purple/20 border border-neon-blue/30 flex items-center justify-center text-2xl box-glow">
              💻
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Telemetry Terminal</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Real-time Agent Communication</p>
            </div>
          </div>

          {status && (
            <div className="glass-panel px-4 py-2 border-white/5">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Status</div>
              <div className={`text-xs font-bold uppercase tracking-wider ${
                status.status === 'complete' ? 'text-success-green text-glow-green' :
                status.status === 'failed' ? 'text-alert-red text-glow-red' :
                'text-warning-yellow animate-pulse'
              }`}>
                {status.status === 'complete' ? '✓ COMPLETE' :
                 status.status === 'failed' ? '✗ FAILED' :
                 '● RUNNING'}
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          {/* Agent Info */}
          {status && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAgentGradient(status.current_agent)}/20 border ${getAgentGradient(status.current_agent)}/30 flex items-center justify-center text-xl`}>
                  {getAgentIcon(status.current_agent)}
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Active Agent</div>
                  <div className={`text-sm font-bold uppercase ${getAgentColor(status.current_agent)}`}>
                    {status.current_agent}
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="text-right">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Iteration</div>
                <div className="text-sm font-bold text-neon-blue">
                  {status.iteration} / {status.max_iterations || 4}
                </div>
              </div>
            </div>
          )}

          {/* Log Count */}
          <div className="glass-panel px-4 py-2 border-white/5">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Log Entries</div>
            <div className="text-sm font-bold text-white font-mono">{logs.length}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {status && (
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-spacex-gray rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 relative"
                  style={{
                    width: `${(status.iteration / (status.max_iterations || 4)) * 100}%`,
                  }}
                >
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${
                    status.status === 'complete'
                      ? 'from-success-green to-cyan'
                      : status.status === 'failed'
                      ? 'from-alert-red to-orange'
                      : 'from-neon-blue to-purple'
                  }`} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider min-w-[60px] text-right ${
                  status.status === 'complete'
                    ? 'text-success-green'
                    : status.status === 'failed'
                    ? 'text-alert-red'
                    : 'text-warning-yellow'
                }`}
              >
                {Math.round((status.iteration / (status.max_iterations || 4)) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto bg-spacex-black/50 p-4 font-mono text-xs"
      >
        {logs.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-neon-blue/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-neon-blue rounded-full animate-spin" />
                <div className="absolute inset-3 border-2 border-transparent border-t-purple rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-neon-blue font-bold text-sm tracking-wider animate-pulse">
                INITIALIZING...
              </div>
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
          const isInfo = content.includes('🔨') || content.includes('🧪') || content.includes('👥');

          return (
            <div key={index} className="terminal-entry mb-2 leading-relaxed px-2 py-1 rounded hover:bg-white/5 transition-colors">
              <span className="text-gray-600 font-mono">[{timestamp}]</span>
              {agent && (
                <span className={`ml-2 font-bold uppercase tracking-wider ${getAgentColor(agent)}`}>
                  [{agent}]
                </span>
              )}
              <span
                className={`ml-2 ${
                  isError
                    ? 'text-alert-red font-medium'
                    : isSuccess
                    ? 'text-success-green font-medium'
                    : isInfo
                    ? 'text-neon-blue'
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
            <div className="text-[10px] text-alert-red font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-alert-red animate-pulse" />
              Errors Detected
            </div>
            {errors.map((error, index) => (
              <div key={index} className="terminal-entry mb-2 px-3 py-2 rounded-lg bg-alert-red/5 border border-alert-red/20 text-alert-red font-medium">
                <span className="mr-2">✗</span>
                {error}
              </div>
            ))}
          </div>
        )}

        {status?.status === 'complete' && (
          <div className="mt-6 pt-4 border-t border-success-green/30 animate-fade-in">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success-green/10 border border-success-green/30 flex items-center justify-center">
                <div className="text-3xl">🎉</div>
              </div>
              <div className="text-success-green font-bold text-lg uppercase tracking-wider text-glow-green mb-2">
                Mission Complete
              </div>
              <div className="text-xs text-gray-500">
                All systems nominal. Check the 3D visualizer for results.
              </div>
            </div>
          </div>
        )}

        {status?.status === 'failed' && (
          <div className="mt-6 pt-4 border-t border-alert-red/30 animate-fade-in">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-alert-red/10 border border-alert-red/30 flex items-center justify-center">
                <div className="text-3xl">❌</div>
              </div>
              <div className="text-alert-red font-bold text-lg uppercase tracking-wider text-glow-red mb-2">
                Mission Failed
              </div>
              <div className="text-xs text-gray-500">
                Check the errors above and try again.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="p-4 border-t border-white/5 bg-spacex-black/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative w-2 h-2 rounded-full ${isRunning ? 'bg-success-green animate-pulse' : 'bg-gray-500'}`}>
              {isRunning && <div className="absolute inset-0 rounded-full bg-success-green blur-md animate-pulse" />}
            </div>
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
              {isRunning ? '● Live Connection' : '○ Standby'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-gray-600 font-mono uppercase tracking-wider">
            <span>{logs.length} Logs</span>
            <div className="w-px h-3 bg-white/10" />
            <span>{errors.length} Errors</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelemetryTerminal;
