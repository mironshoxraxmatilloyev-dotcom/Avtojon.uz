import { Calendar, Users, ArrowUpRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AnimatedCard } from '../ui'
import { QuickStats } from './StatsCards'

export function DemoBanner() {
  const navigate = useNavigate()
  
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm sm:text-base">Demo rejim</p>
          <p className="text-xs sm:text-sm text-white/80 line-clamp-2">Bu demo versiya. To'liq funksiyadan foydalanish uchun ro'yxatdan o'ting.</p>
        </div>
      </div>
      <button
        onClick={() => navigate('/register')}
        className="px-3 sm:px-4 py-2 bg-white text-orange-600 rounded-lg sm:rounded-xl font-semibold hover:bg-orange-50 transition text-sm w-full sm:w-auto flex-shrink-0"
      >
        Ro'yxatdan o'tish
      </button>
    </div>
  )
}

export function HeroHeader({ user, stats }) {
  const navigate = useNavigate()
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

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

      <QuickStats stats={stats} />
    </AnimatedCard>
  )
}
