/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SpaceX-inspired Color Palette
        'spacex-black': '#0a0a0f',
        'spacex-dark': '#12121a',
        'spacex-gray': '#1a1a25',
        'spacex-gray-light': '#252535',
        'spacex-gray-lighter': '#353545',

        // Neon Blue
        'neon-blue': '#00f0ff',
        'neon-blue-dark': '#00b8c4',
        'neon-blue-light': '#5af7ff',

        // Cyan
        'cyan': '#00d4ff',
        'cyan-light': '#5affff',
        'cyan-dark': '#0099b8',

        // Purple
        'purple': '#7b2cbf',
        'purple-light': '#9d4edd',
        'purple-dark': '#5a189a',

        // Status Colors
        'success-green': '#00ff88',
        'success-green-dark': '#00c96a',
        'warning-yellow': '#ffd700',
        'warning-yellow-dark': '#ccac00',
        'alert-red': '#ff4d4d',
        'alert-red-dark': '#cc3c3c',

        // Glass Colors
        'glass-dark': 'rgba(10, 10, 15, 0.7)',
        'glass-light': 'rgba(26, 26, 37, 0.6)',
        'glass-highlight': 'rgba(0, 240, 255, 0.1)',
      },
      backgroundImage: {
        'spacex-gradient': 'radial-gradient(ellipse at top, #1a1a25 0%, #0a0a0f 50%, #000 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00f0ff 0%, #00d4ff 50%, #7b2cbf 100%)',
        'neon-gradient-hover': 'linear-gradient(135deg, #5af7ff 0%, #00d4ff 50%, #9d4edd 100%)',
        'success-gradient': 'linear-gradient(135deg, #00ff88 0%, #00f0ff 100%)',
        'alert-gradient': 'linear-gradient(135deg, #ff4d4d 0%, #ffaa00 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        'neon': '0 0 20px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.3), 0 0 60px rgba(0, 240, 255, 0.1)',
        'neon-alert': '0 0 20px rgba(255, 77, 77, 0.5), 0 0 40px rgba(255, 77, 77, 0.3)',
        'neon-success': '0 0 20px rgba(0, 255, 136, 0.5), 0 0 40px rgba(0, 255, 136, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'monospace'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.5), 0 0 10px rgba(0, 240, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.8), 0 0 40px rgba(0, 240, 255, 0.5)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(to right, rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
}
