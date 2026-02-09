import React from 'react';

function NegotiationModal({ isOpen, onAccept, onDecline }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">

            <div className="w-[600px] border border-cyan-500/50 bg-black shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col relative overflow-hidden group">

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>

                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%]"></div>

                {/* Header */}
                <div className="p-4 border-b border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                        <h2 className="text-sm font-bold text-cyan-400 font-mono tracking-widest uppercase">
                            SIMULATION AGENT REPORT // <span className="text-white">FAILURE_EVENT_091</span>
                        </h2>
                    </div>
                    <div className="text-[10px] text-cyan-500/70 font-mono">
                        T+{Math.floor(Date.now() / 1000) % 10000}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 relative z-10 font-mono">

                    {/* Section 1: Anomaly */}
                    <div className="flex gap-4">
                        <div className="w-24 text-[10px] text-error font-bold tracking-widest uppercase pt-1 text-right shrink-0">
                            Detected<br />Anomaly
                        </div>
                        <div className="flex-1 p-3 border-l-2 border-error bg-error/5">
                            <p className="text-xs text-spacex-text leading-relaxed">
                                <strong className="text-white">CRITICAL LIFT FAILURE.</strong> The current rotor geometry generates insufficient lift coefficient (Cl &lt; 0.4) at operational altitude.
                            </p>
                        </div>
                    </div>

                    {/* Section 2: Impact */}
                    <div className="flex gap-4">
                        <div className="w-24 text-[10px] text-warning font-bold tracking-widest uppercase pt-1 text-right shrink-0">
                            Impact<br />Prediction
                        </div>
                        <div className="flex-1 p-3 border-l-2 border-warning bg-warning/5">
                            <p className="text-xs text-spacex-text leading-relaxed">
                                Catastrophic stall at <span className="text-white">4000m</span>. 100% probability of vehicle loss. Mission constraints cannot be met with current configuration.
                            </p>
                        </div>
                    </div>

                    {/* Section 3: Solution */}
                    <div className="flex gap-4">
                        <div className="w-24 text-[10px] text-cyan-400 font-bold tracking-widest uppercase pt-1 text-right shrink-0">
                            Proposed<br />Solution
                        </div>
                        <div className="flex-1 p-3 border-l-2 border-cyan-500 bg-cyan-900/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-white uppercase">Parametric Rotor Redesign</span>
                                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded">CONFIDENCE: 98%</span>
                            </div>
                            <ul className="text-[10px] text-cyan-300 space-y-1 list-disc pl-4">
                                <li>Increase blade chord by +15%</li>
                                <li>Optimize angle of attack for thin atmosphere</li>
                                <li>Switch to high-RPM motor config</li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-spacex-border bg-spacex-bg/50 flex gap-4 relative z-10 z-50">
                    <button
                        onClick={onDecline}
                        className="flex-1 py-3 border border-spacex-border text-spacex-text-dim hover:text-white hover:bg-white/5 uppercase tracking-widest text-[10px] font-bold transition-colors font-mono"
                    >
                        OVERRIDE & LAUNCH
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-[2] py-3 bg-cyan-600 hover:bg-cyan-500 text-white uppercase tracking-widest text-[10px] font-bold transition-colors flex items-center justify-center gap-2 group font-mono shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                        <span>AUTHORIZE DESIGNER FIX</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

            </div>
        </div>
    );
}

export default NegotiationModal;
