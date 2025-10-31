/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Test environment and globals
    environment: 'happy-dom',
    globals: true,

    // Test file patterns
    include: [
      './app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      ...configDefaults.exclude,
      './build/**',
      './dist/**',
      './node_modules/**',
      './.storybook/**',
      './stories/**'
    ],

    // Setup files
    setupFiles: ['./test/setup-test-env.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: [
        'text', 'json', 'html', 'lcov', 'text-summary', 'clover'
      ],
      reportsDirectory: './coverage',
      include: [
        'app/**/*.{js,ts,jsx,tsx}',
        'utils/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
        ...configDefaults.exclude,
        './app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './stories/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './generator/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './build/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '*.config.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './.storybook/**/*.ts',
        './.eslintrc.cjs',
        './server.mjs',
        './app/entry.client.tsx',
        './app/entry.server.tsx',
        './app/root.tsx',
        './app/routes/*.tsx',
        './prisma/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        './api/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Per-file thresholds for critical components
        './app/components/Atoms/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        './app/components/Molecules/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        './app/components/Organisms/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        './app/utils/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      // Watermarks for coverage quality indicators
      watermarks: {
        statements: [70, 90],
        functions: [70, 90],
        branches: [70, 90],
        lines: [70, 90]
      }
    },

    // Test timeout configuration
    testTimeout: 15000,
    hookTimeout: 10000,

    // Watch mode configuration
    watch: false,

    // Reporter configuration
    reporters: [
      'verbose',
      'json',
      'html',
      'junit'
    ],
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/junit.xml'
    },

    // Pool configuration for parallel testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // Performance and optimization
    isolate: true,
    passWithNoTests: true,
    allowOnly: false,
    bail: 0,

    // Type checking
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },

    // Test sequence configuration
    sequence: {
      concurrent: true,
      shuffle: false
    },

    // Retry configuration for flaky tests
    retry: 2,

    // Test file patterns for different test types
    testNamePattern: undefined,

    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },

    // Custom test environments
    environmentOptions: {
      happyDom: {
        settings: {
          strict: false,
          disableJavaScriptFileLoading: true,
          disableJavaScriptEvaluation: false,
          disableCSSFileLoading: true,
          enableFileSystemHttpRequests: false
        }
      }
    }
  }
})
