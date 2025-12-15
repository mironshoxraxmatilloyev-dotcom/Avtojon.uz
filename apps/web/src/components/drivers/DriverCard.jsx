import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Truck, Play, Route, Edit, Trash2 } from 'lucide-react'

// 🎯 Format money helper
const formatMoney = (num) => num ? new Intl.NumberFormat('uz-UZ').format(num) + ' som' : '-'

// 🚀 Driver Card Component
export const DriverCard = memo(function DriverCard({ 
  driver, 
  vehicle, 
  activeFlight,
  onStartFlight,
  onEdit,
  onDelete 
}) {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate(`/dashboard/drivers/${driver._id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${
            driver.status === 'busy'
              ? 'bg-gradient-to-br from-orange-500 to-orange-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {driver.fullName?.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
              {driver.fullName}
            </h3>
            <div className="flex items-center gap-1 text-gray-500 text-sm">
              <Phone size={14} />
              <span>{driver.phone || 'Telefon yoq'}</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          driver.status === 'busy'
            ? 'bg-orange-100 text-orange-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {driver.status === 'busy' ? 'Reysda' : "Bo'sh"}
        </span>
      </div>

      {/* Vehicle Info */}
      <div className={`p-3 rounded-xl mb-4 ${vehicle ? 'bg-blue-50' : 'bg-gray-50'}`}>
        {vehicle ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Truck size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-700">{vehicle.plateNumber}</p>
              <p className="text-xs text-gray-500">{vehicle.brand} {vehicle.year && `(${vehicle.year})`}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Truck size={18} />
            </div>
            <span className="text-sm">Mashina biriktirilmagan</span>
          </div>
        )}
      </div>

      {/* Active Flight Info */}
      {driver.status === 'busy' && activeFlight && (
        <div 
          className="p-3 rounded-xl mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 cursor-pointer hover:shadow-md transition"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/dashboard/flights/${activeFlight._id}`)
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route size={16} className="text-orange-600" />
              <span className="font-medium text-orange-700">{activeFlight.name || 'Faol reys'}</span>
            </div>
            <span className="text-xs text-orange-500">{activeFlight.legs?.length || 0} bosqich →</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400">
            {driver.paymentType === 'per_trip' ? '💰 Reys uchun' : '💵 Oylik maosh'}
          </p>
          <p className="font-semibold text-gray-900">
            {driver.paymentType === 'per_trip'
              ? formatMoney(driver.perTripRate) + '/reys'
              : formatMoney(driver.baseSalary)
            }
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {driver.status === 'free' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartFlight?.(driver)
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              title="Reys ochish"
            >
              <Play size={18} />
            </button>
          )}
          {driver.status === 'busy' && activeFlight && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/dashboard/flights/${activeFlight._id}`)
              }}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
              title="Reysni davom ettirish"
            >
              <Route size={18} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(driver)
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(driver._id)
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
})

export default DriverCard
