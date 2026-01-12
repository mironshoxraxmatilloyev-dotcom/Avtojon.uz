import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react({
        // Fast Refresh optimizatsiyasi
        fastRefresh: true,
      }),
      // Eski brauzerlar uchun (TV, eski telefonlar)
      legacy({
        targets: ['defaults', 'not IE 11', 'chrome >= 49', 'firefox >= 52', 'safari >= 10'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        renderLegacyChunks: true,
        modernPolyfills: true
      })
    ],
    
    // 🚀 BUILD OPTIMIZATSIYASI
    build: {
      // Chunk splitting - katta fayllarni bo'lish
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - alohida yuklanadi
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', 'zustand'],
            'vendor-map': ['leaflet', 'react-leaflet'],
            'vendor-utils': ['axios', 'socket.io-client', 'gsap'],
          }
        }
      },
      // Chunk size warning
      chunkSizeWarningLimit: 1000,
      // Minify - esbuild (tezroq, terser kerak emas)
      minify: 'esbuild',
      // Source maps faqat dev uchun
      sourcemap: mode === 'development',
      // Target
      target: 'es2020'
    },

    // 🚀 DEV SERVER OPTIMIZATSIYASI
    server: {
      port: 5173,
      host: '0.0.0.0',
      // HMR optimizatsiyasi
      hmr: {
        overlay: false // Error overlay ni o'chirish - tezroq
      },
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
        '/socket.io': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          ws: true
        }
      }
    },

    // 🚀 DEPENDENCY OPTIMIZATSIYASI
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom',
        'zustand',
        'axios',
        'lucide-react'
      ]
    },

    // 🚀 ESBUILD OPTIMIZATSIYASI
    esbuild: {
      // JSX optimizatsiyasi
      jsxInject: undefined,
      // Drop console in production
      drop: mode === 'production' ? ['console', 'debugger'] : []
    }
  }
})
