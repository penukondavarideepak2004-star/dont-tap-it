/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#0A0E17',
          card: '#131A29',
          cardHover: '#1A2338',
        },
        primary: {
          DEFAULT: '#00F0FF',
          hover: '#38F4FF',
          dark: '#00B8C4',
        },
        game: {
          red: '#FF2E63',
          blue: '#00D2FC',
          green: '#00E676',
          yellow: '#FFD600',
          purple: '#B388FF',
          orange: '#FF9100',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulseFast: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.85' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1.2)', opacity: '0' },
        }
      },
      animation: {
        'pulse-fast': 'pulseFast 0.6s ease-in-out infinite',
        'shake': 'shake 0.35s ease-in-out',
        'pop-in': 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'float-up': 'floatUp 0.8s ease-out forwards',
      }
    },
  },
  plugins: [],
}
