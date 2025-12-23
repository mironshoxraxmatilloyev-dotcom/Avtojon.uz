import { memo } from 'react'
import { Search, X, Car, CheckCircle, AlertTriangle, TrendingUp, Plus } from 'lucide-react'
import { VehicleCard } from './VehicleCard'
import { fmt } from './constants'

export const HomeTab = memo(({ 
  vehicles, stats, search, setSearch, onVehicleClick, 
  onEdit, onDelete, showMenu, setShowMenu, loading, openModal 
}) => {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={Car}
          gradient="from-blue-500 to-blue-600"
          value={stats.total}
          label="Jami transport"
        />
        <StatCard
          icon={CheckCircle}
          gradient="from-emerald-500 to-emerald-600"
          value={stats.excellent}
          label="Yaxshi holat"
        />
        <StatCard
          icon={AlertTriangle}
          gradient="from-amber-500 to-orange-500"
          value={stats.attention}
          label="Diqqat talab"
          pulse={stats.attention > 0}
        />
        <StatCard
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
          value={`${(stats.totalKm / 1000).toFixed(0)}k`}
          label="Jami masofa"
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mashina qidirish..."
          className="w-full pl-12 pr-12 py-4 bg-slate-800/30 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg text-slate-500"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Vehicles List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-800/30 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState onAdd={openModal} hasSearch={!!search} />
      ) : (
        <div className="space-y-4">
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

      {search && vehicles.length > 0 && (
        <p className="text-center text-slate-500">{vehicles.length} ta natija</p>
      )}
    </div>
  )
})

const StatCard = memo(({ icon: Icon, gradient, value, label, pulse }) => (
  <div className="bg-slate-800/30 rounded-2xl p-5 lg:p-6 border border-white/5">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}>
        <Icon size={22} className="text-white" />
      </div>
      {pulse && <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />}
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-slate-400">{label}</p>
  </div>
))

const EmptyState = memo(({ onAdd, hasSearch }) => (
  <div className="bg-slate-800/20 rounded-3xl border border-white/5 p-12 text-center">
    <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
      <Car className="w-10 h-10 text-slate-600" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      {hasSearch ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
    </h3>
    <p className="text-slate-400 mb-8 max-w-sm mx-auto">
      {hasSearch ? 'Qidiruv so\'rovingizga mos mashina topilmadi' : 'Birinchi mashinangizni qo\'shing'}
    </p>
    {!hasSearch && (
      <button
        onClick={onAdd}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold inline-flex items-center gap-2 transition-all"
      >
        <Plus size={20} /> Mashina qo'shish
      </button>
    )}
  </div>
))
