import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Route, MapPin, RefreshCw, ArrowUpRight, Calendar, Zap, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../hooks/useSocket'
import { showToast } from '../components/Toast'
import { PageWrapper, AnimatedCard, DashboardSkeleton, NetworkError, ServerError } from '../components/ui'
import { PaymentModal } from '../components/flightDetail/AllModals'



// Xaritani shofyorlar joylashuviga markazlashtirish komponenti
function MapCenterUpdater({ locations, selectedDriver, shouldCenter }) {
  try {
    const map = useMap()
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
      if (!map) return

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
  } catch (error) {
    console.error('MapCenterUpdater error:', error)
    return null
  }
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedLegForPayment, setSelectedLegForPayment] = useState(null)
  const [selectedFlightForPayment, setSelectedFlightForPayment] = useState(null)
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const { socket, joinBusinessRoom } = useSocket()
  const isDemoMode = isDemo()

  // 🔌 Biznesmen xonasiga qo'shilish - real-time GPS uchun
  useEffect(() => {
    if (user?._id && !isDemoMode) {
      joinBusinessRoom(user._id)
    }
  }, [user?._id, isDemoMode, joinBusinessRoom])

  // 🔌 Socket.io - Real-time GPS yangilanishi va mashrut eventlari
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

    // Flight tasdiqlanganda - real-time yangilash
    socket.on('flight-confirmed', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setActiveFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        setRecentFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
      }
      if (data.message) {
        showToast.success(data.message)
      }
    })

    // Flight yangilanganda (xarajat, buyurtma qo'shilganda) - real-time yangilash
    socket.on('flight-updated', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setActiveFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        setRecentFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
      }
      if (data.message) {
        showToast.info(data.message)
      }
    })

    // Xarajat tasdiqlanganda (haydovchi tomonidan) - real-time yangilash
    // Alert ko'rsatilmaydi - ko'p kishi bir vaqtda tasdiqlasa biznesmenga muammo bo'ladi
    socket.on('expense-confirmed', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setActiveFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        setRecentFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
      }
      // Alert olib tashlandi - ko'p haydovchi bir vaqtda tasdiqlasa bezovta qilmasligi uchun
    })

    // Flight o'chirilganda - real-time yangilash
    socket.on('flight-deleted', (data) => {
      if (data.flightId) {
        const deletedId = data.flightId?.toString()
        setActiveFlights(prev => prev.filter(f => f._id?.toString() !== deletedId))
        setRecentFlights(prev => prev.filter(f => f._id?.toString() !== deletedId))
        setStats(prev => ({
          ...prev,
          activeTrips: Math.max(0, prev.activeTrips - 1)
        }))
      }
      if (data.message) {
        showToast.warning(data.message)
      }
    })

    // Flight bekor qilinganda - real-time yangilash
    socket.on('flight-cancelled', (data) => {
      setStats(prev => ({
        ...prev,
        activeTrips: Math.max(0, prev.activeTrips - 1),
        busyDrivers: Math.max(0, prev.busyDrivers - 1),
        freeDrivers: prev.freeDrivers + 1
      }))
      if (data.flight) {
        setActiveFlights(prev => prev.filter(f => f._id !== data.flight._id))
        setRecentFlights(prev => [data.flight, ...prev.filter(f => f._id !== data.flight._id).slice(0, 5)])
      }
      if (data.message) {
        showToast.warning(data.message)
      }
    })

    return () => {
      socket.off('driver-location')
      socket.off('flight-started')
      socket.off('flight-completed')
      socket.off('flight-confirmed')
      socket.off('flight-updated')
      socket.off('flight-deleted')
      socket.off('flight-cancelled')
      socket.off('expense-confirmed')
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
        // 🚀 Parallel so'rovlar - tezroq yuklash
        // Faqat kerakli so'rovlar - trips ni olib tashladik (eski tizim)
        const [driversRes, vehiclesRes, flightsRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/vehicles'),
          api.get('/flights?limit=20') // Faqat oxirgi 20 ta mashrut
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
          totalExpenses: 0, // Alohida yuklanadi
          totalBonus: 0,
          totalPenalty: 0,
          busyDrivers: drivers.filter(d => d.status === 'busy').length,
          freeDrivers: drivers.filter(d => d.status === 'free' || d.status === 'available').length
        })
        setActiveFlights(activeFlightsList)
        setRecentFlights(allFlights.slice(0, 6))
        setLoading(false)

        // 🚀 Expenses alohida yuklash (sekin bo'lishi mumkin)
        api.get('/expenses/stats').then(expensesRes => {
          setStats(prev => ({
            ...prev,
            totalExpenses: expensesRes.data.data?.totalAmount || 0
          }))
        }).catch(() => { })

      } catch (err) {
        console.error('Stats error:', err)
        setError({
          type: err.isNetworkError ? 'network' : err.isServerError ? 'server' : 'generic',
          message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
        })
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

  // To'lovni tahrirlash handler
  const handleEditPayment = (flight, leg) => {
    setSelectedFlightForPayment(flight)
    setSelectedLegForPayment(leg)
    setIsEditingPayment(true)
    setShowPaymentModal(true)
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
      <AnimatedCard delay={0} hover={false} className="relative overflow-hidden bg-gradient-to-r from-[#2d2d44] to-[#1a1a2e] text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10">
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
              {getGreeting()}, {user?.companyName || user?.fullName || 'Foydalanuvchi'}!
            </h1>
            <p className="text-blue-200 text-sm sm:text-base">Bugungi biznes holatini korib chiqing</p>
          </div>
        </div>

      </AnimatedCard>


      {activeFlights.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Route className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800">Faol marshrutlar</h2>
                <p className="text-xs sm:text-sm text-slate-500">{activeFlights.length} ta mashrut yo'lda</p>
              </div>
            </div>
            <button onClick={() => fetchDriverLocations(true)} className="p-2 sm:p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition">
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {activeFlights.map((flight) => (
              <div key={flight._id}
                onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-5 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border border-slate-200 hover:border-emerald-400">
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25 flex-shrink-0">
                      {flight.driver?.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm sm:text-base truncate">{flight.driver?.fullName}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{flight.vehicle?.plateNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-700 mb-3">
                    <MapPin size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium truncate">{flight.name || 'Yangi marshrut'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      {flight.legs?.length || 0} buyurtma
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                      {flight.totalDistance || 0} km
                    </span>
                  </div>

                  {/* To'lovlar ro'yxati */}
                  {flight.legs && flight.legs.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      {flight.legs.map((leg, idx) => (
                        <div key={leg._id || idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-2 group/leg hover:bg-slate-100 transition">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-xs text-slate-600 truncate">
                              {leg.fromCity?.split(',')[0]} → {leg.toCity?.split(',')[0]}
                            </p>
                            {leg.payment > 0 ? (
                              <p className="text-xs sm:text-sm font-bold text-emerald-600">+{(leg.payment || 0).toLocaleString()} so'm</p>
                            ) : (
                              <p className="text-xs text-slate-400">To'lov kiritilmagan</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditPayment(flight, leg)
                            }}
                            className="ml-2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover/leg:opacity-100"
                            title="To'lovni tahrirlash"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Faol
                    </span>
                    <ArrowUpRight size={18} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}





      {/* Xarita va Oxirgi marshrutlar - 2 ustunli layout */}
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
              {driverLocations.length > 0 ? (
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
                            {driver.status === 'busy' ? 'Marshrutda' : 'Bo\'sh'}
                          </span>
                          {driver.lastLocation?.accuracy && (
                            <p className="text-xs text-gray-400 mt-1">±{Math.round(driver.lastLocation.accuracy)}m</p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MapPin size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">Shofyorlar joylashuvini yuklash...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Oxirgi marshrutlar - o'ng tomon (2/5) */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Route className="text-purple-600" size={16} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Oxirgi marshrutlar</h2>
                <p className="text-xs sm:text-sm text-gray-500">{recentFlights.length} ta mashrut</p>
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
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${flight.status === 'active' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                          flight.status === 'completed' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                            'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                        {flight.driver?.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{flight.driver?.fullName || 'Noma\'lum'}</p>
                        <p className="text-xs text-gray-500 truncate">{flight.name || 'Yangi marshrut'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0 ${flight.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
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
            {driverLocations.length > 0 ? (
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
                          {driver.status === 'busy' ? 'Marshrutda' : 'Bo\'sh'}
                        </span>
                        {driver.lastLocation?.accuracy && (
                          <p className={`mt-3 text-sm font-medium ${driver.lastLocation.accuracy < 50 ? 'text-emerald-600' :
                            driver.lastLocation.accuracy < 100 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                            Aniqlik: ±{Math.round(driver.lastLocation.accuracy)}m
                          </p>
                        )}
                        {driver.lastLocation?.speed > 0 && (
                          <p className="text-sm text-blue-600 mt-1">
                            Tezlik: {Math.round(driver.lastLocation.speed * 3.6)} km/h
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300 text-lg">Xarita yuklash...</p>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLegForPayment && selectedFlightForPayment && (
        <PaymentModal
          leg={selectedLegForPayment}
          isEditing={isEditingPayment}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedLegForPayment(null)
            setSelectedFlightForPayment(null)
            setIsEditingPayment(false)
          }}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowPaymentModal(false)
            showToast.success(isEditingPayment ? 'To\'lov yangilandi' : 'To\'lov saqlandi')

            // 🚀 Yangi format: { payment, paymentType, transferFeePercent }
            const legId = selectedLegForPayment._id
            const flightId = selectedFlightForPayment._id
            const oldPayment = selectedLegForPayment.payment || 0
            const newPayment = typeof data === 'object' ? (data.payment || 0) : Number(data) || 0
            const paymentType = typeof data === 'object' ? (data.paymentType || 'cash') : 'cash'
            const transferFeePercent = typeof data === 'object' ? (data.transferFeePercent || 0) : 0

            setActiveFlights(prev => prev.map(f => {
              if (f._id === flightId) {
                return {
                  ...f,
                  legs: f.legs?.map(l =>
                    l._id === legId ? { ...l, payment: newPayment, paymentType, transferFeePercent } : l
                  ) || [],
                  totalPayment: (f.totalPayment || 0) - oldPayment + newPayment
                }
              }
              return f
            }))

            setRecentFlights(prev => prev.map(f => {
              if (f._id === flightId) {
                return {
                  ...f,
                  legs: f.legs?.map(l =>
                    l._id === legId ? { ...l, payment: newPayment, paymentType, transferFeePercent } : l
                  ) || [],
                  totalPayment: (f.totalPayment || 0) - oldPayment + newPayment
                }
              }
              return f
            }))

            setSelectedLegForPayment(null)
            setSelectedFlightForPayment(null)
            setIsEditingPayment(false)

            // Background da serverga yuborish
            const payload = typeof data === 'object' ? data : { payment: data }
            api.put(`/flights/${flightId}/legs/${legId}/payment`, payload)
              .then(res => {
                if (res.data?.data) {
                  setActiveFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
                  setRecentFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
                }
              })
              .catch(() => {
                showToast.error('Xatolik yuz berdi')
              })
          }}
        />
      )}
    </PageWrapper>
  )
}
