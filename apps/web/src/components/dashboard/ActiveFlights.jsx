import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Route, MapPin, RefreshCw, ArrowUpRight, Zap } from 'lucide-react'

// 🚀 Active Flights Section
export const ActiveFlightsSection = memo(function ActiveFlightsSection({ flights, onRefresh }) {
  const navigate = useNavigate()
  
  if (!flights || flights.length === 0) return null
  
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Route className="text-emerald-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Faol reyslar</h2>
            <p className="text-sm text-gray-500">{flights.length} ta reys yo'lda</p>
          </div>
        </div>
        <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
          <RefreshCw size={18} />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flights.map((flight) => (
          <FlightCard key={flight._id} flight={flight} onClick={() => navigate(`/dashboard/flights/${flight._id}`)} />
        ))}
      </div>
    </div>
  )
})

// 🚀 Flight Card
const FlightCard = memo(function FlightCard({ flight, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border border-emerald-100 hover:border-emerald-300"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
            {flight.driver?.fullName?.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{flight.driver?.fullName}</p>
            <p className="text-sm text-gray-500">{flight.vehicle?.plateNumber}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
          <MapPin size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{flight.name || 'Yangi reys'}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{flight.legs?.length || 0} bosqich</span>
          <span>•</span>
          <span>{flight.totalDistance || 0} km</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Faol
          </span>
          <ArrowUpRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition" />
        </div>
      </div>
    </div>
  )
})

// 🚀 Active Trips Section (eski tizim)
export const ActiveTripsSection = memo(function ActiveTripsSection({ trips, onRefresh }) {
  const navigate = useNavigate()
  
  if (!trips || trips.length === 0) return null
  
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Zap className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Hozir yolda (eski)</h2>
            <p className="text-sm text-gray-500">{trips.length} ta faol reys</p>
          </div>
        </div>
        <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
          <RefreshCw size={18} />
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <TripCard key={trip._id} trip={trip} onClick={() => navigate(`/dashboard/trips/${trip._id}`)} />
        ))}
      </div>
    </div>
  )
})

// 🚀 Trip Card
const TripCard = memo(function TripCard({ trip, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
            {trip.driver?.fullName?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{trip.driver?.fullName}</p>
            <p className="text-sm text-gray-500">{trip.vehicle?.plateNumber}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <span>{trip.startAddress} - {trip.endAddress}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            Yolda
          </span>
          <ArrowUpRight size={16} className="text-gray-400 group-hover:text-blue-600 transition" />
        </div>
      </div>
    </div>
  )
})

export default ActiveFlightsSection
