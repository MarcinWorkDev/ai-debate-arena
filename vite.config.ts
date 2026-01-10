import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true, // Clean output directory before build
  },
  server: {
    headers: {
      // Required for Firebase Auth popup to work
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
