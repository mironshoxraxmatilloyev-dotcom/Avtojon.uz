import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, Navigation, Clock, Route, X, Check, Loader2 } from 'lucide-react'

// Marker ikonlari
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

// Xaritada click qilish uchun komponent
function MapClickHandler({ onMapClick, selectingPoint }) {
    useMapEvents({
        click: (e) => {
            if (selectingPoint) {
                onMapClick(e.latlng)
            }
        }
    })
    return null
}

// Xaritani marshrut bo'yicha fit qilish
function FitBounds({ routeCoords }) {
    const map = useMap()
    useEffect(() => {
        if (routeCoords && routeCoords.length > 1) {
            const bounds = L.latLngBounds(routeCoords)
            map.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [routeCoords, map])
    return null
}

// Koordinatadan manzil olish (reverse geocoding)
async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'uz,ru,en' } }
        )
        const data = await response.json()
        if (data.address) {
            const { city, town, village, county, state, road } = data.address
            const place = city || town || village || county || state || ''
            return road ? `${place}, ${road}` : place || data.display_name?.split(',')[0] || 'Noma\'lum joy'
        }
        return 'Noma\'lum joy'
    } catch {
        return 'Noma\'lum joy'
    }
}

// OSRM API orqali yo'l bo'ylab marshrut olish (backend proxy orqali)
async function getRouteFromOSRM(startLat, startLng, endLat, endLng) {
    try {
        // Backend proxy orqali so'rov
        const start = `${startLng},${startLat}`
        const end = `${endLng},${endLat}`
        const url = `/api/route?start=${start}&end=${end}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
            const route = data.routes[0]
            return {
                coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // [lat, lng]
                distance: Math.round(route.distance / 1000), // km
                duration: Math.round(route.duration / 60) // daqiqa
            }
        }
        return null
    } catch {
        return null
    }
}

// Vaqtni formatlash
function formatDuration(minutes) {
    if (minutes < 60) return `${minutes} daqiqa`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return mins > 0 ? `${hours} soat ${mins} daq` : `${hours} soat`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return remainingHours > 0 ? `${days} kun ${remainingHours} soat` : `${days} kun`
}

export default function LocationPicker({ onSelect, onClose, initialStart, initialEnd, endOnly = false, initialStartAddress = '' }) {
    const [startPoint, setStartPoint] = useState(initialStart || null)
    const [endPoint, setEndPoint] = useState(initialEnd || null)
    const [startAddress, setStartAddress] = useState(initialStartAddress || '')
    const [endAddress, setEndAddress] = useState('')
    // Agar endOnly bo'lsa, to'g'ridan-to'g'ri 'end' dan boshlash
    const [selectingPoint, setSelectingPoint] = useState(endOnly && initialStart ? 'end' : 'start')
    const [distance, setDistance] = useState(0)
    const [duration, setDuration] = useState('')
    const [loading, setLoading] = useState(false)
    const [routeCoords, setRouteCoords] = useState([])
    const [routeLoading, setRouteLoading] = useState(false)
    const mapRef = useRef(null)

    const defaultCenter = [41.2995, 69.2401]

    const handleMapClick = async (latlng) => {
        setLoading(true)
        const address = await getAddressFromCoords(latlng.lat, latlng.lng)
        
        if (selectingPoint === 'start') {
            setStartPoint({ lat: latlng.lat, lng: latlng.lng })
            setStartAddress(address)
            setSelectingPoint('end')
        } else if (selectingPoint === 'end') {
            setEndPoint({ lat: latlng.lat, lng: latlng.lng })
            setEndAddress(address)
            setSelectingPoint(null)
        }
        setLoading(false)
    }

    // Marshrut olish
    useEffect(() => {
        async function fetchRoute() {
            if (startPoint && endPoint) {
                setRouteLoading(true)
                const route = await getRouteFromOSRM(
                    startPoint.lat, startPoint.lng,
                    endPoint.lat, endPoint.lng
                )
                if (route) {
                    setRouteCoords(route.coordinates)
                    setDistance(route.distance)
                    setDuration(formatDuration(route.duration))
                } else {
                    // Fallback - to'g'ri chiziq
                    setRouteCoords([[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]])
                    const R = 6371
                    const dLat = (endPoint.lat - startPoint.lat) * Math.PI / 180
                    const dLng = (endPoint.lng - startPoint.lng) * Math.PI / 180
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                              Math.cos(startPoint.lat * Math.PI / 180) * Math.cos(endPoint.lat * Math.PI / 180) *
                              Math.sin(dLng/2) * Math.sin(dLng/2)
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                    const dist = Math.round(R * c)
                    setDistance(dist)
                    setDuration(formatDuration(Math.round(dist / 60 * 60)))
                }
                setRouteLoading(false)
            }
        }
        fetchRoute()
    }, [startPoint, endPoint])

    const handleConfirm = () => {
        if (startPoint && endPoint) {
            onSelect({
                startPoint,
                endPoint,
                startAddress,
                endAddress,
                distance,
                duration,
                routeCoords
            })
        }
    }

    const resetPoints = () => {
        // endOnly rejimida boshlanish nuqtasini saqlab qolish
        if (endOnly && initialStart) {
            setEndPoint(null)
            setEndAddress('')
            setDistance(0)
            setDuration('')
            setRouteCoords([])
            setSelectingPoint('end')
        } else {
            setStartPoint(null)
            setEndPoint(null)
            setStartAddress('')
            setEndAddress('')
            setDistance(0)
            setDuration('')
            setRouteCoords([])
            setSelectingPoint('start')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 border-b border-white/10 p-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Marshrut tanlash</h2>
                            <p className="text-blue-300 text-sm">Xaritada nuqtalarni belgilang</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/50 border-b border-white/10 p-2 shrink-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${selectingPoint === 'start' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : startPoint ? 'bg-green-500/10 text-green-300' : 'text-slate-400'}`}>
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                        <span className="truncate max-w-[150px]">{startAddress || (selectingPoint === 'start' ? 'Boshlanish' : '-')}</span>
                    </div>
                    <Navigation size={14} className="text-slate-500" />
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${selectingPoint === 'end' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : endPoint ? 'bg-red-500/10 text-red-300' : 'text-slate-400'}`}>
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                        <span className="truncate max-w-[150px]">{endAddress || (selectingPoint === 'end' ? 'Tugash' : '-')}</span>
                    </div>
                    {(loading || routeLoading) && (
                        <span className="text-blue-400 flex items-center gap-1 text-xs">
                            <Loader2 size={12} className="animate-spin" /> Yuklanmoqda...
                        </span>
                    )}
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <MapContainer
                    center={defaultCenter}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                    />
                    <MapClickHandler onMapClick={handleMapClick} selectingPoint={selectingPoint} />
                    <FitBounds routeCoords={routeCoords} />
                    
                    {startPoint && (
                        <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon} />
                    )}
                    {endPoint && (
                        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon} />
                    )}
                    {routeCoords.length > 1 && (
                        <Polyline
                            positions={routeCoords}
                            color="#3b82f6"
                            weight={4}
                            opacity={0.8}
                        />
                    )}
                </MapContainer>
            </div>

            {/* Bottom Panel */}
            <div className="bg-slate-900 border-t border-white/10 p-4 shrink-0">
                {startPoint && endPoint ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <Route size={18} className="text-blue-400 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-white">{distance}</p>
                                <p className="text-slate-400 text-xs">km masofa</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <Clock size={18} className="text-amber-400 mx-auto mb-1" />
                                <p className="text-xl font-bold text-white">{duration}</p>
                                <p className="text-slate-400 text-xs">taxminiy vaqt</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={resetPoints}
                                className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition"
                            >
                                Qayta tanlash
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={routeLoading}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                            >
                                {routeLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                Tasdiqlash
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${selectingPoint === 'start' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            <div className={`w-3 h-3 rounded-full animate-pulse ${selectingPoint === 'start' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {selectingPoint === 'start' ? 'Xaritada boshlang\'ich nuqtani tanlang' : 'Xaritada tugash nuqtasini tanlang'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
