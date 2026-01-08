import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, memo, useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { AlertProvider } from './components/ui'
import api from './services/api'
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
  const { initAuth, initialized, token, user } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!initialized) {
        console.log('[App] Initializing auth...')
        const result = await initAuth()
        console.log('[App] Auth initialized:', { hasToken: !!result.token, hasUser: !!result.user })
      }
      setReady(true)
    }

    init()
  }, [initAuth, initialized])

  // Debug log
  useEffect(() => {
    if (ready) {
      console.log('[App] Ready state:', { token: !!token, user: !!user, role: user?.role })
    }
  }, [ready, token, user])

  return ready
}

// 🚀 LAZY LOADING
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Drivers = lazy(() => import('./pages/Drivers'))
const DriverDetail = lazy(() => import('./pages/DriverDetail'))
const Flights = lazy(() => import('./pages/Flights'))
// Temporarily import FlightDetail directly to debug the issue
import FlightDetail from './pages/FlightDetail'
// const FlightDetail = lazy(() => 
//   import('./pages/FlightDetail').catch(err => {
//     console.error('Failed to load FlightDetail:', err)
//     return { default: () => <div className="p-4 text-red-500">FlightDetail yuklanmadi. Sahifani yangilang.</div> }
//   })
// )
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

  // Fleet, dashboard, super-admin, driver - o'zlarining layout'lari bor, safe-area-wrapper kerak emas
  const noWrapperPaths = ['/', '/fleet', '/dashboard', '/super-admin', '/driver']
  const needsWrapper = !noWrapperPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))

  return (
    <AlertProvider>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        {needsWrapper ? (
          <div className="safe-area-wrapper">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Payment */}
              <Route path="/payment" element={<FleetRoute><Payment /></FleetRoute>} />
              <Route path="/payment/success" element={<Payment />} />
              <Route path="/payment/failed" element={<Payment />} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Landing />} />

            {/* Business - Super Admin yaratgan biznesmenlar uchun */}
            <Route path="/dashboard" element={<BusinessRoute><DashboardLayout /></BusinessRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="drivers/:id" element={<DriverDetail />} />
              <Route path="flights" element={<Flights />} />
              <Route path="flights/:id" element={<FlightDetail />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Driver */}
            <Route path="/driver" element={<DriverRoute><DriverHome /></DriverRoute>} />

            {/* Super Admin */}
            <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminPanel /></SuperAdminRoute>} />

            {/* Fleet - Register qilganlar uchun */}
            <Route path="/fleet" element={<FleetRoute><FleetDashboard /></FleetRoute>} />
            <Route path="/fleet/vehicle/:id" element={<FleetRoute><VehicleDetailPanel /></FleetRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </Suspense>
    </AlertProvider>
  )
}

export default App
