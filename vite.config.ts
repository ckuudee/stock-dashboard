import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, forward anything starting with /api to the Express server.
      // Lets the frontend use relative /api paths — same as production on Vercel.
      '/api': 'http://localhost:3001',
    },
  },
})
