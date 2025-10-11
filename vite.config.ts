import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import { compression } from 'vite-plugin-compression2'
import tsconfigPaths from 'vite-tsconfig-paths'

const ReactCompilerConfig = {
  // React Compiler configuration
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    reactRouter(),
    // Bundle analyzer for performance monitoring (dev only)
    process.env.ANALYZE === 'true' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Note: Compression is handled by Vercel in production
  ].filter(Boolean),
  server: {
    hmr: {
      port: 24680,
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    cors: true
  },
  css: {
    devSourcemap: true,
    postcss: {
      plugins: []
    }
  },
  build: {
    target: 'es2022',
    // Let React Router 7 handle build configuration when using vercelPreset
    // Custom rollupOptions can conflict with React Router's build process
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022'
    },
    include: [
      'react',
      'react-dom',
      'react-router',
      'react-router-dom',
      'react-i18next',
      'i18next',
      'i18next-browser-languagedetector',
      'i18next-http-backend',
      'i18next-fs-backend',
      'zustand',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      '@conform-to/react',
      '@conform-to/zod'
    ]
  },
  assetsInclude: [
    '**/*.webp',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.svg'
  ]
})
