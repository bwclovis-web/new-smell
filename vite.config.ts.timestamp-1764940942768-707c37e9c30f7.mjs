// vite.config.ts
import process from "node:process";
import { reactRouter } from "file:///C:/Repos/new-smell/node_modules/@react-router/dev/dist/vite.js";
import tailwindcss from "file:///C:/Repos/new-smell/node_modules/@tailwindcss/vite/dist/index.mjs";
import { visualizer } from "file:///C:/Repos/new-smell/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { defineConfig } from "file:///C:/Repos/new-smell/node_modules/vite/dist/node/index.js";
import babel from "file:///C:/Repos/new-smell/node_modules/vite-plugin-babel/dist/index.mjs";
import tsconfigPaths from "file:///C:/Repos/new-smell/node_modules/vite-tsconfig-paths/dist/index.js";
var isDev = process.env.NODE_ENV !== "production";
var isAnalyze = process.env.ANALYZE === "true";
var vite_config_default = defineConfig({
  plugins: [
    // Tailwind CSS plugin - must be early in the plugin chain for proper HMR
    tailwindcss(),
    tsconfigPaths(),
    // React Compiler - only enable in production builds for faster dev startup
    // The compiler is slow and adds ~30-60s to cold start time
    !isDev && babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              compilationMode: "infer"
              // Automatically optimize without manual annotations
            }
          ]
        ]
      }
    }),
    reactRouter(),
    // Bundle analyzer for performance monitoring
    isAnalyze && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
    // Note: Compression is handled by Vercel in production
  ].filter(Boolean),
  server: {
    hmr: {
      port: 24680,
      overlay: false,
      // Disable error overlay to prevent full page reloads
      protocol: "ws",
      host: "localhost",
      clientPort: 24680,
      // Ensure CSS updates are handled properly
      timeout: 3e4
    },
    watch: {
      // Only use polling on Windows or if explicitly needed
      // Native file watching is faster on macOS/Linux
      usePolling: process.platform === "win32",
      interval: process.platform === "win32" ? 3e3 : void 0,
      // Increased from 1000ms for better performance
      // Watch CSS files more reliably - ignore more for performance
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.react-router/**",
        "**/prisma/migrations/**"
      ]
    },
    cors: true,
    // Pre-transform frequently requested files for faster initial load
    warmup: {
      clientFiles: [
        "./app/root.tsx",
        "./app/routes/RootLayout.tsx",
        "./app/routes/home.tsx"
      ]
    }
  },
  css: {
    devSourcemap: isDev,
    // Only in development
    postcss: {
      plugins: []
    },
    // Improve HMR for CSS updates
    modules: {
      generateScopedName: "[name]__[local]___[hash:base64:5]"
    },
    // Disable CSS code splitting in dev to prevent loss during HMR
    preprocessorOptions: {}
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-query-devtools")) {
              return "react-query-vendor";
            }
            if (id.includes("@conform-to") || id.includes("zod")) {
              return "form-vendor";
            }
            if (id.includes("i18next") || id.includes("react-i18next")) {
              return "i18n-vendor";
            }
            if (id.includes("chart.js") || id.includes("react-chartjs-2")) {
              return "chart-vendor";
            }
            if (id.includes("gsap")) {
              return "animation-vendor";
            }
            return "vendor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js"
      }
    },
    // Minification - esbuild is faster and works well for most cases
    minify: "esbuild"
    // Note: esbuild doesn't support drop_console, but production builds
    // will still be minified. For console removal, consider using a plugin
    // or switching to terser (requires installing terser package)
  },
  ssr: {
    noExternal: [
      "@mjackson/node-fetch-server",
      "@react-router/node"
    ],
    // Externalize heavy dependencies that don't need SSR bundling
    external: [
      "sharp",
      "puppeteer",
      "bcryptjs",
      "@prisma/client"
    ],
    // Fix React 19 ESM/CJS interop issues
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/server",
        "react/jsx-runtime",
        "react/jsx-dev-runtime"
      ]
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022"
    },
    // Force re-bundling only when dependencies change (speeds up subsequent starts)
    force: false,
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
      "react-icons/io5"
    ],
    // Exclude heavy dev-only dependencies
    exclude: [
      "@tanstack/react-query-devtools",
      "react-router-devtools"
    ]
  },
  assetsInclude: [
    "**/*.webp",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.svg"
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxSZXBvc1xcXFxuZXctc21lbGxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFJlcG9zXFxcXG5ldy1zbWVsbFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovUmVwb3MvbmV3LXNtZWxsL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHByb2Nlc3MgZnJvbSBcIm5vZGU6cHJvY2Vzc1wiXG5cbmltcG9ydCB7IHJlYWN0Um91dGVyIH0gZnJvbSBcIkByZWFjdC1yb3V0ZXIvZGV2L3ZpdGVcIlxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQgYmFiZWwgZnJvbSBcInZpdGUtcGx1Z2luLWJhYmVsXCJcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCJcblxuY29uc3QgaXNEZXYgPSBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCJcbmNvbnN0IGlzQW5hbHl6ZSA9IHByb2Nlc3MuZW52LkFOQUxZWkUgPT09IFwidHJ1ZVwiXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICAvLyBUYWlsd2luZCBDU1MgcGx1Z2luIC0gbXVzdCBiZSBlYXJseSBpbiB0aGUgcGx1Z2luIGNoYWluIGZvciBwcm9wZXIgSE1SXG4gICAgdGFpbHdpbmRjc3MoKSxcbiAgICB0c2NvbmZpZ1BhdGhzKCksXG4gICAgLy8gUmVhY3QgQ29tcGlsZXIgLSBvbmx5IGVuYWJsZSBpbiBwcm9kdWN0aW9uIGJ1aWxkcyBmb3IgZmFzdGVyIGRldiBzdGFydHVwXG4gICAgLy8gVGhlIGNvbXBpbGVyIGlzIHNsb3cgYW5kIGFkZHMgfjMwLTYwcyB0byBjb2xkIHN0YXJ0IHRpbWVcbiAgICAhaXNEZXYgJiYgYmFiZWwoe1xuICAgICAgZmlsdGVyOiAvXFwuW2p0XXN4PyQvLFxuICAgICAgYmFiZWxDb25maWc6IHtcbiAgICAgICAgcHJlc2V0czogW1wiQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0XCJdLFxuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgW1xuICAgICAgICAgICAgXCJiYWJlbC1wbHVnaW4tcmVhY3QtY29tcGlsZXJcIixcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY29tcGlsYXRpb25Nb2RlOiBcImluZmVyXCIsIC8vIEF1dG9tYXRpY2FsbHkgb3B0aW1pemUgd2l0aG91dCBtYW51YWwgYW5ub3RhdGlvbnNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgcmVhY3RSb3V0ZXIoKSxcbiAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgZm9yIHBlcmZvcm1hbmNlIG1vbml0b3JpbmdcbiAgICBpc0FuYWx5emUgJiZcbiAgICAgIHZpc3VhbGl6ZXIoe1xuICAgICAgICBmaWxlbmFtZTogXCJkaXN0L3N0YXRzLmh0bWxcIixcbiAgICAgICAgb3BlbjogZmFsc2UsXG4gICAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgICBicm90bGlTaXplOiB0cnVlLFxuICAgICAgfSksXG4gICAgLy8gTm90ZTogQ29tcHJlc3Npb24gaXMgaGFuZGxlZCBieSBWZXJjZWwgaW4gcHJvZHVjdGlvblxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgc2VydmVyOiB7XG4gICAgaG1yOiB7XG4gICAgICBwb3J0OiAyNDY4MCxcbiAgICAgIG92ZXJsYXk6IGZhbHNlLCAvLyBEaXNhYmxlIGVycm9yIG92ZXJsYXkgdG8gcHJldmVudCBmdWxsIHBhZ2UgcmVsb2Fkc1xuICAgICAgcHJvdG9jb2w6IFwid3NcIixcbiAgICAgIGhvc3Q6IFwibG9jYWxob3N0XCIsXG4gICAgICBjbGllbnRQb3J0OiAyNDY4MCxcbiAgICAgIC8vIEVuc3VyZSBDU1MgdXBkYXRlcyBhcmUgaGFuZGxlZCBwcm9wZXJseVxuICAgICAgdGltZW91dDogMzAwMDAsXG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgLy8gT25seSB1c2UgcG9sbGluZyBvbiBXaW5kb3dzIG9yIGlmIGV4cGxpY2l0bHkgbmVlZGVkXG4gICAgICAvLyBOYXRpdmUgZmlsZSB3YXRjaGluZyBpcyBmYXN0ZXIgb24gbWFjT1MvTGludXhcbiAgICAgIHVzZVBvbGxpbmc6IHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIixcbiAgICAgIGludGVydmFsOiBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCIgPyAzMDAwIDogdW5kZWZpbmVkLCAvLyBJbmNyZWFzZWQgZnJvbSAxMDAwbXMgZm9yIGJldHRlciBwZXJmb3JtYW5jZVxuICAgICAgLy8gV2F0Y2ggQ1NTIGZpbGVzIG1vcmUgcmVsaWFibHkgLSBpZ25vcmUgbW9yZSBmb3IgcGVyZm9ybWFuY2VcbiAgICAgIGlnbm9yZWQ6IFtcbiAgICAgICAgXCIqKi9ub2RlX21vZHVsZXMvKipcIixcbiAgICAgICAgXCIqKi8uZ2l0LyoqXCIsXG4gICAgICAgIFwiKiovZGlzdC8qKlwiLFxuICAgICAgICBcIioqL2NvdmVyYWdlLyoqXCIsXG4gICAgICAgIFwiKiovLnJlYWN0LXJvdXRlci8qKlwiLFxuICAgICAgICBcIioqL3ByaXNtYS9taWdyYXRpb25zLyoqXCIsXG4gICAgICBdLFxuICAgIH0sXG4gICAgY29yczogdHJ1ZSxcbiAgICAvLyBQcmUtdHJhbnNmb3JtIGZyZXF1ZW50bHkgcmVxdWVzdGVkIGZpbGVzIGZvciBmYXN0ZXIgaW5pdGlhbCBsb2FkXG4gICAgd2FybXVwOiB7XG4gICAgICBjbGllbnRGaWxlczogW1xuICAgICAgICBcIi4vYXBwL3Jvb3QudHN4XCIsXG4gICAgICAgIFwiLi9hcHAvcm91dGVzL1Jvb3RMYXlvdXQudHN4XCIsXG4gICAgICAgIFwiLi9hcHAvcm91dGVzL2hvbWUudHN4XCIsXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIGNzczoge1xuICAgIGRldlNvdXJjZW1hcDogaXNEZXYsIC8vIE9ubHkgaW4gZGV2ZWxvcG1lbnRcbiAgICBwb3N0Y3NzOiB7XG4gICAgICBwbHVnaW5zOiBbXSxcbiAgICB9LFxuICAgIC8vIEltcHJvdmUgSE1SIGZvciBDU1MgdXBkYXRlc1xuICAgIG1vZHVsZXM6IHtcbiAgICAgIGdlbmVyYXRlU2NvcGVkTmFtZTogXCJbbmFtZV1fX1tsb2NhbF1fX19baGFzaDpiYXNlNjQ6NV1cIixcbiAgICB9LFxuICAgIC8vIERpc2FibGUgQ1NTIGNvZGUgc3BsaXR0aW5nIGluIGRldiB0byBwcmV2ZW50IGxvc3MgZHVyaW5nIEhNUlxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHt9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlczIwMjJcIixcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiBpZCA9PiB7XG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkge1xuICAgICAgICAgICAgLy8gUmVhY3QgY29yZVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcyhcInJlYWN0XCIpIHx8XG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwicmVhY3QtZG9tXCIpIHx8XG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwicmVhY3Qtcm91dGVyXCIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwicmVhY3QtdmVuZG9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFJlYWN0IFF1ZXJ5XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIpIHx8XG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5LWRldnRvb2xzXCIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwicmVhY3QtcXVlcnktdmVuZG9yXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZvcm0gdmFsaWRhdGlvblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcyhcIkBjb25mb3JtLXRvXCIpIHx8XG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiem9kXCIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiZm9ybS12ZW5kb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaTE4blxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcyhcImkxOG5leHRcIikgfHxcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCJyZWFjdC1pMThuZXh0XCIpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiaTE4bi12ZW5kb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2hhcnRzXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKFwiY2hhcnQuanNcIikgfHxcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoXCJyZWFjdC1jaGFydGpzLTJcIilcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gXCJjaGFydC12ZW5kb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQW5pbWF0aW9uXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJnc2FwXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBcImFuaW1hdGlvbi12ZW5kb3JcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXIgdmVuZG9yIGNvZGVcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvclwiXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIE1pbmlmaWNhdGlvbiAtIGVzYnVpbGQgaXMgZmFzdGVyIGFuZCB3b3JrcyB3ZWxsIGZvciBtb3N0IGNhc2VzXG4gICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICAvLyBOb3RlOiBlc2J1aWxkIGRvZXNuJ3Qgc3VwcG9ydCBkcm9wX2NvbnNvbGUsIGJ1dCBwcm9kdWN0aW9uIGJ1aWxkc1xuICAgIC8vIHdpbGwgc3RpbGwgYmUgbWluaWZpZWQuIEZvciBjb25zb2xlIHJlbW92YWwsIGNvbnNpZGVyIHVzaW5nIGEgcGx1Z2luXG4gICAgLy8gb3Igc3dpdGNoaW5nIHRvIHRlcnNlciAocmVxdWlyZXMgaW5zdGFsbGluZyB0ZXJzZXIgcGFja2FnZSlcbiAgfSxcbiAgc3NyOiB7XG4gICAgbm9FeHRlcm5hbDogW1xuICAgICAgXCJAbWphY2tzb24vbm9kZS1mZXRjaC1zZXJ2ZXJcIixcbiAgICAgIFwiQHJlYWN0LXJvdXRlci9ub2RlXCIsXG4gICAgXSxcbiAgICAvLyBFeHRlcm5hbGl6ZSBoZWF2eSBkZXBlbmRlbmNpZXMgdGhhdCBkb24ndCBuZWVkIFNTUiBidW5kbGluZ1xuICAgIGV4dGVybmFsOiBbXG4gICAgICBcInNoYXJwXCIsXG4gICAgICBcInB1cHBldGVlclwiLFxuICAgICAgXCJiY3J5cHRqc1wiLFxuICAgICAgXCJAcHJpc21hL2NsaWVudFwiLFxuICAgIF0sXG4gICAgLy8gRml4IFJlYWN0IDE5IEVTTS9DSlMgaW50ZXJvcCBpc3N1ZXNcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgXCJyZWFjdFwiLFxuICAgICAgICBcInJlYWN0LWRvbVwiLFxuICAgICAgICBcInJlYWN0LWRvbS9zZXJ2ZXJcIixcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgXSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgdGFyZ2V0OiBcImVzMjAyMlwiLFxuICAgIH0sXG4gICAgLy8gRm9yY2UgcmUtYnVuZGxpbmcgb25seSB3aGVuIGRlcGVuZGVuY2llcyBjaGFuZ2UgKHNwZWVkcyB1cCBzdWJzZXF1ZW50IHN0YXJ0cylcbiAgICBmb3JjZTogZmFsc2UsXG4gICAgLy8gUHJlLWJ1bmRsZSBmcmVxdWVudGx5IHVzZWQgZGVwZW5kZW5jaWVzIGZvciBmYXN0ZXIgY29sZCBzdGFydHNcbiAgICBpbmNsdWRlOiBbXG4gICAgICAvLyBSZWFjdCBlY29zeXN0ZW1cbiAgICAgIFwicmVhY3RcIixcbiAgICAgIFwicmVhY3QtZG9tXCIsXG4gICAgICBcInJlYWN0LXJvdXRlclwiLFxuICAgICAgXG4gICAgICAvLyBTdGF0ZSBtYW5hZ2VtZW50ICYgcXVlcmllc1xuICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgIFwienVzdGFuZFwiLFxuICAgICAgXG4gICAgICAvLyBpMThuXG4gICAgICBcInJlYWN0LWkxOG5leHRcIixcbiAgICAgIFwiaTE4bmV4dFwiLFxuICAgICAgXCJpMThuZXh0LWJyb3dzZXItbGFuZ3VhZ2VkZXRlY3RvclwiLFxuICAgICAgXCJpMThuZXh0LWh0dHAtYmFja2VuZFwiLFxuICAgICAgXG4gICAgICAvLyBGb3JtcyAmIHZhbGlkYXRpb25cbiAgICAgIFwiQGNvbmZvcm0tdG8vcmVhY3RcIixcbiAgICAgIFwiQGNvbmZvcm0tdG8vem9kXCIsXG4gICAgICBcInpvZFwiLFxuICAgICAgXG4gICAgICAvLyBVdGlsaXRpZXNcbiAgICAgIFwiY2xzeFwiLFxuICAgICAgXCJ0YWlsd2luZC1tZXJnZVwiLFxuICAgICAgXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIixcbiAgICAgIFwiZGF0ZS1mbnNcIixcbiAgICAgIFwiY29va2llXCIsXG4gICAgICBcbiAgICAgIC8vIEljb25zIChmcmVxdWVudGx5IGltcG9ydGVkKVxuICAgICAgXCJyZWFjdC1pY29ucy9nclwiLFxuICAgICAgXCJyZWFjdC1pY29ucy9tZFwiLFxuICAgICAgXCJyZWFjdC1pY29ucy9mYVwiLFxuICAgICAgXCJyZWFjdC1pY29ucy9pbzVcIixcbiAgICBdLFxuICAgIC8vIEV4Y2x1ZGUgaGVhdnkgZGV2LW9ubHkgZGVwZW5kZW5jaWVzXG4gICAgZXhjbHVkZTogW1xuICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnktZGV2dG9vbHNcIixcbiAgICAgIFwicmVhY3Qtcm91dGVyLWRldnRvb2xzXCIsXG4gICAgXSxcbiAgfSxcbiAgYXNzZXRzSW5jbHVkZTogW1xuXCIqKi8qLndlYnBcIiwgXCIqKi8qLnBuZ1wiLCBcIioqLyouanBnXCIsIFwiKiovKi5qcGVnXCIsIFwiKiovKi5zdmdcIlxuXSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThPLE9BQU8sYUFBYTtBQUVsUSxTQUFTLG1CQUFtQjtBQUM1QixPQUFPLGlCQUFpQjtBQUN4QixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxtQkFBbUI7QUFFMUIsSUFBTSxRQUFRLFFBQVEsSUFBSSxhQUFhO0FBQ3ZDLElBQU0sWUFBWSxRQUFRLElBQUksWUFBWTtBQUUxQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUE7QUFBQSxJQUVQ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
