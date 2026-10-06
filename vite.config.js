import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Browser QA profiles contain files locked by Chrome on Windows.
      ignored: ['**/.logbook-check.local/**'],
    },
  },
})
