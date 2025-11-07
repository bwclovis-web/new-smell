import process from "node:process"

import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import babel from "vite-plugin-babel"
import tsconfigPaths from "vite-tsconfig-paths"

const isDev = process.env.NODE_ENV !== "production"
const isAnalyze = process.env.ANALYZE === "true"

export default defineConfig({
  plugins: [
    // Tailwind CSS plugin - must be early in the plugin chain for proper HMR
    tailwindcss(),
    tsconfigPaths(),
    // React Compiler - ONLY in production for faster dev builds
    // In dev, React 19's built-in optimizations are sufficient
    !isDev && babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              compilationMode: "infer",
            },
          ],
        ],
      },
    }),
    reactRouter(),
    // Bundle analyzer for performance monitoring
    isAnalyze &&
      visualizer({
        filename: "dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    // Note: Compression is handled by Vercel in production
  ].filter(Boolean),
  server: {
    hmr: {
      port: 24680,
      overlay: false, // Disable error overlay to prevent full page reloads
      protocol: "ws",
      host: "localhost",
      clientPort: 24680,
      // Ensure CSS updates are handled properly
      timeout: 30000,
    },
    watch: {
      // Only use polling on Windows or if explicitly needed
      // Native file watching is faster on macOS/Linux
      usePolling: process.platform === "win32",
      interval: process.platform === "win32" ? 3000 : undefined, // Increased from 1000ms for better performance
      // Watch CSS files more reliably - ignore more for performance
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.react-router/**",
        "**/prisma/migrations/**",
      ],
    },
    cors: true,
    // Pre-transform frequently requested files for faster initial load
    warmup: {
      clientFiles: [
        "./app/root.tsx",
        "./app/routes/RootLayout.tsx",
        "./app/routes/home.tsx",
      ],
    },
  },
  css: {
    devSourcemap: isDev, // Only in development
    postcss: {
      plugins: [],
    },
    // Improve HMR for CSS updates
    modules: {
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
    // Disable CSS code splitting in dev to prevent loss during HMR
    preprocessorOptions: {},
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: id => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            // React core
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor"
            }
            // React Query
            if (
              id.includes("@tanstack/react-query") ||
              id.includes("@tanstack/react-query-devtools")
            ) {
              return "react-query-vendor"
            }
            // Form validation
            if (
              id.includes("@conform-to") ||
              id.includes("zod")
            ) {
              return "form-vendor"
            }
            // i18n
            if (
              id.includes("i18next") ||
              id.includes("react-i18next")
            ) {
              return "i18n-vendor"
            }
            // Charts
            if (
              id.includes("chart.js") ||
              id.includes("react-chartjs-2")
            ) {
              return "chart-vendor"
            }
            // Animation
            if (id.includes("gsap")) {
              return "animation-vendor"
            }
            // Other vendor code
            return "vendor"
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
    // Minification - esbuild is faster and works well for most cases
    minify: "esbuild",
    // Note: esbuild doesn't support drop_console, but production builds
    // will still be minified. For console removal, consider using a plugin
    // or switching to terser (requires installing terser package)
  },
  ssr: {
    noExternal: [
      "@mjackson/node-fetch-server",
      "@react-router/node",
    ],
    // Externalize heavy dependencies that don't need SSR bundling
    external: [
      "sharp",
      "puppeteer",
      "bcryptjs",
      "@prisma/client",
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
    // Pre-bundle frequently used dependencies for faster cold starts
    include: [
      // React ecosystem
      "react",
      "react-dom",
      "react-router",
      
      // State management & queries
      "@tanstack/react-query",
      "zustand",
      
      // i18n
      "react-i18next",
      "i18next",
      "i18next-browser-languagedetector",
      "i18next-http-backend",
      
      // Forms & validation
      "@conform-to/react",
      "@conform-to/zod",
      "zod",
      
      // Utilities
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "date-fns",
      "cookie",
      
      // Icons (frequently imported)
      "react-icons/gr",
      "react-icons/md",
      "react-icons/fa",
      "react-icons/io5",
    ],
    // Exclude heavy dev-only dependencies
    exclude: [
      "@tanstack/react-query-devtools",
      "react-router-devtools",
    ],
  },
  assetsInclude: [
"**/*.webp", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.svg"
],
})
