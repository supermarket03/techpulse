/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Financial dashboard colors
        'bull-green': '#00C851',
        'bear-red': '#FF4444',
        'neutral-gray': '#6C757D',
        'hype-purple': '#9C27B0',
        'fund-blue': '#2196F3',
        'warning-orange': '#FF8800',
        'dark-bg': '#1a1a1a',
        'card-bg': '#ffffff',
        'border-light': '#e5e7eb'
      },
      fontFamily: {
        'mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}