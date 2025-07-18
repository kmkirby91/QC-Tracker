import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from any host
    port: 3000,
    allowedHosts: [
      'localhost',
      '192.168.1.182',
      'qctracker.a-naviq.com',
      '.a-naviq.com' // Allow all subdomains
    ],
    proxy: {
      '/api': {
        target: 'http://192.168.1.182:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  base: '/', // Ensure proper base path for reverse proxy
})