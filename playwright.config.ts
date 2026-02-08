import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration pour GoAI Editor E2E Tests
 * 
 * Tests E2E pour :
 * - Board.tsx (19×19 Interactive Board)
 * - GameService.ts
 * - Responsive Mobile/Desktop
 * - Performance & Accessibility
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /**
   * Timeout configurations
   */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  
  /**
   * Parallel execution
   */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  /**
   * Reporter configuration
   */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  /**
   * Web server configuration
   */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  /**
   * Test projects for different browsers
   */
  projects: [
    // Chrome/Chromium
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    // WebKit (Safari)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  /**
   * Global configuration for all tests
   */
  use: {
    baseURL: 'http://localhost:5174',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    screenshotDir: 'test-results/screenshots',
    
    // Video on failure
    video: 'retain-on-failure',
    videoDir: 'test-results/videos',
    
    // Trace on failure
    trace: 'on-first-retry',
    
    // Locale & timezone
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  
  /**
   * Global setup/teardown
   */
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
});
