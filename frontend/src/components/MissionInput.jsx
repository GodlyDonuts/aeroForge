import React, { useState } from 'react';
import { submitMission } from '../api';
import { simpleDemoOrchestrator } from '../engine/SimpleDemo';

function MissionInput({ currentMissionId, onMissionStart, isRunning, initialPrompt, autoSubmit }) {
  const [missionPrompt, setMissionPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoLaunched, setHasAutoLaunched] = useState(false);

  // Auto-launch effect
  React.useEffect(() => {
    if (initialPrompt && autoSubmit && !hasAutoLaunched) {
      setHasAutoLaunched(true);
      handleSubmit(null, initialPrompt);
    }
  }, [initialPrompt, autoSubmit]);

  const handleSubmit = async (e, overridePrompt = null) => {
    if (e) e.preventDefault();
    const promptToSubmit = overridePrompt || missionPrompt;

    if (!promptToSubmit.trim()) return;

    setIsSubmitting(true);

    // Check if this is a demo mission that's already running
    if (currentMissionId && currentMissionId.startsWith('DEMO-')) {
      // If user submits additional prompt, upgrade to V3
      if (simpleDemoOrchestrator.droneVersion === 2) {
        // Enforce prompt requirement: "larger payload carrying capacity"
        const keywords = ['payload', 'capacity', 'weight', 'lift', 'carry', 'heavy'];
        const hasKeyword = keywords.some(k => promptToSubmit.toLowerCase().includes(k));

        if (hasKeyword) {
          console.log("🚀 Upgrading to V3...");
          simpleDemoOrchestrator.upgradeToV3();
          setIsSubmitting(false);
          return;
        }
      }
      // If already at V3, just log the update
      if (simpleDemoOrchestrator.droneVersion === 3) {
        console.log("✓ Already at advanced configuration - optimizing...");
        simpleDemoOrchestrator.emit('log', {
          source: 'DESIGNER',
          message: '✓ Configuration updated and optimized',
          type: 'success'
        });
        setIsSubmitting(false);
        return;
      }
    }

    // Check if this is the demo prompt
    const isDemoPrompt = simpleDemoOrchestrator.isDemoPrompt(promptToSubmit);

    if (isDemoPrompt) {
      console.log("🎬 Demo mode activated - using orchestrated script");
      // Use demo orchestrator
      const demoMissionId = "DEMO-" + Date.now();
      onMissionStart(demoMissionId, promptToSubmit);

      // Start the orchestrated demo
      setTimeout(() => {
        simpleDemoOrchestrator.start();
      }, 500);

      setIsSubmitting(false);
      return;
    }

    // Normal API submission
    try {
      const response = await submitMission({
        prompt: promptToSubmit,
        max_iterations: maxIterations,
      });

      onMissionStart(response.mission_id, promptToSubmit);
    } catch (error) {
      console.error('Failed to submit mission:', error);
      alert('Mission launch failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presets = [
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
              S
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Design Parameters</h2>
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
              System Specification
            </label>
            <textarea
              className="glass-input w-full min-h-[100px] resize-none font-mono text-xs leading-relaxed"
              placeholder="Describe the system configuration..."
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
            {isSubmitting ? 'Processing...' : isRunning ? 'Update in Progress' : 'Update Design'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MissionInput;
