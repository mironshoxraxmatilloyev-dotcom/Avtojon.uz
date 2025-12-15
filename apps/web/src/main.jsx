import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 🚀 Lazy load - kerak bo'lganda yuklanadi
const SocketProvider = lazy(() => 
  import('./contexts/SocketContext').then(mod => ({ default: mod.SocketProvider }))
)
const Toaster = lazy(() => 
  import('react-hot-toast').then(mod => ({ default: mod.Toaster }))
)

// 🎯 Production da StrictMode o'chiriladi (2x render yo'q)
const isDev = import.meta.env.DEV
const Wrapper = isDev ? StrictMode : ({ children }) => children

// 🚀 Root render
createRoot(document.getElementById('root')).render(
  <Wrapper>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={null}>
        <SocketProvider>
          <App />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000, // Qisqaroq
              style: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
              },
            }}
            containerStyle={{
              top: 16,
              right: 16,
            }}
          />
        </SocketProvider>
      </Suspense>
    </BrowserRouter>
  </Wrapper>
)
