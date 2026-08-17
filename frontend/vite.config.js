import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.monkeycode-ai.live'],
    host: true,
    port: 5173,
    // Makes every /api/* fetch appear same-origin to the browser during
    // local dev (the backend runs as a separate Next.js server on
    // :3000) — this is what lets the admin/agent/customer httpOnly
    // session cookies work without loosening CORS. See backend/README.md
    // "Architecture: two projects, one API".
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          leaflet: ['leaflet'],
          qr: ['qrcode.react', 'html5-qrcode'],
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})
