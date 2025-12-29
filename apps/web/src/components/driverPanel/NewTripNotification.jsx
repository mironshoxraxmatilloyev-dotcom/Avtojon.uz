import { Bell, X } from 'lucide-react'

export default function NewTripNotification({ trip, onClose }) {
  if (!trip) return null

  const tripName = trip.name || 
    `${trip.startAddress || trip.legs?.[0]?.fromCity} → ${trip.endAddress || trip.legs?.[trip.legs?.length - 1]?.toCity}`

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-bounce">
      <div className="max-w-lg mx-auto">
        <div className="bg-emerald-500 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">🚛 Yangi marshrut!</h3>
              <p className="text-emerald-100 text-sm">{tripName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
