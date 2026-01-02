import { memo } from 'react'
import { Users, Truck, Car, BarChart3, TrendingUp, Building2 } from 'lucide-react'
import { StatCard, AnimatedCounter } from './Charts'

const DashboardTab = memo(({ stats, setActiveTab }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  // Backend object qaytaradi: { businessmen: { total, active }, users: { total, active }, ... }
  const businessmenCount = typeof stats.businessmen === 'object' ? stats.businessmen?.total : stats.businessmen
  const usersCount = typeof stats.users === 'object' ? stats.users?.total : stats.users
  const driversCount = typeof stats.drivers === 'object' ? stats.drivers?.total : stats.drivers
  const vehiclesCount = typeof stats.vehicles === 'object' ? stats.vehicles?.total : stats.vehicles
  
  const activeBusinessmen = typeof stats.businessmen === 'object' ? stats.businessmen?.active : stats.activeBusinessmen
  const activeUsers = typeof stats.users === 'object' ? stats.users?.active : stats.activeUsers
  
  const totalFlights = typeof stats.flights === 'object' ? stats.flights?.total : stats.flights
  const activeFlights = typeof stats.flights === 'object' ? stats.flights?.active : stats.activeFlights

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Tizim statistikasi</p>
        </div>
        <button
          onClick={() => setActiveTab('stats')}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-slate-300 transition-colors border border-white/5"
        >
          <BarChart3 size={18} />
          <span className="hidden sm:inline">Batafsil</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Biznesmenlar"
          value={<AnimatedCounter value={businessmenCount || 0} />}
          color="violet"
          onClick={() => setActiveTab('businessmen')}
        />
        <StatCard
          icon={Users}
          label="Foydalanuvchilar"
          value={<AnimatedCounter value={usersCount || 0} />}
          color="cyan"
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          icon={Truck}
          label="Haydovchilar"
          value={<AnimatedCounter value={driversCount || 0} />}
          color="emerald"
          onClick={() => setActiveTab('drivers')}
        />
        <StatCard
          icon={Car}
          label="Mashinalar"
          value={<AnimatedCounter value={vehiclesCount || 0} />}
          color="pink"
          onClick={() => setActiveTab('vehicles')}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Subscriptions */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Faol obunalar
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Biznesmenlar</span>
              <span className="text-emerald-400 font-semibold">{activeBusinessmen || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Foydalanuvchilar</span>
              <span className="text-emerald-400 font-semibold">{activeUsers || 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            Umumiy statistika
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Jami marshrutlar</span>
              <span className="text-white font-semibold">{totalFlights || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Faol marshrutlar</span>
              <span className="text-amber-400 font-semibold">{activeFlights || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tezkor harakatlar</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            icon={Building2}
            label="Yangi biznesmen"
            color="violet"
            onClick={() => setActiveTab('businessmen')}
          />
          <QuickAction
            icon={Users}
            label="Foydalanuvchilar"
            color="cyan"
            onClick={() => setActiveTab('users')}
          />
          <QuickAction
            icon={Truck}
            label="Haydovchilar"
            color="emerald"
            onClick={() => setActiveTab('drivers')}
          />
          <QuickAction
            icon={Car}
            label="Mashinalar"
            color="pink"
            onClick={() => setActiveTab('vehicles')}
          />
        </div>
      </div>
    </div>
  )
})

const QuickAction = memo(({ icon: Icon, label, color, onClick }) => {
  const colors = {
    violet: 'from-violet-500 to-purple-600 shadow-violet-500/30',
    cyan: 'from-cyan-500 to-blue-600 shadow-cyan-500/30',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    pink: 'from-pink-500 to-rose-600 shadow-pink-500/30'
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 bg-gradient-to-r ${colors[color]} rounded-xl text-white font-medium transition-all hover:scale-[1.02] shadow-lg`}
    >
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </button>
  )
})

export default DashboardTab
