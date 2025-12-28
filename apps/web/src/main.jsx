import { StrictMode, lazy, Suspense, Fragment, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 📱 Capacitor StatusBar sozlash
const initStatusBar = async () => {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import('@capacitor/status-bar')
      await StatusBar.setOverlaysWebView({ overlay: false })
      await StatusBar.setBackgroundColor({ color: '#6d28d9' })
      await StatusBar.setStyle({ style: Style.Light })
    }
  } catch (e) {
    // Web da xato emas
  }
}
initStatusBar()

// 🚀 Lazy load
const Toaster = lazy(() => 
  import('react-hot-toast').then(mod => ({ default: mod.Toaster }))
)

// 🎯 Production da StrictMode o'chiriladi
const isDev = import.meta.env.DEV
const Wrapper = isDev ? StrictMode : Fragment

// 🚀 Root render
createRoot(document.getElementById('root')).render(
  <Wrapper>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Suspense fallback={null}>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { background: 'transparent', boxShadow: 'none', padding: 0 },
          }}
          containerStyle={{ top: 12 }}
        />
      </Suspense>
    </BrowserRouter>
  </Wrapper>
)
