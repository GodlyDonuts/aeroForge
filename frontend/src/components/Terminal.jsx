import React, { useState, useEffect, useRef } from 'react';
import { pollMissionStatus } from '../api';

function Terminal({ missionId, isRunning, onStatusChange, onMissionComplete }) {
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (!missionId || !isRunning) {
      return;
    }

    // Start polling
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

        // Notify parent of status change
        if (onStatusChange) {
          onStatusChange(statusResponse);
        }

        // Check if complete
        if (statusResponse.status === 'complete' || statusResponse.status === 'failed') {
          if (onMissionComplete) {
            onMissionComplete();
          }
        }

        // Auto-scroll to bottom
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      },
      1000, // Poll every 1 second
      300 // Max 5 minutes
    );
  }, [missionId, isRunning]);

  if (!missionId) {
    return (
      <div className="panel-card" style={{ flex: 1 }}>
        <div className="panel-header">
          <span className="panel-title">
            <span className="panel-title-icon">💻</span>
            Agent Terminal
          </span>
        </div>
        <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📡</div>
              <div>Waiting for mission...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'designer':
        return '🔨';
      case 'simulator':
        return '🧪';
      case 'supervisor':
        return '👥';
      default:
        return '🤖';
    }
  };

  return (
    <div className="panel-card" style={{ flex: 1 }}>
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">💻</span>
          Agent Terminal
        </span>
        {status && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Agent: {getAgentIcon(status.current_agent)} {status.current_agent.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: status.status === 'complete' ? 'var(--accent-success)' :
                       status.status === 'failed' ? 'var(--accent-error)' :
                       'var(--accent-warning)'
              }}
            >
              {status.status.toUpperCase()}
            </span>
            {status.iteration > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Iteration: {status.iteration}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="terminal" ref={terminalRef}>
          {logs.length === 0 ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            logs.map((log, index) => {
              // Parse log entry
              const parts = log.split(' ');
              const timestamp = parts[0] || '';
              const agent = parts[1]?.replace('[', '').replace(']', '') || '';
              const content = parts.slice(2).join(' ') || log;

              return (
                <div key={index} className="terminal-entry">
                  <span className="entry-time">{timestamp}</span>
                  {agent && <span className="entry-agent">{agent}</span>}
                  <span className={`entry-content ${content.startsWith('✗') || content.includes('ERROR') ? 'entry-error' : ''}`}>
                    {content}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Terminal;
