import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, memo, useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { AlertProvider } from './components/ui'
import api from './services/api'

// 🚀 LAZY LOADING - Sahifalar faqat kerak bo'lganda yuklanadi
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Drivers = lazy(() => import('./pages/Drivers'))
const DriverDetail = lazy(() => import('./pages/DriverDetail'))
const Salaries = lazy(() => import('./pages/Salaries'))
const Flights = lazy(() => import('./pages/Flights'))
const FlightDetail = lazy(() => import('./pages/FlightDetail'))
const DriverHome = lazy(() => import('./pages/driver/DriverHome'))

// Layout - bu tez yuklanishi kerak
import DashboardLayout from './components/layout/DashboardLayout'

// 🎯 Loading Spinner - minimal va tez
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-500 mt-3 text-sm">Yuklanmoqda...</p>
    </div>
  </div>
))

// 🎯 Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Protected Route - Admin uchun
const ProtectedRoute = ({ children }) => {
  const { token, user, logout } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false)
        return
      }
      
      try {
        // Token ni serverda tekshirish
        await api.get('/auth/me')
        setIsValid(true)
      } catch (error) {
        // Token yaroqsiz - logout qilish
        if (error.statusCode === 401) {
          logout()
        }
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }
    
    validateToken()
  }, [token, logout])
  
  // Tekshirilayotgan paytda loading ko'rsatish
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!token || !isValid) return <Navigate to="/login" replace />
  if (user?.role === 'driver') return <Navigate to="/driver" replace />
  return children
}

// Protected Route - Shofyor uchun
const DriverRoute = ({ children }) => {
  const { token, user, logout } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false)
        return
      }
      
      try {
        await api.get('/auth/me')
        setIsValid(true)
      } catch (error) {
        if (error.statusCode === 401) {
          logout()
        }
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }
    
    validateToken()
  }, [token, logout])
  
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  if (!token || !isValid) return <Navigate to="/login" replace />
  if (user?.role === 'admin' || user?.role === 'business') return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <AlertProvider>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="drivers" element={
              <Suspense fallback={<PageLoader />}>
                <Drivers />
              </Suspense>
            } />
            <Route path="drivers/:id" element={
              <Suspense fallback={<PageLoader />}>
                <DriverDetail />
              </Suspense>
            } />
            <Route path="flights" element={
              <Suspense fallback={<PageLoader />}>
                <Flights />
              </Suspense>
            } />
            <Route path="flights/:id" element={
              <Suspense fallback={<PageLoader />}>
                <FlightDetail />
              </Suspense>
            } />
            <Route path="salaries" element={
              <Suspense fallback={<PageLoader />}>
                <Salaries />
              </Suspense>
            } />
          </Route>

          {/* Driver routes */}
          <Route path="/driver" element={
            <DriverRoute>
              <Suspense fallback={<PageLoader />}>
                <DriverHome />
              </Suspense>
            </DriverRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AlertProvider>
  )
}

export default App
