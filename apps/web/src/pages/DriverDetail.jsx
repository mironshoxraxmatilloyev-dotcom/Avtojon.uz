import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { 
  ArrowLeft, User, Phone, Truck, Route, 
  Calendar, Wallet, TrendingUp, TrendingDown, CheckCircle, Clock, 
  Activity, ChevronRight, X, Play, Gauge, Fuel
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert, DriverDetailSkeleton, NetworkError, NotFoundError } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { useSocket } from '../hooks/useSocket'

export default function DriverDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDemo } = useAuthStore()
  const alert = useAlert()
  const isDemoMode = isDemo()
  const { socket } = useSocket()
  
  const [driver, setDriver] = useState(null)
  const [flights, setFlights] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFlightModal, setShowFlightModal] = useState(false)
  
  useEffect(() => {
    if (showFlightModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showFlightModal])

  const [flightForm, setFlightForm] = useState({
    startOdometer: '', startFuel: '', fromCity: '', toCity: '',
    payment: '', givenBudget: '', fromCoords: null, toCoords: null,
    flightType: 'domestic', fuelType: 'benzin', fuelUnit: 'litr'
  })

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const [driverRes, vehiclesRes, flightsRes] = await Promise.all([
        api.get(`/drivers/${id}`),
        api.get('/vehicles'),
        api.get('/flights', { params: { driverId: id } })
      ])
      setDriver(driverRes.data.data)
      setFlights(flightsRes.data.data || [])
      const assignedVehicle = (vehiclesRes.data.data || []).find(v => 
        v.currentDriver === id || v.currentDriver?._id === id
      )
      setVehicle(assignedVehicle)
    } catch (err) {
      if (err.response?.status === 404) {
        setError({ type: 'notfound', message: 'Shofyor topilmadi' })
      } else {
        setError({
          type: err.isNetworkError ? 'network' : 'generic',
          message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
        })
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])
  
  useEffect(() => {
    if (!socket) return
    const handleFlightUpdate = (data) => {
      if (data.flight?.driver === id || data.flight?.driver?._id === id) {
        fetchData(false)
      }
    }
    const handleDriverUpdate = (data) => {
      if (data.driver?._id === id || data.driverId === id) {
        fetchData(false)
      }
    }
    socket.on('flight-started', handleFlightUpdate)
    socket.on('flight-updated', handleFlightUpdate)
    socket.on('flight-completed', handleFlightUpdate)
    socket.on('driver-updated', handleDriverUpdate)
    return () => {
      socket.off('flight-started', handleFlightUpdate)
      socket.off('flight-updated', handleFlightUpdate)
      socket.off('flight-completed', handleFlightUpdate)
      socket.off('driver-updated', handleDriverUpdate)
    }
  }, [socket, id, fetchData])

  if (loading) return <DriverDetailSkeleton />

  if (error) {
    if (error.type === 'notfound') {
      return <NotFoundError title="Shofyor topilmadi" message="Bu shofyor mavjud emas yoki o'chirilgan" onBack={() => navigate('/dashboard/drivers')} />
    }
    if (error.type === 'network') {
      return <NetworkError onRetry={fetchData} message={error.message} />
    }
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Qayta urinish</button>
        </div>
      </div>
    )
  }

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

  const handleStartFlight = async (e) => {
    e.preventDefault()
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya.')
      setShowFlightModal(false)
      return
    }
    if (!flightForm.fromCity || !flightForm.toCity) {
      showToast.error('Qayerdan va qayerga shaharlarini kiriting!')
      return
    }
    const payload = {
      driverId: id,
      startOdometer: Number(flightForm.startOdometer) || 0,
      startFuel: Number(flightForm.startFuel) || 0,
      fuelType: flightForm.fuelType || 'benzin',
      fuelUnit: flightForm.fuelUnit || 'litr',
      flightType: flightForm.flightType,
      firstLeg: {
        fromCity: flightForm.fromCity,
        toCity: flightForm.toCity,
        fromCoords: flightForm.fromCoords,
        toCoords: flightForm.toCoords,
        payment: Number(flightForm.payment) || 0,
        givenBudget: Number(flightForm.givenBudget) || 0
      }
    }
    const fromCity = flightForm.fromCity
    const toCity = flightForm.toCity
    setShowFlightModal(false)
    setFlightForm({ startOdometer: '', startFuel: '', fromCity: '', toCity: '', payment: '', givenBudget: '', fromCoords: null, toCoords: null, flightType: 'domestic', fuelType: 'benzin', fuelUnit: 'litr' })
    showToast.success(`Reys ochilmoqda: ${fromCity} → ${toCity}`)
    api.post('/flights', payload)
      .then((res) => navigate(`/dashboard/flights/${res.data.data._id}`))
      .catch((err) => showToast.error(err.response?.data?.message || 'Xatolik yuz berdi'))
  }

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'

  const driverStatusConfig = {
    busy: { label: 'Reysda', color: 'from-orange-500 to-amber-600', icon: Activity, bg: 'bg-orange-500' },
    offline: { label: 'Offline', color: 'from-slate-500 to-slate-600', icon: Clock, bg: 'bg-slate-500' },
    available: { label: "Bo'sh", color: 'from-emerald-500 to-teal-600', icon: CheckCircle, bg: 'bg-emerald-500' }
  }

  const totalPayment = flights.reduce((sum, f) => sum + (f.totalPayment || 0), 0)
  const totalExpenses = flights.reduce((sum, f) => sum + (f.totalExpenses || 0), 0)
  const totalProfit = flights.reduce((sum, f) => sum + (f.profit || 0), 0)
  const totalEarnings = (driver?.baseSalary || 0) + totalProfit

  if (!driver) return null

  const currentStatus = driverStatusConfig[driver.status] || driverStatusConfig.available
  const StatusIcon = currentStatus.icon
  const activeFlight = flights.find(f => f.status === 'active')


  return (
    <div className="space-y-4 pb-8">
      {/* Header with Action */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>
        
        <div className="relative">
          <button 
            onClick={() => navigate('/dashboard/drivers')} 
            className="mb-3 flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"
          >
            <ArrowLeft size={16} />
            <span>Shofyorlarga qaytish</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                {driver.fullName?.charAt(0) || 'S'}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${currentStatus.bg} rounded-lg flex items-center justify-center`}>
                <StatusIcon size={12} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{driver.fullName}</h1>
              <p className="text-slate-400 text-sm">@{driver.username}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 bg-gradient-to-r ${currentStatus.color} rounded-lg text-xs font-medium`}>
                  {currentStatus.label}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Calendar size={10} /> {formatDate(driver.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Card - inside header */}
          {activeFlight ? (
            <div 
              onClick={() => navigate(`/dashboard/flights/${activeFlight._id}`)}
              className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3 cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <Route size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-xs">Faol reys</p>
                    <p className="font-bold text-white text-sm">{activeFlight.name || 'Joriy reys'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 bg-white/20 rounded-lg">
                  <Play size={12} className="text-white" />
                  <span className="text-white text-xs font-medium">Davom</span>
                  <ChevronRight size={12} className="text-white" />
                </div>
              </div>
            </div>
          ) : driver.status !== 'busy' && (
            <div 
              onClick={() => setShowFlightModal(true)}
              className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 cursor-pointer hover:from-blue-600 hover:to-indigo-600 transition shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <Truck size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-xs">Haydovchi bo'sh</p>
                    <p className="font-bold text-white text-sm">Yangi reys boshlash</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 bg-white/20 rounded-lg">
                  <Play size={12} className="text-white" />
                  <span className="text-white text-xs font-medium">Boshlash</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Moliyaviy */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Wallet size={16} className="text-white" />
              </div>
              <h2 className="font-bold text-gray-900">Moliyaviy</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-lg font-bold text-gray-900">{formatMoney(driver.baseSalary)}</p>
                <p className="text-xs text-gray-500">Oylik maosh</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <p className="text-lg font-bold text-emerald-600">{formatMoney(totalEarnings)}</p>
                <p className="text-xs text-gray-500">Daromad</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="text-lg font-bold text-orange-600">{formatMoney(totalExpenses)}</p>
                <p className="text-xs text-gray-500">Xarajatlar</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <p className="text-lg font-bold text-purple-600">+{formatMoney(totalProfit)}</p>
                <p className="text-xs text-gray-500">Foyda</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-xs">Jami daromad</p>
                <p className="text-xl font-bold text-white">{formatMoney(totalEarnings)} <span className="text-sm text-blue-200">so'm</span></p>
              </div>
              <TrendingUp size={24} className="text-emerald-300" />
            </div>
          </div>

          {/* Reyslar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Route size={16} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900">Reyslar</h2>
                <span className="text-xs text-gray-400">({flights.length})</span>
              </div>
              {flights.filter(f => f.status === 'active').length > 0 && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs animate-pulse">
                  {flights.filter(f => f.status === 'active').length} faol
                </span>
              )}
            </div>
            {flights.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {flights.slice(0, 10).map((flight) => (
                  <div 
                    key={flight._id} 
                    onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      flight.status === 'active' ? 'bg-orange-500' : 
                      flight.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}>
                      <Route size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{flight.name || 'Reys'}</p>
                      <p className="text-xs text-gray-500">{formatDate(flight.createdAt)} • {flight.totalDistance || 0} km</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-medium ${
                        flight.status === 'active' ? 'text-orange-600' : 
                        flight.status === 'completed' ? 'text-emerald-600' : 'text-gray-500'
                      }`}>
                        {flight.status === 'active' ? '🚛 Faol' : flight.status === 'completed' ? '✅ Yopilgan' : '❌ Bekor'}
                      </span>
                      {flight.totalPayment > 0 && (
                        <p className="text-xs font-bold text-emerald-600">{formatMoney(flight.totalPayment)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Route size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Hali reyslar yo'q</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <h2 className="font-bold text-gray-900">Ma'lumotlar</h2>
            </div>
            
            {/* Telefon */}
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Telefon</p>
                <p className="font-medium text-gray-900 text-sm">{driver.phone || 'Kiritilmagan'}</p>
              </div>
            </div>

            {/* Mashina */}
            {vehicle ? (
              <div className="space-y-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck size={14} className="text-blue-200" />
                    <span className="text-blue-200 text-xs">Mashina</span>
                  </div>
                  <p className="text-xl font-bold">{vehicle.plateNumber}</p>
                  <p className="text-blue-200 text-sm">{vehicle.brand} {vehicle.model}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Yil</p>
                    <p className="font-bold text-gray-900">{vehicle.year || '-'}</p>
                  </div>
                  {vehicle.capacity && (
                    <div className="p-2 bg-amber-50 rounded-lg text-center">
                      <p className="text-xs text-amber-600">Sig'im</p>
                      <p className="font-bold text-amber-700">{vehicle.capacity}t</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Truck size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Mashina</p>
                    <p className="font-medium text-gray-500 text-sm">Biriktirilmagan</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/dashboard/vehicles')}
                  className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                >
                  Biriktirish
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-white">
            <h3 className="font-bold mb-3 text-sm">Tezkor amallar</h3>
            <div className="space-y-2">
              {driver.status !== 'busy' && (
                <button 
                  onClick={() => setShowFlightModal(true)}
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg text-left transition flex items-center gap-2"
                >
                  <Play size={16} />
                  <span className="text-sm font-medium">Reys ochish</span>
                </button>
              )}
              <button 
                onClick={() => navigate('/dashboard/flights')}
                className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition flex items-center gap-2"
              >
                <Route size={16} className="text-blue-400" />
                <span className="text-sm">Barcha reyslar</span>
              </button>
              <button 
                onClick={() => navigate('/dashboard/salaries')}
                className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-left transition flex items-center gap-2"
              >
                <Wallet size={16} className="text-emerald-400" />
                <span className="text-sm">Maosh hisoblash</span>
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Reys ochish Modal */}
      {showFlightModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto"
          onClick={() => setShowFlightModal(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div 
              className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Yangi reys</h2>
                      <p className="text-emerald-300 text-sm">{driver.fullName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowFlightModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleStartFlight} className="p-5 space-y-4">
                {vehicle && (
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center gap-3">
                    <Truck size={18} className="text-blue-400" />
                    <div>
                      <p className="font-semibold text-white text-sm">{vehicle.plateNumber}</p>
                      <p className="text-xs text-blue-300">{vehicle.brand}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-emerald-200 mb-2">Reys turi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFlightForm({ ...flightForm, flightType: 'domestic' })}
                      className={`p-3 rounded-xl border-2 transition ${
                        flightForm.flightType === 'domestic'
                          ? 'border-green-500 bg-green-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">🇺🇿</span>
                      <p className="font-medium text-sm mt-1">Mahalliy</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlightForm({ ...flightForm, flightType: 'international' })}
                      className={`p-3 rounded-xl border-2 transition ${
                        flightForm.flightType === 'international'
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400'
                      }`}
                    >
                      <span className="text-xl">🌍</span>
                      <p className="font-medium text-sm mt-1">Xalqaro</p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-emerald-200 mb-1">
                      <Gauge size={12} className="inline mr-1" /> Odometr (km)
                    </label>
                    <input
                      type="number"
                      value={flightForm.startOdometer}
                      onChange={(e) => setFlightForm({ ...flightForm, startOdometer: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-emerald-200 mb-1">
                      <Fuel size={12} className="inline mr-1" /> Yoqilg'i
                    </label>
                    <input
                      type="number"
                      value={flightForm.startFuel}
                      onChange={(e) => setFlightForm({ ...flightForm, startFuel: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-emerald-200 mb-1">Yoqilg'i turi</label>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { value: 'benzin', label: 'Benzin', icon: '⛽', unit: 'litr' },
                      { value: 'diesel', label: 'Dizel', icon: '🛢️', unit: 'litr' },
                      { value: 'gas', label: 'Gaz', icon: '🔵', unit: 'kub' },
                      { value: 'metan', label: 'Metan', icon: '🟢', unit: 'kub' },
                      { value: 'propan', label: 'Propan', icon: '🟡', unit: 'litr' }
                    ].map(fuel => (
                      <button
                        key={fuel.value}
                        type="button"
                        onClick={() => setFlightForm({ ...flightForm, fuelType: fuel.value, fuelUnit: fuel.unit })}
                        className={`p-2 rounded-lg border text-center transition ${
                          flightForm.fuelType === fuel.value
                            ? 'border-emerald-500 bg-emerald-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        <span className="text-base">{fuel.icon}</span>
                        <p className="text-[9px] mt-0.5">{fuel.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm font-medium text-emerald-300 mb-2">Birinchi buyurtma</p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Qayerdan *</label>
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
                        domesticOnly={flightForm.flightType === 'domestic'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Qayerga *</label>
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
                        domesticOnly={flightForm.flightType === 'domestic'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Berilgan pul (so'm)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={flightForm.givenBudget ? new Intl.NumberFormat('uz-UZ').format(flightForm.givenBudget) : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '')
                          setFlightForm({ ...flightForm, givenBudget: rawValue })
                        }}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none text-sm"
                        placeholder="200,000"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Play size={18} /> Reysni boshlash
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
