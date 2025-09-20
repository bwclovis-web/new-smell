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
    rollupOptions: {
      output: {
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: chunkInfo => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
          if (facadeModuleId?.includes('node_modules')) {
            return 'assets/js/vendor/[name]-[hash].js'
          }
          if (facadeModuleId?.includes('admin')) {
            return 'assets/js/admin/[name]-[hash].js'
          }
          if (facadeModuleId?.includes('login')) {
            return 'assets/js/auth/[name]-[hash].js'
          }
          return 'assets/js/[name]-[hash].js'
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        manualChunks: (id) => {
          // Vendor chunks - exclude React as it's handled externally
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('@gsap') || id.includes('gsap') || id.includes('zustand') || id.includes('i18next')) {
              return 'ui-vendor'
            }
            if (id.includes('react-icons')) {
              return 'icons-vendor'
            }
            if (id.includes('cookie') || id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge')) {
              return 'utils-vendor'
            }
            return 'vendor'
          }

          // Feature chunks
          if (id.includes('/admin/')) {
            return 'admin'
          }
          if (id.includes('/login/')) {
            return 'auth'
          }
          if (id.includes('perfume.tsx') || id.includes('perfume-house.tsx')) {
            return 'perfume-detail'
          }
          if (id.includes('behind-the-bottle.tsx') || id.includes('the-vault.tsx') || id.includes('the-exchange.tsx')) {
            return 'data-display'
          }
          if (id.includes('performance')) {
            return 'performance'
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
