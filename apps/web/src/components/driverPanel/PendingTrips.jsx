import { Clock, Play } from 'lucide-react'

export default function PendingTrips({ trips, onStart, actionLoading }) {
  if (!trips?.length) return null

  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-gray-800 font-bold text-base sm:text-lg flex items-center gap-2">
        <Clock className="text-amber-500" size={20} />
        Kutilayotgan marshrutlar
      </h2>
      {trips.map((trip) => (
        <div key={trip._id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] sm:text-xs font-semibold">
                Kutilmoqda
              </span>
              <p className="text-gray-800 font-semibold mt-2 text-sm sm:text-base truncate">
                {trip.startAddress} → {trip.endAddress}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">{trip.vehicle?.plateNumber}</p>
            </div>
            <button
              onClick={() => onStart(trip._id)}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm transition-colors flex-shrink-0 active:scale-[0.98]"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={16} className="sm:w-[18px] sm:h-[18px]" />
              )}
              Boshlash
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
