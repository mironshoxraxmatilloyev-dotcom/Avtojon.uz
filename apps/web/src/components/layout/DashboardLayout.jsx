import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { 
  LayoutDashboard, Users, Route, LogOut, Menu, X, Calculator, 
  Truck, ChevronRight, Sparkles
} from 'lucide-react'
import { useState, createContext, useContext, useEffect, useRef } from 'react'

// Sidebar context
const SidebarContext = createContext()
export const useSidebar = () => useContext(SidebarContext)

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Umumiy statistika' },
  { path: '/dashboard/drivers', icon: Users, label: 'Shofyorlar', description: 'Haydovchilar ro\'yxati' },
  { path: '/dashboard/trips', icon: Route, label: 'Reyslar', description: 'Barcha reyslar' },
  { path: '/dashboard/salaries', icon: Calculator, label: 'Maoshlar', description: 'Moliya boshqaruvi' },
]

// Animated nav item with hover effect
function AnimatedNavItem({ path, icon: Icon, label, description, isActive, onClick }) {
  const itemRef = useRef(null)
  
  return (
    <NavLink
      ref={itemRef}
      to={path}
      end={path === '/dashboard'}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
        isActive ? 'bg-white/20 rotate-0' : 'bg-white/5 group-hover:bg-white/10 group-hover:rotate-6'
      }`}>
        <Icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        <p className={`text-xs transition-colors ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{description}</p>
      </div>
      <ChevronRight 
        size={16} 
        className={`transition-all duration-300 ${
          isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
        }`} 
      />
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Entrance animation
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    const isDemo = user?.username === 'demo'
    logout()
    // Demo rejimda bosh sahifaga, aks holda login sahifasiga
    navigate(isDemo ? '/' : '/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      {/* Mobile Header with menu button */}
      {!sidebarOpen && (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            >
              <Menu size={22} className="text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">Avtojon</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 transform transition-all duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all hover:scale-105 cursor-pointer">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Avtojon
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">{user?.companyName || 'Avtojon'}</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className={`p-4 mx-4 mt-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@avtojon.uz'}</p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 mt-2">
          <p className={`text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
            Asosiy
          </p>
          {navItems.map(({ path, icon: Icon, label, description }, index) => {
            const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
            return (
              <div 
                key={path} 
                className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${250 + index * 50}ms` }}
              >
                <AnimatedNavItem
                  path={path}
                  icon={Icon}
                  label={label}
                  description={description}
                  isActive={isActive}
                  onClick={() => setSidebarOpen(false)}
                />
              </div>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all active:scale-[0.98] group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-4 sm:p-6 pt-16 lg:pt-6 animate-fadeIn">
          <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
            <Outlet />
          </SidebarContext.Provider>
        </div>
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fadeIn" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  )
}
