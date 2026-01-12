import { memo } from 'react'
import { Truck, ChevronRight, Fuel, Gauge, MoreVertical, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { FUEL, STATUS_CONFIG, fmt } from './constants'

export const VehicleCard = memo(({ vehicle, onClick, onEdit, onDelete, showMenu, onMenuToggle }) => {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical'
  const isCritical = vehicle.status === 'critical'
  const isTemp = vehicle._isTemp || vehicle._id?.startsWith?.('temp_')

  return (
    <div className={`group relative bg-white rounded-xl border transition-all ${
      isCritical ? 'border-red-200 shadow-sm shadow-red-100' : 
      isWarning ? 'border-amber-200 shadow-sm shadow-amber-100' : 
      'border-slate-200 hover:border-indigo-200 hover:shadow-md'
    } ${isTemp ? 'opacity-60' : ''}`}>
      
      {/* Warning line */}
      {isWarning && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
      )}

      <div onClick={isTemp ? undefined : onClick} className={`p-3 sm:p-4 ${isTemp ? 'cursor-wait' : 'cursor-pointer'}`}>
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-indigo-100'
          }`}>
            <Truck className={`w-5 h-5 sm:w-6 sm:h-6 ${
              isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-indigo-600'
            }`} />
            {isWarning && (
              <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}>
                <AlertTriangle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {vehicle.plateNumber}
              </h3>
              {!isTemp && (
                <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isCritical ? 'bg-red-100 text-red-700' :
                  isWarning ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {status.label}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">{vehicle.brand} {vehicle.year ? `• ${vehicle.year}` : ''}</p>
            
            {/* Mobile stats */}
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Gauge size={11} />
                {fmt(vehicle.currentOdometer)} km
              </span>
              <span className="flex items-center gap-1">
                <Fuel size={11} />
                {FUEL[vehicle.fuelType] || '-'}
              </span>
            </div>
          </div>

          {/* Desktop stats */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">{fmt(vehicle.currentOdometer)}</p>
              <p className="text-[10px] text-slate-400">km</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">{FUEL[vehicle.fuelType] || '-'}</p>
              <p className="text-[10px] text-slate-400">Yoqilg'i</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!isTemp && (
              <button
                onClick={(e) => { e.stopPropagation(); onMenuToggle() }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <MoreVertical size={18} />
              </button>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isWarning ? isCritical ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'
            }`}>
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      {showMenu && (
        <div className="absolute right-3 top-14 z-50 bg-white rounded-xl border border-slate-200 shadow-xl py-1 min-w-[140px]">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="w-full px-3 py-2.5 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 text-sm"
          >
            <Edit2 size={14} />
            Tahrirlash
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-full px-3 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm"
          >
            <Trash2 size={14} />
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
})
