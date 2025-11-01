/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Integration test specific configuration
    name: "integration",
    environment: "happy-dom",
    globals: true,

    // Focus on integration tests
    include: [
      "./test/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./app/routes/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./app/models/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      ...configDefaults.exclude,
      "./app/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./app/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./app/hooks/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],

    setupFiles: ["./test/setup-test-env.ts", "./test/setup-integration.ts"],

    // Longer timeouts for integration tests
    testTimeout: 30000,
    hookTimeout: 20000,

    // Coverage for integration tests
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage/integration",
      include: [
        "app/routes/**/*.{js,ts,jsx,tsx}",
        "app/models/**/*.{js,ts,jsx,tsx}",
        "app/providers/**/*.{js,ts,jsx,tsx}",
      ],
      exclude: [
        ...configDefaults.exclude,
        "./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "./test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "./stories/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },

    // Sequential execution for integration tests
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1,
      },
    },

    // More comprehensive mocking
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Allow shared state for integration tests
    isolate: false,
    passWithNoTests: true,

    // Reporter for integration tests
    reporter: ["verbose", "json"],
    outputFile: {
      json: "./test-results/integration-results.json",
    },

    // Environment variables for integration tests
    env: {
      NODE_ENV: "test",
      VITEST: "true",
      INTEGRATION_TEST: "true",
    },
  },
})
