import { useEffect, useState } from 'react'
import { RefreshCw, Truck, MapPin, Navigation, Maximize2, Minimize2, X, Route } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../services/api'

// Truck icon
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
})

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

// Xaritani markazlashtirish komponenti
function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13)
    }
  }, [position, map])
  return null
}

export default function LiveMap() {
  const [activeTrips, setActiveTrips] = useState([])
  const [driverLocations, setDriverLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [center, setCenter] = useState([41.2995, 69.2401]) // Toshkent
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tripRoutes, setTripRoutes] = useState({}) // Har bir reys uchun marshrut

  const fetchActiveTrips = async () => {
    try {
      const { data } = await api.get('/trips/active')
      const trips = data.data || []
      setActiveTrips(trips)
      
      // Har bir faol reys uchun marshrut olish
      for (const trip of trips) {
        if (trip.startCoords && trip.endCoords && !tripRoutes[trip._id]) {
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
      console.error('Active trips error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDriverLocations = async () => {
    try {
      const { data } = await api.get('/drivers/locations')
      setDriverLocations(data.data || [])
    } catch (error) {
      console.error('Driver locations error:', error)
    }
  }

  useEffect(() => {
    fetchActiveTrips()
    fetchDriverLocations()
    const interval = setInterval(() => {
      fetchActiveTrips()
      fetchDriverLocations()
    }, 10000) // 10 sekundda yangilash
    return () => clearInterval(interval)
  }, [])

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver)
    if (driver.lastLocation) {
      setCenter([driver.lastLocation.lat, driver.lastLocation.lng])
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Yuklanmoqda...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jonli xarita</h1>
        <button onClick={() => { fetchActiveTrips(); fetchDriverLocations() }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <RefreshCw size={18} /> Yangilash
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Drivers List */}
        <div className="bg-white rounded-xl shadow-sm p-4 max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="text-blue-600" /> Shofyorlar ({driverLocations.length})
          </h2>
          
          {driverLocations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Joylashuv ma'lumoti yo'q</p>
          ) : (
            <div className="space-y-2">
              {driverLocations.map((driver) => (
                <div key={driver._id} 
                  onClick={() => handleSelectDriver(driver)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedDriver?._id === driver._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{driver.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {driver.lastLocation ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <Navigation size={12} /> Online
                          </span>
                        ) : (
                          <span className="text-gray-400">Offline</span>
                        )}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      driver.status === 'busy' ? 'bg-orange-100 text-orange-800' : 
                      driver.status === 'free' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.status === 'busy' ? 'Reysda' : driver.status === 'free' ? 'Bo\'sh' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Trips */}
          <h2 className="text-lg font-semibold mt-6 mb-4 flex items-center gap-2">
            <MapPin className="text-red-600" /> Faol reyslar ({activeTrips.length})
          </h2>
          {activeTrips.map((trip) => (
            <div key={trip._id} className="border rounded-lg p-3 mb-2">
              <p className="font-medium text-sm">{trip.driver?.fullName}</p>
              <p className="text-xs text-gray-500">{trip.startAddress} → {trip.endAddress}</p>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden relative" style={{ height: '600px' }}>
          {/* Fullscreen button */}
          <button 
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition"
            title="To'liq ekran"
          >
            <Maximize2 size={20} className="text-gray-700" />
          </button>
          
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FlyToLocation position={selectedDriver?.lastLocation ? [selectedDriver.lastLocation.lat, selectedDriver.lastLocation.lng] : null} />
            
            {driverLocations.filter(d => d.lastLocation).map((driver) => (
              <Marker 
                key={driver._id} 
                position={[driver.lastLocation.lat, driver.lastLocation.lng]}
                icon={truckIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">{driver.fullName}</p>
                    <p className="text-sm text-gray-500">{driver.phone}</p>
                    <p className={`text-xs mt-1 ${driver.status === 'busy' ? 'text-orange-600' : 'text-green-600'}`}>
                      {driver.status === 'busy' ? '🚛 Reysda' : '✅ Bo\'sh'}
                    </p>
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

      {/* Fullscreen Map Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] bg-black">
          {/* Close button */}
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
          >
            <X size={24} className="text-gray-700" />
          </button>
          
          {/* Minimize button */}
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-16 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition"
            title="Kichraytirish"
          >
            <Minimize2 size={24} className="text-gray-700" />
          </button>

          {/* Driver list sidebar */}
          <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-xl w-72 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <h3 className="font-bold flex items-center gap-2">
                <Truck className="text-blue-600" size={18} /> 
                Shofyorlar ({driverLocations.length})
              </h3>
            </div>
            <div className="p-2">
              {driverLocations.map((driver) => (
                <div 
                  key={driver._id} 
                  onClick={() => handleSelectDriver(driver)}
                  className={`p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                    selectedDriver?._id === driver._id 
                      ? 'bg-blue-100 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{driver.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {driver.lastLocation ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <Navigation size={10} /> Online
                          </span>
                        ) : (
                          <span className="text-gray-400">Offline</span>
                        )}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      driver.status === 'busy' ? 'bg-orange-100 text-orange-800' : 
                      driver.status === 'free' ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.status === 'busy' ? 'Reysda' : 'Bo\'sh'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fullscreen Map */}
          <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FlyToLocation position={selectedDriver?.lastLocation ? [selectedDriver.lastLocation.lat, selectedDriver.lastLocation.lng] : null} />
            
            {driverLocations.filter(d => d.lastLocation).map((driver) => (
              <Marker 
                key={driver._id} 
                position={[driver.lastLocation.lat, driver.lastLocation.lng]}
                icon={truckIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">{driver.fullName}</p>
                    <p className="text-sm text-gray-500">{driver.phone}</p>
                    <p className={`text-xs mt-1 ${driver.status === 'busy' ? 'text-orange-600' : 'text-green-600'}`}>
                      {driver.status === 'busy' ? '🚛 Reysda' : '✅ Bo\'sh'}
                    </p>
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
      )}
    </div>
  )
}
