import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0e13',
        surface: '#14171e',
        'surface-2': '#1c2029',
        border: '#2a2e3a',
        'text-primary': '#e2e4e9',
        'text-dim': '#8b8fa3',
        'text-muted': '#5c6070',
        accent: '#3b82f6',
        'var-set': '#a78bfa',
        'var-unset': '#f87171',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
