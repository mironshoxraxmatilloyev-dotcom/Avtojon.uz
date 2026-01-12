import { Phone, Truck, Edit, Trash2, Play, Route, Banknote, Wallet, Coins, Plus } from 'lucide-react'

export default function DriverCard({
  driver,
  vehicle,
  flight,
  onNavigate,
  onEdit,
  onDelete,
  onStartFlight,
  onViewFlight,
  onAddExpense,
  formatMoney
}) {
  return (
    <div
      onClick={() => onNavigate(driver._id)}
      className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg flex-shrink-0 ${driver.status === 'busy'
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
            {driver.fullName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-sm sm:text-base truncate">
              {driver.fullName}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
              <Phone size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="truncate">{driver.phone || "Telefon yo'q"}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium flex-shrink-0 ${driver.status === 'busy'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-green-100 text-green-700'
          }`}>
          {driver.status === 'busy' ? 'Marshrutda' : "Bo'sh"}
        </span>
      </div>

      {/* Vehicle */}
      <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 ${vehicle ? 'bg-blue-50' : 'bg-gray-50'}`}>
        {vehicle ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <Truck size={14} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-blue-700 text-sm sm:text-base truncate">{vehicle.plateNumber}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                {vehicle.brand} {vehicle.year && `(${vehicle.year})`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 text-gray-400">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck size={14} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <span className="text-xs sm:text-sm">Mashina biriktirilmagan</span>
          </div>
        )}
      </div>

      {/* Active Flight */}
      {driver.status === 'busy' && flight && (
        <div
          onClick={(e) => { e.stopPropagation(); onViewFlight(flight._id) }}
          className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Route size={14} className="sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
              <span className="font-medium text-orange-700 text-xs sm:text-sm truncate">
                {flight.name || 'Faol marshrut'}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-orange-500 flex-shrink-0">
              {flight.legs?.length || 0} buyurtma →
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-gray-100">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
            {driver.paymentType === 'per_trip' ? (
              <><Coins size={10} className="sm:w-3 sm:h-3" /> Marshrut uchun</>
            ) : (
              <><Banknote size={10} className="sm:w-3 sm:h-3" /> Oylik</>
            )}
          </p>
          <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
            {driver.paymentType === 'per_trip'
              ? formatMoney(driver.perTripRate) + '/marshrut'
              : formatMoney(driver.baseSalary)}
          </p>
          {/* To'lanmagan daromad */}
          {driver.pendingEarnings > 0 && (
            <p className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <Wallet size={10} className="sm:w-3 sm:h-3" /> {formatMoney(driver.pendingEarnings)} (kutilmoqda)
            </p>
          )}
        </div>
        <div className="flex gap-0.5 sm:gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); onAddExpense(driver) }}
            className="px-2 py-1.5 sm:px-3 sm:py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition flex items-center gap-1.5 border border-purple-200 hover:border-purple-300"
            title="Xarajat qo'shish"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs font-medium">Xarajat qo'shish</span>
          </button>
          {driver.status === 'free' && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartFlight(driver) }}
              className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              title="Marshrut ochish"
            >
              <Play size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          )}
          {driver.status === 'busy' && flight && (
            <button
              onClick={(e) => { e.stopPropagation(); onViewFlight(flight._id) }}
              className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
              title="Marshrutni davom ettirish"
            >
              <Route size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          )}
          <button
            onClick={(e) => onEdit(e, driver)}
            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={(e) => onDelete(e, driver._id)}
            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}
