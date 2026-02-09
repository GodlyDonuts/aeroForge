import React, { useState, useEffect } from 'react';
import { simpleDemoOrchestrator } from '../engine/SimpleDemo';

function MetricsDisplay({ missionId, isRunning }) {
  const [metrics, setMetrics] = useState({
    stability: 0,
    acceleration: 0,
    efficiency: 0,
    safetyFactor: 0,
    positionDrift: 0
  });
  const [iteration, setIteration] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Listen for demo orchestrator updates
  useEffect(() => {
    setIsDemoMode(missionId?.startsWith('DEMO-'));

    const handleComplete = (data) => {
      setMetrics({
        stability: data.metrics?.stability_score || 0,
        acceleration: 15.36,
        efficiency: data.metrics?.energy_efficiency || 0,
        safetyFactor: data.metrics?.safety_factor || 0,
        positionDrift: data.metrics?.position_drift || 0
      });
      setIteration(data.iteration || 0);
    };

    simpleDemoOrchestrator.on('complete', handleComplete);

    return () => {
      // Cleanup is handled internally
    };
  }, [missionId]);

  // Metric card component
  const MetricCard = ({ label, value, unit, goodThreshold = Infinity, invert = false }) => {
    const isGood = invert ? value <= goodThreshold : value >= goodThreshold;
    const displayValue = typeof value === 'number' ? value.toFixed(2) : value;

    return (
      <div className="bg-spacex-surface/50 border border-spacex-border p-3 rounded-sm">
        <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider mb-1">{label}</div>
        <div className={`text-xl font-bold font-mono ${isGood ? 'text-success' : 'text-warning'}`}>
          {displayValue}
          <span className="text-xs text-spacex-text-dim ml-1">{unit}</span>
        </div>
      </div>
    );
  };

  if (!missionId || !isRunning) {
    return (
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white">
            📊
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Performance Metrics</h2>
        </div>

        <div className="text-center text-spacex-text-dim text-xs py-8">
          Awaiting mission data...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white">
            📊
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Performance Metrics</h2>
        </div>

        {iteration > 0 && (
          <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
            <span className="text-[10px] text-spacex-text-dim uppercase tracking-wider mr-2">ITER</span>
            <span className="text-xs font-bold text-white font-mono">{iteration}</span>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Stability Score"
          value={metrics.stability}
          unit="%"
          goodThreshold={0.85}
        />

        <MetricCard
          label="Max Acceleration"
          value={metrics.acceleration}
          unit="m/s²"
          goodThreshold={10}
          invert={true}
        />

        <MetricCard
          label="Energy Efficiency"
          value={metrics.efficiency}
          unit="%"
          goodThreshold={0.7}
        />

        <MetricCard
          label="Safety Factor"
          value={metrics.safetyFactor}
          unit=""
          goodThreshold={1.5}
        />
      </div>

      {/* Drift Metric - Full Width */}
      <MetricCard
        label="Position Drift"
        value={metrics.positionDrift}
        unit="m"
        goodThreshold={0.5}
        invert={true}
      />

      {/* Progress Visual */}
      {iteration > 0 && metrics.stability > 0 && (
        <div className="pt-3 border-t border-spacex-border">
          <div className="flex justify-between text-[10px] text-spacex-text-dim uppercase tracking-wider mb-2">
            <span>Design Optimization</span>
            <span>{Math.round(metrics.stability * 100)}%</span>
          </div>
          <div className="h-1 bg-spacex-surface rounded-none overflow-hidden border border-spacex-border">
            <div
              className={`h-full transition-all duration-500 ${metrics.stability >= 0.95 ? 'bg-success' :
                metrics.stability >= 0.8 ? 'bg-warning' : 'bg-error'
                }`}
              style={{ width: `${metrics.stability * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MetricsDisplay;
