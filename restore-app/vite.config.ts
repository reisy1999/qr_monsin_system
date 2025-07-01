import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      buffer: 'buffer',
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  define: {
    global: {},
  },
})
