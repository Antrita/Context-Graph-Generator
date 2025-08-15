import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate Three.js into its own chunk to avoid build issues
          if (id.includes('three')) {
            return 'three'
          }
          if (id.includes('d3')) {
            return 'd3'
          }
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild'
  },
  optimizeDeps: {
    include: ['d3'],
    exclude: ['three/build/three.webgpu.js']
  },
  define: {
    global: 'globalThis',
  }
})
