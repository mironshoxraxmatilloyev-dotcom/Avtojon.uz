import { Route, ChevronRight, Wallet, MapPin, Package } from 'lucide-react'
import { formatMoney, formatDate } from './constants'

export default function FlightHistory({ flights, onSelect }) {
  if (!flights?.length) return null

  const statusConfig = {
    completed: { bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Tugatilgan' },
    active: { bg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'Faol' },
    cancelled: { bg: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'Bekor' }
  }

  return (
    <div className="space-y-2">
      {flights.map((flight) => {
        const status = statusConfig[flight.status] || statusConfig.cancelled
        return (
          <button
            key={flight._id}
            onClick={() => onSelect(flight)}
            className="w-full text-left bg-white rounded-xl p-3 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.99]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 ${status.bg} rounded-lg flex items-center justify-center`}>
                  <Route size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-slate-800 font-medium text-sm">{flight.name || 'Reys'}</p>
                  <p className="text-slate-400 text-xs">{formatDate(flight.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${status.badge}`}>
                  {status.label}
                </span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <Package size={12} />
                <span>{flight.legs?.length || 0} ta</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <MapPin size={12} />
                <span>{flight.totalDistance || 0} km</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 ml-auto font-medium">
                <Wallet size={12} />
                <span>{formatMoney(flight.totalPayment)}</span>
              </div>
            </div>

            {/* Driver earnings badge */}
            {flight.status === 'completed' && flight.driverProfitAmount > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-medium">
                  💰 Ulush: {formatMoney(flight.driverProfitAmount)} ({flight.driverProfitPercent}%)
                </span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
