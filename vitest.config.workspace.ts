/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Workspace configuration for running all test types
    workspace: [
      './vitest.config.unit.ts',
      './vitest.config.integration.ts',
      './vitest.config.performance.ts'
    ],

    // Global workspace settings
    globals: true,

    // Workspace-level reporters
    reporter: [
      'verbose',
      'json',
      'html'
    ],

    // Workspace-level output files
    outputFile: {
      json: './test-results/workspace-results.json',
      html: './test-results/workspace-report.html'
    },

    // Workspace-level coverage
    coverage: {
      provider: 'v8',
      reporter: [
'text', 'json', 'html', 'lcov'
],
      reportsDirectory: './coverage/workspace',
      include: [
        'app/**/*.{js,ts,jsx,tsx}',
        'utils/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
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
    }
  }
})
