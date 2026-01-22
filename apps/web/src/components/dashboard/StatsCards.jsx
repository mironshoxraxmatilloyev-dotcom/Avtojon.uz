import { Users, Truck, Route, CheckCircle, Activity, Clock, Fuel, TrendingUp, TrendingDown } from 'lucide-react'
import { AnimatedStatCard } from '../ui'

export function QuickStats({ stats }) {
  const quickStats = [
    { label: 'Faol marshrutlar', value: stats.activeTrips, icon: Activity, color: 'from-orange-400 to-orange-600' },
    { label: 'Yoldagi haydovchilar', value: stats.busyDrivers, icon: Truck, color: 'from-blue-400 to-blue-600' },
    { label: 'Bo\'sh haydovchilar', value: stats.freeDrivers, icon: Users, color: 'from-green-400 to-green-600' },
    { label: 'Haydovchilardan olingan', value: new Intl.NumberFormat('uz-UZ').format(stats.driverPaid || 0), icon: Clock, color: 'from-purple-400 to-purple-600' },
  ]

  return (
    <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-8">
      {quickStats.map((item, i) => (
        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
              <item.icon size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold">{item.value}</p>
              <p className="text-blue-200 text-[10px] sm:text-xs">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function MainStats({ stats, onNavigate }) {
  const mainStats = [
    { label: 'Jami haydovchilar', value: stats.drivers, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', link: '/dashboard/drivers' },
    { label: 'Tugatilgan marshrutlar', value: stats.completedTrips, icon: CheckCircle, gradient: 'from-green-500 to-green-600', bg: 'bg-green-50', link: '/dashboard/drivers' },
    { label: 'Jami mashinalar', value: stats.vehicles, icon: Truck, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', link: '/dashboard/drivers' },
    { label: 'Jami marshrutlar', value: stats.completedTrips + stats.activeTrips, icon: Route, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', link: '/dashboard/drivers' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 stagger-children">
      {mainStats.map((item, i) => (
        <AnimatedStatCard
          key={i}
          icon={item.icon}
          label={item.label}
          value={item.value}
          gradient={item.gradient}
          bgColor={item.bg}
          onClick={() => onNavigate(item.link)}
          delay={i * 100}
        />
      ))}
    </div>
  )
}

export function FinancialStats({ stats }) {
  const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n)
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
      <FinancialCard
        title="Jami xarajatlar"
        value={formatMoney(stats.totalExpenses)}
        subtitle="so'm sarflandi"
        gradient="from-red-500 via-red-600 to-rose-600"
        shadowColor="shadow-red-500/20"
        subtitleColor="text-red-200"
        icon="fuel"
      />
      <FinancialCard
        title="Haydovchilardan olingan"
        value={formatMoney(stats.driverPaid || 0)}
        subtitle="so'm olingan"
        gradient="from-emerald-500 via-green-500 to-teal-600"
        shadowColor="shadow-green-500/20"
        subtitleColor="text-green-200"
        icon="up"
      />
      <FinancialCard
        title="Haydovchi qarzi"
        value={formatMoney(stats.driverDebt || 0)}
        subtitle="so'm kutilmoqda"
        gradient="from-amber-500 via-orange-500 to-orange-600"
        shadowColor="shadow-orange-500/20"
        subtitleColor="text-orange-200"
        icon="down"
      />
      <FinancialCard
        title="Bonuslar"
        value={`+${formatMoney(stats.totalBonus)}`}
        subtitle="so'm tejaldi"
        gradient="from-purple-500 via-indigo-500 to-blue-600"
        shadowColor="shadow-purple-500/20"
        subtitleColor="text-purple-200"
        icon="up"
      />
    </div>
  )
}

function FinancialCard({ title, value, subtitle, gradient, shadowColor, subtitleColor, icon }) {
  const icons = { fuel: Fuel, up: TrendingUp, down: TrendingDown }
  const Icon = icons[icon]
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl ${shadowColor}`}>
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-lg sm:rounded-xl flex items-center justify-center">
            <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <span className="font-medium text-sm sm:text-base">{title}</span>
        </div>
        <p className="text-2xl sm:text-4xl font-bold truncate">{value}</p>
        <p className={`${subtitleColor} text-xs sm:text-sm mt-1`}>{subtitle}</p>
      </div>
    </div>
  )
}
