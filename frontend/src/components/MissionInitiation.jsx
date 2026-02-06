import React, { useState, useEffect } from 'react';

function MissionInitiation({ onStart }) {
    const [input, setInput] = useState('');
    const [animationStage, setAnimationStage] = useState(0); // 0: Start, 1: Typing, 2: Command Active

    useEffect(() => {
        // Fade in effect
        setTimeout(() => setAnimationStage(1), 500);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onStart(input);
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-sans tracking-tight">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-3xl"></div>
            </div>

            <div className={`transition-all duration-1000 ease-out flex flex-col items-center max-w-2xl w-full px-8 relative ${animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

                {/* Decorative Header */}
                <div className="mb-12 text-center space-y-4">
                    <div className="w-12 h-12 bg-white text-black flex items-center justify-center text-xl font-bold rounded-sm mx-auto mb-6">
                        AF
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tighter">
                        What do you want to build?
                    </h1>
                    <p className="text-spacex-text-dim text-sm uppercase tracking-[0.2em]">
                        AeroForge G3 // Intelligent Engineering Assistant
                    </p>
                </div>

                {/* Input Field */}
                <form onSubmit={handleSubmit} className="w-full relative group">
                    <input
                        type="text"
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your mission parameters..."
                        className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl md:text-2xl text-center text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors font-light"
                    />

                    {/* Enter hint */}
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 transition-opacity duration-300 ${input.trim() ? 'opacity-100' : 'opacity-0'}`}>
                        <button type="submit" className="text-[10px] uppercase font-bold text-black bg-white px-3 py-1 rounded-sm tracking-chapter hover:bg-gray-200">
                            Enter
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="mt-16 flex gap-8 text-[10px] text-spacex-text-dim uppercase tracking-widest font-mono opacity-50">
                    <span>System: ONLINE</span>
                    <span>Latency: 12ms</span>
                    <span>Gemini: CONNECTED</span>
                </div>

            </div>
        </div>
    );
}

export default MissionInitiation;
