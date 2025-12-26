import { Gauge, Fuel } from 'lucide-react'

export default function OdometerFuelCard({ flight, formatMoney }) {
  // Xarajatlardan yoqilg'i miqdorini hisoblash
  const totalFuel = flight.expenses?.reduce((sum, exp) => {
    if (exp.type?.startsWith('fuel_') && exp.quantity) {
      return sum + Number(exp.quantity)
    }
    return sum
  }, 0) || 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* Odometer */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Gauge className="text-blue-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Spidometr</h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2">
            <p className="text-[9px] sm:text-[10px] text-gray-400">Boshlang'ich</p>
            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{formatMoney(flight.startOdometer || 0)} km</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2">
            <p className="text-[9px] sm:text-[10px] text-gray-400">Tugash</p>
            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{flight.endOdometer ? formatMoney(flight.endOdometer) : '-'} km</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2">
            <p className="text-[9px] sm:text-[10px] text-blue-500">Jami yurgan</p>
            <p className="text-xs sm:text-sm font-bold text-blue-600 truncate">
              {flight.endOdometer && flight.startOdometer 
                ? formatMoney(flight.endOdometer - flight.startOdometer) 
                : formatMoney(flight.totalDistance || 0)} km
            </p>
          </div>
        </div>
      </div>

      {/* Fuel */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Fuel className="text-amber-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Yoqilg'i</h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2">
            <p className="text-[9px] sm:text-[10px] text-gray-400">Boshlang'ich</p>
            <p className="text-xs sm:text-sm font-bold text-gray-900">{flight.startFuel || 0} L</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2">
            <p className="text-[9px] sm:text-[10px] text-gray-400">Qoldiq</p>
            <p className="text-xs sm:text-sm font-bold text-gray-900">{flight.endFuel || '-'} L</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-1.5 sm:p-2">
            <p className="text-[9px] sm:text-[10px] text-amber-500">Jami sarflangan</p>
            <p className="text-xs sm:text-sm font-bold text-amber-600">
              {totalFuel > 0 ? `${totalFuel} L` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
