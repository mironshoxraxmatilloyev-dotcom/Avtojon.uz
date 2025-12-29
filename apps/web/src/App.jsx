import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, memo, useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { AlertProvider } from './components/ui'
import api from './services/api'
import SubscriptionAlert from './components/subscription/SubscriptionAlert'
import { connectSocket, joinBusinessRoom, joinDriverRoom } from './services/socket'

// 🔌 Global Socket Connection Hook
function useGlobalSocket() {
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!user || !token) return

    // Socket ni ulash
    connectSocket()

    // Role ga qarab room ga qo'shilish
    if (user.role === 'business' && user._id) {
      joinBusinessRoom(user._id)
    } else if (user.role === 'driver' && user.driverId) {
      joinDriverRoom(user.driverId)
    }
  }, [user, token])
}

// 🚀 Auth initialization hook
function useInitAuth() {
  const { initAuth, initialized } = useAuthStore()
  const [ready, setReady] = useState(false)
  
  useEffect(() => {
    if (!initialized) {
      initAuth().finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [initAuth, initialized])
  
  return ready
}

// 🚀 LAZY LOADING
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Drivers = lazy(() => import('./pages/DriversNew'))
const DriverDetail = lazy(() => import('./pages/DriverDetail'))
const Flights = lazy(() => import('./pages/Flights'))
const FlightDetail = lazy(() => import('./pages/FlightDetail'))
const Reports = lazy(() => import('./pages/Reports'))
const DriverHome = lazy(() => import('./pages/driver/DriverHome'))
const SuperAdminPanel = lazy(() => import('./pages/superadmin/SuperAdminPanel'))
const FleetDashboard = lazy(() => import('./pages/fleet/FleetDashboard'))
const VehicleDetailPanel = lazy(() => import('./pages/fleet/VehicleDetailPanel'))
const Payment = lazy(() => import('./pages/Payment'))

import DashboardLayout from './components/layout/DashboardLayout'

// Loading Spinner
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-gray-500 mt-3 text-sm">Yuklanmoqda...</p>
    </div>
  </div>
))

const MiniLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
))

// Scroll to top
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// 🔐 Global auth validation cache
let authValidationCache = { isValid: false, timestamp: 0, promise: null }
const AUTH_CACHE_TTL = 60000 // 1 daqiqa cache

// 🔐 INSTANT Auth Hook - optimizatsiya qilingan
function useAuthValidation() {
  const { token, user, logout } = useAuthStore()
  
  // 🚀 INSTANT: User va token bor bo'lsa - darhol valid
  const [isValidating, setIsValidating] = useState(() => !user && !!token)
  const [isValid, setIsValid] = useState(() => !!user && !!token)
  
  useEffect(() => {
    // Token yo'q - validatsiya kerak emas
    if (!token) {
      setIsValidating(false)
      setIsValid(false)
      return
    }
    
    // 🚀 INSTANT: User bor - darhol valid, loading yo'q
    if (user) {
      setIsValid(true)
      setIsValidating(false)
      authValidationCache.isValid = true
      authValidationCache.timestamp = Date.now()
      return
    }
    
    // Cache tekshirish
    const now = Date.now()
    if (authValidationCache.isValid && (now - authValidationCache.timestamp) < AUTH_CACHE_TTL) {
      setIsValid(true)
      setIsValidating(false)
      return
    }
    
    // Agar allaqachon tekshirilayotgan bo'lsa, kutish
    if (authValidationCache.promise) {
      authValidationCache.promise
        .then(() => setIsValid(authValidationCache.isValid))
        .catch(() => setIsValid(false))
        .finally(() => setIsValidating(false))
      return
    }
    
    // Faqat user yo'q bo'lganda serverdan tekshirish
    setIsValidating(true)
    authValidationCache.promise = api.get('/auth/me')
    
    authValidationCache.promise
      .then(() => {
        authValidationCache.isValid = true
        authValidationCache.timestamp = Date.now()
        setIsValid(true)
      })
      .catch(() => {
        authValidationCache.isValid = false
        logout()
        setIsValid(false)
      })
      .finally(() => {
        authValidationCache.promise = null
        setIsValidating(false)
      })
  }, [token, user, logout])
  
  return { isValidating, isValid, token, user }
}

// Auth cache ni tozalash (logout da ishlatiladi)
export const clearAuthCache = () => {
  authValidationCache = { isValid: false, timestamp: 0, promise: null }
}

// Global function sifatida ham export qilish
if (typeof window !== 'undefined') {
  window.__clearAuthCache = clearAuthCache
}

// Protected Route - Business uchun (Super Admin yaratgan - /dashboard)
const BusinessRoute = ({ children }) => {
  const { user } = useAuthStore()
  const { isValidating, isValid, token } = useAuthValidation()
  
  if (isValidating) return <MiniLoader />
  if (!token || !isValid) return <Navigate to="/login" replace />
  if (user?.role === 'driver') return <Navigate to="/driver" replace />
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />
  if (user?.role === 'admin') return <Navigate to="/fleet" replace />
  return children
}

// Protected Route - Fleet (Register qilganlar - admin role)
const FleetRoute = ({ children }) => {
  const { user } = useAuthStore()
  const { isValidating, isValid, token } = useAuthValidation()
  
  if (isValidating) return <MiniLoader />
  if (!token || !isValid) return <Navigate to="/login" replace />
  if (user?.role === 'driver') return <Navigate to="/driver" replace />
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />
  if (user?.role === 'business') return <Navigate to="/dashboard" replace />
  return children
}

// Protected Route - Shofyor uchun
const DriverRoute = ({ children }) => {
  const { user } = useAuthStore()
  const { isValidating, isValid, token } = useAuthValidation()
  
  if (isValidating) return <MiniLoader />
  if (!token || !isValid) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/fleet" replace />
  if (user?.role === 'business') return <Navigate to="/dashboard" replace />
  if (user?.role === 'super_admin') return <Navigate to="/super-admin" replace />
  return children
}

// Protected Route - Super Admin uchun
const SuperAdminRoute = ({ children }) => {
  const { user } = useAuthStore()
  const { isValidating, isValid, token } = useAuthValidation()
  
  if (isValidating) return <MiniLoader />
  if (!token || !isValid) return <Navigate to="/login" replace />
  if (user?.role !== 'super_admin') return <Navigate to="/login" replace />
  return children
}

function App() {
  const authReady = useInitAuth()
  const location = useLocation()
  
  // 🔌 Global socket ulanishi
  useGlobalSocket()
  
  // Auth yuklangunga qadar kutish
  if (!authReady) {
    return <PageLoader />
  }
  
  // Landing page uchun safe-area-wrapper ishlatmaymiz
  const isLandingPage = location.pathname === '/'
  
  return (
    <AlertProvider>
      <ScrollToTop />
      <SubscriptionAlert />
      {isLandingPage ? (
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
          </Routes>
        </Suspense>
      ) : (
        <div className="safe-area-wrapper">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Business - Super Admin yaratgan biznesmenlar uchun */}
              <Route path="/dashboard" element={<BusinessRoute><DashboardLayout /></BusinessRoute>}>
                <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                <Route path="drivers" element={<Suspense fallback={<PageLoader />}><Drivers /></Suspense>} />
                <Route path="drivers/:id" element={<Suspense fallback={<PageLoader />}><DriverDetail /></Suspense>} />
                <Route path="flights" element={<Suspense fallback={<PageLoader />}><Flights /></Suspense>} />
                <Route path="flights/:id" element={<Suspense fallback={<PageLoader />}><FlightDetail /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
              </Route>

              {/* Driver */}
              <Route path="/driver" element={<DriverRoute><Suspense fallback={<PageLoader />}><DriverHome /></Suspense></DriverRoute>} />

              {/* Super Admin */}
              <Route path="/super-admin" element={<SuperAdminRoute><Suspense fallback={<PageLoader />}><SuperAdminPanel /></Suspense></SuperAdminRoute>} />

              {/* Fleet - Register qilganlar uchun */}
              <Route path="/fleet" element={<FleetRoute><Suspense fallback={<PageLoader />}><FleetDashboard /></Suspense></FleetRoute>} />
              <Route path="/fleet/vehicle/:id" element={<FleetRoute><Suspense fallback={<PageLoader />}><VehicleDetailPanel /></Suspense></FleetRoute>} />

              {/* Payment */}
              <Route path="/payment" element={<FleetRoute><Suspense fallback={<PageLoader />}><Payment /></Suspense></FleetRoute>} />
              <Route path="/payment/success" element={<Suspense fallback={<PageLoader />}><Payment /></Suspense>} />
              <Route path="/payment/failed" element={<Suspense fallback={<PageLoader />}><Payment /></Suspense>} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      )}
    </AlertProvider>
  )
}

export default App
