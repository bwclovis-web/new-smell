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
    // Temporarily disabled React Compiler due to build issues
    // babel({
    //   filter: /\.[jt]sx?$/,
    //   babelConfig: {
    //     presets: ['@babel/preset-typescript'],
    //     plugins: [['babel-plugin-react-compiler', ReactCompilerConfig],],
    //   },
    // }),
    // Bundle analyzer for performance monitoring
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Gzip compression
    compression({
      algorithms: ['gzip'],
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    // Brotli compression
    compression({
      algorithms: ['brotliCompress'],
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ],
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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Ensure consistent builds
    rollupOptions: {
      output: {
        // Use deterministic chunk names for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        manualChunks: id => {
          // Core React libraries (small, critical, stable)
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-core'
          }

          // UI and animation libraries (medium size)
          if (id.includes('@gsap') || id.includes('chart.js') || id.includes('react-icons') ||
            id.includes('react-chartjs-2') || id.includes('@conform-to')) {
            return 'vendor-ui'
          }

          // Utility libraries (small, non-critical)
          if (id.includes('zustand') || id.includes('i18next') || id.includes('clsx') ||
            id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'vendor-utils'
          }

          // Large utility libraries (lazy load)
          if (id.includes('bcryptjs') || id.includes('jsonwebtoken') || id.includes('sharp') ||
            id.includes('csv-parser') || id.includes('papaparse')) {
            return 'vendor-libs'
          }

          // All other node_modules (fallback)
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }

          // Route components (lazy load for better performance)
          if (id.includes('/routes/')) {
            return 'routes'
          }

          // Performance and monitoring components (lazy load)
          if (id.includes('Performance') || id.includes('DataQuality') || id.includes('PerformanceMonitor')) {
            return 'performance'
          }

          // Admin components (lazy load)
          if (id.includes('/admin/') && !id.includes('node_modules')) {
            return 'admin'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
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
      'zustand',
      'i18next',
      'react-i18next'
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
