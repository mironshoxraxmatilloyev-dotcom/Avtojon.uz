import { memo } from 'react'
import { Truck, ChevronRight, Fuel, Gauge, Calendar, MoreVertical, Edit2, Trash2, Zap } from 'lucide-react'
import { FUEL, STATUS_CONFIG, fmt } from './constants'

export const VehicleCard = memo(({ vehicle, onClick, onEdit, onDelete, showMenu, onMenuToggle }) => {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical'
  const isCritical = vehicle.status === 'critical'
  const isTemp = vehicle._isTemp || vehicle._id?.startsWith?.('temp_')

  const statusColors = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: 'text-emerald-500'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-500'
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: 'text-amber-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-500'
    }
  }

  const sc = statusColors[status.color] || statusColors.blue

  return (
    <div className={`group relative bg-white rounded-2xl border-2 transition-all duration-300 ${
      isCritical 
        ? 'border-red-200 hover:border-red-300 shadow-lg shadow-red-500/5' 
        : isWarning 
          ? 'border-amber-200 hover:border-amber-300 shadow-lg shadow-amber-500/5' 
          : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5'
    } ${isTemp ? 'opacity-60' : ''}`}>
      
      {/* Warning indicator line */}
      {isWarning && (
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
          isCritical ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
        }`} />
      )}

      <div 
        onClick={isTemp ? undefined : onClick} 
        className={`p-5 lg:p-6 ${isTemp ? 'cursor-wait' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-4 lg:gap-5">
          {/* Vehicle Icon */}
          <div className={`relative w-16 h-16 lg:w-18 lg:h-18 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            isCritical 
              ? 'bg-gradient-to-br from-red-100 to-rose-100 border-2 border-red-200' 
              : isWarning 
                ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200' 
                : 'bg-gradient-to-br from-indigo-100 to-blue-100 border-2 border-indigo-200'
          }`}>
            <Truck className={`w-8 h-8 ${
              isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-indigo-600'
            }`} />
            {isWarning && (
              <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                isCritical ? 'bg-red-500' : 'bg-amber-500'
              } shadow-lg`}>
                <Zap className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
                {vehicle.plateNumber}
              </h3>
              {isTemp ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                  <div className="w-2 h-2 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Saqlanmoqda...
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${sc.bg} ${sc.text} border ${sc.border}`}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium">{vehicle.brand} {vehicle.model}</p>
          </div>

          {/* Desktop Stats */}
          <div className="hidden lg:flex items-center gap-8">
            <StatItem 
              value={fmt(vehicle.currentOdometer)} 
              label="km" 
              highlight={vehicle.currentOdometer > 100000}
            />
            <StatItem 
              value={FUEL[vehicle.fuelType] || '-'} 
              label="Yoqilg'i" 
            />
            {vehicle.year && (
              <StatItem 
                value={vehicle.year} 
                label="Yil" 
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isTemp && (
              <button
                onClick={(e) => { e.stopPropagation(); onMenuToggle() }}
                className="p-3 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all"
              >
                <MoreVertical size={20} />
              </button>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isWarning 
                ? isCritical ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'
                : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
            }`}>
              <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="flex lg:hidden items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <MobileStat icon={Gauge} value={`${fmt(vehicle.currentOdometer)} km`} />
          <MobileStat icon={Fuel} value={FUEL[vehicle.fuelType] || '-'} />
          {vehicle.year && <MobileStat icon={Calendar} value={vehicle.year} />}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-4 top-20 z-50 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl shadow-slate-200/50 py-2 min-w-[180px] overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="w-full px-4 py-3 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors font-medium"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Edit2 size={16} className="text-indigo-600" />
            </div>
            Tahrirlash
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
})

const StatItem = memo(({ value, label, highlight }) => (
  <div className="text-center min-w-[70px]">
    <p className={`text-lg font-bold ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{value}</p>
    <p className="text-xs text-slate-400 font-medium">{label}</p>
  </div>
))

const MobileStat = memo(({ icon: Icon, value }) => (
  <div className="flex items-center gap-2 text-slate-600">
    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
      <Icon size={14} className="text-slate-500" />
    </div>
    <span className="text-sm font-medium">{value}</span>
  </div>
))
