import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0', // Tarmoqda ochish uchun
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true, // WebSocket support
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📤 Sending Request:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📥 Received Response:', proxyRes.statusCode, req.url);
            });
          }
        }
      }
    }
  }
})
