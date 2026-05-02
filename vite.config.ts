/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Vitest config — runs `npm test`, `npm run test:watch`, `npm run test:ui`.
    // Picks up *.{test,spec}.{ts,tsx} co-located next to source files under src/.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // Exclude scripts/release.test.mjs — that file runs under node:test
    // (different runner, no DOM, no JSX). See npm run release:test.
    exclude: ['node_modules', 'dist', 'src-tauri', 'scripts'],
    css: true,
  },
});
