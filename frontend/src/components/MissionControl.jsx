import React, { useState } from 'react';
import { submitMission, pollMissionStatus } from '../api';

function MissionControl({ currentMissionId, onMissionStart }) {
  const [missionPrompt, setMissionPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!missionPrompt.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitMission({
        prompt: missionPrompt,
        max_iterations: maxIterations,
      });

      onMissionStart(response.mission_id);
    } catch (error) {
      console.error('Failed to submit mission:', error);
      alert('Failed to submit mission: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <span className="panel-title">
          <span className="panel-title-icon">📋</span>
          Mission Control
        </span>
        {currentMissionId && (
          <span className="status-text" style={{ color: 'var(--accent-success)', fontSize: '11px' }}>
            ACTIVE: {currentMissionId}
          </span>
        )}
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mission Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Design a quadcopter drone for Mars atmosphere with 2kg payload capacity..."
              value={missionPrompt}
              onChange={(e) => setMissionPrompt(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Iterations</label>
            <select
              className="form-select"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              disabled={isSubmitting}
            >
              <option value={2}>2 (Quick)</option>
              <option value={4}>4 (Standard)</option>
              <option value={6}>6 (Thorough)</option>
              <option value={10}>10 (Exhaustive)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !missionPrompt.trim()}
            style={{ width: '100%' }}
          >
            {isSubmitting ? '⏳ Initializing...' : '🚀 Launch Mission'}
          </button>
        </form>

        {/* Mission Presets */}
        <div style={{ marginTop: '20px' }}>
          <label className="form-label">Quick Presets</label>
          <div style={{ display: 'grid', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMissionPrompt('Design a quadcopter drone for Mars atmosphere with 2kg payload capacity. Must be stable in high winds and operate for at least 30 minutes.')}
              style={{ fontSize: '12px', padding: '8px' }}
            >
              Mars Drone
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMissionPrompt('Design a high-speed racing drone capable of reaching 150 km/h. Focus on aerodynamic efficiency and minimal drag.')}
              style={{ fontSize: '12px', padding: '8px' }}
            >
              Racing Drone
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMissionPrompt('Design an octocopter heavy-lift drone capable of carrying 20kg payload. Prioritize stability and structural integrity.')}
              style={{ fontSize: '12px', padding: '8px' }}
            >
              Heavy Lift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionControl;
