import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MD3 Surface containers (6 levels of elevation)
        'surface-lowest': 'var(--ivk-surface-lowest, #000000)',
        'surface-low': 'var(--ivk-surface-low, #131313)',
        surface: 'var(--ivk-surface, #0e0e0e)',
        'surface-container': 'var(--ivk-surface-container, #191a1a)',
        'surface-high': 'var(--ivk-surface-high, #1f2020)',
        'surface-highest': 'var(--ivk-surface-highest, #252626)',

        // Text
        'on-surface': 'var(--ivk-on-surface, #e7e5e4)',
        'on-surface-variant': 'var(--ivk-on-surface-variant, #acabaa)',
        outline: 'var(--ivk-outline, #767575)',
        'outline-variant': 'var(--ivk-outline-variant, #484848)',

        // Accent
        primary: 'var(--ivk-primary, #e6c188)',
        'on-primary': 'var(--ivk-on-primary, #543c0e)',
        secondary: 'var(--ivk-secondary, #dbc3a1)',
        tertiary: 'var(--ivk-tertiary, #ffcdb3)',
        error: 'var(--ivk-error, #f97758)',

        // Keep old names as aliases for backward compat during migration
        bg: 'var(--ivk-surface-lowest, #000000)',
        border: 'var(--ivk-outline-variant, #484848)',
        accent: 'var(--ivk-primary, #e6c188)',
        'text-primary': 'var(--ivk-on-surface, #e7e5e4)',
        'text-dim': 'var(--ivk-on-surface-variant, #acabaa)',
        'text-muted': 'var(--ivk-outline, #767575)',

        // Preserved from previous config
        'surface-2': 'var(--ivk-surface-container, #191a1a)',
        'var-set': 'var(--ivk-var-set)',
        'var-unset': 'var(--ivk-var-unset)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
