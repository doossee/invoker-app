import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests against `npm run dev` (browser-demo mode).
 *
 * Why browser-demo and not Tauri?
 *   - Playwright doesn't have first-class Tauri webview support yet.
 *   - The browser-demo mode exercises the same React app + sample collection,
 *     just without the native filesystem / native HTTP transport. So most
 *     UI behavior, store flow, and component contracts get full coverage.
 *   - For Tauri-specific paths (real fs, native dialog, IPC) we'll add
 *     focused integration tests that mock @tauri-apps/* modules.
 *
 * Run: npm run test:e2e
 *      npm run test:e2e -- --headed     (watch in browser)
 *      npm run test:e2e -- --ui         (Playwright UI runner)
 */
export default defineConfig({
  testDir: './e2e',
  // Re-running a single failing test should not block the rest.
  fullyParallel: true,
  // Refuse to commit a `.only` to prevent skipping the rest of the suite.
  forbidOnly: !!process.env.CI,
  // Retries are masking-prone; keep at 0 locally so flakes surface.
  // CI gets one retry to absorb transient infra hiccups.
  retries: process.env.CI ? 1 : 0,
  // Sequential workers locally so output is readable; CI uses default.
  workers: process.env.CI ? undefined : 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add firefox / webkit later if cross-browser issues surface.
  ],

  // Boots `vite` for the suite. Reuses an already-running server (handy when
  // iterating: leave `npm run dev` open in another terminal, run tests).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
