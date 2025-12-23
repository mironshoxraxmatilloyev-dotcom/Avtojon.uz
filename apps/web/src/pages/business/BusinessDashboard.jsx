import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import {
  Briefcase,
  LogOut,
  Bell,
  Users,
  Car,
  TrendingUp,
  MapPin,
  Calendar,
  ChevronRight,
  Route,
  DollarSign,
  Clock,
  Sparkles,
  Settings,
  FileText,
} from 'lucide-react'

export default function BusinessDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const [stats, setStats] = useState({
    drivers: 0,
    vehicles: 0,
    activeTrips: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch real stats from API
    setLoading(false)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  const formatDate = () => {
    const date = new Date()
    const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
    return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}`
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Dark style */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  {user?.businessType || 'Biznes Panel'}
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h1>
                <p className="text-xs text-slate-400">{user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors relative">
                <Bell size={20} />
              </button>
              <button className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Header - Dark gradient like Dashboard */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#2d2d44] to-[#1a1a2e] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-teal-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>

          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-300 text-sm mb-2">
              <Calendar size={14} />
              <span>{formatDate()}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Biznesmen'}! 👋
            </h2>
            <p className="text-emerald-200 text-sm sm:text-base">
              Biznes panelingizga xush kelibsiz. Barcha ma'lumotlaringizni shu yerdan boshqaring.
            </p>
          </div>
        </div>

        {/* Stats Cards - Colorful gradient cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.drivers}</p>
            <p className="text-blue-100 text-sm">Shofyorlar</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.vehicles}</p>
            <p className="text-emerald-100 text-sm">Mashinalar</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Route className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.activeTrips}</p>
            <p className="text-purple-100 text-sm">Faol reyslar</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-orange-100 text-sm">Daromad (so'm)</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Tezkor harakatlar
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <Users className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">Shofyorlar</p>
                    <p className="text-sm text-gray-500">Boshqarish va qo'shish</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <Car className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">Avtopark</p>
                    <p className="text-sm text-gray-500">Mashinalarni boshqarish</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                    <FileText className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">Hisobotlar</p>
                    <p className="text-sm text-gray-500">Statistika va tahlil</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                    <Route className="w-7 h-7 text-orange-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">Reyslar</p>
                    <p className="text-sm text-gray-500">Yo'nalishlarni ko'rish</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/10 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                    <DollarSign className="w-7 h-7 text-teal-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">Moliya</p>
                    <p className="text-sm text-gray-500">Daromad va xarajatlar</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            <button className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-500/10 transition-all text-left group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                    <Settings className="w-7 h-7 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">Sozlamalar</p>
                    <p className="text-sm text-gray-500">Profil va tizim</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">So'nggi faoliyat</h3>
          <div className="text-center py-12 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Hozircha faoliyat yo'q</p>
            <p className="text-sm mt-1">Yangi reyslar bu yerda ko'rinadi</p>
          </div>
        </div>
      </main>
    </div>
  )
}
