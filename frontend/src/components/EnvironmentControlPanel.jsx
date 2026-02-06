import React, { useState } from 'react';

function EnvironmentControlPanel() {
    const [params, setParams] = useState({
        windSpeed: 12,
        windDirection: 45,
        temperature: -5,
        altitude: 4000,
        gravity: 9.81
    });

    const handleChange = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex flex-col h-full bg-black border-l border-spacex-border">
            {/* Header */}
            <div className="p-4 border-b border-spacex-border bg-spacex-bg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-spacex-surface border border-spacex-border flex items-center justify-center text-sm font-bold text-white">
                        🌍
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Environment Control</h2>
                        <div className="text-[10px] text-spacex-text-dim uppercase tracking-wider">
                            Sector: Alpine (Matterhorn)
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="h-48 border-b border-spacex-border relative bg-spacex-surface overflow-hidden group">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs text-spacex-text-dim font-mono uppercase tracking-widest text-center">
                        Scanning Topography...<br />
                        <span className="text-white font-bold">ISO-3166-CH</span>
                    </div>
                </div>
                {/* Fake Scan Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-success/50 shadow-[0_0_15px_rgba(0,255,136,0.5)] animate-[scan_4s_linear_infinite]"></div>
            </div>

            {/* Controls */}
            <div className="flex-1 p-4 overflow-y-auto space-y-6">

                {/* Wind Group */}
                <div className="space-y-3">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-spacex-text-dim border-b border-spacex-border pb-1">Atmospheric Conditions</h3>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-spacex-text-dim">WIND SPEED</span>
                            <span className="text-white">{params.windSpeed} km/h</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="150"
                            value={params.windSpeed}
                            onChange={(e) => handleChange('windSpeed', e.target.value)}
                            className="w-full h-1 bg-spacex-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-spacex-text-dim">TEMPERATURE</span>
                            <span className="text-white">{params.temperature}°C</span>
                        </div>
                        <input
                            type="range"
                            min="-40" max="50"
                            value={params.temperature}
                            onChange={(e) => handleChange('temperature', e.target.value)}
                            className="w-full h-1 bg-spacex-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-sm"
                        />
                    </div>
                </div>

                {/* Physics Group */}
                <div className="space-y-3">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-spacex-text-dim border-b border-spacex-border pb-1">Geospatial Physics</h3>

                    <div className="bg-spacex-surface border border-spacex-border p-2 rounded-sm space-y-2">
                        <div className="flex justify-between items-center text-xs font-mono">
                            <span className="text-spacex-text-dim">ALTITUDE</span>
                            <span className="text-warning">HIGH</span>
                        </div>
                        <div className="text-right text-lg font-bold text-white font-mono">
                            {params.altitude} m
                        </div>
                        <div className="text-[10px] text-error text-right font-mono mt-1">
                            Air Density: 0.65 kg/m³
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default EnvironmentControlPanel;
