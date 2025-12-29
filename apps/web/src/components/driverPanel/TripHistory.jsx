import { Route, TrendingUp, TrendingDown } from 'lucide-react'
import { formatMoney, formatDate } from './constants'

export default function TripHistory({ trips }) {
  if (!trips?.length) return null

  return (
    <div className="space-y-2 sm:space-y-3">
      {trips.map((trip) => (
        <div key={trip._id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
          <div className="flex justify-between items-start mb-1.5 sm:mb-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                trip.status === 'completed' ? 'bg-emerald-500' : trip.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
              }`}>
                <Route size={16} className="sm:w-[18px] sm:h-[18px] text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[180px]">{trip.startAddress} → {trip.endAddress}</p>
                <p className="text-slate-500 text-[10px] sm:text-xs">{formatDate(trip.createdAt)}</p>
              </div>
            </div>
            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 ${
              trip.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
              trip.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {trip.status === 'completed' ? 'Tugatilgan' : trip.status === 'in_progress' ? 'Yolda' : 'Kutilmoqda'}
            </span>
          </div>
          {(trip.bonusAmount > 0 || trip.penaltyAmount > 0) && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
              {trip.bonusAmount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                  <TrendingUp size={10} className="sm:w-2.5 sm:h-2.5" /> +{formatMoney(trip.bonusAmount)}
                </span>
              )}
              {trip.penaltyAmount > 0 && (
                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">
                  <TrendingDown size={10} className="sm:w-2.5 sm:h-2.5" /> -{formatMoney(trip.penaltyAmount)}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
