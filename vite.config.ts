import { reactRouter } from "@react-router/dev/vite"
import tailwindcss from "@tailwindcss/vite"
import { visualizer } from "rollup-plugin-visualizer"
import { defineConfig } from "vite"
import babel from "vite-plugin-babel"
import { compression } from "vite-plugin-compression2"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [
    // Tailwind CSS plugin - must be early in the plugin chain for proper HMR
    tailwindcss(),
    tsconfigPaths(),
    // React Compiler - automatically optimizes React components
    // Processes .tsx, .jsx, .ts, and .js files
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              compilationMode: "infer", // Automatically optimize components without manual annotations
            },
          ],
        ],
      },
    }),
    reactRouter(),
    // Bundle analyzer for performance monitoring (dev only)
    process.env.ANALYZE === "true" &&
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
      overlay: true,
      // Ensure CSS updates are properly handled
      protocol: "ws",
      host: "localhost",
    },
    watch: {
      usePolling: true,
      interval: 100,
      // Watch CSS files more reliably
      ignored: ["**/node_modules/**", "**/.git/**"],
    },
    cors: true,
  },
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [],
    },
    // Improve HMR for CSS updates
    modules: {
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
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
    noExternal: ["@mjackson/node-fetch-server", "@react-router/node"],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
    include: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "react-i18next",
      "i18next",
      "i18next-browser-languagedetector",
      "i18next-http-backend",
      "i18next-fs-backend",
      "zustand",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "@conform-to/react",
      "@conform-to/zod",
    ],
  },
  assetsInclude: [
"**/*.webp", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.svg"
],
})
