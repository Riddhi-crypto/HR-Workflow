/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Geist"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f7f7f5',
          100: '#ededea',
          200: '#d9d9d3',
          300: '#b8b8b0',
          400: '#8e8e84',
          500: '#6b6b61',
          600: '#54544b',
          700: '#3f3f38',
          800: '#27272280',
          900: '#171714',
          950: '#0a0a08',
        },
        accent: {
          DEFAULT: '#e85d2f',
          hover: '#cf4a1f',
          soft: '#fff0e8',
        },
        approve: '#16a34a',
        reject: '#dc2626',
        canvas: '#fafaf7',
      },
      boxShadow: {
        node: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        'node-active': '0 0 0 2px #e85d2f, 0 8px 24px rgba(232,93,47,0.2)',
        panel: '0 1px 3px rgba(0,0,0,0.04), 0 10px 40px rgba(0,0,0,0.08)',
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot': 'pulse-dot 2s infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};
