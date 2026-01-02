import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, Play, X, RefreshCw } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

// Shofyor uchun custom marker yaratish
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

// Xaritani markazlashtirish komponenti
function MapCenterUpdater({ locations, selectedDriver, shouldCenter }) {
  const map = useMap()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (selectedDriver?.lastLocation) {
      map.flyTo([selectedDriver.lastLocation.lat, selectedDriver.lastLocation.lng], 15, { duration: 1.5 })
      return
    }

    const validLocations = locations?.filter(d => d.lastLocation) || []
    if (validLocations.length > 0 && (!initialized || shouldCenter)) {
      const bounds = L.latLngBounds(validLocations.map(d => [d.lastLocation.lat, d.lastLocation.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      setInitialized(true)
    }
  }, [locations, selectedDriver, shouldCenter, map, initialized])

  return null
}

export function LiveMap({
  driverLocations,
  activeFlights,
  tripRoutes,
  selectedDriver,
  shouldCenterMap,
  onRefresh,
  fullScreenMap,
  setFullScreenMap
}) {
  const onlineDrivers = driverLocations.filter(d => d.lastLocation).length

  const mapContent = (
    <MapContainer center={[39.7747, 64.4286]} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapCenterUpdater locations={driverLocations} selectedDriver={selectedDriver} shouldCenter={shouldCenterMap} />

      {/* Shofyorlar markerlari */}
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
                {driver.status === 'busy' ? 'Marshrutda' : "Bo'sh"}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Faol marshrutlar marshruti */}
      {activeFlights.map((flight) => (
        <span key={`flight-route-${flight._id}`}>
          {flight.legs?.map((leg, idx) => {
            const route = tripRoutes[`flight-${flight._id}-${leg._id}`]
            const fromCoords = (leg.fromCoords?.lat && leg.fromCoords?.lng) ? leg.fromCoords : route?.fromCoords
            const toCoords = (leg.toCoords?.lat && leg.toCoords?.lng) ? leg.toCoords : route?.toCoords

            return (
              <span key={`leg-${leg._id || idx}`}>
                {route?.coordinates && (
                  <Polyline positions={route.coordinates} color="#3b82f6" weight={4} opacity={0.8} />
                )}
                {fromCoords && <Marker position={[fromCoords.lat, fromCoords.lng]} icon={startIcon} />}
                {toCoords && <Marker position={[toCoords.lat, toCoords.lng]} icon={endIcon} />}
              </span>
            )
          })}
        </span>
      ))}
    </MapContainer>
  )

  // Full screen map portal
  if (fullScreenMap) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-slate-900">
        <div className="absolute top-4 left-4 right-4 z-[10000] flex justify-between items-center">
          <div className="bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-lg">
            <h3 className="font-bold text-gray-900">Jonli xarita</h3>
            <p className="text-sm text-gray-500">{onlineDrivers} ta haydovchi online</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="p-3 bg-white/95 backdrop-blur rounded-xl shadow-lg hover:bg-white transition">
              <RefreshCw size={20} className="text-gray-700" />
            </button>
            <button onClick={() => setFullScreenMap(false)} className="p-3 bg-white/95 backdrop-blur rounded-xl shadow-lg hover:bg-white transition">
              <X size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
        <div className="h-full w-full">{mapContent}</div>
      </div>,
      document.body
    )
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center">
            <MapPin className="text-blue-600" size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Jonli xarita</h2>
            <p className="text-xs sm:text-sm text-gray-500">{onlineDrivers} ta haydovchi online</p>
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
      <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200" style={{ height: '650px' }}>
        {mapContent}
      </div>
    </div>
  )
}
