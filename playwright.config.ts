import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  webServer: {
    command: 'npm run dev',
    port: 5000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
};

export default config;