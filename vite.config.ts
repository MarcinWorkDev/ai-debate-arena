import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Required for Firebase Auth popup to work
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})
