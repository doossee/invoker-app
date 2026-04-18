import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--ivk-bg)',
        surface: 'var(--ivk-surface)',
        'surface-2': 'var(--ivk-surface-hover)',
        border: 'var(--ivk-border)',
        'text-primary': 'var(--ivk-text)',
        'text-dim': 'var(--ivk-text-secondary)',
        'text-muted': 'var(--ivk-text-muted)',
        accent: 'var(--ivk-accent)',
        'var-set': 'var(--ivk-var-set)',
        'var-unset': 'var(--ivk-var-unset)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
