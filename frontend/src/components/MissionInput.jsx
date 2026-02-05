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
      icon: '🔴',
      gradient: 'from-red-500/20 to-orange-500/20',
      border: 'border-red-500/30'
    },
    {
      name: 'High-Speed Racing',
      prompt: 'Design a high-speed racing drone capable of reaching 150 km/h. Focus on aerodynamic efficiency and minimal drag. Use slim arms and streamlined fuselage.',
      icon: '⚡',
      gradient: 'from-yellow-500/20 to-amber-500/20',
      border: 'border-yellow-500/30'
    },
    {
      name: 'Heavy Lift Cargo',
      prompt: 'Design an octocopter heavy-lift drone capable of carrying 20kg payload. Prioritize stability and structural integrity. Use thick reinforced arms.',
      icon: '📦',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30'
    },
    {
      name: 'Stealth Surveillance',
      prompt: 'Design a stealth surveillance drone with long endurance (4+ hours) and low acoustic signature. Focus on aerodynamic efficiency and quiet operation.',
      icon: '🎯',
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30'
    }
  ];

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue/20 to-purple/20 border border-neon-blue/30 flex items-center justify-center text-2xl box-glow">
              📋
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Mission Parameters</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Configure Design Requirements</p>
            </div>
          </div>

          {currentMissionId && (
            <div className="glass-panel px-4 py-2 border-success-green/20 flex items-center gap-2 animate-slide-down">
              <div className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
              <span className="text-[10px] font-bold text-success-green tracking-wider uppercase">
                ACTIVE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mission Description */}
          <div className="space-y-2">
            <label className="block text-xs text-neon-blue uppercase tracking-[0.15em] font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
              Mission Description
            </label>
            <textarea
              className="glass-input w-full min-h-[140px] resize-none font-mono text-sm leading-relaxed"
              placeholder="Describe the aerospace design requirements..."
              value={missionPrompt}
              onChange={(e) => setMissionPrompt(e.target.value)}
              disabled={isSubmitting || isRunning}
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>{missionPrompt.length} / 2000 characters</span>
              <span className={missionPrompt.length > 2000 ? 'text-alert-red' : ''}>
                {missionPrompt.length > 2000 && '⚠️ Limit exceeded'}
              </span>
            </div>
          </div>

          {/* Iterations Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs text-neon-blue uppercase tracking-[0.15em] font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple animate-pulse" />
                Design Iterations
              </label>
              <div className="glass-panel px-4 py-1.5 border-purple/30">
                <span className="text-lg font-bold text-purple">{maxIterations}</span>
              </div>
            </div>

            <input
              type="range"
              min="2"
              max="6"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              disabled={isSubmitting || isRunning}
              className="range-slider"
            />

            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider">
              <span>Quick (2)</span>
              <span className="text-neon-blue">Standard (4)</span>
              <span>Thorough (6)</span>
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="submit"
            className={`relative w-full overflow-hidden rounded-xl font-bold py-4 uppercase tracking-widest transition-all duration-300 ${
              isSubmitting || !missionPrompt.trim() || isRunning
                ? 'bg-spacex-gray text-gray-600 cursor-not-allowed'
                : 'neon-button'
            }`}
            disabled={isSubmitting || !missionPrompt.trim() || isRunning}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 border-2 border-black/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-transparent border-t-black rounded-full animate-spin" />
                </div>
                Initializing...
              </span>
            ) : isRunning ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 rounded-full bg-warning-yellow/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-warning-yellow animate-pulse" />
                </div>
                Mission in Progress
              </span>
            ) : (
              <span className="flex items-center justify-center gap-3">
                🚀 Launch Mission
              </span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-transparent text-[10px] text-gray-500 uppercase tracking-wider">
              Quick Presets
            </span>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-3">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => setMissionPrompt(preset.prompt)}
              disabled={isSubmitting || isRunning}
              className={`group relative w-full overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                isSubmitting || isRunning
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-[1.02] cursor-pointer'
              }`}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-r ${preset.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Border */}
              <div className={`absolute inset-0 rounded-xl border ${preset.border} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${preset.gradient} border ${preset.border} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {preset.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white mb-1 group-hover:text-neon-blue transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500 line-clamp-2 group-hover:text-gray-400 transition-colors">
                    {preset.prompt.substring(0, 60)}...
                  </div>
                </div>

                {/* Arrow */}
                <div className={`text-neon-blue opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0`}>
                  →
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
