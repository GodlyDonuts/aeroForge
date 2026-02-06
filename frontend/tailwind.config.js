/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial / SpaceX-inspired Palette
        'spacex-black': '#000000',      // Pure black
        'spacex-bg': '#050505',         // Almost black
        'spacex-surface': '#111111',    // Dark gray
        'spacex-border': '#333333',     // Subtle border
        'spacex-text': '#e5e5e5',       // Primary text
        'spacex-text-dim': '#888888',   // Secondary text

        // Status Colors (Functional, not decorative)
        'success': '#00ff88',
        'warning': '#ffcc00',
        'error': '#ff3333',
        'info': '#3399ff',
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        // Subtle technical gradients
        'industrial-gradient': 'linear-gradient(180deg, #1A1A1A 0%, #050505 100%)',
      },
      boxShadow: {
        'technical': '0 0 0 1px #333333',
        'technical-hover': '0 0 0 1px #666666',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
