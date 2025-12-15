import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Truck, Route, CheckCircle, Fuel, TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedStatCard } from '../ui'

// 🎯 Format money helper
const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n)

// 🎯 Main stats config
const getMainStats = (stats) => [
  { label: 'Jami shofyorlar', value: stats.drivers, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', link: '/dashboard/drivers' },
  { label: 'Tugatilgan reyslar', value: stats.completedTrips, icon: CheckCircle, gradient: 'from-green-500 to-green-600', bg: 'bg-green-50', link: '/dashboard/drivers' },
  { label: 'Jami mashinalar', value: stats.vehicles, icon: Truck, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', link: '/dashboard/drivers' },
  { label: 'Jami reyslar', value: stats.completedTrips + stats.activeTrips, icon: Route, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', link: '/dashboard/drivers' },
]

// 🚀 Main Stats Grid
export const MainStatsGrid = memo(function MainStatsGrid({ stats }) {
  const navigate = useNavigate()
  const mainStats = getMainStats(stats)
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
      {mainStats.map((item, i) => (
        <AnimatedStatCard
          key={i}
          icon={item.icon}
          label={item.label}
          value={item.value}
          gradient={item.gradient}
          bgColor={item.bg}
          onClick={() => navigate(item.link)}
          delay={i * 100}
        />
      ))}
    </div>
  )
})

// 🚀 Financial Stats
export const FinancialStats = memo(function FinancialStats({ stats }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Xarajatlar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white p-6 rounded-2xl shadow-xl shadow-red-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Fuel size={22} />
            </div>
            <span className="font-medium">Jami xarajatlar</span>
          </div>
          <p className="text-4xl font-bold">{formatMoney(stats.totalExpenses)}</p>
          <p className="text-red-200 text-sm mt-1">som sarflandi</p>
        </div>
      </div>

      {/* Bonuslar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl shadow-green-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <span className="font-medium">Bonuslar</span>
          </div>
          <p className="text-4xl font-bold">+{formatMoney(stats.totalBonus)}</p>
          <p className="text-green-200 text-sm mt-1">som tejaldi</p>
        </div>
      </div>

      {/* Jarimalar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <TrendingDown size={22} />
            </div>
            <span className="font-medium">Jarimalar</span>
          </div>
          <p className="text-4xl font-bold">-{formatMoney(stats.totalPenalty)}</p>
          <p className="text-orange-200 text-sm mt-1">som jarima</p>
        </div>
      </div>
    </div>
  )
})

export default MainStatsGrid
