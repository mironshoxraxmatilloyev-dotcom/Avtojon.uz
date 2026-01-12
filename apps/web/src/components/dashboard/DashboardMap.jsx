import { memo, useState, useEffect, lazy, Suspense } from 'react'
import { MapPin, X } from 'lucide-react'
import L from 'leaflet'

// 🚀 Lazy load map components
const MapContainer = lazy(() => import('react-leaflet').then(m => ({ default: m.MapContainer })))
const TileLayer = lazy(() => import('react-leaflet').then(m => ({ default: m.TileLayer })))
const Marker = lazy(() => import('react-leaflet').then(m => ({ default: m.Marker })))
const Popup = lazy(() => import('react-leaflet').then(m => ({ default: m.Popup })))
const Polyline = lazy(() => import('react-leaflet').then(m => ({ default: m.Polyline })))

// 🎯 Map Loading Placeholder
const MapPlaceholder = memo(() => (
  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <MapPin className="w-6 h-6 text-blue-500 animate-pulse" />
      </div>
      <p className="text-gray-500 text-sm">Xarita yuklanmoqda...</p>
    </div>
  </div>
))

// 🎯 Marker Icons
export const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

export const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
})

// 🎯 Create Driver Icon
export const createDriverIcon = (name, status) => {
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

// 🚀 Dashboard Map Component
export const DashboardMap = memo(function DashboardMap({ 
  driverLocations, 
  tripRoutes, 
  activeFlights,
  isFullScreen,
  onClose 
}) {
  const [mapReady, setMapReady] = useState(false)
  
  useEffect(() => {
    // Delay map loading for better performance
    const timer = setTimeout(() => setMapReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!mapReady) return <MapPlaceholder />

  const validLocations = driverLocations?.filter(d => d.lastLocation) || []
  const defaultCenter = validLocations.length > 0 
    ? [validLocations[0].lastLocation.lat, validLocations[0].lastLocation.lng]
    : [41.31, 69.28] // Toshkent

  const MapContent = (
    <Suspense fallback={<MapPlaceholder />}>
      <MapContainer
        center={defaultCenter}
        zoom={10}
        className="w-full h-full rounded-2xl"
        zoomControl={!isFullScreen}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {/* Driver Markers */}
        {validLocations.map(driver => (
          <Marker
            key={driver._id}
            position={[driver.lastLocation.lat, driver.lastLocation.lng]}
            icon={createDriverIcon(driver.fullName, driver.status)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">{driver.fullName}</p>
                <p className="text-sm text-gray-500">{driver.phone}</p>
                <p className={`text-xs ${driver.status === 'busy' ? 'text-orange-500' : 'text-green-500'}`}>
                  {driver.status === 'busy' ? 'Marshrutda' : "Bo'sh"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route Polylines */}
        {Object.entries(tripRoutes).map(([id, route]) => (
          route?.coordinates && (
            <Polyline
              key={id}
              positions={route.coordinates}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
            />
          )
        ))}
      </MapContainer>
    </Suspense>
  )

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-[10000] p-3 bg-white rounded-xl shadow-lg"
        >
          <X size={24} />
        </button>
        <div className="w-full h-full p-4">
          {MapContent}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[400px] rounded-2xl overflow-hidden">
      {MapContent}
    </div>
  )
})

export default DashboardMap
