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
      'designer': 'D',
      'simulator': 'S',
      'supervisor': 'V',
      'none': 'A'
    };
    return icons[agent] || 'A';
  };

  const getAgentColor = (agent) => {
    const colors = {
      'designer': 'text-info',
      'simulator': 'text-success',
      'supervisor': 'text-warning',
      'none': 'text-spacex-text-dim'
    };
    return colors[agent] || 'text-spacex-text-dim';
  };

  if (!missionId) {
    return (
      <div className="glass-panel flex-1 flex flex-col min-h-[400px]">
        {/* Header */}
        <div className="p-4 border-b border-spacex-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm box-border">
                💻
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Telemetry Terminal</h2>
              </div>
            </div>

            <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
              <span className="text-[10px] font-bold text-spacex-text-dim uppercase tracking-wider">STANDBY</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl text-spacex-text-dim font-bold mb-2">+</div>
            <p className="text-xs text-spacex-text-dim uppercase tracking-wider">Awaiting Mission Launch</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[400px]">
      {/* Terminal Header */}
      <div className="p-4 border-b border-spacex-border bg-spacex-bg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white">
              T
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Telemetry Terminal</h2>
            </div>
          </div>

          {status && (
            <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${status.status === 'complete' ? 'text-success' :
                  status.status === 'failed' ? 'text-error' :
                    'text-warning'
                }`}>
                {status.status === 'complete' ? 'COMPLETE' :
                  status.status === 'failed' ? 'FAILED' :
                    'RUNNING'}
              </span>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          {/* Agent Info */}
          {status && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-sm border border-spacex-border flex items-center justify-center text-xs bg-spacex-surface">
                  {getAgentIcon(status.current_agent)}
                </div>
                <div>
                  <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider">Agent</div>
                  <div className={`text-xs font-bold uppercase ${getAgentColor(status.current_agent)}`}>
                    {status.current_agent}
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-spacex-border" />

              <div className="text-right">
                <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider">Iter</div>
                <div className="text-xs font-bold text-white">
                  {status.iteration} / {status.max_iterations || 4}
                </div>
              </div>
            </div>
          )}

          {/* Log Count */}
          <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
            <span className="text-[10px] text-spacex-text-dim uppercase tracking-wider mr-2">LOGS</span>
            <span className="text-xs font-bold text-white font-mono">{logs.length}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {status && (
          <div className="mt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-spacex-surface rounded-none overflow-hidden border border-spacex-border">
                <div
                  className={`h-full transition-all duration-300 ${status.status === 'complete' ? 'bg-success' :
                      status.status === 'failed' ? 'bg-error' :
                        'bg-white'
                    }`}
                  style={{
                    width: `${(status.iteration / (status.max_iterations || 4)) * 100}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider min-w-[30px] text-right text-spacex-text-dim">
                {Math.round((status.iteration / (status.max_iterations || 4)) * 100)}%
              </span>
            </div>
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
            <div className="text-center text-spacex-text-dim animate-pulse">
              INITIALIZING UPLINK...
            </div>
          </div>
        )}

        {logs.map((log, index) => {
          const parts = log.split(' ');
          const timestamp = parts[0] || '';
          const agent = parts[1]?.replace('[', '').replace(']', '') || '';
          const content = parts.slice(2).join(' ') || log;
          const cleanContent = content.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

          const isError = content.toLowerCase().includes('error') || content.includes('failed');
          const isSuccess = content.toLowerCase().includes('complete') || content.includes('success');

          return (
            <div key={index} className="mb-1 leading-relaxed border-b border-white/5 py-1">
              <span className="text-spacex-text-dim mr-2">[{timestamp}]</span>
              {agent && (
                <span className={`mr-2 font-bold uppercase ${getAgentColor(agent)}`}>
                  {agent}
                </span>
              )}
              <span className={isError ? 'text-error' : isSuccess ? 'text-success' : 'text-spacex-text'}>
                {cleanContent}
              </span>
            </div>
          );
        })}

        {errors.length > 0 && (
          <div className="mt-4 pt-2 border-t border-error">
            <div className="text-[10px] text-error font-bold uppercase tracking-wider mb-2">Errors Detected</div>
            {errors.map((error, index) => (
              <div key={index} className="text-error mb-1">> {error}</div>
            ))}
          </div>
        )}

        {status?.status === 'complete' && (
          <div className="mt-4 pt-2 border-t border-success">
            <div className="text-success font-bold uppercase tracking-wider text-sm">
              >> MISSION SEQUENCE COMPLETE
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="p-2 border-t border-spacex-border bg-spacex-bg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-success' : 'bg-spacex-text-dim'}`}></div>
          <span className="text-[10px] text-spacex-text-dim uppercase tracking-wider">
            {isRunning ? 'Uplink Active' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TelemetryTerminal;
