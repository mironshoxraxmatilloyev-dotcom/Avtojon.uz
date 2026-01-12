import { Truck, Bell, CheckCircle, Banknote, MapPin, Calendar, ChevronRight } from 'lucide-react'
import { formatMoney } from './constants'
import { useTranslation } from '../../store/langStore'

export default function EmptyState({ stats, recentFlights = [], onSelectFlight }) {
  const { t } = useTranslation()
  const hasRecentFlights = recentFlights.length > 0

  return (
    <div className="space-y-3">
      {/* Empty state card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 text-center border-b border-slate-100">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Truck size={24} className="text-slate-400" />
          </div>
          <h3 className="text-slate-800 font-semibold text-sm mb-0.5">{t('noActiveTrips')}</h3>
          <p className="text-slate-400 text-xs">{t('newTripNotify')}</p>
        </div>

        {/* Inline stats */}
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-base leading-none">
                {stats?.totalCompletedTrips || 0}
              </p>
              <p className="text-slate-400 text-xs">{t('completed')}</p>
            </div>
          </div>
          <div className="p-3 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Banknote className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-800 font-bold text-base leading-none truncate">
                +{formatMoney(stats?.totalBonusAmount || 0)}
              </p>
              <p className="text-slate-400 text-xs">{t('totalEarnings')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent flights */}
      {hasRecentFlights && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-slate-800 font-semibold text-sm">{t('recentTrips')}</h4>
            <span className="text-xs text-slate-400">{recentFlights.length} {t('count')}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {recentFlights.map((flight) => (
              <button
                key={flight._id}
                onClick={() => onSelectFlight?.(flight)}
                className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    flight.status === 'completed' ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}
                >
                  <MapPin
                    size={16}
                    className={flight.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate">
                    {flight.legs?.[0]?.fromCity || t('route')} →{' '}
                    {flight.legs?.[flight.legs.length - 1]?.toCity || ''}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={10} />
                    <span>{new Date(flight.createdAt).toLocaleDateString('uz-UZ')}</span>
                    {flight.profit > 0 && (
                      <span className="text-emerald-600 font-medium">
                        +{formatMoney(flight.profit)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No history hint */}
      {!hasRecentFlights && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell size={14} className="text-blue-600" />
            </div>
            <div>
              <p className="text-slate-700 text-sm font-medium mb-0.5">{t('historyEmpty')}</p>
              <p className="text-slate-500 text-xs">{t('historyEmptyHint')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
