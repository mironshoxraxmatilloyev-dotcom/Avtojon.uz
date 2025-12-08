import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { 
  LayoutDashboard, Users, Route, LogOut, Menu, X, Calculator, 
  Truck, Bell, ChevronRight, Sparkles
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Umumiy statistika' },
  { path: '/dashboard/drivers', icon: Users, label: 'Shofyorlar', description: 'Haydovchilar royxati' },
  { path: '/dashboard/trips', icon: Route, label: 'Reyslar', description: 'Barcha reyslar' },
  { path: '/dashboard/salaries', icon: Calculator, label: 'Maoshlar', description: 'Moliya boshqaruvi' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="p-3 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 hover:shadow-xl transition-all"
        >
          {sidebarOpen ? <X size={22} className="text-gray-700" /> : <Menu size={22} className="text-gray-700" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 transform transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Avtojon
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{user?.companyName || 'Biznes panel'}</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 mx-4 mt-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-emerald-500/30">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@avtojon.uz'}</p>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors relative">
              <Bell size={18} className="text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 mt-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3">Asosiy</p>
          {navItems.map(({ path, icon: Icon, label, description }) => {
            const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{label}</p>
                  <p className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{description}</p>
                </div>
                <ChevronRight size={16} className={`transition-transform ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-6 pt-20 lg:pt-6">
          <Outlet />
        </div>
      </main>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  )
}
