import React, { useState } from 'react';
import { updateEnvironment } from '../api/PhysicsApi';

function EnvironmentControlPanel() {
    // Input State
    const [envPrompt, setEnvPrompt] = useState('');
    const [intensity, setIntensity] = useState(4);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Terminal State
    const [logs, setLogs] = useState([
        { text: 'init_sequence_complete', type: 'info' },
        { text: 'physics_engine: active', type: 'success' },
        { text: 'awaiting_input...', type: 'dim' }
    ]);
    const terminalRef = React.useRef(null);

    // Auto-scroll terminal
    React.useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!envPrompt.trim()) return;

        setIsSubmitting(true);

        // Add user command to logs
        setLogs(prev => [...prev, { text: `> cmd: ${envPrompt}`, type: 'highlight' }]);
        setLogs(prev => [...prev, { text: 'transmitting_parameters_to_physics_engine...', type: 'dim' }]);

        try {
            // Call Physics API (Simulated Backend)
            const result = await updateEnvironment(envPrompt);

            // Handle Response
            if (result.status === 'success') {
                // Append telemetry from "server"
                setLogs(prev => [...prev, ...result.telemetry]);
            }
        } catch (err) {
            setLogs(prev => [...prev, { text: 'error: physics_engine_timeout', type: 'error' }]);
        } finally {
            setIsSubmitting(false);
            setEnvPrompt('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-spacex-bg">
            {/* Header Title (Matches Left Panel 'Drone Registry' header style if possible, or just the component style) */}
            {/* Actually Left Panel has a parent header 'Drone Registry'. We might miss that wrapper but inside the component we match MissionInput */}

            <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">

                {/* 1. INPUT PANEL (Mirrors MissionInput.jsx) */}
                <div className="glass-panel">
                    {/* Header */}
                    <div className="p-4 border-b border-spacex-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white font-mono">
                                    E
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Environment Parameters</h2>
                                </div>
                            </div>

                            {/* Active Indicator Placeholder */}
                            <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
                                <span className="text-[10px] font-bold text-spacex-text-dim uppercase tracking-wider">STANDBY</span>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Description */}
                            <div className="space-y-2">
                                <label className="block text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold">
                                    Environment Specification
                                </label>
                                <textarea
                                    className="glass-input w-full min-h-[100px] resize-none font-mono text-xs leading-relaxed"
                                    placeholder="Describe atmospheric conditions (e.g., 'Heavy storm with high wind shear')..."
                                    value={envPrompt}
                                    onChange={(e) => setEnvPrompt(e.target.value)}
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-between text-[10px] text-spacex-text-dim font-mono">
                                    <span>{envPrompt.length} chars</span>
                                </div>
                            </div>

                            {/* Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold">
                                        Simulation Intensity
                                    </label>
                                    <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
                                        <span className="text-xs font-bold font-mono text-white">{intensity}</span>
                                    </div>
                                </div>

                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={intensity}
                                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                                    disabled={isSubmitting}
                                    className="w-full h-1 bg-spacex-border rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-none"
                                />

                                <div className="flex justify-between text-[10px] text-spacex-text-dim uppercase tracking-wider font-mono">
                                    <span>Low</span>
                                    <span>Medium</span>
                                    <span>Extreme</span>
                                </div>
                            </div>

                            {/* Button */}
                            <button
                                type="submit"
                                className={`w-full font-bold py-3 uppercase tracking-widest text-xs transition-all duration-200 border border-white hover:bg-white hover:text-black ${isSubmitting || !envPrompt.trim()
                                    ? 'opacity-50 cursor-not-allowed border-spacex-border hover:bg-transparent hover:text-inherit'
                                    : 'bg-transparent text-white'
                                    }`}
                                disabled={isSubmitting || !envPrompt.trim()}
                            >
                                {isSubmitting ? 'Updating Physics...' : 'Update Environment'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. TERMINAL PANEL (Mirrors TelemetryTerminal.jsx) */}
                <div className="glass-panel w-full h-[400px] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-spacex-border bg-spacex-bg shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white">
                                    A
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Atmospheric Conditions</h2>
                                </div>
                            </div>

                            <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
                                <span className="text-[10px] font-bold text-success uppercase tracking-wider">ACTIVE</span>
                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-spacex-text-dim uppercase tracking-wider">Physics Engine</span>
                                <span className="text-xs font-bold text-white">v2.4.0</span>
                            </div>

                            <div className="px-3 py-1 border border-spacex-border rounded-sm bg-spacex-bg">
                                <span className="text-[10px] text-spacex-text-dim uppercase tracking-wider mr-2">LOGS</span>
                                <span className="text-xs font-bold text-white font-mono">{logs.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div
                        ref={terminalRef}
                        className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs"
                    >
                        {logs.map((log, index) => (
                            <div key={index} className="mb-1 leading-relaxed border-b border-white/5 py-1">
                                <span className="text-spacex-text-dim mr-2">
                                    [{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                                <span className={
                                    log.type === 'error' ? 'text-error' :
                                        log.type === 'warning' ? 'text-warning' :
                                            log.type === 'success' ? 'text-success' :
                                                log.type === 'highlight' ? 'text-white font-bold' :
                                                    log.type === 'dim' ? 'text-spacex-text-dim' :
                                                        'text-spacex-text'
                                }>
                                    {log.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default EnvironmentControlPanel;
