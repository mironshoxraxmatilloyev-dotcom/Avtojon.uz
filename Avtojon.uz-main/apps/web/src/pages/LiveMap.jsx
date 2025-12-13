import { useEffect, useState, useRef } from 'react'
import { RefreshCw, Truck, MapPin, Phone, X, Clock, Gauge, Eye, EyeOff } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

// Shofyor markeri
const createDriverIcon = (name, isSelected) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const size = isSelected ? 56 : 44
  const bg = isSelected ? '#2563eb' : '#22c55e'
  
  return L.divIcon({
    className: 'driver-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:${size}px;height:${size}px;
          background:linear-gradient(135deg,${bg},${isSelected ? '#1d4ed8' : '#16a34a'});
          border-radius:14px;display:flex;align-items:center;justify-content:center;
          color:white;font-weight:bold;font-size:${isSelected ? 22 : 18}px;
          border:3px solid white;box-shadow:0 4px 15px ${bg}66;
          ${isSelected ? 'animation:pulse 2s infinite;' : ''}
        ">${initial}</div>
        <div style="
          background:${bg};color:white;padding:3px 10px;border-radius:10px;
          font-size:11px;font-weight:600;margin-top:4px;white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">${name?.split(' ')[0] || 'Nomalum'}</div>
      </div>
    `,
    iconSize: [70, 90],
    iconAnchor: [35, 90],
    popupAnchor: [0, -90]
  })
}

// Xarita controller - haydovchini kuzatish
function MapController({ selectedDriver, isTracking, onFirstFly }) {
  const map = useMap()
  const hasFlewRef = useRef(false)
  const lastDriverIdRef = useRef(null)

  useEffect(() => {
    if (!selectedDriver?.lastLocation) return

    const { lat, lng } = selectedDriver.lastLocation
    
    // Yangi haydovchi tanlanganda - bir marta fly
    if (selectedDriver._id !== lastDriverIdRef.current) {
      lastDriverIdRef.current = selectedDriver._id
      hasFlewRef.current = false
    }

    if (!hasFlewRef.current) {
      hasFlewRef.current = true
      map.flyTo([lat, lng], 15, { duration: 1.2 })
      onFirstFly?.()
    } else if (isTracking) {
      // Kuzatish rejimida - smooth move
      map.setView([lat, lng], map.getZoom(), { animate: true, duration: 0.5 })
    }
  }, [selectedDriver?._id, selectedDriver?.lastLocation?.lat, selectedDriver?.lastLocation?.lng, isTracking, map, onFirstFly])

  // Haydovchi tanlanmasa reset
  useEffect(() => {
    if (!selectedDriver) {
      lastDriverIdRef.current = null
      hasFlewRef.current = false
    }
  }, [selectedDriver])

  return null
}

export default function LiveMap() {
  const [drivers, setDrivers] = useState([])
  const [activeTrips, setActiveTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [isTracking, setIsTracking] = useState(true)

  // Ma'lumotlarni yuklash
  const fetchData = async () => {
    try {
      const [driversRes, tripsRes] = await Promise.all([
        api.get('/drivers/locations'),
        api.get('/trips/active')
      ])
      setDrivers(driversRes.data.data || [])
      setActiveTrips(tripsRes.data.data || [])
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // 10 sekund
    return () => clearInterval(interval)
  }, [])

  const selectedDriver = drivers.find(d => d._id === selectedId)
  const onlineDrivers = drivers.filter(d => d.lastLocation)

  const handleSelectDriver = (driver) => {
    if (selectedId === driver._id) {
      // Qayta bosilsa - kuzatishni toggle
      setIsTracking(!isTracking)
    } else {
      setSelectedId(driver._id)
      setIsTracking(true)
    }
  }

  const handleClose = () => {
    setSelectedId(null)
    setIsTracking(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <Truck className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-bounce" />
          <p className="text-white">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col">
      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <MapPin className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Jonli xarita
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </span>
              </h1>
              <p className="text-slate-400 text-sm">
                {onlineDrivers.length} ta online • {activeTrips.length} ta reysda
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
            >
              <RefreshCw size={18} /> Yangilash
            </button>
            {selectedId && (
              <button 
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                <X size={18} /> Yopish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold flex items-center gap-2">
                <Truck size={18} /> Shofyorlar
              </span>
              <span className="bg-slate-700 text-white px-2 py-1 rounded-lg text-sm">
                {drivers.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {drivers.map(driver => {
              const isSelected = selectedId === driver._id
              const hasLocation = !!driver.lastLocation
              
              return (
                <div
                  key={driver._id}
                  onClick={() => hasLocation && handleSelectDriver(driver)}
                  className={`p-4 rounded-xl transition-all ${
                    !hasLocation 
                      ? 'bg-slate-800/50 opacity-50 cursor-not-allowed' 
                      : isSelected 
                        ? 'bg-blue-600 cursor-pointer' 
                        : 'bg-slate-800 hover:bg-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold ${
                      isSelected ? 'bg-blue-500' : hasLocation ? 'bg-green-600' : 'bg-slate-600'
                    }`}>
                      {driver.fullName?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{driver.fullName}</p>
                      <p className="text-slate-400 text-sm">{driver.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        driver.status === 'busy' 
                          ? 'bg-orange-500/20 text-orange-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {driver.status === 'busy' ? 'Reysda' : "Bo'sh"}
                      </span>
                      {hasLocation && (
                        <p className={`text-xs mt-1 ${
                          driver.lastLocation.accuracy < 100 ? 'text-green-400' : 'text-amber-400'
                        }`}>
                          ±{Math.round(driver.lastLocation.accuracy || 0)}m
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer 
            center={[41.3, 69.3]} 
            zoom={6} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapController 
              selectedDriver={selectedDriver}
              isTracking={isTracking}
            />

            {onlineDrivers.map(driver => (
              <Marker
                key={driver._id}
                position={[driver.lastLocation.lat, driver.lastLocation.lng]}
                icon={createDriverIcon(driver.fullName, selectedId === driver._id)}
                eventHandlers={{
                  click: () => handleSelectDriver(driver)
                }}
              >
                <Popup>
                  <div className="text-center p-2 min-w-[140px]">
                    <p className="font-bold text-lg">{driver.fullName}</p>
                    <p className="text-gray-500">{driver.phone}</p>
                    <p className={`mt-2 text-sm font-medium ${
                      driver.status === 'busy' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {driver.status === 'busy' ? '🚛 Reysda' : "✅ Bo'sh"}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Selected driver panel */}
          {selectedDriver && (
            <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl shadow-2xl p-5 z-[1000]">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {selectedDriver.fullName?.charAt(0)}
                  </div>
                  {isTracking && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Eye size={10} className="text-white" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{selectedDriver.fullName}</h3>
                    <button
                      onClick={() => setIsTracking(!isTracking)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        isTracking 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isTracking ? <Eye size={14} /> : <EyeOff size={14} />}
                      {isTracking ? 'Kuzatilmoqda' : 'Kuzatish'}
                    </button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedDriver.status === 'busy' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedDriver.status === 'busy' ? '🚛 Reysda' : "✅ Bo'sh"}
                    </span>
                  </div>
                  
                  <a href={`tel:${selectedDriver.phone}`} className="text-blue-600 flex items-center gap-1 mb-2">
                    <Phone size={14} /> {selectedDriver.phone}
                  </a>

                  {selectedDriver.lastLocation && (
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-pink-500" />
                        ±{Math.round(selectedDriver.lastLocation.accuracy || 0)}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge size={14} className="text-blue-500" />
                        {Math.round((selectedDriver.lastLocation.speed || 0) * 3.6)} km/h
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} className="text-green-500" />
                        {selectedDriver.lastLocation.updatedAt 
                          ? new Date(selectedDriver.lastLocation.updatedAt).toLocaleTimeString('uz-UZ', {hour:'2-digit', minute:'2-digit'})
                          : '-'
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Close */}
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
