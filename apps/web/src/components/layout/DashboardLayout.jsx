import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  BarChart3,
  Sparkles
} from 'lucide-react'
import { useState, createContext, useContext, useEffect, useRef } from 'react'
import { BusinessSubscriptionBlocker } from '../subscription/SubscriptionBlocker'
import api from '../../services/api'

// Sidebar context
const SidebarContext = createContext()
export const useSidebar = () => useContext(SidebarContext)

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Umumiy statistika' },
  { path: '/dashboard/drivers', icon: Users, label: 'Haydovchilar', description: 'Haydovchilar ro\'yxati' },
  { path: '/dashboard/reports', icon: BarChart3, label: 'Hisobotlar', description: 'Statistika va grafiklar' },
]

// Secondary nav items removed - not needed for business panel

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
      .catch(() => { })

    // Serverdan subscription tekshirish
    api
      .get('/auth/me')
      .then((res) => {
        if (!isMounted.current) return
        const userData = res.data.data

        console.log('[DashboardLayout] User subscription data:', userData?.subscription)

        // Biznesmen yaratilgan sanani tekshirish
        const registrationDate = userData?.registrationDate || userData?.createdAt
        if (registrationDate) {
          const regDate = new Date(registrationDate)
          const now = new Date()
          const daysSinceRegistration = Math.floor((now - regDate) / (1000 * 60 * 60 * 24))
          
          console.log('[DashboardLayout] Registration date:', registrationDate)
          console.log('[DashboardLayout] Days since registration:', daysSinceRegistration)
          
          // Agar 7 kundan kam bo'lsa - trial davom etmoqda
          if (daysSinceRegistration < 7) {
            console.log('[DashboardLayout] Still in trial period')
            setSubscriptionExpired(false)
            return
          }
        }

        // checkSubscription metodidan kelgan ma'lumot (subscriptionInfo)
        const subInfo = userData?.subscriptionInfo || userData?.subscription

        console.log('[DashboardLayout] Subscription info:', subInfo)

        if (subInfo?.isExpired) {
          console.log('[DashboardLayout] Subscription expired!')
          setSubscriptionExpired(true)
          return
        }

        // User dan subscription.endDate ni tekshirish
        const endDate = subInfo?.endDate || userData?.subscription?.endDate
        if (endDate) {
          const expiryDate = new Date(endDate)
          const now = new Date()
          console.log('[DashboardLayout] Checking endDate:', endDate, 'expired:', expiryDate < now)
          if (expiryDate < now) {
            setSubscriptionExpired(true)
            return
          }
        }

        // Eski format - subscriptionExpiry
        if (userData?.subscriptionExpiry) {
          const expiryDate = new Date(userData.subscriptionExpiry)
          if (expiryDate < new Date()) {
            setSubscriptionExpired(true)
            return
          }
        }

        // Eski format - trialEndsAt
        if (userData?.trialEndsAt) {
          const trialEnd = new Date(userData.trialEndsAt)
          if (trialEnd < new Date()) {
            setSubscriptionExpired(true)
            return
          }
        }

        // Agar hech qanday subscription ma'lumoti yo'q bo'lsa va 7 kundan ko'p bo'lsa
        if (!subInfo && !userData?.subscriptionExpiry && !userData?.trialEndsAt && registrationDate) {
          const regDate = new Date(registrationDate)
          const now = new Date()
          const daysSinceRegistration = Math.floor((now - regDate) / (1000 * 60 * 60 * 24))
          
          if (daysSinceRegistration >= 7) {
            console.log('[DashboardLayout] Trial period ended, no subscription found')
            setSubscriptionExpired(true)
            return
          }
        }

        // Default: subscription active
        setSubscriptionExpired(false)
      })
      .catch((err) => {
        console.error('[DashboardLayout] Error checking subscription:', err)
      })
  }, [isDemoMode])

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
    <div className="bg-slate-50" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
              <img src="/main_logo.jpg" alt="Avtojon" className="w-8 h-8 rounded-lg object-cover" />
              <div className="flex items-baseline gap-0">
                <span className="font-bold text-gray-900">avto</span>
                <span className="font-bold text-amber-500">JON</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - fixed height, no scroll */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 transform transition-all duration-300 ease-out lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          height: '100vh',
          overflow: 'hidden',
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      >
        {/* Logo Section - fixed top */}
        <div className="flex-shrink-0 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <img src="/main_logo.jpg" alt="Avtojon" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-0">
                  <span>avto</span><span className="text-amber-400">JON</span>
                </h1>
                <p className="text-[10px] text-slate-500">{user?.companyName || 'avtoJON'}</p>
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

        {/* Navigation - no scroll */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Asosiy</p>
          <div className="space-y-1 mb-6">
            {navItems.map(({ path, icon: Icon, label, description }) => {
              const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
              return (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/dashboard'}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${isActive
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
      <main className="lg:ml-72 h-screen overflow-y-auto bg-slate-50 pb-20 lg:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-4 sm:p-6 pt-16 lg:pt-6 animate-fadeIn">
          <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
            <Outlet />
          </SidebarContext.Provider>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/dashboard'}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-50' : 'bg-transparent'
                  }`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

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
