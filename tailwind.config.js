/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          bg: '#0A0D12',
          surface: '#11151D',
          surface2: '#171C26',
          border: '#232A37',
          borderLight: '#2E3646'
        },
        ink: {
          primary: '#E7EAF0',
          secondary: '#8D96A8',
          muted: '#5C6577'
        },
        signal: {
          low: '#3DD68C',
          mid: '#F0A63B',
          high: '#F0555F',
          cyan: '#4FD8D0'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(79, 216, 208, 0.15), 0 8px 24px -8px rgba(79, 216, 208, 0.25)'
      },
      backgroundImage: {
        scan: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)'
      }
    }
  },
  plugins: []
}
