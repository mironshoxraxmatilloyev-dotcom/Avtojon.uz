import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { AlertProvider } from './components/ui'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import DriverDetail from './pages/DriverDetail'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import Salaries from './pages/Salaries'

import DriverHome from './pages/driver/DriverHome'

// Layout
import DashboardLayout from './components/layout/DashboardLayout'

// Protected Route - Admin uchun
const ProtectedRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'driver') return <Navigate to="/driver" replace />
  return children
}

// Protected Route - Shofyor uchun
const DriverRoute = ({ children }) => {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <AlertProvider>
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
        <Route index element={<Dashboard />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="drivers/:id" element={<DriverDetail />} />
        <Route path="trips" element={<Trips />} />
        <Route path="trips/:id" element={<TripDetail />} />
        <Route path="salaries" element={<Salaries />} />
      </Route>

      {/* Driver routes */}
      <Route path="/driver" element={
        <DriverRoute>
          <DriverHome />
        </DriverRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AlertProvider>
  )
}

export default App
