/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Unit test specific configuration
    name: 'unit',
    environment: 'happy-dom',
    globals: true,

    // Focus on component unit tests
    include: [
      './app/components/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './app/utils/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './app/hooks/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      ...configDefaults.exclude,
      './app/routes/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './app/models/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    setupFiles: ['./test/setup-test-env.ts'],

    // Fast execution for unit tests
    testTimeout: 5000,
    hookTimeout: 3000,

    // Coverage for unit tests only
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/unit',
      include: [
        'app/components/**/*.{js,ts,jsx,tsx}',
        'app/utils/**/*.{js,ts,jsx,tsx}',
        'app/hooks/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
        ...configDefaults.exclude,
        './app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './stories/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },

    // Optimized for speed
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 8,
        minThreads: 2
      }
    },

    // Minimal mocking for unit tests
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Fast execution
    isolate: true,
    passWithNoTests: true,

    // Reporter for unit tests
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results/unit-results.json'
    }
  }
})
