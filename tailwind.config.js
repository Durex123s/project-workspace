/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0e17',
          900: '#0f172a',
          800: '#151f32',
          700: '#1e293b',
          600: '#2a3a52'
        },
        accent: {
          DEFAULT: '#3b82f6',
          soft: '#60a5fa'
        },
        status: {
          ready: '#22c55e',
          pending: '#eab308',
          blocked: '#ef4444',
          progress: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
