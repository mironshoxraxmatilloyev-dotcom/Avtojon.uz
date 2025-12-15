import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Calendar, ArrowUpRight, Zap } from 'lucide-react'
import { AnimatedCard } from '../ui'

// 🎯 Quick Stats data
const getQuickStats = (stats) => [
  { label: 'Faol reyslar', value: stats.activeTrips, color: 'from-orange-400 to-orange-600' },
  { label: 'Yoldagi shofyorlar', value: stats.busyDrivers, color: 'from-blue-400 to-blue-600' },
  { label: 'Bosh shofyorlar', value: stats.freeDrivers, color: 'from-green-400 to-green-600' },
  { label: 'Kutilayotgan', value: stats.pendingTrips, color: 'from-purple-400 to-purple-600' },
]

// 🎯 Greeting helper
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Xayrli tong'
  if (hour < 18) return 'Xayrli kun'
  return 'Xayrli kech'
}

// 🚀 Demo Banner
export const DemoBanner = memo(function DemoBanner() {
  const navigate = useNavigate()
  
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Zap size={20} />
        </div>
        <div>
          <p className="font-semibold">Demo rejim</p>
          <p className="text-sm text-white/80">Bu demo versiya. To'liq funksiyadan foydalanish uchun ro'yxatdan o'ting.</p>
        </div>
      </div>
      <button 
        onClick={() => navigate('/register')}
        className="px-4 py-2 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition"
      >
        Ro'yxatdan o'tish
      </button>
    </div>
  )
})

// 🚀 Hero Header
export const DashboardHero = memo(function DashboardHero({ user, stats }) {
  const navigate = useNavigate()
  const quickStats = getQuickStats(stats)
  
  return (
    <AnimatedCard delay={0} hover={false} className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
      <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
      <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
      
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-300 text-xs sm:text-sm mb-1 sm:mb-2">
            <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
            <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
            {getGreeting()}, {user?.companyName || 'Admin'}! 👋
          </h1>
          <p className="text-blue-200 text-sm sm:text-base">Bugungi biznes holatini korib chiqing</p>
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <button onClick={() => navigate('/dashboard/drivers')} 
            className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10 text-sm sm:text-base">
            <Users size={16} className="sm:w-[18px] sm:h-[18px]" /> 
            Shofyorlar
            <ArrowUpRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-8">
        {quickStats.map((item, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                <span className="text-white text-xs sm:text-sm font-bold">{item.value}</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{item.value}</p>
                <p className="text-blue-200 text-[10px] sm:text-xs">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AnimatedCard>
  )
})

export default DashboardHero
