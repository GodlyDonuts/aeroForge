import React, { useState } from 'react';
import { submitMission } from '../api';

function MissionInput({ currentMissionId, onMissionStart, isRunning }) {
  const [missionPrompt, setMissionPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!missionPrompt.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await submitMission({
        prompt: missionPrompt,
        max_iterations: maxIterations,
      });

      onMissionStart(response.mission_id);
    } catch (error) {
      console.error('Failed to submit mission:', error);
      alert('Mission launch failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presets = [
    {
      name: 'Mars Explorer',
      prompt: 'Design a quadcopter drone for Mars atmosphere with 2kg payload capacity. Must be stable in high winds and operate for at least 30 minutes. Use carbon fiber for lightweight construction.',
      icon: '🔴'
    },
    {
      name: 'High-Speed Racing',
      prompt: 'Design a high-speed racing drone capable of reaching 150 km/h. Focus on aerodynamic efficiency and minimal drag. Use slim arms and streamlined fuselage.',
      icon: '⚡'
    },
    {
      name: 'Heavy Lift Cargo',
      prompt: 'Design an octocopter heavy-lift drone capable of carrying 20kg payload. Prioritize stability and structural integrity. Use thick reinforced arms.',
      icon: '📦'
    },
    {
      name: 'Stealth Surveillance',
      prompt: 'Design a stealth surveillance drone with long endurance (4+ hours) and low acoustic signature. Focus on aerodynamic efficiency and quiet operation.',
      icon: '🎯'
    }
  ];

  return (
    <div className="glass-panel">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">📋</div>
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Mission Parameters</h2>
            <p className="text-xs text-gray-500">Configure mission requirements</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-neon-blue uppercase tracking-wider mb-2 font-bold">
              Mission Description
            </label>
            <textarea
              className="glass-input w-full min-h-[120px] resize-none font-mono text-sm"
              placeholder="Describe the aerospace design requirements..."
              value={missionPrompt}
              onChange={(e) => setMissionPrompt(e.target.value)}
              disabled={isSubmitting || isRunning}
            />
          </div>

          <div>
            <label className="block text-xs text-neon-blue uppercase tracking-wider mb-2 font-bold">
              Design Iterations: {maxIterations}
            </label>
            <input
              type="range"
              min="2"
              max="6"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              disabled={isSubmitting || isRunning}
              className="w-full h-2 bg-spacex-gray rounded-lg appearance-none cursor-pointer accent-neon-blue"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Quick (2)</span>
              <span>Standard (4)</span>
              <span>Thorough (6)</span>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full font-bold py-4 rounded-lg uppercase tracking-widest transition-all duration-300 ${
              isSubmitting || !missionPrompt.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'neon-button'
            }`}
            disabled={isSubmitting || !missionPrompt.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Initializing...
              </span>
            ) : isRunning ? (
              'Mission in Progress'
            ) : (
              <span className="flex items-center justify-center gap-2">
                🚀 Launch Mission
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Quick Presets */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-xl">⚡</div>
          <h3 className="text-sm font-bold text-neon-blue uppercase tracking-wider">Quick Presets</h3>
        </div>

        <div className="space-y-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => setMissionPrompt(preset.prompt)}
              disabled={isSubmitting || isRunning}
              className="w-full glass-panel px-4 py-3 text-left hover:border-neon-blue/50 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl group-hover:scale-110 transition-transform">{preset.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{preset.name}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">{preset.prompt.substring(0, 50)}...</div>
                </div>
                <div className="text-xs text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  Load →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MissionInput;
