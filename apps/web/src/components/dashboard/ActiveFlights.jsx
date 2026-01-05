import { Route, MapPin, ArrowUpRight, RefreshCw, DollarSign, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export function ActiveFlights({ flights, onRefresh, onEditPayment }) {
  const navigate = useNavigate()
  const [selectedFlight, setSelectedFlight] = useState(null)
  
  if (!flights || flights.length === 0) return null

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
            <Route className="text-emerald-600" size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Faol marshrutlar</h2>
            <p className="text-xs sm:text-sm text-gray-500">{flights.length} ta mashrut yo'lda</p>
          </div>
        </div>
        <button onClick={onRefresh} className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg sm:rounded-xl transition">
          <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {flights.map((flight) => (
          <FlightCard 
            key={flight._id} 
            flight={flight} 
            onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
            onEditPayment={onEditPayment}
          />
        ))}
      </div>
    </div>
  )
}

function FlightCard({ flight, onClick, onEditPayment }) {
  const [showPaymentMenu, setShowPaymentMenu] = useState(false)
  
  return (
    <div
      className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border border-emerald-100 hover:border-emerald-300"
    >
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-full -mr-8 -mt-8 sm:-mr-10 sm:-mt-10 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-500/30 flex-shrink-0">
            {flight.driver?.fullName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{flight.driver?.fullName}</p>
            <p className="text-xs sm:text-sm text-gray-500 truncate">{flight.vehicle?.plateNumber}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600 mb-2">
          <MapPin size={14} className="sm:w-4 sm:h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <span className="font-medium truncate">{flight.name || 'Yangi marshrut'}</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
          <span>{flight.legs?.length || 0} buyurtma</span>
          <span>•</span>
          <span>{flight.totalDistance || 0} km</span>
        </div>

        {/* To'lovlar ro'yxati */}
        {flight.legs && flight.legs.length > 0 && (
          <div className="mb-3 sm:mb-4 space-y-1.5">
            {flight.legs.map((leg, idx) => (
              <div key={leg._id || idx} className="flex items-center justify-between bg-white/60 rounded-lg p-2 sm:p-2.5 group/leg hover:bg-white transition">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                    {leg.fromCity?.split(',')[0]} → {leg.toCity?.split(',')[0]}
                  </p>
                  {leg.payment > 0 ? (
                    <p className="text-xs sm:text-sm font-bold text-emerald-600">+{(leg.payment || 0).toLocaleString()} so'm</p>
                  ) : (
                    <p className="text-xs text-gray-400">To'lov kiritilmagan</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditPayment?.(flight, leg)
                  }}
                  className="ml-2 p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover/leg:opacity-100"
                  title="To'lovni tahrirlash"
                >
                  <Pencil size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Faol
          </span>
          <button
            onClick={onClick}
            className="text-gray-400 group-hover:text-emerald-600 transition"
          >
            <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
