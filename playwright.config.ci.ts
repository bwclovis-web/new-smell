import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright configuration for CI/CD environments
 */
export default defineConfig({
  // Test directory
  testDir: "./test/e2e",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Use fewer workers on CI
  workers: process.env.CI ? 2 : undefined,

  // Reporter to use for CI
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/e2e-results.json" }],
    ["junit", { outputFile: "test-results/e2e-results.xml" }],
    ["github"],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:2112",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",

    // Record video on failure
    video: "retain-on-failure",

    // Global timeout for each action
    actionTimeout: 15000,

    // Global timeout for navigation
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Test against mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Global setup and teardown
  globalSetup: "./test/e2e/global-setup.ts",
  globalTeardown: "./test/e2e/global-teardown.ts",

  // Test timeout
  timeout: 60 * 1000, // 60 seconds for CI

  // Expect timeout
  expect: {
    timeout: 15 * 1000, // 15 seconds for CI
  },

  // Output directory for test artifacts
  outputDir: "test-results/artifacts",

  // Test match patterns
  testMatch: ["**/test/e2e/**/*.test.ts", "**/test/e2e/**/*.spec.ts"],

  // Ignore patterns
  testIgnore: ["**/node_modules/**", "**/build/**", "**/dist/**", "**/coverage/**"],

  // Preserve output directory
  preserveOutput: "failures-only",

  // Update snapshots
  updateSnapshots: "missing",

  // Maximum failures before stopping
  maxFailures: 10,
})
