import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) {
              return 'vendor'
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts'
            }
            if (id.includes('leaflet')) {
              return 'leaflet'
            }
            if (id.includes('@supabase')) {
              return 'supabase'
            }
          }
        }
      }
    }
  }
})
