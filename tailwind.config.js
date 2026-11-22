/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        cyber: {
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee',
          violet: '#8b5cf6',
          purple: '#a855f7',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.85)',
          surfaceHover: 'rgba(255, 255, 255, 0.95)',
          border: 'rgba(255, 255, 255, 0.65)',
          darkSurface: 'rgba(15, 23, 42, 0.78)',
          darkBorder: 'rgba(255, 255, 255, 0.12)',
        }
      },
      boxShadow: {
        'glass': '0 20px 50px rgba(15, 23, 42, 0.08)',
        'glass-glow': '0 0 25px rgba(99, 102, 241, 0.25)',
        'glass-hover': '0 25px 60px -15px rgba(99, 102, 241, 0.2)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-indigo': '0 0 25px rgba(99, 102, 241, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
