import { useEffect, useState } from 'react'
import { Users, Truck, Route, TrendingUp, TrendingDown, Clock, CheckCircle, MapPin, RefreshCw, ArrowUpRight, Fuel, Calendar, Activity, Zap, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

// Xaritani shofyorlar joylashuviga markazlashtirish komponenti
function MapCenterUpdater({ locations, selectedDriver }) {
  const map = useMap()
  
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
    
    // Aks holda barcha shofyorlarni ko'rsatish
    if (locations && locations.length > 0) {
      const validLocations = locations.filter(d => d.lastLocation)
      if (validLocations.length > 0) {
        const bounds = L.latLngBounds(
          validLocations.map(d => [d.lastLocation.lat, d.lastLocation.lng])
        )
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    }
  }, [locations, selectedDriver, map])
  
  return null
}

// Shofyor uchun custom marker yaratish (ism bilan)
const createDriverIcon = (name, status) => {
  const color = status === 'busy' ? '#f97316' : '#10b981' // orange yoki green
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  
  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, ${color}, ${status === 'busy' ? '#ea580c' : '#059669'});
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 4px 12px ${color}66;
          border: 3px solid white;
        ">${initial}</div>
        <div style="
          background: ${color};
          color: white;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">${name?.split(' ')[0] || 'Nomalum'}</div>
        <div style="
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid ${color};
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [60, 80],
    iconAnchor: [30, 80],
    popupAnchor: [0, -80]
  })
}

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

export default function Dashboard() {
  const { user } = useAuthStore()
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

  const fetchDriverLocations = async () => {
    try {
      const { data } = await api.get('/drivers/locations')
      console.log('📍 Shofyorlar joylashuvi olindi:', data.data?.length || 0, 'ta')
      data.data?.forEach(d => {
        if (d.lastLocation?.lat) {
          console.log(`   ✅ ${d.fullName}: ${d.lastLocation.lat.toFixed(4)}, ${d.lastLocation.lng.toFixed(4)}`)
        } else {
          console.log(`   ❌ ${d.fullName}: Joylashuv yo'q`)
        }
      })
      setDriverLocations(data.data || [])
    } catch (error) {
      console.error('Driver locations error:', error)
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
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
      } catch (error) {
        console.error('Stats error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    fetchDriverLocations()
    const interval = setInterval(fetchDriverLocations, 15000)
    return () => clearInterval(interval)
  }, [])

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
        <div className="text-center">
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
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-8 rounded-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {user?.companyName || 'Admin'}! 👋
            </h1>
            <p className="text-blue-200">Bugungi biznes holatini korib chiqing</p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard/trips')} 
              className="group px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
              <Route size={18} /> 
              Yangi reys
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {quickStats.map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="text-blue-200 text-xs">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
            <button onClick={fetchDriverLocations} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((item, i) => (
          <div key={i} onClick={() => navigate(item.link)}
            className={`group ${item.bg} p-6 rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-200`}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon className="text-white" size={22} />
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{item.value}</p>
            <p className="text-gray-500 text-sm">{item.label}</p>
          </div>
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
                attribution="OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenterUpdater locations={driverLocations} />
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

      {/* Full Screen Map Modal */}
      {fullScreenMap && (
        <div className="fixed inset-0 bg-slate-950 z-[9999]">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-[10000] bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <MapPin className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Jonli xarita
                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      LIVE
                    </span>
                  </h2>
                  <p className="text-slate-400">{driverLocations.filter(d => d.lastLocation).length} ta shofyor online • {driverLocations.filter(d => d.status === 'busy').length} ta reysda</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={fetchDriverLocations}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-xl text-white rounded-xl hover:bg-white/20 transition-all border border-white/10"
                >
                  <RefreshCw size={18} />
                  <span className="font-medium">Yangilash</span>
                </button>
                <button 
                  onClick={() => setFullScreenMap(false)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-medium"
                >
                  <X size={18} />
                  Yopish
                </button>
              </div>
            </div>
          </div>

          {/* Drivers Sidebar */}
          <div className="absolute top-24 left-4 bottom-4 w-96 z-[10000] bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Truck size={20} className="text-white" />
                  </div>
                  Shofyorlar
                </h3>
                <span className="px-3 py-1.5 bg-white/10 rounded-xl text-white font-bold">{driverLocations.length}</span>
              </div>
            </div>
            
            {/* Drivers List */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100%-80px)]">
              {driverLocations.map((driver) => (
                <div 
                  key={driver._id}
                  className={`group p-4 rounded-2xl transition-all cursor-pointer border ${
                    driver.lastLocation 
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-blue-500/50' 
                      : 'bg-white/5 opacity-50 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                        driver.status === 'busy' 
                          ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30' 
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                      }`}>
                        {driver.fullName?.charAt(0)}
                      </div>
                      {driver.lastLocation && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{driver.fullName}</p>
                      <p className="text-slate-400 text-sm">{driver.phone || 'Telefon yo\'q'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        driver.status === 'busy' 
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {driver.status === 'busy' ? '🚛 Reysda' : '✅ Bo\'sh'}
                      </span>
                      {driver.lastLocation && (
                        <div className="mt-2 text-right">
                          {driver.lastLocation.accuracy && (
                            <p className={`text-xs font-medium ${
                              driver.lastLocation.accuracy < 50 ? 'text-emerald-400' : 
                              driver.lastLocation.accuracy < 100 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              📍 ±{Math.round(driver.lastLocation.accuracy)}m
                            </p>
                          )}
                          {driver.lastLocation.speed > 0 && (
                            <p className="text-xs text-blue-400 mt-0.5">
                              🚗 {Math.round(driver.lastLocation.speed * 3.6)} km/h
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {driverLocations.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Truck size={40} className="text-slate-600" />
                  </div>
                  <p className="text-slate-400 font-medium">Shofyorlar yo'q</p>
                  <p className="text-slate-500 text-sm mt-1">Hali shofyor qo'shilmagan</p>
                </div>
              )}
            </div>
          </div>

          {/* Full Screen Map */}
          <div className="absolute inset-0 z-[9998]">
          <MapContainer 
            center={[39.7747, 64.4286]} 
            zoom={6} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution="OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterUpdater locations={driverLocations} />
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
          </MapContainer>
          </div>
        </div>
      )}
    </div>
  )
}
