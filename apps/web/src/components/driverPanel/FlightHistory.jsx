import { Route, ChevronRight, Wallet, MapPin, Package, Plus } from 'lucide-react'
import { formatMoney, formatDate } from './constants'
import { useTranslation } from '../../store/langStore'
import { useState } from 'react'

// Mashrut nomini legs dan olish
const getFlightRoute = (flight, t) => {
  if (!flight?.legs?.length) return t('route')
  const firstLeg = flight.legs[0]
  const lastLeg = flight.legs[flight.legs.length - 1]
  const from = firstLeg?.fromCity || ''
  const to = lastLeg?.toCity || ''
  if (from && to) return `${from} → ${to}`
  if (from) return from
  if (to) return to
  return t('route')
}

export default function FlightHistory({ flights, onSelect }) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState(null)

  if (!flights?.length) return null

  const statusConfig = {
    completed: { bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: t('completed') },
    active: { bg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: t('active') },
    cancelled: { bg: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: t('cancelled') },
  }

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {flights.map((flight) => {
        const status = statusConfig[flight.status] || statusConfig.cancelled
        const routeName = getFlightRoute(flight, t)
        const isExpanded = expandedId === flight._id

        return (
          <div key={flight._id} className="space-y-1">
            <button
              onClick={() => onSelect(flight)}
              className="w-full text-left bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.99]"
            >
              <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 ${status.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Route size={14} className="sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium text-xs sm:text-sm truncate">{routeName}</p>
                    <p className="text-slate-400 text-[10px] sm:text-xs">{formatDate(flight.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium ${status.badge}`}>
                    {status.label}
                  </span>
                  <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5 text-slate-300" />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <Package size={10} className="sm:w-3 sm:h-3" />
                  <span>{flight.legs?.length || 0} {t('count')}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin size={10} className="sm:w-3 sm:h-3" />
                  <span>{flight.totalDistance || 0} km</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 ml-auto font-medium">
                  <Wallet size={10} className="sm:w-3 sm:h-3" />
                  <span>{formatMoney(flight.totalPayment)}</span>
                </div>
              </div>

              {flight.status === 'completed' && flight.driverProfitAmount > 0 && (
                <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium">
                    {t('share')}: {formatMoney(flight.driverProfitAmount)} ({flight.driverProfitPercent}%)
                  </span>
                </div>
              )}
            </button>

            {/* Xarajat qo'shish button - shunchaki reysda */}
            {flight.status === 'completed' && (
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : flight._id)
                  if (!isExpanded) onSelect(flight)
                }}
                className="w-full text-left bg-blue-50 hover:bg-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-2.5 border border-blue-200 transition-all flex items-center justify-center gap-2 text-blue-600 font-medium text-xs sm:text-sm"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" /> Xarajat qo'shish
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
