import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Power rail colors
        'power-ac': '#3b82f6',      // Blue - AC Power
        'power-standby': '#eab308', // Yellow - Standby Rail
        'power-main': '#f97316',    // Orange - Main Rail
        // Status colors
        'status-on': '#22c55e',     // Green
        'status-off': '#6b7280',    // Gray
        'status-warning': '#f59e0b', // Amber
        'status-error': '#ef4444',  // Red
        // UI colors
        'panel-bg': '#1e293b',
        'panel-border': '#334155',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 0.5s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}

export default config
