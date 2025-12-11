import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Users, Truck, Route, TrendingUp, TrendingDown, Clock, CheckCircle, MapPin, RefreshCw, ArrowUpRight, Fuel, Calendar, Activity, Zap, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../contexts/SocketContext'
import { PageWrapper, AnimatedCard, AnimatedStatCard } from '../components/ui'

// eslint-disable-next-line no-unused-vars

// Start/End markers
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

// Backend API orqali marshrut olish
async function getRouteFromAPI(startLat, startLng, endLat, endLng) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const baseUrl = apiUrl.replace('/api', '')
    const response = await fetch(
      `${baseUrl}/api/route?start=${startLng},${startLat}&end=${endLng},${endLat}`
    )
    const data = await response.json()
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0]
      const coords = route.geometry.coordinates || route.geometry
      return {
        coordinates: coords.map(coord => [coord[1], coord[0]]),
        distance: Math.round(route.distance / 1000),
        duration: Math.round(route.duration / 60)
      }
    }
    return null
  } catch (error) {
    console.error('Marshrut olish xatosi:', error)
    return null
  }
}

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
  const firstName = name?.split(' ')[0] || 'Nomalum'
  
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
  const [activeTrips, setActiveTrips] = useState([])
  const [recentTrips, setRecentTrips] = useState([])
  const [driverLocations, setDriverLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [fullScreenMap, setFullScreenMap] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [shouldCenterMap, setShouldCenterMap] = useState(false)
  const [tripRoutes, setTripRoutes] = useState({}) // Har bir reys uchun marshrut
  const { socket } = useSocket()
  const isDemoMode = isDemo()

  // 🔌 Socket.io - Real-time GPS yangilanishi va reys eventlari
  useEffect(() => {
    if (!socket) return

    socket.on('driver-location', (data) => {
      console.log('🔌 Real-time GPS:', data.driverName, data.location.lat.toFixed(4), data.location.lng.toFixed(4))
      
      setDriverLocations(prev => prev.map(driver => 
        driver._id === data.driverId 
          ? { ...driver, lastLocation: data.location }
          : driver
      ))
    })

    // Reys boshlanganda - real-time yangilash
    socket.on('trip-started', (data) => {
      console.log('🔔 Dashboard: Reys boshlandi:', data)
      // Stats va trips ni yangilash
      setStats(prev => ({
        ...prev,
        activeTrips: prev.activeTrips + 1,
        pendingTrips: Math.max(0, prev.pendingTrips - 1),
        busyDrivers: prev.busyDrivers + 1,
        freeDrivers: Math.max(0, prev.freeDrivers - 1)
      }))
      if (data.trip) {
        setActiveTrips(prev => [data.trip, ...prev])
        setRecentTrips(prev => [data.trip, ...prev.slice(0, 5)])
      }
    })

    // Reys tugatilganda - real-time yangilash
    socket.on('trip-completed', (data) => {
      console.log('🔔 Dashboard: Reys tugatildi:', data)
      // Stats va trips ni yangilash
      setStats(prev => ({
        ...prev,
        activeTrips: Math.max(0, prev.activeTrips - 1),
        completedTrips: prev.completedTrips + 1,
        busyDrivers: Math.max(0, prev.busyDrivers - 1),
        freeDrivers: prev.freeDrivers + 1
      }))
      if (data.trip) {
        setActiveTrips(prev => prev.filter(t => t._id !== data.trip._id))
        setRecentTrips(prev => [data.trip, ...prev.filter(t => t._id !== data.trip._id).slice(0, 5)])
      }
    })

    return () => {
      socket.off('driver-location')
      socket.off('trip-started')
      socket.off('trip-completed')
    }
  }, [socket])

  const fetchDriverLocations = async (centerMap = false) => {
    try {
      const { data } = await api.get('/drivers/locations')
      console.log('📍 Shofyorlar joylashuvi olindi:', data.data?.length || 0, 'ta')
      setDriverLocations(data.data || [])
      
      // Faqat "Yangilash" tugmasi bosilganda xaritani markazlashtirish
      if (centerMap) {
        setShouldCenterMap(true)
        setTimeout(() => setShouldCenterMap(false), 100)
      }
    } catch (error) {
      console.error('Driver locations error:', error)
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      // Demo rejimda fake data ishlatish
      if (isDemoMode) {
        setStats(DEMO_DATA.stats)
        setActiveTrips(DEMO_DATA.activeTrips)
        setRecentTrips(DEMO_DATA.recentTrips)
        setDriverLocations(DEMO_DATA.driverLocations)
        setLoading(false)
        return
      }

      try {
        const [driversRes, vehiclesRes, tripsRes, expensesRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/vehicles'),
          api.get('/trips'),
          api.get('/expenses/stats').catch(() => ({ data: { data: { totalAmount: 0 } } }))
        ])
        
        const trips = tripsRes.data.data || []
        const drivers = driversRes.data.data || []
        const active = trips.filter(t => t.status === 'in_progress')
        const completed = trips.filter(t => t.status === 'completed')
        
        setStats({
          drivers: drivers.length,
          vehicles: vehiclesRes.data.data?.length || 0,
          activeTrips: active.length,
          completedTrips: completed.length,
          pendingTrips: trips.filter(t => t.status === 'pending').length,
          totalExpenses: expensesRes.data.data?.totalAmount || 0,
          totalBonus: completed.reduce((sum, t) => sum + (t.bonusAmount || 0), 0),
          totalPenalty: completed.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0),
          busyDrivers: drivers.filter(d => d.status === 'busy').length,
          freeDrivers: drivers.filter(d => d.status === 'free').length
        })
        setActiveTrips(active)
        setRecentTrips(trips.slice(0, 6))
        
        // Faol reyslar uchun marshrut olish
        for (const trip of active) {
          if (trip.startCoords && trip.endCoords) {
            const route = await getRouteFromAPI(
              trip.startCoords.lat, trip.startCoords.lng,
              trip.endCoords.lat, trip.endCoords.lng
            )
            if (route) {
              setTripRoutes(prev => ({ ...prev, [trip._id]: route }))
            }
          }
        }
      } catch (error) {
        console.error('Stats error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    if (!isDemoMode) {
      fetchDriverLocations()
      const interval = setInterval(fetchDriverLocations, 15000)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <Truck className="absolute inset-0 m-auto text-blue-600" size={32} />
          </div>
          <p className="text-gray-500 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const quickStats = [
    { label: 'Faol reyslar', value: stats.activeTrips, icon: Activity, color: 'from-orange-400 to-orange-600' },
    { label: 'Yoldagi shofyorlar', value: stats.busyDrivers, icon: Truck, color: 'from-blue-400 to-blue-600' },
    { label: 'Bosh shofyorlar', value: stats.freeDrivers, icon: Users, color: 'from-green-400 to-green-600' },
    { label: 'Kutilayotgan', value: stats.pendingTrips, icon: Clock, color: 'from-purple-400 to-purple-600' },
  ]

  const mainStats = [
    { label: 'Jami shofyorlar', value: stats.drivers, icon: Users, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', link: '/dashboard/drivers' },
    { label: 'Tugatilgan reyslar', value: stats.completedTrips, icon: CheckCircle, gradient: 'from-green-500 to-green-600', bg: 'bg-green-50', link: '/dashboard/trips' },
    { label: 'Jami mashinalar', value: stats.vehicles, icon: Truck, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', link: '/dashboard/drivers' },
    { label: 'Jami reyslar', value: stats.completedTrips + stats.activeTrips + stats.pendingTrips, icon: Route, gradient: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', link: '/dashboard/trips' },
  ]

  return (
    <PageWrapper className="space-y-6 pb-8">
      {/* Demo Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <p className="font-semibold">Demo rejim</p>
              <p className="text-sm text-white/80">Bu demo versiya. To'liq funksiyadan foydalanish uchun ro'yxatdan o'ting.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition"
          >
            Ro'yxatdan o'tish
          </button>
        </div>
      )}

      {/* Hero Header */}
      <AnimatedCard delay={0} hover={false} className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs sm:text-sm mb-1 sm:mb-2">
              <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
              <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
              {getGreeting()}, {user?.companyName || 'Admin'}! 👋
            </h1>
            <p className="text-blue-200 text-sm sm:text-base">Bugungi biznes holatini korib chiqing</p>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => navigate('/dashboard/trips')} 
              className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10 text-sm sm:text-base">
              <Route size={16} className="sm:w-[18px] sm:h-[18px]" /> 
              <span className="hidden xs:inline">Yangi</span> reys
              <ArrowUpRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-8">
          {quickStats.map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">{item.value}</p>
                  <p className="text-blue-200 text-[10px] sm:text-xs">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AnimatedCard>

      {/* Faol reyslar */}
      {activeTrips.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Zap className="text-orange-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Hozir yolda</h2>
                <p className="text-sm text-gray-500">{activeTrips.length} ta faol reys</p>
              </div>
            </div>
            <button onClick={() => fetchDriverLocations(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
              <RefreshCw size={18} />
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrips.map((trip) => (
              <div key={trip._id} 
                onClick={() => navigate(`/dashboard/trips/${trip._id}`)}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200">
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
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {mainStats.map((item, i) => (
          <AnimatedStatCard
            key={i}
            icon={item.icon}
            label={item.label}
            value={item.value}
            gradient={item.gradient}
            bgColor={item.bg}
            onClick={() => navigate(item.link)}
            delay={i * 100}
          />
        ))}
      </div>

      {/* Moliyaviy statistika */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white p-6 rounded-2xl shadow-xl shadow-red-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Fuel size={22} />
              </div>
              <span className="font-medium">Jami xarajatlar</span>
            </div>
            <p className="text-4xl font-bold">{formatMoney(stats.totalExpenses)}</p>
            <p className="text-red-200 text-sm mt-1">som sarflandi</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white p-6 rounded-2xl shadow-xl shadow-green-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <TrendingUp size={22} />
              </div>
              <span className="font-medium">Bonuslar</span>
            </div>
            <p className="text-4xl font-bold">+{formatMoney(stats.totalBonus)}</p>
            <p className="text-green-200 text-sm mt-1">som tejaldi</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl shadow-orange-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <TrendingDown size={22} />
              </div>
              <span className="font-medium">Jarimalar</span>
            </div>
            <p className="text-4xl font-bold">-{formatMoney(stats.totalPenalty)}</p>
            <p className="text-orange-200 text-sm mt-1">som ortiqcha</p>
          </div>
        </div>
      </div>

      {/* Xarita va Songgi reyslar */}
      {!fullScreenMap && (
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Jonli xarita */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Jonli xarita</h2>
                <p className="text-sm text-gray-500">{driverLocations.filter(d => d.lastLocation).length} ta shofyor online</p>
              </div>
            </div>
            <button 
              onClick={() => setFullScreenMap(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Play size={16} />
              <span className="text-sm font-medium">Kengaytirish</span>
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: '380px' }}>
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
                      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-lg mb-2 ${
                        driver.status === 'busy' ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {driver.fullName?.charAt(0)}
                      </div>
                      <p className="font-bold text-gray-900">{driver.fullName}</p>
                      <p className="text-gray-500 text-sm">{driver.phone || ''}</p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
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
              
              {/* Faol reyslar uchun marshrut chiziqlari */}
              {activeTrips.map((trip) => {
                const route = tripRoutes[trip._id]
                return (
                  <span key={`route-${trip._id}`}>
                    {route && route.coordinates && (
                      <Polyline positions={route.coordinates} color="#3b82f6" weight={4} opacity={0.8} />
                    )}
                    {trip.startCoords && (
                      <Marker position={[trip.startCoords.lat, trip.startCoords.lng]} icon={startIcon}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold text-green-600">🟢 Boshlanish</p>
                            <p className="text-xs">{trip.startAddress}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {trip.endCoords && (
                      <Marker position={[trip.endCoords.lat, trip.endCoords.lng]} icon={endIcon}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-bold text-red-600">🔴 Manzil</p>
                            <p className="text-xs">{trip.endAddress}</p>
                            {route && <p className="text-xs text-blue-600 mt-1">{route.distance} km</p>}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </span>
                )
              })}
            </MapContainer>
          </div>
        </div>

        {/* Songgi reyslar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Route className="text-purple-600" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Songgi reyslar</h2>
                <p className="text-sm text-gray-500">Oxirgi faoliyat</p>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard/trips')} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
              Barchasi <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recentTrips.map((trip) => (
              <div key={trip._id} 
                onClick={() => navigate(`/dashboard/trips/${trip._id}`)}
                className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                  trip.status === 'completed' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  trip.status === 'in_progress' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  trip.status === 'pending' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 
                  'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  {trip.driver?.fullName?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{trip.driver?.fullName || 'Nomalum'}</p>
                  <p className="text-sm text-gray-500 truncate">{trip.startAddress} - {trip.endAddress}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                    trip.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    trip.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {trip.status === 'completed' ? 'Tugatilgan' :
                     trip.status === 'in_progress' ? 'Yolda' :
                     trip.status === 'pending' ? 'Kutilmoqda' : 'Bekor'}
                  </span>
                </div>
              </div>
            ))}
            {recentTrips.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Route size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500">Reyslar yoq</p>
              </div>
            )}
          </div>
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

          {/* Compact Right Sidebar */}
          <div className="hidden lg:flex flex-col absolute top-20 right-4 bottom-4 w-72 bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-xl" style={{ zIndex: 100000 }}>
            {/* Sidebar Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Truck size={14} className="text-blue-400" />
                Shofyorlar
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] font-bold">{driverLocations.length}</span>
              </h3>
              {selectedDriver && (
                <button onClick={() => setSelectedDriver(null)} className="text-blue-400 text-xs hover:underline">
                  Hammasi
                </button>
              )}
            </div>
            
            {/* Drivers List - Compact */}
            <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
              {driverLocations.map((driver) => (
                <div 
                  key={driver._id}
                  onClick={() => driver.lastLocation && setSelectedDriver(driver)}
                  className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                    selectedDriver?._id === driver._id
                      ? 'bg-blue-500/20 ring-1 ring-blue-500/50'
                      : driver.lastLocation 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-white/5 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                        driver.status === 'busy' ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}>
                        {driver.fullName?.charAt(0)}
                      </div>
                      {driver.lastLocation && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{driver.fullName}</p>
                      <p className={`text-[10px] ${driver.status === 'busy' ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {driver.status === 'busy' ? 'Reysda' : 'Bo\'sh'}
                        {driver.lastLocation?.speed > 0 && ` • ${Math.round(driver.lastLocation.speed * 3.6)} km/h`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {driverLocations.length === 0 && (
                <div className="text-center py-6">
                  <Truck size={24} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">Shofyorlar yo'q</p>
                </div>
              )}
            </div>
            
            {/* Active Trips */}
            {activeTrips.length > 0 && (
              <div className="border-t border-white/10 p-3">
                <h4 className="text-white text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Activity size={12} className="text-blue-400" />
                  Faol reyslar
                  <span className="px-1 py-0.5 bg-blue-500/20 rounded text-blue-400 text-[10px]">{activeTrips.length}</span>
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activeTrips.slice(0, 4).map((trip) => (
                    <div key={trip._id} className="p-2 bg-white/5 rounded-lg">
                      <p className="text-white text-[11px] font-medium truncate">{trip.driver?.fullName}</p>
                      <p className="text-slate-400 text-[10px] truncate">{trip.startAddress} → {trip.endAddress}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                    <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3 ${
                      driver.status === 'busy' 
                        ? 'bg-gradient-to-br from-orange-500 to-amber-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {driver.fullName?.charAt(0)}
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{driver.fullName}</p>
                    <p className="text-gray-500">{driver.phone || 'Telefon yo\'q'}</p>
                    <span className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-medium ${
                      driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {driver.status === 'busy' ? '🚛 Reysda' : '✅ Bo\'sh'}
                    </span>
                    {driver.lastLocation?.accuracy && (
                      <p className={`mt-3 text-sm font-medium ${
                        driver.lastLocation.accuracy < 50 ? 'text-emerald-600' : 
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
            
            {/* Fullscreen: Faol reyslar uchun marshrut chiziqlari */}
            {activeTrips.map((trip) => {
              const route = tripRoutes[trip._id]
              return (
                <span key={`fs-route-${trip._id}`}>
                  {route && route.coordinates && (
                    <Polyline positions={route.coordinates} color="#3b82f6" weight={5} opacity={0.9} />
                  )}
                  {trip.startCoords && (
                    <Marker position={[trip.startCoords.lat, trip.startCoords.lng]} icon={startIcon}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-green-600">🟢 Boshlanish</p>
                          <p className="text-xs">{trip.startAddress}</p>
                          <p className="text-xs text-gray-500 mt-1">{trip.driver?.fullName}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  {trip.endCoords && (
                    <Marker position={[trip.endCoords.lat, trip.endCoords.lng]} icon={endIcon}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-red-600">🔴 Manzil</p>
                          <p className="text-xs">{trip.endAddress}</p>
                          {route && <p className="text-xs text-blue-600 mt-1">{route.distance} km • {route.duration} daq</p>}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </span>
              )
            })}
          </MapContainer>
          </div>

          {/* Mobile Bottom Sheet - Pro Design */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-[100000] bg-slate-900/95 backdrop-blur-2xl rounded-t-3xl border-t border-white/10">
            <div className="p-4 pb-6">
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4"></div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                  <Truck size={14} className="text-blue-400" />
                  Shofyorlar
                </h4>
                <span className="text-emerald-400 text-xs font-medium">
                  {driverLocations.filter(d => d.lastLocation).length} online
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {driverLocations.filter(d => d.lastLocation).map((driver) => (
                  <button
                    key={driver._id}
                    onClick={() => setSelectedDriver(driver)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all border ${
                      selectedDriver?._id === driver._id
                        ? 'bg-blue-500/20 border-blue-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      driver.status === 'busy' ? 'bg-gradient-to-br from-orange-500 to-amber-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {driver.fullName?.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium whitespace-nowrap">{driver.fullName?.split(' ')[0]}</p>
                      <p className={`text-xs ${driver.status === 'busy' ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {driver.status === 'busy' ? 'Reysda' : 'Bo\'sh'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageWrapper>
  )
}
