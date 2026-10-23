import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the same build works at a domain root (Vercel, custom domain)
  // and under a GitHub Pages project path like /portfolio-cs1.6-theme/.
  // Safe because the app is a single page with hash routing.
  base: './',
  build: {
    // The lazily loaded 3D scene (Three.js) is one ~930 kB chunk by design; the main bundle stays small.
    chunkSizeWarningLimit: 1000,
  },
})
