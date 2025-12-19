import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 🚀 Lazy load
const Toaster = lazy(() => 
  import('react-hot-toast').then(mod => ({ default: mod.Toaster }))
)

// 🎯 Production da StrictMode o'chiriladi
const isDev = import.meta.env.DEV
const Wrapper = isDev ? StrictMode : ({ children }) => children

// 🚀 Root render
createRoot(document.getElementById('root')).render(
  <Wrapper>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Suspense fallback={null}>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: 'transparent', boxShadow: 'none', padding: 0 },
          }}
          containerStyle={{ top: 16, right: 16 }}
        />
      </Suspense>
    </BrowserRouter>
  </Wrapper>
)
