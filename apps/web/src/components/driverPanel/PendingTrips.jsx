import { Clock, Play } from 'lucide-react'

export default function PendingTrips({ trips, onStart, actionLoading }) {
  if (!trips?.length) return null

  return (
    <div className="space-y-4">
      <h2 className="text-gray-800 font-bold text-lg flex items-center gap-2">
        <Clock className="text-amber-500" size={22} />
        Kutilayotgan marshrutlar
      </h2>
      {trips.map((trip) => (
        <div key={trip._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-xs font-semibold">
                Kutilmoqda
              </span>
              <p className="text-gray-800 font-semibold mt-2 truncate">
                {trip.startAddress} → {trip.endAddress}
              </p>
              <p className="text-gray-500 text-sm">{trip.vehicle?.plateNumber}</p>
            </div>
            <button
              onClick={() => onStart(trip._id)}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 text-sm transition-colors"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={18} />
              )}
              Boshlash
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
