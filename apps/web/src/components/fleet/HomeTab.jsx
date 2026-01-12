import { memo } from 'react'
import { Search, X, TrendingUp, TrendingDown, DollarSign, AlertCircle, Plus, Truck, Sparkles } from 'lucide-react'
import { VehicleCard } from './VehicleCard'

const fmt = (n) => {
  const abs = Math.abs(n || 0)
  if (abs >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`
  if (abs >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n?.toString() || '0'
}

export const HomeTab = memo(({ 
  vehicles, search, setSearch, onVehicleClick, 
  onEdit, onDelete, showMenu, setShowMenu, loading, openModal,
  fleetAnalytics, onAlertClick
}) => {
  const totalIncome = fleetAnalytics?.summary?.totalIncome || 0
  const totalExpenses = fleetAnalytics?.summary?.totalExpenses || 0
  const netProfit = fleetAnalytics?.summary?.netProfit || 0
  const alertsCount = fleetAnalytics?.alertsCount || 0

  return (
    <div className="space-y-4">
      {/* Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Daromad"
          value={fmt(totalIncome)}
          color="emerald"
        />
        <StatCard
          icon={TrendingDown}
          label="Xarajat"
          value={fmt(totalExpenses)}
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          label="Foyda"
          value={`${netProfit >= 0 ? '+' : ''}${fmt(netProfit)}`}
          color={netProfit >= 0 ? 'emerald' : 'red'}
        />
        <StatCard
          icon={AlertCircle}
          label="Diqqat"
          value={alertsCount}
          color="amber"
          onClick={alertsCount > 0 ? onAlertClick : undefined}
          pulse={alertsCount > 0}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mashina qidirish..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Vehicles List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState onAdd={openModal} hasSearch={!!search} />
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {search && (
            <p className="text-xs text-slate-500 px-1">{vehicles.length} ta natija</p>
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
          {/* Bottom nav uchun bo'sh joy */}
          <div className="h-20 lg:hidden" />
        </div>
      )}
    </div>
  )
})

// Compact Stat Card
const StatCard = memo(({ icon: Icon, label, value, color, onClick, pulse }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-600' }
  }
  const c = colors[color]
  
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      onClick={onClick}
      className={`${c.bg} rounded-xl p-3 sm:p-4 text-left w-full transition-all ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 ${c.icon} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </div>
      <p className={`text-lg sm:text-xl font-bold ${c.text}`}>{value}</p>
      <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{label}</p>
    </Wrapper>
  )
})

// Empty State
const EmptyState = memo(({ onAdd, hasSearch }) => (
  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Truck className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">
      {hasSearch ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
    </h3>
    <p className="text-slate-500 text-sm mb-6">
      {hasSearch ? 'Boshqa so\'rov bilan urinib ko\'ring' : 'Birinchi mashinangizni qo\'shing'}
    </p>
    {!hasSearch && (
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
      >
        <Plus size={18} />
        Mashina qo'shish
      </button>
    )}
  </div>
))
