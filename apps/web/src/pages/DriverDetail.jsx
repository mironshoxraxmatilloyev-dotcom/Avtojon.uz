import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { 
  ArrowLeft, User, Phone, CreditCard, Truck, Route, MapPin, 
  Calendar, Wallet, TrendingUp, TrendingDown, CheckCircle, Clock, 
  Activity, Star, Award, ChevronRight, Sparkles, Shield, X, Play, Gauge, Fuel
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'

export default function DriverDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDemo } = useAuthStore()
  const alert = useAlert()
  const isDemoMode = isDemo()
  
  const [driver, setDriver] = useState(null)
  const [trips, setTrips] = useState([])
  const [flights, setFlights] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Reys ochish modal
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [flightForm, setFlightForm] = useState({
    startOdometer: '',
    startFuel: '',
    fromCity: '',
    toCity: '',
    payment: '',
    givenBudget: '',
    distance: '',
    fromCoords: null,
    toCoords: null
  })

  const fetchData = async () => {
    try {
      const [driverRes, tripsRes, vehiclesRes, flightsRes] = await Promise.all([
        api.get(`/drivers/${id}`),
        api.get('/trips', { params: { driverId: id } }),
        api.get('/vehicles'),
        api.get('/flights', { params: { driverId: id } })
      ])
      setDriver(driverRes.data.data)
      setTrips(tripsRes.data.data || [])
      setFlights(flightsRes.data.data || [])
      const assignedVehicle = (vehiclesRes.data.data || []).find(v => 
        v.currentDriver === id || v.currentDriver?._id === id
      )
      setVehicle(assignedVehicle)
    } catch (error) {
      showToast.error('Shofyor topilmadi')
      navigate('/dashboard/drivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  // Masofa hisoblash
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c)
  }

  // Reys ochish
  const handleStartFlight = async (e) => {
    e.preventDefault()
    
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      setShowFlightModal(false)
      return
    }

    if (!flightForm.fromCity || !flightForm.toCity) {
      showToast.error('Qayerdan va qayerga shaharlarini kiriting!')
      return
    }

    try {
      const payload = {
        driverId: id,
        startOdometer: Number(flightForm.startOdometer) || 0,
        startFuel: Number(flightForm.startFuel) || 0,
        firstLeg: {
          fromCity: flightForm.fromCity,
          toCity: flightForm.toCity,
          fromCoords: flightForm.fromCoords,
          toCoords: flightForm.toCoords,
          payment: Number(flightForm.payment) || 0,
          givenBudget: Number(flightForm.givenBudget) || 0,
          distance: Number(flightForm.distance) || 0
        }
      }

      const res = await api.post('/flights', payload)
      showToast.success('Reys ochildi!')
      setShowFlightModal(false)
      setFlightForm({ startOdometer: '', startFuel: '', fromCity: '', toCity: '', payment: '', givenBudget: '', distance: '', fromCoords: null, toCoords: null })
      // Yangi reysga o'tish
      navigate(`/dashboard/flights/${res.data.data._id}`)
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'

  const statusConfig = {
    pending: { label: 'Kutilmoqda', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', gradient: 'from-amber-500 to-orange-600', dot: 'bg-amber-400' },
    in_progress: { label: "Yo'lda", color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', gradient: 'from-blue-500 to-indigo-600', dot: 'bg-blue-400' },
    completed: { label: 'Tugatilgan', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', gradient: 'from-emerald-500 to-teal-600', dot: 'bg-emerald-400' },
    cancelled: { label: 'Bekor', color: 'bg-red-500/20 text-red-400 border-red-500/30', gradient: 'from-red-500 to-rose-600', dot: 'bg-red-400' }
  }

  const driverStatusConfig = {
    busy: { label: 'Reysda', color: 'from-orange-500 to-amber-600', icon: Activity },
    offline: { label: 'Offline', color: 'from-slate-500 to-slate-600', icon: Clock },
    available: { label: "Bo'sh", color: 'from-emerald-500 to-teal-600', icon: CheckCircle }
  }

  // Statistika
  const completedTrips = trips.filter(t => t.status === 'completed')
  const activeTrips = trips.filter(t => t.status === 'in_progress')
  const totalBonus = completedTrips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0)
  const totalPenalty = completedTrips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0)
  const totalPayment = completedTrips.reduce((sum, t) => sum + (t.tripPayment || 0), 0)
  const totalEarnings = (driver?.baseSalary || 0) + totalPayment + totalBonus - totalPenalty

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

  if (!driver) return null

  const currentStatus = driverStatusConfig[driver.status] || driverStatusConfig.available
  const StatusIcon = currentStatus.icon

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
        
        <div className="relative">
          {/* Back button */}
          <button 
            onClick={() => navigate('/dashboard/drivers')} 
            className="mb-4 sm:mb-6 flex items-center gap-2 text-blue-300 hover:text-white transition group text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Shofyorlarga qaytish</span>
          </button>

          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Avatar and Info Row */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold shadow-2xl shadow-blue-500/30">
                  {driver.fullName?.charAt(0) || 'S'}
                </div>
                <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br ${currentStatus.color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
                  <StatusIcon size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-bold truncate">{driver.fullName}</h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500/20 rounded-full">
                    <Star size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-300 text-xs sm:text-sm font-medium">Pro</span>
                  </div>
                </div>
                <p className="text-blue-300 text-sm sm:text-lg">@{driver.username}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
                  <span className={`px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r ${currentStatus.color} rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1.5 sm:gap-2`}>
                    <StatusIcon size={14} className="sm:w-4 sm:h-4" />
                    {currentStatus.label}
                  </span>
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm text-blue-200 flex items-center gap-1.5">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    {formatDate(driver.createdAt)} dan beri
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl border border-white/10">
                <p className="text-2xl sm:text-3xl font-bold">{completedTrips.length}</p>
                <p className="text-blue-300 text-xs sm:text-sm">Reyslar</p>
              </div>
              <div className="text-center px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl border border-white/10">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400">{formatMoney(totalEarnings)}</p>
                <p className="text-blue-300 text-xs sm:text-sm">Jami daromad</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Stats */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Moliyaviy statistika</h2>
                <p className="text-gray-500 text-xs sm:text-sm">Oylik hisobot</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="group p-3 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Wallet size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatMoney(driver.baseSalary)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Oylik maosh</p>
              </div>

              <div className="group p-3 sm:p-5 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl border border-purple-100 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Route size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatMoney(totalPayment)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Reys haqlari</p>
              </div>

              <div className="group p-3 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl border border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">+{formatMoney(totalBonus)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Bonuslar</p>
              </div>

              <div className="group p-3 sm:p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl sm:rounded-2xl border border-red-100 hover:shadow-lg hover:shadow-red-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <TrendingDown size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-red-600">-{formatMoney(totalPenalty)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Jarimalar</p>
              </div>
            </div>

            {/* Total Earnings Bar */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Award size={20} className="sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Jami daromad</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">{formatMoney(totalEarnings)} <span className="text-sm sm:text-lg text-slate-400">so'm</span></p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Trips History */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reyslar tarixi</h2>
                  <p className="text-gray-500 text-sm">{trips.length} ta reys</p>
                </div>
              </div>
              {activeTrips.length > 0 && (
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium animate-pulse">
                  {activeTrips.length} ta faol reys
                </span>
              )}
            </div>

            {trips.length > 0 ? (
              <div className="space-y-3">
                {trips.slice(0, 10).map((trip) => (
                  <div 
                    key={trip._id} 
                    onClick={() => navigate(`/dashboard/trips/${trip._id}`)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-blue-200"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${statusConfig[trip.status]?.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <MapPin size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{trip.startAddress} → {trip.endAddress}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">{formatDate(trip.createdAt)}</span>
                        {trip.estimatedDistance && (
                          <span className="text-sm text-gray-400">• {trip.estimatedDistance} km</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusConfig[trip.status]?.color}`}>
                        {statusConfig[trip.status]?.label}
                      </span>
                      {trip.tripPayment > 0 && (
                        <p className="text-sm font-bold text-gray-900 mt-2">{formatMoney(trip.tripPayment)} so'm</p>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Route size={40} className="text-gray-300" />
                </div>
                <p className="text-gray-500">Hali reyslar yo'q</p>
              </div>
            )}
          </div>
        </div>


        {/* Right Column */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Shaxsiy ma'lumotlar</h2>
                <p className="text-gray-500 text-sm">Hujjatlar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <Phone size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Telefon</p>
                    <p className="font-semibold text-gray-900">{driver.phone || 'Kiritilmagan'}</p>
                  </div>
                </div>
              </div>

              <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                    <CreditCard size={20} className="text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Passport</p>
                    <p className="font-semibold text-gray-900">{driver.passport || 'Kiritilmagan'}</p>
                  </div>
                </div>
              </div>

              <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <Shield size={20} className="text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Guvohnoma</p>
                    <p className="font-semibold text-gray-900">{driver.licenseNumber || 'Kiritilmagan'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicle */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Biriktirilgan mashina</h2>
                <p className="text-gray-500 text-sm">Transport vositasi</p>
              </div>
            </div>

            {vehicle ? (
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <Truck size={32} className="text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{vehicle.plateNumber}</p>
                      <p className="text-blue-200">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Yil</p>
                    <p className="text-xl font-bold text-gray-900">{vehicle.year || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rang</p>
                    <p className="text-xl font-bold text-gray-900">{vehicle.color || '-'}</p>
                  </div>
                </div>

                {vehicle.capacity && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Yuk sig'imi</p>
                    <p className="text-xl font-bold text-amber-700">{vehicle.capacity} tonna</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Truck size={40} className="text-gray-300" />
                </div>
                <p className="text-gray-500 mb-4">Mashina biriktirilmagan</p>
                <button 
                  onClick={() => navigate('/dashboard/vehicles')}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Mashina biriktirish
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Tezkor amallar
            </h3>
            <div className="space-y-3">
              {driver.status !== 'busy' && (
                <button 
                  onClick={() => setShowFlightModal(true)}
                  className="w-full p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl text-left transition flex items-center gap-3 border border-emerald-500/30"
                >
                  <Play size={20} className="text-emerald-400" />
                  <span className="font-medium">Reys ochish</span>
                  <ChevronRight size={18} className="ml-auto text-emerald-400" />
                </button>
              )}
              <button 
                onClick={() => navigate('/dashboard/trips')}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left transition flex items-center gap-3"
              >
                <Route size={20} className="text-blue-400" />
                <span>Barcha reyslar</span>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
              <button 
                onClick={() => navigate('/dashboard/salaries')}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left transition flex items-center gap-3"
              >
                <Wallet size={20} className="text-emerald-400" />
                <span>Maosh hisoblash</span>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reys ochish Modal */}
      {showFlightModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowFlightModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Yangi reys ochish</h2>
                      <p className="text-emerald-300 text-sm">{driver.fullName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowFlightModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleStartFlight} className="p-6 space-y-5">
                {/* Mashina info */}
                {vehicle && (
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <Truck size={20} className="text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">{vehicle.plateNumber}</p>
                        <p className="text-sm text-blue-300">{vehicle.brand}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Odometr va Yoqilg'i */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-emerald-200 mb-2">
                      <Gauge size={14} className="inline mr-1" /> Odometr (km)
                    </label>
                    <input
                      type="number"
                      value={flightForm.startOdometer}
                      onChange={(e) => setFlightForm({ ...flightForm, startOdometer: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-200 mb-2">
                      <Fuel size={14} className="inline mr-1" /> Yoqilg'i (L)
                    </label>
                    <input
                      type="number"
                      value={flightForm.startFuel}
                      onChange={(e) => setFlightForm({ ...flightForm, startFuel: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="100"
                    />
                  </div>
                </div>

                {/* Birinchi bosqich */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm font-semibold text-emerald-300 mb-3">Birinchi bosqich</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Qayerdan *</label>
                      <AddressAutocomplete
                        value={flightForm.fromCity}
                        onChange={(val) => setFlightForm({ ...flightForm, fromCity: val })}
                        onSelect={(s) => {
                          setFlightForm(prev => ({ ...prev, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } }))
                          if (flightForm.toCoords) {
                            const dist = calculateDistance(s.lat, s.lng, flightForm.toCoords.lat, flightForm.toCoords.lng)
                            setFlightForm(prev => ({ ...prev, distance: dist }))
                          }
                        }}
                        placeholder="Toshkent"
                        focusColor="green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Qayerga *</label>
                      <AddressAutocomplete
                        value={flightForm.toCity}
                        onChange={(val) => setFlightForm({ ...flightForm, toCity: val })}
                        onSelect={(s) => {
                          setFlightForm(prev => ({ ...prev, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } }))
                          if (flightForm.fromCoords) {
                            const dist = calculateDistance(flightForm.fromCoords.lat, flightForm.fromCoords.lng, s.lat, s.lng)
                            setFlightForm(prev => ({ ...prev, distance: dist }))
                          }
                        }}
                        placeholder="Samarqand"
                        focusColor="green"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Mijozdan to'lov</label>
                        <input
                          type="number"
                          value={flightForm.payment}
                          onChange={(e) => setFlightForm({ ...flightForm, payment: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                          placeholder="500000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Yo'l xarajati</label>
                        <input
                          type="number"
                          value={flightForm.givenBudget}
                          onChange={(e) => setFlightForm({ ...flightForm, givenBudget: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none text-sm"
                          placeholder="200000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Masofa (km)</label>
                      <input
                        type="number"
                        value={flightForm.distance}
                        onChange={(e) => setFlightForm({ ...flightForm, distance: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                        placeholder="300"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition flex items-center justify-center gap-2"
                >
                  <Play size={20} /> Reysni boshlash
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
