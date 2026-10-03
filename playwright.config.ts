import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Each test boots its own DuckDB-WASM and sample, so keep parallelism modest.
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // The offline worker precaches ~38 MB per browser context; only the offline
    // and privacy specs (which must see real behaviour) let it install.
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /perf\.spec\.ts/ },
    // Timing budgets run last and alone, so parallel workers can't skew them (ADR-019).
    {
      name: 'perf',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /perf\.spec\.ts/,
      dependencies: ['chromium'],
    },
  ],
  webServer: {
    // E2E runs against the production build so the CSP and service worker are the real ones.
    command: `pnpm start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Sharing runs against an in-memory Postgres (PGlite) with the real migrations.
    env: { DATABASE_URL: 'pglite://memory', SHARE_SALT: 'e2e-only-salt', ENABLE_DEBUG_PAGE: '1' },
  },
});
