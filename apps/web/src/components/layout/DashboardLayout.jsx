import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  BarChart3,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useState, createContext, useContext, useEffect, memo, useRef } from 'react'
import { BusinessSubscriptionBlocker } from '../subscription/SubscriptionBlocker'
import api from '../../services/api'

// Sidebar context
const SidebarContext = createContext()
export const useSidebar = () => useContext(SidebarContext)

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Umumiy statistika' },
  { path: '/dashboard/drivers', icon: Users, label: 'Haydovchilar', description: 'Haydovchilar ro\'yxati' },
  // { path: '/dashboard/flights', icon: Route, label: 'Reyslar', description: 'Faol va tugatilgan' },
  // { path: '/dashboard/trips', icon: Route, label: 'Eski reyslar', description: 'Barcha reyslar' },
  // { path: '/dashboard/salaries', icon: Calculator, label: 'Maoshlar', description: 'Moliya boshqaruvi' },
  { path: '/dashboard/reports', icon: BarChart3, label: 'Hisobotlar', description: 'Statistika va grafiklar' },
]

// 🚀 Optimized nav item with memo
const AnimatedNavItem = memo(function AnimatedNavItem({ path, icon: Icon, label, description, isActive, onClick }) {
  return (
    <NavLink
      to={path}
      end={path === '/dashboard'}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
        isActive ? 'bg-white/20' : 'bg-white/5'
      }`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        <p className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{description}</p>
      </div>
      <ChevronRight 
        size={16} 
        className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} 
      />
    </NavLink>
  )
})

export default function DashboardLayout() {
  const { user, logout, isDemo } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [subscriptionExpired, setSubscriptionExpired] = useState(false)
  const [driverCount, setDriverCount] = useState(1)
  const isMounted = useRef(true)
  const isDemoMode = isDemo()

  // Unmount tracking
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Entrance animation
  useEffect(() => {
    setMounted(true)
  }, [])

  // 🔥 Subscription tekshirish - barcha sahifalar uchun
  useEffect(() => {
    if (isDemoMode) return

    // Haydovchilar sonini olish
    api
      .get('/drivers')
      .then((res) => {
        if (isMounted.current) {
          setDriverCount(res.data.data?.length || 1)
        }
      })
      .catch(() => {})

    // User dan subscription.endDate ni tekshirish
    const endDate = user?.subscription?.endDate
    if (endDate) {
      const expiryDate = new Date(endDate)
      if (expiryDate < new Date()) {
        setSubscriptionExpired(true)
        return
      }
    }

    // Eski format - subscriptionExpiry
    if (user?.subscriptionExpiry) {
      const expiryDate = new Date(user.subscriptionExpiry)
      if (expiryDate < new Date()) {
        setSubscriptionExpired(true)
        return
      }
    }

    // Eski format - trialEndsAt
    if (user?.trialEndsAt) {
      const trialEnd = new Date(user.trialEndsAt)
      if (trialEnd < new Date()) {
        setSubscriptionExpired(true)
        return
      }
    }
  }, [isDemoMode, user?.subscription?.endDate, user?.subscriptionExpiry, user?.trialEndsAt])

  // 🔥 Obuna tugagan bo'lsa - blocker ko'rsatish (barcha sahifalar uchun)
  if (subscriptionExpired && !isDemoMode) {
    return <BusinessSubscriptionBlocker driverCount={driverCount} />
  }

  const handleLogout = () => {
    const isDemo = user?.username === 'demo'
    logout()
    navigate(isDemo ? '/' : '/login')
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      {/* Mobile Header with menu button */}
      {!sidebarOpen && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
              <Menu size={22} className="text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Avtojon" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-bold text-gray-900">Avtojon</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - fixed height, no scroll */}
      <aside className={`fixed top-0 bottom-0 left-0 z-40 w-72 h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 transform transition-all duration-300 ease-out lg:translate-x-0 flex flex-col overflow-hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Section - fixed top */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <img src="/logo.jpg" alt="Avtojon" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
                  Avtojon
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h1>
                <p className="text-[10px] text-slate-500">{user?.companyName || 'Avtojon'}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-shrink-0 px-4 py-3">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@avtojon.uz'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-hidden">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Asosiy</p>
          <div className="space-y-1">
            {navItems.map(({ path, icon: Icon, label, description }) => {
              const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/dashboard'}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{label}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{description}</p>
                  </div>
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="flex-shrink-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2.5 w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 h-screen overflow-y-auto bg-slate-50">
        <div className="p-4 sm:p-6 pt-16 lg:pt-6 animate-fadeIn">
          <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
            <Outlet />
          </SidebarContext.Provider>
        </div>
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  )
}
