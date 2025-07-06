import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.1.182',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://192.168.1.182:5000',
        changeOrigin: true,
      },
    },
  },
})