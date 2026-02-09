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

            <div className={`transition-all duration-1000 ease-out flex flex-col items-center max-w-4xl w-full px-8 relative ${animationStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

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
                <form onSubmit={handleSubmit} className="w-full relative group max-w-3xl">
                    <textarea
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Describe your mission parameters..."
                        className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl md:text-2xl text-center text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors font-light resize-none h-[120px]"
                    />

                    {/* Enter hint */}
                    <div className={`absolute right-0 bottom-4 transition-opacity duration-300 ${input.trim() ? 'opacity-100' : 'opacity-0'}`}>
                        <button type="submit" className="text-[10px] uppercase font-bold text-black bg-white px-4 py-2 rounded-sm tracking-wider hover:bg-gray-200 shadow-lg hover:shadow-xl transition-all">
                            Initialize Mission &rarr;
                        </button>
                    </div>
                </form>



            </div>
        </div>
    );
}

export default MissionInitiation;
