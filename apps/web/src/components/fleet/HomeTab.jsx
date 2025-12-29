import { memo } from 'react'
import { Search, X, TrendingUp, TrendingDown, DollarSign, Clock, Plus, Sparkles, Car } from 'lucide-react'
import { VehicleCard } from './VehicleCard'

const fmt = (n) => {
  const abs = Math.abs(n || 0)
  if (abs >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n?.toString() || '0'
}

export const HomeTab = memo(({ 
  vehicles, stats, search, setSearch, onVehicleClick, 
  onEdit, onDelete, showMenu, setShowMenu, loading, openModal,
  fleetAnalytics
}) => {
  const totalIncome = fleetAnalytics?.summary?.totalIncome || 0
  const totalExpenses = fleetAnalytics?.summary?.totalExpenses || 0
  const netProfit = fleetAnalytics?.summary?.netProfit || 0
  const alertsCount = fleetAnalytics?.alertsCount || 0

  return (
    <div className="space-y-6">
      {/* PRO Stats Cards - 4 ta asosiy ko'rsatkich */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <ProStatCard
          icon={DollarSign}
          label="Daromad"
          value={fmt(totalIncome)}
          color="emerald"
        />
        <ProStatCard
          icon={TrendingDown}
          label="Xarajat"
          value={fmt(totalExpenses)}
          color="red"
        />
        <ProStatCard
          icon={TrendingUp}
          label="Sof foyda"
          value={`${netProfit >= 0 ? '+' : ''}${fmt(netProfit)}`}
          color={netProfit >= 0 ? 'emerald' : 'red'}
        />
        <ProStatCard
          icon={Clock}
          label="Muddati kelayotgan"
          value={alertsCount}
          color="orange"
          pulse={alertsCount > 0}
        />
      </div>

      {/* PRO Search */}
      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mashina qidirish (raqam yoki marka)..."
          className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm hover:shadow-md hover:border-slate-300"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Vehicles List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border-2 border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <ProEmptyState onAdd={openModal} hasSearch={!!search} />
      ) : (
        <div className="space-y-4">
          {search && (
            <p className="text-sm text-slate-500 font-medium">
              {vehicles.length} ta natija topildi
            </p>
          )}
          {vehicles.map(v => (
            <VehicleCard
              key={v._id}
              vehicle={v}
              onClick={() => onVehicleClick(v)}
              onEdit={() => onEdit(v)}
              onDelete={() => onDelete(v._id)}
              showMenu={showMenu === v._id}
              onMenuToggle={() => setShowMenu(showMenu === v._id ? null : v._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// PRO Stat Card Component
const ProStatCard = memo(({ icon: Icon, label, value, suffix, color, trend, percent, pulse, subValue }) => {
  const colors = {
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-blue-50',
      border: 'border-indigo-100',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
      iconShadow: 'shadow-indigo-500/30',
      text: 'text-indigo-600',
      light: 'text-indigo-400'
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-teal-50',
      border: 'border-emerald-100',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      iconShadow: 'shadow-emerald-500/30',
      text: 'text-emerald-600',
      light: 'text-emerald-400'
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50',
      border: 'border-amber-100',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      iconShadow: 'shadow-amber-500/30',
      text: 'text-amber-600',
      light: 'text-amber-400'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-50 via-orange-50/50 to-red-50',
      border: 'border-orange-100',
      iconBg: 'bg-gradient-to-br from-orange-500 to-red-500',
      iconShadow: 'shadow-orange-500/30',
      text: 'text-orange-600',
      light: 'text-orange-400'
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 via-red-50/50 to-rose-50',
      border: 'border-red-100',
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
      iconShadow: 'shadow-red-500/30',
      text: 'text-red-600',
      light: 'text-red-400'
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-50 via-cyan-50/50 to-sky-50',
      border: 'border-cyan-100',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-sky-600',
      iconShadow: 'shadow-cyan-500/30',
      text: 'text-cyan-600',
      light: 'text-cyan-400'
    }
  }

  const c = colors[color]

  return (
    <div className={`relative overflow-hidden ${c.bg} rounded-2xl p-5 lg:p-6 border-2 ${c.border} group hover:shadow-lg transition-all duration-300`}>
      {/* Decorative gradient */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/40 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center shadow-lg ${c.iconShadow}`}>
            <Icon size={22} className="text-white" />
          </div>
          {pulse && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          )}
          {percent !== undefined && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${c.bg} ${c.text} border ${c.border}`}>
              {percent}%
            </span>
          )}
        </div>
        
        <div className="flex items-end gap-1">
          <p className="text-2xl lg:text-3xl font-bold text-slate-900 truncate">{value}</p>
          {suffix && <span className={`text-lg font-medium ${c.light} mb-1`}>{suffix}</span>}
        </div>
        
        <p className="text-slate-500 text-sm font-medium mt-1">{label}</p>
        
        {subValue && (
          <p className="text-xs font-semibold text-emerald-600 mt-2">{subValue}</p>
        )}
        {trend && (
          <p className={`text-xs font-semibold ${c.text} mt-2`}>{trend}</p>
        )}
      </div>
    </div>
  )
})

// PRO Empty State
const ProEmptyState = memo(({ onAdd, hasSearch }) => (
  <div className="relative overflow-hidden bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 lg:p-16 text-center">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-cyan-50/50" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-transparent rounded-full blur-3xl" />
    
    <div className="relative">
      <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
        <Car className="w-12 h-12 text-slate-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-slate-900 mb-3">
        {hasSearch ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
      </h3>
      <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
        {hasSearch 
          ? 'Qidiruv so\'rovingizga mos mashina topilmadi. Boshqa so\'rov bilan urinib ko\'ring.' 
          : 'Avtoparkingizni boshqarishni boshlash uchun birinchi mashinangizni qo\'shing.'
        }
      </p>
      
      {!hasSearch && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 rounded-2xl text-white font-bold text-lg transition-all shadow-xl shadow-indigo-500/30 active:scale-[0.98] group"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={22} />
          </div>
          Mashina qo'shish
          <Sparkles className="w-5 h-5 text-amber-300" />
        </button>
      )}
    </div>
  </div>
))
