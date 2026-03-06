import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Fail fast in CI; keep going locally so you see all failures at once
  // Forbid test.only in CI
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Single worker to keep state-dependent serial suites orderly
  workers: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:3000',
    // Don't show the browser window during runs (override with --headed)
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start the UI test server before running tests; reuse if already up
  // (so `npm run test:ui-server` in a separate terminal gives instant re-runs)
  webServer: {
    command: 'node scripts/serve-ui.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
