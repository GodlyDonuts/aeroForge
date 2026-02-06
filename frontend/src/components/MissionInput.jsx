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

      onMissionStart(response.mission_id, missionPrompt);
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
      icon: 'M',
    },
    {
      name: 'High-Speed Racing',
      prompt: 'Design a high-speed racing drone capable of reaching 150 km/h. Focus on aerodynamic efficiency and minimal drag. Use slim arms and streamlined fuselage.',
      icon: 'R',
    },
    {
      name: 'Heavy Lift Cargo',
      prompt: 'Design an octocopter heavy-lift drone capable of carrying 20kg payload. Prioritize stability and structural integrity. Use thick reinforced arms.',
      icon: 'H',
    },
    {
      name: 'Stealth Surveillance',
      prompt: 'Design a stealth surveillance drone with long endurance (4+ hours) and low acoustic signature. Focus on aerodynamic efficiency and quiet operation.',
      icon: 'S',
    }
  ];

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="p-4 border-b border-spacex-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white font-mono">
              M
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Mission Parameters</h2>
            </div>
          </div>

          {currentMissionId && (
            <div className="px-3 py-1 border border-success/30 bg-success/5 rounded-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-[10px] font-bold text-success tracking-wider uppercase">
                ACTIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mission Description */}
          <div className="space-y-2">
            <label className="block text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold">
              Mission Description
            </label>
            <textarea
              className="glass-input w-full min-h-[100px] resize-none font-mono text-xs leading-relaxed"
              placeholder="Describe the aerospace design requirements..."
              value={missionPrompt}
              onChange={(e) => setMissionPrompt(e.target.value)}
              disabled={isSubmitting || isRunning}
            />
            <div className="flex justify-between text-[10px] text-spacex-text-dim font-mono">
              <span>{missionPrompt.length} chars</span>
              <span className={missionPrompt.length > 2000 ? 'text-error' : ''}>
                {missionPrompt.length > 2000 && '! Limit exceeded'}
              </span>
            </div>
          </div>

          {/* Iterations Slider - simplified */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold">
                Design Iterations
              </label>
              <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
                <span className="text-xs font-bold font-mono text-white">{maxIterations}</span>
              </div>
            </div>

            <input
              type="range"
              min="2"
              max="6"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              disabled={isSubmitting || isRunning}
              className="w-full h-1 bg-spacex-border rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-none"
            />

            <div className="flex justify-between text-[10px] text-spacex-text-dim uppercase tracking-wider font-mono">
              <span>Quick</span>
              <span>Standard</span>
              <span>Thorough</span>
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="submit"
            className={`w-full font-bold py-3 uppercase tracking-widest text-xs transition-all duration-200 border border-white hover:bg-white hover:text-black ${isSubmitting || !missionPrompt.trim() || isRunning
              ? 'opacity-50 cursor-not-allowed border-spacex-border hover:bg-transparent hover:text-inherit'
              : 'bg-transparent text-white'
              }`}
            disabled={isSubmitting || !missionPrompt.trim() || isRunning}
          >
            {isSubmitting ? 'Initializing System...' : isRunning ? 'Mission in Progress' : 'Launch Mission'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-spacex-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-spacex-black text-[10px] text-spacex-text-dim uppercase tracking-wider">
              Presets
            </span>
          </div>
        </div>

        {/* Presets - Minimalist */}
        <div className="grid grid-cols-1 gap-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => setMissionPrompt(preset.prompt)}
              disabled={isSubmitting || isRunning}
              className={`group w-full p-3 text-left border border-spacex-border hover:border-white transition-colors duration-200 bg-spacex-bg flex items-center gap-3 ${isSubmitting || isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
              <div className="w-6 h-6 flex items-center justify-center text-xs font-bold text-spacex-text-dim border border-spacex-border group-hover:text-black group-hover:bg-white group-hover:border-white transition-colors">
                {preset.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-spacex-text group-hover:text-white mb-0.5">
                  {preset.name}
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
