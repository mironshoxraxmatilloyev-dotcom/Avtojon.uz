import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Route, MapPin, RefreshCw, ArrowUpRight, Calendar, Zap, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../contexts/SocketContext'
import { PageWrapper, AnimatedCard, AnimatedStatCard, DashboardSkeleton, NetworkError, ServerError } from '../components/ui'



// Xaritani shofyorlar joylashuviga markazlashtirish komponenti
function MapCenterUpdater({ locations, selectedDriver, shouldCenter }) {
  const map = useMap()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Agar tanlangan shofyor bo'lsa, unga zoom qilish
    if (selectedDriver?.lastLocation) {
      map.flyTo(
        [selectedDriver.lastLocation.lat, selectedDriver.lastLocation.lng],
        15,
        { duration: 1.5 }
      )
      return
    }

    // Faqat birinchi marta (initialized=false) YOKI shouldCenter=true bo'lganda
    const validLocations = locations?.filter(d => d.lastLocation) || []

    if (validLocations.length > 0 && (!initialized || shouldCenter)) {
      const bounds = L.latLngBounds(
        validLocations.map(d => [d.lastLocation.lat, d.lastLocation.lng])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      setInitialized(true)
    }
  }, [locations, selectedDriver, shouldCenter, map, initialized])

  return null
}

// Shofyor uchun custom marker yaratish (ism bilan)
const createDriverIcon = (name, status) => {
  const color = status === 'busy' ? '#f97316' : '#10b981'
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const firstName = name?.split(' ')[0] || 'Noma\'lum'

  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="width:40px;height:40px;background:${color};border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">${initial}</div>
        <div style="background:${color};color:white;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600;margin-top:2px;white-space:nowrap;">${firstName}</div>
        <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -60]
  })
}

// Truck icon - kerak bo'lganda ishlatiladi
// const truckIcon = new L.Icon({
//   iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
//   iconSize: [40, 40],
//   iconAnchor: [20, 40],
//   popupAnchor: [0, -40]
// })

// Demo rejim uchun fake ma'lumotlar
const DEMO_DATA = {
  stats: {
    drivers: 8, vehicles: 12, activeTrips: 3, completedTrips: 156,
    totalExpenses: 45000000, pendingTrips: 5, totalBonus: 8500000, totalPenalty: 1200000,
    busyDrivers: 3, freeDrivers: 5
  },
  activeTrips: [
    { _id: 'demo1', driver: { fullName: 'Akmal Karimov' }, vehicle: { plateNumber: '01 A 123 AB' }, startAddress: 'Toshkent', endAddress: 'Samarqand', status: 'in_progress' },
    { _id: 'demo2', driver: { fullName: 'Bobur Aliyev' }, vehicle: { plateNumber: '01 B 456 CD' }, startAddress: 'Buxoro', endAddress: 'Navoiy', status: 'in_progress' },
    { _id: 'demo3', driver: { fullName: 'Sardor Rahimov' }, vehicle: { plateNumber: '01 C 789 EF' }, startAddress: 'Farg\'ona', endAddress: 'Andijon', status: 'in_progress' }
  ],
  recentTrips: [
    { _id: 'demo1', driver: { fullName: 'Akmal Karimov' }, startAddress: 'Toshkent', endAddress: 'Samarqand', status: 'in_progress', createdAt: new Date() },
    { _id: 'demo4', driver: { fullName: 'Jasur Toshmatov' }, startAddress: 'Namangan', endAddress: 'Toshkent', status: 'completed', createdAt: new Date(Date.now() - 86400000) },
    { _id: 'demo5', driver: { fullName: 'Dilshod Umarov' }, startAddress: 'Xorazm', endAddress: 'Buxoro', status: 'completed', createdAt: new Date(Date.now() - 172800000) },
    { _id: 'demo6', driver: { fullName: 'Nodir Qodirov' }, startAddress: 'Qarshi', endAddress: 'Termiz', status: 'pending', createdAt: new Date() }
  ],
  driverLocations: [
    { _id: 'd1', fullName: 'Akmal Karimov', phone: '+998901234567', status: 'busy', lastLocation: { lat: 39.65, lng: 66.96 } },
    { _id: 'd2', fullName: 'Bobur Aliyev', phone: '+998901234568', status: 'busy', lastLocation: { lat: 40.12, lng: 65.37 } },
    { _id: 'd3', fullName: 'Sardor Rahimov', phone: '+998901234569', status: 'busy', lastLocation: { lat: 40.78, lng: 72.34 } },
    { _id: 'd4', fullName: 'Jasur Toshmatov', phone: '+998901234570', status: 'free', lastLocation: { lat: 41.31, lng: 69.28 } }
  ]
}

export default function Dashboard() {
  const { user, isDemo } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    drivers: 0, vehicles: 0, activeTrips: 0, completedTrips: 0,
    totalExpenses: 0, pendingTrips: 0, totalBonus: 0, totalPenalty: 0,
    busyDrivers: 0, freeDrivers: 0
  })
  const [activeFlights, setActiveFlights] = useState([])
  const [recentFlights, setRecentFlights] = useState([])
  const [driverLocations, setDriverLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // Error state
  const [fullScreenMap, setFullScreenMap] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [shouldCenterMap, setShouldCenterMap] = useState(false)
  const { socket } = useSocket()
  const isDemoMode = isDemo()

  // 🔌 Socket.io - Real-time GPS yangilanishi va reys eventlari
  useEffect(() => {
    if (!socket) return

    socket.on('driver-location', (data) => {
      setDriverLocations(prev => prev.map(driver =>
        driver._id === data.driverId
          ? { ...driver, lastLocation: data.location }
          : driver
      ))
    })

    // Flight boshlanganda - real-time yangilash
    socket.on('flight-started', (data) => {
      setStats(prev => ({
        ...prev,
        activeTrips: prev.activeTrips + 1,
        busyDrivers: prev.busyDrivers + 1,
        freeDrivers: Math.max(0, prev.freeDrivers - 1)
      }))
      if (data.flight) {
        setActiveFlights(prev => [data.flight, ...prev])
        setRecentFlights(prev => [data.flight, ...prev.slice(0, 5)])
      }
    })

    // Flight tugatilganda - real-time yangilash
    socket.on('flight-completed', (data) => {
      setStats(prev => ({
        ...prev,
        activeTrips: Math.max(0, prev.activeTrips - 1),
        completedTrips: prev.completedTrips + 1,
        busyDrivers: Math.max(0, prev.busyDrivers - 1),
        freeDrivers: prev.freeDrivers + 1
      }))
      if (data.flight) {
        setActiveFlights(prev => prev.filter(f => f._id !== data.flight._id))
        setRecentFlights(prev => [data.flight, ...prev.filter(f => f._id !== data.flight._id).slice(0, 5)])
      }
    })

    return () => {
      socket.off('driver-location')
      socket.off('flight-started')
      socket.off('flight-completed')
    }
  }, [socket])

  const fetchDriverLocations = async (centerMap = false) => {
    try {
      const { data } = await api.get('/drivers/locations')
      setDriverLocations(data.data || [])

      // Faqat "Yangilash" tugmasi bosilganda xaritani markazlashtirish
      if (centerMap) {
        setShouldCenterMap(true)
        setTimeout(() => setShouldCenterMap(false), 100)
      }
    } catch {
      // Driver locations error - silent
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      // Demo rejimda fake data ishlatish
      if (isDemoMode) {
        setStats(DEMO_DATA.stats)
        setActiveFlights(DEMO_DATA.activeTrips) // Demo uchun
        setDriverLocations(DEMO_DATA.driverLocations)
        setLoading(false)
        return
      }

      try {
        // Faqat kerakli so'rovlar - trips ni olib tashladik (eski tizim)
        const [driversRes, vehiclesRes, expensesRes, flightsRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/vehicles'),
          api.get('/expenses/stats').catch(() => ({ data: { data: { totalAmount: 0 } } })),
          api.get('/flights').catch(() => ({ data: { data: [] } }))
        ])

        const drivers = driversRes.data.data || []
        const allFlights = flightsRes.data.data || []
        const activeFlightsList = allFlights.filter(f => f.status === 'active')
        const completedFlights = allFlights.filter(f => f.status === 'completed')

        setStats({
          drivers: drivers.length,
          vehicles: vehiclesRes.data.data?.length || 0,
          activeTrips: activeFlightsList.length,
          completedTrips: completedFlights.length,
          pendingTrips: 0,
          totalExpenses: expensesRes.data.data?.totalAmount || 0,
          totalBonus: 0,
          totalPenalty: 0,
          busyDrivers: drivers.filter(d => d.status === 'busy').length,
          freeDrivers: drivers.filter(d => d.status === 'free' || d.status === 'available').length
        })
        setActiveFlights(activeFlightsList)
        setRecentFlights(allFlights.slice(0, 6))
      } catch (err) {
        console.error('Stats error:', err)
        setError({
          type: err.isNetworkError ? 'network' : err.isServerError ? 'server' : 'generic',
          message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    setError(null)
    if (!isDemoMode) {
      fetchDriverLocations()
      // Intervalini 30 sekundga oshirdik (15 dan)
      const interval = setInterval(fetchDriverLocations, 30000)
      return () => clearInterval(interval)
    }
  }, [isDemoMode])

  // Full screen map ochilganda scroll'ni bloklash
  useEffect(() => {
    if (fullScreenMap) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [fullScreenMap])

  const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n)
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  // Refetch function for error retry
  const refetchData = () => {
    setLoading(true)
    setError(null)
    window.location.reload()
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  // Error states
  if (error) {
    if (error.type === 'network') {
      return <NetworkError onRetry={refetchData} message={error.message} />
    }
    if (error.type === 'server') {
      return <ServerError onRetry={refetchData} message={error.message} />
    }
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={refetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Qayta urinish
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageWrapper className="space-y-6 pb-8">
      {/* Demo Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base">Demo rejim</p>
              <p className="text-xs sm:text-sm text-white/80 line-clamp-2">Bu demo versiya. To'liq funksiyadan foydalanish uchun ro'yxatdan o'ting.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="px-3 sm:px-4 py-2 bg-white text-orange-600 rounded-lg sm:rounded-xl font-semibold hover:bg-orange-50 transition text-sm w-full sm:w-auto flex-shrink-0"
          >
            Ro'yxatdan o'tish
          </button>
        </div>
      )}

      {/* Hero Header */}
      <AnimatedCard delay={0} hover={false} className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>

        <div className="relative">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs sm:text-sm mb-1 sm:mb-2">
              <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
              <span>{(() => {
                const date = new Date()
                const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
                const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
                return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}`
              })()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
              {getGreeting()}, {user?.companyName || 'Admin'}! 👋
            </h1>
            <p className="text-blue-200 text-sm sm:text-base">Bugungi biznes holatini korib chiqing</p>
          </div>
        </div>

      </AnimatedCard>

      {/* Faol reyslar (yangi tizim - flights) */}
      {activeFlights.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Route className="text-emerald-600" size={16} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Faol reyslar</h2>
                <p className="text-xs sm:text-sm text-gray-500">{activeFlights.length} ta reys yo'lda</p>
              </div>
            </div>
            <button onClick={() => fetchDriverLocations(true)} className="p-1.5 sm:p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg sm:rounded-xl transition">
              <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {activeFlights.map((flight) => (
              <div key={flight._id}
                onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border border-emerald-100 hover:border-emerald-300">
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
                    <span className="font-medium truncate">{flight.name || 'Yangi reys'}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                    <span>{flight.legs?.length || 0} bosqich</span>
                    <span>•</span>
                    <span>{flight.totalDistance || 0} km</span>
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-center justify-between">
                    <span className="px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Faol
                    </span>
                    <ArrowUpRight size={14} className="sm:w-4 sm:h-4 text-gray-400 group-hover:text-emerald-600 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}





      {/* Xarita va Oxirgi reyslar - 2 ustunli layout */}
      {!fullScreenMap && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Jonli xarita - chap tomon (3/5) */}
          <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <MapPin className="text-blue-600" size={16} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Jonli xarita</h2>
                  <p className="text-xs sm:text-sm text-gray-500">{driverLocations.filter(d => d.lastLocation).length} ta shofyor online</p>
                </div>
              </div>
              <button
                onClick={() => setFullScreenMap(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all text-xs sm:text-sm"
              >
                <Play size={14} className="sm:w-4 sm:h-4" />
                <span className="font-medium">Kengaytirish</span>
              </button>
            </div>
            <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200" style={{ height: '400px' }}>
              <MapContainer center={[39.7747, 64.4286]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapCenterUpdater locations={driverLocations} selectedDriver={selectedDriver} shouldCenter={shouldCenterMap} />
                {driverLocations.filter(d => d.lastLocation).map((driver) => (
                  <Marker
                    key={driver._id}
                    position={[driver.lastLocation.lat, driver.lastLocation.lng]}
                    icon={createDriverIcon(driver.fullName, driver.status)}
                  >
                    <Popup>
                      <div className="text-center p-3 min-w-[160px]">
                        <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-lg mb-2 ${driver.status === 'busy' ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                          }`}>
                          {driver.fullName?.charAt(0)}
                        </div>
                        <p className="font-bold text-gray-900">{driver.fullName}</p>
                        <p className="text-gray-500 text-sm">{driver.phone || ''}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                          }`}>
                          {driver.status === 'busy' ? '🚛 Reysda' : '✅ Bo\'sh'}
                        </span>
                        {driver.lastLocation?.accuracy && (
                          <p className="text-xs text-gray-400 mt-1">📍 ±{Math.round(driver.lastLocation.accuracy)}m</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Oxirgi reyslar - o'ng tomon (2/5) */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Route className="text-purple-600" size={16} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Oxirgi reyslar</h2>
                <p className="text-xs sm:text-sm text-gray-500">{recentFlights.length} ta reys</p>
              </div>
            </div>
            <div className="space-y-3" style={{ maxHeight: '370px', overflowY: 'auto' }}>
              {recentFlights.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Route size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Hozircha reyslar yo'q</p>
                </div>
              ) : (
                recentFlights.map((flight) => (
                  <div
                    key={flight._id}
                    onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
                    className="p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all border border-transparent hover:border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                        flight.status === 'active' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                        flight.status === 'completed' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        {flight.driver?.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{flight.driver?.fullName || 'Noma\'lum'}</p>
                        <p className="text-xs text-gray-500 truncate">{flight.name || 'Yangi reys'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0 ${
                        flight.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        flight.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {flight.status === 'active' ? 'Faol' : flight.status === 'completed' ? 'Tugadi' : 'Kutilmoqda'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentFlights.length > 0 && (
              <button
                onClick={() => navigate('/dashboard/flights')}
                className="w-full mt-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
              >
                Barcha reyslarni ko'rish →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full Screen Map Modal - Pro Design */}
      {fullScreenMap && createPortal(
        <div className="fixed inset-0 bg-slate-950" style={{ zIndex: 99999 }}>
          {/* CLOSE BUTTON - Top Left */}
          <button
            onClick={() => setFullScreenMap(false)}
            className="absolute top-4 left-4 flex items-center gap-2 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-2xl font-semibold z-[999999]"
          >
            <X size={20} />
            Yopish
          </button>

          {/* Full Screen Map */}
          <div className="absolute inset-0" style={{ zIndex: 99998 }}>
            <MapContainer
              center={[39.7747, 64.4286]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapCenterUpdater locations={driverLocations} selectedDriver={selectedDriver} shouldCenter={shouldCenterMap} />
              {driverLocations.filter(d => d.lastLocation).map((driver) => (
                <Marker
                  key={driver._id}
                  position={[driver.lastLocation.lat, driver.lastLocation.lng]}
                  icon={createDriverIcon(driver.fullName, driver.status)}
                >
                  <Popup>
                    <div className="text-center p-4 min-w-[200px]">
                      <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3 ${driver.status === 'busy'
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        }`}>
                        {driver.fullName?.charAt(0)}
                      </div>
                      <p className="font-bold text-gray-900 text-lg">{driver.fullName}</p>
                      <p className="text-gray-500">{driver.phone || 'Telefon yo\'q'}</p>
                      <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-medium ${driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                        {driver.status === 'busy' ? '🚛 Reysda' : '✅ Bo\'sh'}
                      </span>
                      {driver.lastLocation?.accuracy && (
                        <p className={`mt-3 text-sm font-medium ${driver.lastLocation.accuracy < 50 ? 'text-emerald-600' :
                          driver.lastLocation.accuracy < 100 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                          📍 Aniqlik: ±{Math.round(driver.lastLocation.accuracy)}m
                        </p>
                      )}
                      {driver.lastLocation?.speed > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          🚗 Tezlik: {Math.round(driver.lastLocation.speed * 3.6)} km/h
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>,
        document.body
      )}
    </PageWrapper>
  )
}
