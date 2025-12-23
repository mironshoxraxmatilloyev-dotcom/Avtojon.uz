import { memo } from 'react'
import { Truck, ChevronRight, Fuel, Gauge, Calendar, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { FUEL, STATUS_CONFIG, fmt } from './constants'

export const VehicleCard = memo(({ vehicle, onClick, onEdit, onDelete, showMenu, onMenuToggle }) => {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical'
  const isTemp = vehicle._isTemp || vehicle._id?.startsWith?.('temp_')

  return (
    <div className={`group relative bg-slate-800/30 hover:bg-slate-800/50 rounded-2xl border transition-all ${
      isWarning ? 'border-amber-500/20 hover:border-amber-500/30' : 'border-white/5 hover:border-white/10'
    } ${isTemp ? 'opacity-70' : ''}`}>
      <div onClick={isTemp ? undefined : onClick} className={`p-5 ${isTemp ? 'cursor-wait' : 'cursor-pointer'}`}>
        <div className="flex items-center gap-5">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isWarning ? 'bg-amber-500/10' : 'bg-blue-500/10'
          }`}>
            <Truck className={`w-7 h-7 ${isWarning ? 'text-amber-400' : 'text-blue-400'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-bold text-white whitespace-nowrap">{vehicle.plateNumber}</h3>
              {isTemp ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/15 text-slate-400 flex items-center gap-1">
                  <div className="w-2 h-2 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Saqlanmoqda...
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                  status.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' :
                  status.color === 'blue' ? 'bg-blue-500/15 text-blue-400' :
                  status.color === 'amber' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 truncate">{vehicle.brand} {vehicle.model}</p>
          </div>

          {/* Stats - Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <p className="text-white font-semibold text-lg">{fmt(vehicle.currentOdometer)}</p>
              <p className="text-xs text-slate-500">km</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">{FUEL[vehicle.fuelType] || '-'}</p>
              <p className="text-xs text-slate-500">Yoqilg'i</p>
            </div>
            {vehicle.year && (
              <div className="text-center">
                <p className="text-white font-semibold">{vehicle.year}</p>
                <p className="text-xs text-slate-500">Yil</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {!isTemp && (
              <button
                onClick={(e) => { e.stopPropagation(); onMenuToggle() }}
                className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <MoreVertical size={20} />
              </button>
            )}
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-all" />
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="flex lg:hidden items-center gap-5 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400">
            <Gauge size={16} />
            <span className="text-sm">{fmt(vehicle.currentOdometer)} km</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Fuel size={16} />
            <span className="text-sm">{FUEL[vehicle.fuelType] || '-'}</span>
          </div>
          {vehicle.year && (
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <span className="text-sm">{vehicle.year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-4 top-16 z-40 bg-slate-800 rounded-xl border border-white/10 shadow-2xl py-2 min-w-[160px]">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="w-full px-4 py-3 text-left text-white hover:bg-white/5 flex items-center gap-3"
          >
            <Edit2 size={16} className="text-blue-400" /> Tahrirlash
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3"
          >
            <Trash2 size={16} /> O'chirish
          </button>
        </div>
      )}
    </div>
  )
})
