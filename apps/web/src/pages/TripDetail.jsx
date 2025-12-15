import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Route, Calendar, Gauge, Activity, Clock, CheckCircle, XCircle, Globe } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import {
  InternationalTripSection,
  OdometerSection,
  FuelSection,
  RoadExpensesSection,
  UnexpectedSection,
  ProfitSection,
  DriverVehicleCard,
  TimelineCard,
  QuickActions,
  FuelModal,
  RoadExpenseModal,
  UnexpectedModal,
  EditTripModal
} from '../components/trip'

const statusConfig = {
  pending: { label: 'Kutilmoqda', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
  in_progress: { label: "Yo'lda", color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Activity },
  completed: { label: 'Tugatilgan', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Bekor', color: 'from-red-500 to-rose-600', bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle }
}

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState({ USD: 1, UZS: 12800, KZT: 450, RUB: 90 })
  
  // Modal states
  const [showFuelModal, setShowFuelModal] = useState(false)
  const [showRoadModal, setShowRoadModal] = useState(false)
  const [showUnexpectedModal, setShowUnexpectedModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('uzb')

  useEffect(() => {
    fetchTrip()
    fetchRates()
  }, [id])

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/trips/${id}`)
      setTrip(res.data.data)
    } catch (error) {
      showToast.error('Reys topilmadi')
      navigate('/dashboard/trips')
    } finally {
      setLoading(false)
    }
  }

  const fetchRates = async () => {
    try {
      const res = await api.get('/trips/currency-rates')
      if (res.data.data) setRates(res.data.data)
    } catch (e) { /* default rates ishlatiladi */ }
  }


  const formatMoney = (n, currency = 'USD') => {
    if (!n && n !== 0) return '0'
    return new Intl.NumberFormat('uz-UZ').format(n)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!trip) return null

  const currentStatus = statusConfig[trip.status] || statusConfig.pending
  const StatusIcon = currentStatus.icon

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentStatus.color} text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl`}>
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-black/10 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
        
        <div className="relative">
          <button 
            onClick={() => navigate('/dashboard/trips')} 
            className="mb-4 sm:mb-6 flex items-center gap-2 text-white/80 hover:text-white transition group text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Reyslarga qaytish</span>
          </button>

          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl flex-shrink-0">
                <Route size={24} className="sm:w-8 sm:h-8 md:w-10 md:h-10" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                    <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                    {currentStatus.label}
                  </span>
                  {trip.tripType === 'international' && (
                    <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/30 backdrop-blur rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                      <Globe size={12} className="sm:w-3.5 sm:h-3.5" />
                      Xalqaro
                    </span>
                  )}
                </div>
                
                {/* Xalqaro reys - davlatlar */}
                {trip.tripType === 'international' && trip.countriesInRoute?.length > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    {trip.countriesInRoute.map((code, idx) => (
                      <span key={code} className="flex items-center gap-1">
                        <span className="text-lg">
                          {code?.toUpperCase() === 'UZB' ? '🇺🇿' : code?.toUpperCase() === 'KZ' ? '🇰🇿' : code?.toUpperCase() === 'RU' ? '🇷🇺' : '🏳️'}
                        </span>
                        {idx < trip.countriesInRoute.length - 1 && (
                          <span className="text-white/60 mx-1">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Manzillar */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full shadow-lg flex-shrink-0"></div>
                    <span className="text-base sm:text-xl md:text-2xl font-bold truncate">{trip.startAddress || 'Boshlanish'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white/60 rounded-full flex-shrink-0"></div>
                    <span className="text-base sm:text-xl md:text-2xl font-bold truncate">{trip.endAddress || 'Tugash'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 text-white/80 text-xs sm:text-sm">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    {formatDate(trip.createdAt)}
                  </span>
                  {trip.odometer?.traveled > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Gauge size={12} className="sm:w-3.5 sm:h-3.5" />
                      {trip.odometer.traveled.toLocaleString()} km
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                <p className="text-lg sm:text-xl md:text-2xl font-bold">${formatMoney(trip.income?.amountInUSD || 0)}</p>
                <p className="text-white/70 text-xs sm:text-sm">Daromad</p>
              </div>
              <div className="text-center px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 backdrop-blur rounded-xl border border-white/20">
                <p className={`text-lg sm:text-xl md:text-2xl font-bold ${(trip.profitUSD || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {(trip.profitUSD || 0) >= 0 ? '' : '-'}${formatMoney(Math.abs(trip.profitUSD || 0))}
                </p>
                <p className="text-white/70 text-xs sm:text-sm">{(trip.profitUSD || 0) >= 0 ? 'Sof foyda' : 'Zarar'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* XALQARO REYS SECTION */}
          {trip.tripType === 'international' && (
            <InternationalTripSection trip={trip} rates={rates} onUpdate={fetchTrip} />
          )}

          {/* ODOMETR */}
          <OdometerSection trip={trip} onUpdate={fetchTrip} />

          {/* YOQILG'I */}
          <FuelSection 
            trip={trip} 
            rates={rates}
            onAddFuel={() => setShowFuelModal(true)}
            onUpdate={fetchTrip}
          />

          {/* YO'L XARAJATLARI */}
          <RoadExpensesSection 
            trip={trip}
            onEdit={(country) => { setSelectedCountry(country); setShowRoadModal(true) }}
          />

          {/* KUTILMAGAN XARAJATLAR */}
          <UnexpectedSection 
            trip={trip}
            onAdd={() => setShowUnexpectedModal(true)}
            onUpdate={fetchTrip}
          />

          {/* ITOG HISOB */}
          <ProfitSection trip={trip} />
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Shofyor va Mashina */}
          <DriverVehicleCard trip={trip} navigate={navigate} />

          {/* Vaqt jadvali */}
          <TimelineCard trip={trip} formatDateTime={formatDateTime} />

          {/* Tezkor amallar */}
          <QuickActions 
            trip={trip} 
            onEdit={() => setShowEditModal(true)}
            onUpdate={fetchTrip}
          />
        </div>
      </div>

      {/* MODALLAR */}
      {showFuelModal && (
        <FuelModal 
          tripId={id}
          tripType={trip.tripType}
          rates={rates}
          onClose={() => setShowFuelModal(false)}
          onSuccess={() => { setShowFuelModal(false); fetchTrip() }}
        />
      )}

      {showRoadModal && (
        <RoadExpenseModal
          tripId={id}
          country={selectedCountry}
          currentData={trip.roadExpenses?.[selectedCountry.toLowerCase()]}
          rates={rates}
          onClose={() => setShowRoadModal(false)}
          onSuccess={() => { setShowRoadModal(false); fetchTrip() }}
        />
      )}

      {showUnexpectedModal && (
        <UnexpectedModal
          tripId={id}
          rates={rates}
          onClose={() => setShowUnexpectedModal(false)}
          onSuccess={() => { setShowUnexpectedModal(false); fetchTrip() }}
        />
      )}

      {showEditModal && (
        <EditTripModal
          trip={trip}
          rates={rates}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); fetchTrip() }}
        />
      )}
    </div>
  )
}
