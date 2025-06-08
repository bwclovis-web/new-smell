import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths(), reactRouter()],
  build: {
    target: 'es2022', // Ensure target supports top-level await
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022', // Specify ESBuild target to support top-level await
    }
  }
})
