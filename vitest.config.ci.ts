/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // CI-specific configuration
    name: 'ci',
    environment: 'happy-dom',
    globals: true,

    // All test files
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

    setupFiles: ['./test/setup-test-env.ts'],

    // CI-optimized timeouts
    testTimeout: 30000,
    hookTimeout: 20000,

    // Comprehensive coverage for CI
    coverage: {
      provider: 'v8',
      reporter: [
'text', 'json', 'html', 'lcov', 'clover'
],
      reportsDirectory: './coverage/ci',
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
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },

    // CI-optimized execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2
      }
    },

    // CI-specific mocking
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,

    // CI reporting
    reporter: [
      'verbose',
      'json',
      'junit'
    ],
    outputFile: {
      json: './test-results/ci-results.json',
      junit: './test-results/ci-junit.xml'
    },

    // CI environment variables
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      CI: 'true'
    },

    // CI-specific settings
    isolate: true,
    passWithNoTests: true,
    allowOnly: false,
    bail: 0,
    retry: 1,

    // Type checking for CI
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    }
  }
})
