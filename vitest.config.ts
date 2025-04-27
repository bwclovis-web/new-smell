/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    coverage: {
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
        './prisma/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
      ]
    },
    environment: 'happy-dom',
    globals: true,
    include: ['./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./test/setup-test-env.ts']
  }
})
