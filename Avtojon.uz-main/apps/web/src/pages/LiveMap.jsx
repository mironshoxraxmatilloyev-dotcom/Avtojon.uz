import { useEffect, useState, useRef, useCallback } from 'react'
import { RefreshCw, Truck, MapPin, Phone, X, Clock, Gauge, Eye, EyeOff } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

// Marker yaratish
function createMarkerIcon(letter, selected) {
  const size = selected ? 48 : 38
  const color = selected ? '#2563eb' : '#22c55e'
  return L.divIcon({
    className: 'driver-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:bold;font-size:${selected ? 18 : 14}px;
      border:3px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
      ${selected ? 'animation:pulse 1.5s infinite;' : ''}
    ">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Xarita kontroleri - haydovchini kuzatish
function FollowDriver({ driver, following, onFirstFly }) {
  const map = useMap()
  const didFirstFly = useRef(false)
  const prevDriverId = useRef(null)

  useEffect(() => {
    if (!driver?.lastLocation) return

    const { lat, lng } = driver.lastLocation

    // Yangi haydovchi tanlanganda - flyTo
    if (driver._id !== prevDriverId.current) {
      prevDriverId.current = driver._id
      didFirstFly.current = false
    }

    if (!didFirstFly.current) {
      // Birinchi marta - animatsiya bilan
      map.flyTo([lat, lng], 15, { duration: 1.2 })
      didFirstFly.current = true
      if (onFirstFly) onFirstFly()
    } else if (following) {
      // Kuzatish rejimida - silliq harakatlanish
      map.setView([lat, lng], map.getZoom(), { animate: true, duration: 0.5 })
    }
  }, [driver?._id, driver?.lastLocation?.lat, driver?.lastLocation?.lng, following, map, onFirstFly])

  return null
}

// CSS animatsiya
const pulseStyle = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
`

export default function LiveMap() {
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [following, setFollowing] = useState(true)
  const mapRef = useRef(null)

  // Ma'lumotlarni yuklash
  const loadData = useCallback(async () => {
    try {
      const [dRes, tRes] = await Promise.all([
        api.get('/drivers/locations'),
        api.get('/trips/active')
      ])
      setDrivers(dRes.data.data || [])
      setTrips(tRes.data.data || [])
    } catch (e) {
      console.error('Load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const timer = setInterval(loadData, 8000)
    return () => clearInterval(timer)
  }, [loadData])

  // Tanlangan haydovchi
  const selected = drivers.find(d => d._id === selectedId)

  // Haydovchi tanlash
  const handleSelect = (driver) => {
    if (selectedId === driver._id) {
      // Qayta bosilsa - kuzatishni yoqish
      setFollowing(true)
    } else {
      setSelectedId(driver._id)
      setFollowing(true)
    }
  }

  // Yopish
  const handleClose = () => {
    setSelectedId(null)
    setFollowing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Truck className="w-12 h-12 mx-auto mb-3 text-blue-500 animate-bounce" />
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const onlineCount = drivers.filter(d => d.lastLocation).length

  return (
    <div>
      <style>{pulseStyle}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl">
            <MapPin className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Jonli xarita
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
            </h1>
            <p className="text-sm text-gray-500">
              {onlineCount} ta online • {trips.length} ta reysda
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition"
          >
            <RefreshCw size={16} /> Yangilash
          </button>
          {selectedId && (
            <button 
              onClick={handleClose}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              <X size={16} /> Yopish
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        
        {/* Sidebar */}
        <div className="w-72 bg-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="bg-slate-700 p-3 flex items-center justify-between">
            <span className="text-white font-semibold flex items-center gap-2">
              <Truck size={18} /> Shofyorlar
            </span>
            <span className="bg-slate-600 text-white text-sm px-2 py-0.5 rounded-full">
              {drivers.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {drivers.map(driver => {
              const isSelected = selectedId === driver._id
              const hasLocation = !!driver.lastLocation
              
              return (
                <div
                  key={driver._id}
                  onClick={() => hasLocation && handleSelect(driver)}
                  className={`rounded-xl p-3 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 ring-2 ring-blue-400' 
                      : hasLocation 
                        ? 'bg-slate-700 hover:bg-slate-600' 
                        : 'bg-slate-700/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isSelected ? 'bg-blue-500' : hasLocation ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {driver.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-white truncate text-sm">{driver.fullName}</p>
                        <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
                          driver.status === 'busy' 
                            ? 'bg-orange-500/20 text-orange-300' 
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {driver.status === 'busy' ? 'Reysda' : "Bo'sh"}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">{driver.phone}</p>
                      {hasLocation && (
                        <div className="flex gap-2 mt-1 text-xs">
                          <span className="text-pink-400">±{Math.round(driver.lastLocation.accuracy || 0)}m</span>
                          <span className="text-blue-400">{Math.round((driver.lastLocation.speed || 0) * 3.6)} km/h</span>
                        </div>
                      )}
                      {!hasLocation && (
                        <p className="text-gray-500 text-xs mt-1">GPS yo'q</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden relative bg-slate-200">
          <MapContainer 
            center={[41.3, 69.3]} 
            zoom={6} 
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Kuzatish komponenti */}
            {selected && (
              <FollowDriver 
                driver={selected} 
                following={following}
              />
            )}

            {/* Markerlar */}
            {drivers.filter(d => d.lastLocation).map(driver => (
              <Marker
                key={driver._id}
                position={[driver.lastLocation.lat, driver.lastLocation.lng]}
                icon={createMarkerIcon(driver.fullName?.charAt(0) || '?', selectedId === driver._id)}
                eventHandlers={{
                  click: () => handleSelect(driver)
                }}
              >
                <Popup>
                  <div className="text-center py-1">
                    <p className="font-bold">{driver.fullName}</p>
                    <p className="text-gray-500 text-sm">{driver.phone}</p>
                    <p className="text-xs mt-1">±{Math.round(driver.lastLocation.accuracy || 0)}m</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Info panel */}
          {selected && (
            <div className="absolute bottom-3 left-3 right-3 bg-white rounded-xl shadow-lg p-3 z-[1000]">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {selected.fullName?.charAt(0) || '?'}
                  </div>
                  {following && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">{selected.fullName}</h3>
                    <button
                      onClick={() => setFollowing(!following)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        following 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {following ? <Eye size={12} /> : <EyeOff size={12} />}
                      {following ? 'Kuzatilmoqda' : 'Kuzatish'}
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selected.status === 'busy' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selected.status === 'busy' ? '🚛 Reysda' : "✅ Bo'sh"}
                    </span>
                  </div>
                  
                  <a href={`tel:${selected.phone}`} className="text-blue-600 text-sm flex items-center gap-1">
                    <Phone size={12} /> {selected.phone}
                  </a>

                  {selected.lastLocation && (
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span><MapPin size={10} className="inline" /> ±{Math.round(selected.lastLocation.accuracy || 0)}m</span>
                      <span><Gauge size={10} className="inline" /> {Math.round((selected.lastLocation.speed || 0) * 3.6)} km/h</span>
                      <span><Clock size={10} className="inline" /> {selected.lastLocation.updatedAt ? new Date(selected.lastLocation.updatedAt).toLocaleTimeString('uz-UZ', {hour:'2-digit', minute:'2-digit'}) : '-'}</span>
                    </div>
                  )}
                </div>

                {/* Close */}
                <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
