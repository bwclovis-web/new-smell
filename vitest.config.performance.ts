/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Performance test specific configuration
    name: 'performance',
    environment: 'happy-dom',
    globals: true,

    // Focus on performance tests
    include: [
      './test/performance/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './app/**/*.perf.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      ...configDefaults.exclude,
      './app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    setupFiles: ['./test/setup-test-env.ts', './test/setup-performance.ts'],

    // Longer timeouts for performance tests
    testTimeout: 60000,
    hookTimeout: 30000,

    // No coverage for performance tests
    coverage: {
      enabled: false
    },

    // Single thread for accurate performance measurements
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1
      }
    },

    // Minimal mocking for performance tests
    mockReset: false,
    clearMocks: false,
    restoreMocks: false,

    // Allow shared state
    isolate: false,
    passWithNoTests: true,

    // Reporter for performance tests
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results/performance-results.json'
    },

    // Environment variables for performance tests
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      PERFORMANCE_TEST: 'true'
    },

    // Benchmark configuration
    benchmark: {
      enabled: true,
      outputFile: './test-results/benchmark-results.json',
      reporters: ['verbose', 'json']
    }
  }
})
