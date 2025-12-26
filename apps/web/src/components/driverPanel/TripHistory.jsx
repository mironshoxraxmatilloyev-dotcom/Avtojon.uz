import { Route, TrendingUp, TrendingDown } from 'lucide-react'
import { formatMoney, formatDate } from './constants'

export default function TripHistory({ trips }) {
  if (!trips?.length) return null

  return (
    <div className="space-y-3">
      {trips.map((trip) => (
        <div key={trip._id} className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                trip.status === 'completed' ? 'bg-emerald-500' : trip.status === 'in_progress' ? 'bg-blue-500' : 'bg-amber-500'
              }`}>
                <Route size={18} className="text-white" />
              </div>
              <div>
                <p className="text-slate-800 font-semibold text-sm truncate max-w-[180px]">{trip.startAddress} → {trip.endAddress}</p>
                <p className="text-slate-500 text-xs">{formatDate(trip.createdAt)}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              trip.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
              trip.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
            }`}>
              {trip.status === 'completed' ? 'Tugatilgan' : trip.status === 'in_progress' ? 'Yolda' : 'Kutilmoqda'}
            </span>
          </div>
          {(trip.bonusAmount > 0 || trip.penaltyAmount > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {trip.bonusAmount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                  <TrendingUp size={10} /> +{formatMoney(trip.bonusAmount)}
                </span>
              )}
              {trip.penaltyAmount > 0 && (
                <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">
                  <TrendingDown size={10} /> -{formatMoney(trip.penaltyAmount)}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
