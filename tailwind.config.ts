import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MD3 Surface containers (6 levels of elevation)
        'surface-lowest': 'var(--ivk-surface-lowest, #0a0e14)',
        'surface-low': 'var(--ivk-surface-low, #181c22)',
        surface: 'var(--ivk-surface, #10141a)',
        'surface-container': 'var(--ivk-surface-container, #1c2026)',
        'surface-high': 'var(--ivk-surface-high, #262a31)',
        'surface-highest': 'var(--ivk-surface-highest, #31353c)',

        // Text
        'on-surface': 'var(--ivk-on-surface, #dfe2eb)',
        'on-surface-variant': 'var(--ivk-on-surface-variant, #c2c6d6)',
        outline: 'var(--ivk-outline, #8c909f)',
        'outline-variant': 'var(--ivk-outline-variant, #424754)',

        // Accent
        primary: 'var(--ivk-primary, #adc6ff)',
        'on-primary': 'var(--ivk-on-primary, #002e6a)',
        secondary: 'var(--ivk-secondary, #ddb7ff)',
        tertiary: 'var(--ivk-tertiary, #4ae176)',
        error: 'var(--ivk-error, #ffb4ab)',

        // Keep old names as aliases for backward compat during migration
        bg: 'var(--ivk-surface-lowest, #0a0e14)',
        border: 'var(--ivk-outline-variant, #424754)',
        accent: 'var(--ivk-primary, #adc6ff)',
        'text-primary': 'var(--ivk-on-surface, #dfe2eb)',
        'text-dim': 'var(--ivk-on-surface-variant, #c2c6d6)',
        'text-muted': 'var(--ivk-outline, #8c909f)',

        // Preserved from previous config
        'surface-2': 'var(--ivk-surface-container, #1c2026)',
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
