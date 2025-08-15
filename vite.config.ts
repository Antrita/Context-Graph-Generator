import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['3d-force-graph', 'three', 'd3'],
    exclude: ['three/webgpu']
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'three': ['three'],
          '3d-force-graph': ['3d-force-graph'],
          'd3': ['d3']
        }
      }
    },
    target: 'esnext',
    minify: 'esbuild'
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
