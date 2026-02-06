import React from 'react';

function NegotiationModal({ isOpen, onAccept, onDecline }) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">

            <div className="w-[600px] border-2 border-warning bg-black shadow-[0_0_50px_rgba(255,170,0,0.2)] flex flex-col relative overflow-hidden">

                {/* Striped Warning Bar */}
                <div className="h-2 bg-[repeating-linear-gradient(45deg,#ffaa00,#ffaa00_10px,#000_10px,#000_20px)]"></div>

                {/* Header */}
                <div className="p-6 border-b border-warning/30 flex items-start gap-4">
                    <div className="w-12 h-12 bg-warning/20 border border-warning text-warning flex items-center justify-center text-2xl animate-pulse">
                        ⚠️
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                            Critical Design Failure
                            <span className="px-2 py-0.5 bg-error text-white text-[10px] uppercase font-bold tracking-widest rounded-sm animate-pulse">
                                Action Required
                            </span>
                        </h2>
                        <div className="mt-2 text-warning font-mono text-xs uppercase tracking-wider">
                            Physics Engine / Fluid Dynamics Module
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* The Analysis */}
                    <div className="p-4 bg-spacex-surface border-l-2 border-error">
                        <p className="font-mono text-sm text-gray-300 leading-relaxed">
                            <span className="text-error font-bold">FATAL ERROR DETECTED:</span> Current rotor geometry produces insufficient lift at <span className="text-white">4000m altitude</span> (0.6 atm). Deployment will result in catastrophic stall and loss of vehicle.
                        </p>
                    </div>

                    {/* The Proposal */}
                    <div>
                        <h3 className="text-xs font-bold text-spacex-text-dim uppercase tracking-wider mb-3">
                            Reasoning Engine Proposal
                        </h3>
                        <div className="border border-spacex-border p-4 bg-spacex-surface/50">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-2 py-1 bg-success/20 text-success border border-success/50 text-[10px] font-bold uppercase tracking-widest">
                                    RECOMMENDATION #1
                                </div>
                                <span className="text-sm font-bold text-white">High-Altitude Geometric Compensator</span>
                            </div>

                            {/* Comparison Table */}
                            <div className="grid grid-cols-3 gap-px bg-spacex-border">
                                <div className="bg-spacex-surface p-2 text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold">Metric</div>
                                <div className="bg-spacex-surface p-2 text-[10px] text-spacex-text-dim uppercase tracking-wider font-bold text-center">Current</div>
                                <div className="bg-spacex-surface p-2 text-[10px] text-success uppercase tracking-wider font-bold text-center bg-success/5">Proposed</div>

                                {/* Row 1 */}
                                <div className="bg-black p-2 text-xs font-mono text-gray-400">Blade Chord</div>
                                <div className="bg-black p-2 text-xs font-mono text-center text-error border-l border-spacex-border">Standard</div>
                                <div className="bg-black p-2 text-xs font-mono text-center text-success border-l border-spacex-border font-bold">+15% (Wide)</div>

                                {/* Row 2 */}
                                <div className="bg-black p-2 text-xs font-mono text-gray-400">Est. Flight Time</div>
                                <div className="bg-black p-2 text-xs font-mono text-center text-white border-l border-spacex-border">34 mins</div>
                                <div className="bg-black p-2 text-xs font-mono text-center text-warning border-l border-spacex-border">32 mins</div>

                                {/* Row 3 */}
                                <div className="bg-black p-2 text-xs font-mono text-gray-400">Stability @ 4km</div>
                                <div className="bg-black p-2 text-xs font-mono text-center text-error border-l border-spacex-border font-bold">CRITICAL</div>
                                <div className="bg-black p-2 text-xs font-mono text-center text-success border-l border-spacex-border font-bold">OPTIMAL</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-0 flex gap-4">
                    <button
                        onClick={onDecline}
                        className="flex-1 py-3 border border-spacex-border text-spacex-text-dim hover:text-white hover:bg-white/5 uppercase tracking-widest text-xs font-bold transition-colors"
                    >
                        Ignore Warning
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-[2] py-3 bg-white text-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold transition-colors flex items-center justify-center gap-2 group"
                    >
                        <span>Deploy Engineering Fix</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

            </div>
        </div>
    );
}

export default NegotiationModal;
