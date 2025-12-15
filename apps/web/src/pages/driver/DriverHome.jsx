import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
    LogOut, Truck, Play, CheckCircle, History, Wallet, Route, MapPin, Map,
    Clock, TrendingUp, TrendingDown, Award, Navigation, X, Sparkles, Zap, Target,
    Star, CircleDollarSign, Bell, WifiOff, RefreshCw
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../services/api'
import { showToast } from '../../components/Toast'
import { connectSocket, joinDriverRoom } from '../../services/socket'
import { DriverHomeSkeleton } from '../../components/ui'

const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
    iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40]
})

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

// Navigator rejimi - haydovchini kuzatib borish
function NavigatorMode({ position, isNavigating, routeCoords, endCoords }) {
    const map = useMap()
    
    useEffect(() => {
        if (isNavigating && position) {
            // Navigator rejimida - haydovchini markazda ushlab turish
            map.setView(position, 16, { animate: true, duration: 0.3 })
        }
    }, [position, isNavigating, map])

    // Marshrut bo'yicha fit qilish (navigator o'chiq bo'lganda)
    useEffect(() => {
        if (!isNavigating && routeCoords && routeCoords.length > 1 && position) {
            try {
                const allPoints = [position, ...routeCoords]
                if (endCoords) allPoints.push([endCoords.lat, endCoords.lng])
                const bounds = L.latLngBounds(allPoints)
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
            } catch (e) {
                // Bounds error - silent
            }
        }
    }, [isNavigating, routeCoords, position, endCoords, map])

    return null
}

// Backend API orqali yo'l bo'ylab marshrut olish
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
    } catch {
        return null
    }
}

export default function DriverHome() {
    const { user, logout } = useAuthStore()
    const [activeTrip, setActiveTrip] = useState(null)
    const [pendingTrips, setPendingTrips] = useState([])
    const [trips, setTrips] = useState([])
    // Flight (yangi tizim)
    const [activeFlight, setActiveFlight] = useState(null)
    const [flights, setFlights] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('home')
    const [gpsStatus, setGpsStatus] = useState('checking')
    const [currentLocation, setCurrentLocation] = useState(null)
    const [lastGpsUpdate, setLastGpsUpdate] = useState(null)
    const [gpsRetryCount, setGpsRetryCount] = useState(0)
    const [routeCoords, setRouteCoords] = useState([])
    const [routeInfo, setRouteInfo] = useState(null)
    const [tripStartCoords, setTripStartCoords] = useState(null)
    const [tripEndCoords, setTripEndCoords] = useState(null)
    const [isNavigating, setIsNavigating] = useState(false)

    const [driverId, setDriverId] = useState(null)
    const [newTripNotification, setNewTripNotification] = useState(null)

    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        setError(null)
        try {
            const [tripsRes, profileRes, flightsRes] = await Promise.all([
                api.get('/driver/me/trips'),
                api.get('/driver/me'),
                api.get('/driver/me/flights').catch(() => ({ data: { data: [] } }))
            ])
            
            const allTrips = tripsRes.data.data || []
            setTrips(allTrips)
            setActiveTrip(allTrips.find(t => t.status === 'in_progress') || null)
            setPendingTrips(allTrips.filter(t => t.status === 'pending'))
            
            // Flight (yangi tizim)
            const allFlights = flightsRes.data.data || []
            setFlights(allFlights)
            setActiveFlight(allFlights.find(f => f.status === 'active') || null)
            
            // Serverdan oxirgi joylashuvni olish
            const driverData = profileRes.data.data
            
            // Driver ID ni saqlash (socket uchun)
            if (driverData?._id) {
                setDriverId(driverData._id)
            }
            
            if (driverData?.lastLocation) {
                const loc = driverData.lastLocation
                
                if (loc.lat && loc.lng) {
                    setCurrentLocation({
                        lat: loc.lat,
                        lng: loc.lng,
                        accuracy: loc.accuracy || 100,
                        speed: loc.speed || 0
                    })
                    setGpsAccuracy(loc.accuracy || 100)
                    setGpsStatus(loc.accuracy < 50 ? 'excellent' : loc.accuracy < 200 ? 'good' : 'active')
                }
            }
        } catch (err) {
            setError({
                type: err.isNetworkError ? 'network' : 'generic',
                message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
            })
        }
        finally { setLoading(false) }
    }, [])

    const [gpsAccuracy, setGpsAccuracy] = useState(null)

    // Faol reys uchun marshrut olish (Trip va Flight)
    useEffect(() => {
        async function fetchRoute() {
            // Flight tizimi (yangi) - birinchi va oxirgi bosqich koordinatalari
            if (activeFlight && activeFlight.legs && activeFlight.legs.length > 0) {
                const firstLeg = activeFlight.legs[0]
                const lastLeg = activeFlight.legs[activeFlight.legs.length - 1]
                
                // Koordinatalar mavjud bo'lsa
                if (firstLeg.fromCoords && lastLeg.toCoords) {
                    setTripStartCoords(firstLeg.fromCoords)
                    setTripEndCoords(lastLeg.toCoords)
                    

                    const route = await getRouteFromAPI(
                        firstLeg.fromCoords.lat, firstLeg.fromCoords.lng,
                        lastLeg.toCoords.lat, lastLeg.toCoords.lng
                    )
                    
                    if (route && route.coordinates && route.coordinates.length > 2) {
                        setRouteCoords(route.coordinates)
                        setRouteInfo({ distance: route.distance, duration: route.duration })
                    } else {
                        setRouteCoords([
                            [firstLeg.fromCoords.lat, firstLeg.fromCoords.lng],
                            [lastLeg.toCoords.lat, lastLeg.toCoords.lng]
                        ])
                        setRouteInfo({ distance: activeFlight.totalDistance || 0, duration: 0 })
                    }
                } else {
                    // Koordinatalar yo'q - shahar nomlaridan qidirish
                    try {
                        const [startRes, endRes] = await Promise.all([
                            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(firstLeg.fromCity)}&limit=1`),
                            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lastLeg.toCity)}&limit=1`)
                        ])
                        const [startData, endData] = await Promise.all([startRes.json(), endRes.json()])
                        
                        if (startData[0] && endData[0]) {
                            const start = { lat: parseFloat(startData[0].lat), lng: parseFloat(startData[0].lon) }
                            const end = { lat: parseFloat(endData[0].lat), lng: parseFloat(endData[0].lon) }
                            setTripStartCoords(start)
                            setTripEndCoords(end)
                            
                            const route = await getRouteFromAPI(start.lat, start.lng, end.lat, end.lng)
                            if (route && route.coordinates && route.coordinates.length > 2) {
                                setRouteCoords(route.coordinates)
                                setRouteInfo({ distance: route.distance, duration: route.duration })
                            } else {
                                setRouteCoords([[start.lat, start.lng], [end.lat, end.lng]])
                                setRouteInfo({ distance: activeFlight.totalDistance || 0, duration: 0 })
                            }
                        }
                    } catch {
                        // Flight marshrut xatosi - silent
                    }
                }
                return // Flight bor bo'lsa, Trip ni tekshirmaymiz
            }
            
            // Trip tizimi (eski)
            if (activeTrip && activeTrip.startCoords && activeTrip.endCoords) {
                setTripStartCoords(activeTrip.startCoords)
                setTripEndCoords(activeTrip.endCoords)
                

                const route = await getRouteFromAPI(
                    activeTrip.startCoords.lat, activeTrip.startCoords.lng,
                    activeTrip.endCoords.lat, activeTrip.endCoords.lng
                )
                
                if (route && route.coordinates && route.coordinates.length > 2) {
                    setRouteCoords(route.coordinates)
                    setRouteInfo({ distance: route.distance, duration: route.duration })
                } else {
                    setRouteCoords([
                        [activeTrip.startCoords.lat, activeTrip.startCoords.lng],
                        [activeTrip.endCoords.lat, activeTrip.endCoords.lng]
                    ])
                    const dist = Math.round(
                        6371 * Math.acos(
                            Math.cos(activeTrip.startCoords.lat * Math.PI / 180) * 
                            Math.cos(activeTrip.endCoords.lat * Math.PI / 180) * 
                            Math.cos((activeTrip.endCoords.lng - activeTrip.startCoords.lng) * Math.PI / 180) + 
                            Math.sin(activeTrip.startCoords.lat * Math.PI / 180) * 
                            Math.sin(activeTrip.endCoords.lat * Math.PI / 180)
                        )
                    )
                    setRouteInfo({ distance: dist, duration: Math.round(dist / 60 * 60) })
                }
            } else if (activeTrip) {
                try {
                    const [startRes, endRes] = await Promise.all([
                        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeTrip.startAddress)}&countrycodes=uz&limit=1`),
                        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeTrip.endAddress)}&countrycodes=uz&limit=1`)
                    ])
                    const [startData, endData] = await Promise.all([startRes.json(), endRes.json()])
                    
                    if (startData[0] && endData[0]) {
                        const start = { lat: parseFloat(startData[0].lat), lng: parseFloat(startData[0].lon) }
                        const end = { lat: parseFloat(endData[0].lat), lng: parseFloat(endData[0].lon) }
                        setTripStartCoords(start)
                        setTripEndCoords(end)
                        
                        const route = await getRouteFromAPI(start.lat, start.lng, end.lat, end.lng)
                        if (route && route.coordinates && route.coordinates.length > 2) {
                            setRouteCoords(route.coordinates)
                            setRouteInfo({ distance: route.distance, duration: route.duration })
                        } else {
                            setRouteCoords([[start.lat, start.lng], [end.lat, end.lng]])
                        }
                    }
                } catch {
                    // Trip marshrut xatosi - silent
                }
            }
        }
        fetchRoute()
    }, [activeTrip, activeFlight])

    const sendLocation = async (position) => {
        const accuracy = position.coords.accuracy
        console.log('🟢 GPS olindi:', position.coords.latitude, position.coords.longitude, '±', accuracy, 'm')

        // Juda yomon aniqlikni rad etish (100km dan ko'p = kesh yoki xato)
        if (accuracy > 100000) {
            setGpsStatus('waiting')
            console.log('⚠️ GPS aniqlik juda yomon, kutilmoqda...')
            return
        }

        setGpsAccuracy(accuracy)
        setLastGpsUpdate(new Date())
        setGpsRetryCount(0)

        const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            timestamp: position.timestamp
        }

        setCurrentLocation(loc)

        if (accuracy < 50) {
            setGpsStatus('excellent')
        } else if (accuracy < 200) {
            setGpsStatus('good')
        } else if (accuracy < 1000) {
            setGpsStatus('active')
        } else {
            setGpsStatus('waiting')
        }

        // Har doim serverga yuborish (aniqlik qanday bo'lmasin)
        // Server o'zi qaror qiladi - saqlash yoki yo'q
        try {
            await api.post('/driver/me/location', loc)
            console.log('✅ GPS serverga yuborildi')
        } catch (err) {
            console.log('❌ GPS yuborishda xatolik:', err.message)
        }
    }

    const handleGpsError = (error, setRetry) => {
        console.log('🔴 GPS xatolik:', error.code, error.message)
        if (error.code === 1) {
            setGpsStatus('denied')
            console.log('GPS ruxsat berilmagan')
        } else if (error.code === 2) {
            setGpsStatus('unavailable')
            console.log('GPS mavjud emas')
            if (setRetry) setGpsRetryCount(prev => prev + 1)
        } else if (error.code === 3) {
            setGpsStatus('timeout')
            console.log('GPS timeout')
            if (setRetry) setGpsRetryCount(prev => prev + 1)
        } else {
            setGpsStatus('error')
            console.log('GPS noma\'lum xatolik')
        }
    }

    // Socket.io ulanish va yangi reys xabarlarini tinglash
    useEffect(() => {
        if (!driverId) {
            return
        }

        const socket = connectSocket()
        
        // Socket ulanganidan keyin xonaga qo'shilish
        const joinRoom = () => {
            joinDriverRoom(driverId)
        }

        if (socket.connected) {
            joinRoom()
        } else {
            socket.on('connect', joinRoom)
        }

        // Yangi reys xabarini tinglash (eski Trip tizimi)
        const handleNewTrip = (data) => {
            showToast.success('🚛 Yangi reys!', data.message || 'Sizga yangi reys tayinlandi')
            setNewTripNotification(data.trip)
            
            // Ma'lumotlarni yangilash
            fetchData()
            
            // 5 sekunddan keyin notification ni yashirish
            setTimeout(() => setNewTripNotification(null), 5000)
        }

        // Yangi Flight xabarini tinglash (yangi tizim)
        const handleNewFlight = (data) => {
            showToast.success('🚛 Yangi reys!', data.message || 'Sizga yangi reys tayinlandi')
            setNewTripNotification(data.flight)
            
            // Ma'lumotlarni yangilash
            fetchData()
            
            // 5 sekunddan keyin notification ni yashirish
            setTimeout(() => setNewTripNotification(null), 5000)
        }
        
        // Flight yangilanganda
        const handleFlightUpdated = (data) => {
            // Ma'lumotlarni yangilash
            fetchData()
        }
        
        // Flight yopilganda
        const handleFlightCompleted = (data) => {
            showToast.success('✅ Reys yopildi!', data.message || 'Reys muvaffaqiyatli yopildi')
            fetchData()
        }

        // Reys bekor qilinganda
        const handleTripCancelled = (data) => {
            showToast.error('❌ Reys bekor qilindi!', data.message || 'Sizning reysingiz bekor qilindi')
            
            // Ma'lumotlarni yangilash
            fetchData()
        }

        socket.on('new-trip', handleNewTrip)
        socket.on('new-flight', handleNewFlight)
        socket.on('flight-started', handleNewFlight)
        socket.on('flight-updated', handleFlightUpdated)
        socket.on('flight-completed', handleFlightCompleted)
        socket.on('trip-cancelled', handleTripCancelled)

        return () => {
            socket.off('connect', joinRoom)
            socket.off('new-trip', handleNewTrip)
            socket.off('new-flight', handleNewFlight)
            socket.off('flight-started', handleNewFlight)
            socket.off('flight-updated', handleFlightUpdated)
            socket.off('flight-completed', handleFlightCompleted)
            socket.off('trip-cancelled', handleTripCancelled)
        }
    }, [driverId, fetchData])

    useEffect(() => {
        fetchData()

        if (!navigator.geolocation) {
            setGpsStatus('error')
            return
        }

        let watchId = null
        let retryInterval = null
        let highAccuracyRetry = null

        setGpsStatus('checking')

        // 1. Birinchi: tez network joylashuv
        navigator.geolocation.getCurrentPosition(
            sendLocation,
            (err) => handleGpsError(err, false),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
        )

        // 2. Aniq GPS kuzatish
        setTimeout(() => {
            watchId = navigator.geolocation.watchPosition(
                sendLocation,
                (err) => handleGpsError(err, true),
                {
                    enableHighAccuracy: true,
                    timeout: 60000,
                    maximumAge: 10000
                }
            )
        }, 500)

        // 3. Har 10 sekundda yangi GPS so'rash
        retryInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                sendLocation,
                () => { },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 5000
                }
            )
        }, 10000)

        // 4. Har 30 sekundda high accuracy bilan qayta urinish
        highAccuracyRetry = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                sendLocation,
                () => { },
                {
                    enableHighAccuracy: true,
                    timeout: 45000,
                    maximumAge: 0
                }
            )
        }, 30000)

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
            if (retryInterval) clearInterval(retryInterval)
            if (highAccuracyRetry) clearInterval(highAccuracyRetry)
        }
    }, [])

    const [actionLoading, setActionLoading] = useState(false)

    const handleLogout = () => { logout(); window.location.href = '/login' }
    
    const handleCompleteTrip = async () => {
        if (!activeTrip || actionLoading) return
        setActionLoading(true)
        try { 
            await api.put(`/driver/me/trips/${activeTrip._id}/complete`)
            showToast.success('Reys tugatildi!')
            fetchData() 
        }
        catch (error) { showToast.error(error.response?.data?.message || 'Xatolik') }
        finally { setActionLoading(false) }
    }
    
    // Flight bosqichini tugatish
    const handleCompleteLeg = async () => {
        if (!activeFlight || actionLoading) return
        
        // Joriy in_progress bosqichni topish
        const currentLeg = activeFlight.legs?.find(leg => leg.status === 'in_progress')
        if (!currentLeg) {
            showToast.error('Faol bosqich topilmadi')
            return
        }
        
        setActionLoading(true)
        try { 
            await api.put(`/driver/me/flights/${activeFlight._id}/legs/${currentLeg._id}/complete`)
            showToast.success('Bosqich tugatildi!')
            fetchData() 
        }
        catch (error) { showToast.error(error.response?.data?.message || 'Xatolik') }
        finally { setActionLoading(false) }
    }
    
    const handleStartPendingTrip = async (tripId) => {
        if (actionLoading) return
        setActionLoading(true)
        try { 
            await api.put(`/driver/me/trips/${tripId}/start`)
            showToast.success('Reys boshlandi!')
            fetchData() 
        }
        catch (error) { showToast.error(error.response?.data?.message || 'Xatolik') }
        finally { setActionLoading(false) }
    }
    const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
    const formatDate = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'
    
    // Flights dan statistika (yangi tizim)
    const completedFlights = flights.filter(f => f.status === 'completed').length
    const totalProfit = flights.reduce((sum, f) => sum + (f.profit > 0 ? f.profit : 0), 0)
    const totalLoss = flights.reduce((sum, f) => sum + (f.profit < 0 ? Math.abs(f.profit) : 0), 0)
    
    // Eski trips dan ham (orqaga moslik)
    const completedTrips = trips.filter(t => t.status === 'completed').length
    const totalBonus = trips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0)
    const totalPenalty = trips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0)
    
    // Jami statistika (flights + trips)
    const totalCompletedTrips = completedFlights + completedTrips
    const totalBonusAmount = totalProfit + totalBonus
    const totalPenaltyAmount = totalLoss + totalPenalty

    if (loading) return <DriverHomeSkeleton />

    if (error) {
        return (
            <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
                <div className="text-center max-w-sm">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <WifiOff className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {error.type === 'network' ? 'Internet aloqasi yo\'q' : 'Xatolik yuz berdi'}
                    </h3>
                    <p className="text-violet-300 mb-6">{error.message}</p>
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Qayta urinish
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a1a]">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
            </div>

            {/* 🔔 Yangi reys notification */}
            {newTripNotification && (
                <div className="fixed top-4 left-4 right-4 z-50 animate-pulse">
                    <div className="max-w-lg mx-auto">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 shadow-2xl shadow-emerald-500/30 border border-emerald-400/30">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Bell className="w-6 h-6 text-white animate-bounce" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold text-lg">🚛 Yangi reys!</h3>
                                    <p className="text-emerald-100 text-sm">
                                        {newTripNotification.name || `${newTripNotification.startAddress || newTripNotification.legs?.[0]?.fromCity} → ${newTripNotification.endAddress || newTripNotification.legs?.[newTripNotification.legs?.length - 1]?.toCity}`}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setNewTripNotification(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <X size={20} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="relative z-20 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/10 p-3 sm:p-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="relative">
                                    <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <Truck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 border-[#0a0a1a] flex items-center justify-center">
                                        <Zap size={8} className="sm:hidden text-white" />
                                        <Zap size={10} className="hidden sm:block text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-base sm:text-xl font-bold text-white flex items-center gap-1 sm:gap-2">Avtojon <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" /></h1>
                                    <p className="text-xs sm:text-sm text-violet-300 truncate max-w-[100px] sm:max-w-[150px]">{user?.fullName || 'Haydovchi'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold ${gpsStatus === 'excellent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    gpsStatus === 'good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        gpsStatus === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                            gpsStatus === 'waiting' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                gpsStatus === 'denied' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    gpsStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${gpsStatus === 'excellent' || gpsStatus === 'good' ? 'bg-emerald-400 animate-pulse' :
                                        gpsStatus === 'active' ? 'bg-blue-400 animate-pulse' :
                                            gpsStatus === 'waiting' ? 'bg-amber-400 animate-pulse' :
                                                'bg-red-400'
                                        }`}></span>
                                    <span className="hidden sm:inline">{gpsStatus === 'excellent' ? '📍 GPS' :
                                        gpsStatus === 'good' ? '📍 GPS' :
                                            gpsStatus === 'active' ? 'GPS' :
                                                gpsStatus === 'waiting' ? '⏳' :
                                                    gpsStatus === 'denied' ? '🚫' : 'GPS'}</span>
                                    <span className="sm:hidden">{gpsStatus === 'excellent' ? '📍' :
                                        gpsStatus === 'good' ? '📍' :
                                            gpsStatus === 'active' ? 'GPS' :
                                                gpsStatus === 'waiting' ? '⏳' :
                                                    gpsStatus === 'denied' ? '🚫' : 'GPS'}</span>
                                    {gpsAccuracy && gpsStatus !== 'error' && gpsStatus !== 'denied' && (
                                        <span>±{Math.round(gpsAccuracy)}m</span>
                                    )}
                                </div>
                                <button onClick={handleLogout} className="p-2 sm:p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg sm:rounded-xl border border-red-500/20">
                                    <LogOut size={16} className="sm:hidden text-red-400" />
                                    <LogOut size={20} className="hidden sm:block text-red-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <nav className="relative z-20 px-3 sm:px-4 py-2 sm:py-3 sticky top-0">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-1 sm:p-1.5 flex gap-0.5 sm:gap-1">
                        {[
                            { id: 'home', label: 'Asosiy', icon: Target },
                            { id: 'map', label: 'Xarita', icon: Map },
                            { id: 'history', label: 'Tarix', icon: History },
                            { id: 'salary', label: 'Maosh', icon: CircleDollarSign }
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all ${tab === id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30' : 'text-violet-300 hover:bg-white/5'
                                    }`}>
                                <Icon size={16} className="sm:hidden" />
                                <Icon size={18} className="hidden sm:block" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main */}
            <main className="relative z-10 px-4 pb-8">
                <div className="max-w-lg mx-auto">

                    {tab === 'home' && (
                        <div className="space-y-5 pt-2">
                            {/* FLIGHT TIZIMI - Yangi */}
                            {activeFlight ? (
                                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-3xl p-4 sm:p-6">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4 sm:mb-5">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                                    <Route size={20} className="sm:hidden text-white" />
                                                    <Route size={24} className="hidden sm:block text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-base sm:text-lg">{activeFlight.name || 'Faol reys'}</h3>
                                                    <p className="text-green-200 text-xs sm:text-sm flex items-center gap-1">
                                                        {activeFlight.flightType === 'international' ? '🌍 Xalqaro' : '🇺🇿 Mahalliy'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                <span className="text-emerald-300 text-xs sm:text-sm font-semibold">LIVE</span>
                                            </div>
                                        </div>

                                        {/* Bosqichlar */}
                                        <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 border border-white/10">
                                            <p className="text-green-200 text-xs font-medium mb-2 sm:mb-3">BOSQICHLAR ({activeFlight.legs?.length || 0})</p>
                                            <div className="space-y-2">
                                                {activeFlight.legs?.map((leg, idx) => (
                                                    <div key={leg._id || idx} className="flex items-center gap-2 sm:gap-3">
                                                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            leg.status === 'completed' ? 'bg-emerald-500 text-white' : 
                                                            leg.status === 'in_progress' ? 'bg-amber-500 text-white animate-pulse' : 
                                                            'bg-white/20 text-white/60'
                                                        }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-xs sm:text-sm font-medium truncate">{leg.fromCity} → {leg.toCity}</p>
                                                            <p className="text-green-300 text-[10px] sm:text-xs">{leg.distance || 0} km • {formatMoney(leg.payment)} so'm</p>
                                                        </div>
                                                        {leg.status === 'completed' && <CheckCircle size={14} className="sm:hidden text-emerald-400 flex-shrink-0" />}
                                                        {leg.status === 'completed' && <CheckCircle size={16} className="hidden sm:block text-emerald-400 flex-shrink-0" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Statistika */}
                                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                                            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/10">
                                                <p className="text-green-200 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Masofa</p>
                                                <p className="text-white font-bold text-xs sm:text-sm">{activeFlight.totalDistance || 0} km</p>
                                            </div>
                                            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/10">
                                                <p className="text-green-200 text-[10px] sm:text-xs mb-0.5 sm:mb-1">To'lov</p>
                                                <p className="text-emerald-300 font-bold text-xs sm:text-sm truncate">{formatMoney(activeFlight.totalPayment)}</p>
                                            </div>
                                            <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/10">
                                                <p className="text-green-200 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Xarajat</p>
                                                <p className="text-amber-300 font-bold text-xs sm:text-sm truncate">{formatMoney(activeFlight.totalExpenses)}</p>
                                            </div>
                                        </div>

                                        {/* Joriy bosqichni tugatish */}
                                        {activeFlight.legs?.some(leg => leg.status === 'in_progress') && (
                                            <button 
                                                onClick={handleCompleteLeg}
                                                disabled={actionLoading}
                                                className="w-full bg-white text-emerald-600 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base mb-2"
                                            >
                                                {actionLoading ? (
                                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <CheckCircle size={18} className="sm:w-[22px] sm:h-[22px]" />
                                                )}
                                                {actionLoading ? 'Kutilmoqda...' : 'Bosqichni tugatish'}
                                            </button>
                                        )}

                                    </div>
                                </div>
                            ) : activeTrip ? (
                                /* ESKI TRIP TIZIMI */
                                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-4 sm:p-6">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4 sm:mb-5">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                                    <Route size={20} className="sm:hidden text-white" />
                                                    <Route size={24} className="hidden sm:block text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-base sm:text-lg">Faol reys</h3>
                                                    <p className="text-violet-200 text-xs sm:text-sm">Yo'ldasiz</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                <span className="text-emerald-300 text-xs sm:text-sm font-semibold">LIVE</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 border border-white/10">
                                            <div className="flex gap-3 sm:gap-4">
                                                <div className="flex flex-col items-center py-1">
                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
                                                    <div className="w-0.5 h-10 sm:h-12 bg-gradient-to-b from-emerald-400 to-amber-400 my-1"></div>
                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"></div>
                                                </div>
                                                <div className="flex-1 space-y-3 sm:space-y-4">
                                                    <div>
                                                        <p className="text-violet-200 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">BOSHLANISH</p>
                                                        <p className="text-white font-semibold text-sm sm:text-base">{activeTrip.startAddress || 'Belgilanmagan'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-violet-200 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">TUGASH</p>
                                                        <p className="text-white font-semibold text-sm sm:text-base">{activeTrip.endAddress || 'Belgilanmagan'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {activeTrip.tripBudget > 0 && (
                                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                                                <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/10 overflow-hidden">
                                                    <p className="text-violet-200 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Berilgan</p>
                                                    <p className="text-white font-bold text-xs sm:text-sm truncate">{formatMoney(activeTrip.tripBudget)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/10 overflow-hidden">
                                                    <p className="text-violet-200 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Sarflangan</p>
                                                    <p className="text-amber-300 font-bold text-xs sm:text-sm truncate">{formatMoney(activeTrip.totalExpenses || 0)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border border-white/10 overflow-hidden">
                                                    <p className="text-violet-200 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Qoldiq</p>
                                                    <p className={`font-bold text-xs sm:text-sm truncate ${(activeTrip.remainingBudget || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {formatMoney(activeTrip.remainingBudget || activeTrip.tripBudget)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 sm:gap-3">
                                            <button 
                                                onClick={handleCompleteTrip} 
                                                disabled={actionLoading}
                                                className="flex-1 bg-white text-violet-600 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                            >
                                                {actionLoading ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div> : <CheckCircle size={18} className="sm:hidden" />}
                                                {actionLoading ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin hidden sm:block"></div> : <CheckCircle size={22} className="hidden sm:block" />}
                                                {actionLoading ? 'Kutilmoqda...' : 'Tugatish'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : pendingTrips.length > 0 ? (
                                <div className="space-y-3 sm:space-y-4">
                                    <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                                        <Clock className="text-amber-400" size={18} />
                                        <Clock className="text-amber-400 hidden sm:block" size={22} />
                                        Kutilayotgan reyslar
                                    </h2>
                                    {pendingTrips.map((trip) => (
                                        <div key={trip._id} className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-[10px] sm:text-xs font-semibold">Kutilmoqda</span>
                                                    <p className="text-white font-semibold mt-2 text-sm sm:text-base truncate">{trip.startAddress} → {trip.endAddress}</p>
                                                    <p className="text-violet-300 text-xs sm:text-sm">{trip.vehicle?.plateNumber}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleStartPendingTrip(trip._id)} 
                                                    disabled={actionLoading}
                                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex-shrink-0"
                                                >
                                                    {actionLoading ? <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Play size={14} className="sm:hidden" />}
                                                    {actionLoading ? null : <Play size={18} className="hidden sm:block" />}
                                                    Boshlash
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-white/10">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-violet-500/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
                                        <Truck size={32} className="sm:hidden text-violet-400" />
                                        <Truck size={40} className="hidden sm:block text-violet-400" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg sm:text-xl mb-1 sm:mb-2">Reys yo'q</h3>
                                    <p className="text-violet-300 text-sm sm:text-base">Hozirda sizga biriktirilgan reys yo'q</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 group overflow-hidden">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <p className="text-3xl sm:text-4xl font-bold text-white mb-0.5 sm:mb-1">{totalCompletedTrips}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Tugatilgan reyslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 group overflow-hidden">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-emerald-400 mb-0.5 sm:mb-1 truncate">+{formatMoney(totalBonusAmount)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Jami foyda</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'map' && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-white font-bold text-lg">Joylashuvim</h2>
                                {currentLocation && (
                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${gpsStatus === 'excellent' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                        gpsStatus === 'good' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                            gpsStatus === 'active' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                        }`}>
                                        <Navigation size={12} className="animate-pulse" />
                                        {gpsStatus === 'excellent' ? 'Ajoyib' : gpsStatus === 'good' ? 'Yaxshi' : 'Faol'}
                                        {gpsAccuracy && <span>±{Math.round(gpsAccuracy)}m</span>}
                                    </span>
                                )}
                            </div>

                            {/* GPS Debug Info */}
                            {currentLocation && (
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                                    <p className="text-violet-300 text-xs mb-2">📍 Hozirgi koordinatalar:</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-xl p-3">
                                            <p className="text-violet-400 text-xs">Kenglik (Lat)</p>
                                            <p className="text-white font-mono font-bold">{currentLocation.lat.toFixed(6)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3">
                                            <p className="text-violet-400 text-xs">Uzunlik (Lng)</p>
                                            <p className="text-white font-mono font-bold">{currentLocation.lng.toFixed(6)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3">
                                            <p className="text-violet-400 text-xs">Aniqlik</p>
                                            <p className={`font-bold ${gpsAccuracy < 50 ? 'text-emerald-400' : gpsAccuracy < 100 ? 'text-amber-400' : 'text-red-400'}`}>
                                                ±{Math.round(gpsAccuracy || 0)} metr
                                            </p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3">
                                            <p className="text-violet-400 text-xs">Tezlik</p>
                                            <p className="text-white font-bold">
                                                {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)} km/h` : '0 km/h'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Marshrut ma'lumotlari */}
                            {(activeFlight || activeTrip) && routeInfo && (
                                <div className={`rounded-2xl p-4 border mb-4 ${activeFlight ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/20' : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/20'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Route size={20} className={activeFlight ? 'text-green-400' : 'text-blue-400'} />
                                        <span className="text-white font-semibold">
                                            {activeFlight ? (activeFlight.name || 'Faol reys') : 'Faol marshrut'}
                                        </span>
                                        {activeFlight && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10">
                                                {activeFlight.flightType === 'international' ? '🌍 Xalqaro' : '🇺🇿 Mahalliy'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">{activeFlight ? (activeFlight.totalDistance || routeInfo.distance) : routeInfo.distance}</p>
                                            <p className={`text-xs ${activeFlight ? 'text-green-300' : 'text-blue-300'}`}>km masofa</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">
                                                {routeInfo.duration < 60 ? routeInfo.duration + ' daq' : Math.round(routeInfo.duration/60) + ' soat'}
                                            </p>
                                            <p className="text-amber-300 text-xs">taxminiy vaqt</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10" style={{ height: '400px' }}>
                                {currentLocation ? (
                                    <>
                                    <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={isNavigating ? 16 : ((activeFlight || activeTrip) && routeCoords.length > 0 ? 10 : 16)} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        <NavigatorMode 
                                            position={[currentLocation.lat, currentLocation.lng]} 
                                            isNavigating={isNavigating}
                                            routeCoords={routeCoords}
                                            endCoords={tripEndCoords}
                                        />
                                        
                                        {/* Haydovchi joylashuvi */}
                                        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={truckIcon}>
                                            <Popup>
                                                <div className="text-center p-2">
                                                    <p className="font-bold">{user?.fullName}</p>
                                                    <p className="text-xs text-gray-500">±{Math.round(gpsAccuracy || 0)}m aniqlik</p>
                                                    {currentLocation.speed > 0 && (
                                                        <p className="text-xs text-blue-600">{Math.round(currentLocation.speed * 3.6)} km/h</p>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>

                                        {/* Marshrut chizig'i */}
                                        {routeCoords.length > 1 && (
                                            <Polyline
                                                positions={routeCoords}
                                                color="#3b82f6"
                                                weight={4}
                                                opacity={0.8}
                                            />
                                        )}

                                        {/* Boshlanish nuqtasi */}
                                        {tripStartCoords && (
                                            <Marker position={[tripStartCoords.lat, tripStartCoords.lng]} icon={startIcon}>
                                                <Popup>
                                                    <div className="text-center">
                                                        <p className="font-bold text-green-600">Boshlanish</p>
                                                        <p className="text-xs">
                                                            {activeFlight?.legs?.[0]?.fromCity || activeTrip?.startAddress}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* Tugash nuqtasi */}
                                        {tripEndCoords && (
                                            <Marker position={[tripEndCoords.lat, tripEndCoords.lng]} icon={endIcon}>
                                                <Popup>
                                                    <div className="text-center">
                                                        <p className="font-bold text-red-600">Manzil</p>
                                                        <p className="text-xs">
                                                            {activeFlight?.legs?.[activeFlight.legs.length - 1]?.toCity || activeTrip?.endAddress}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}
                                    </MapContainer>
                                    
                                    {/* Meni ko'rsat tugmasi */}
                                    <button
                                        onClick={() => setIsNavigating(!isNavigating)}
                                        className={`absolute bottom-4 right-4 z-[1000] px-4 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 ${
                                            isNavigating 
                                                ? 'bg-blue-600 text-white shadow-blue-500/50' 
                                                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-xl'
                                        }`}
                                    >
                                        <Navigation size={20} className={isNavigating ? 'animate-pulse' : ''} />
                                        <span className="text-sm font-medium">{isNavigating ? 'Kuzatish' : 'Meni ko\'rsat'}</span>
                                    </button>
                                    
                                    {/* Tezlik ko'rsatkichi */}
                                    {isNavigating && currentLocation?.speed > 0 && (
                                        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg">
                                            <p className="text-2xl font-bold text-gray-800">{Math.round(currentLocation.speed * 3.6)}</p>
                                            <p className="text-xs text-gray-500">km/h</p>
                                        </div>
                                    )}
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <MapPin size={48} className="mx-auto mb-3 text-violet-400 animate-bounce" />
                                            <p className="text-violet-300 mb-2">GPS aniqlanmoqda...</p>
                                            <p className="text-violet-400 text-xs">
                                                {gpsStatus === 'denied' ? '🚫 Joylashuv ruxsati berilmagan' :
                                                    gpsStatus === 'unavailable' ? '📡 GPS mavjud emas' :
                                                        gpsStatus === 'timeout' ? '⏳ GPS javob bermayapti...' :
                                                            gpsStatus === 'error' ? '❌ GPS xatolik' :
                                                                '⏳ Joylashuv aniqlanmoqda...'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'history' && (
                        <div className="space-y-4 pt-2">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <History className="text-violet-400" size={22} /> Reyslar tarixi
                            </h2>
                            {trips.length > 0 ? trips.map((trip) => (
                                <div key={trip._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trip.status === 'completed' ? 'bg-emerald-500/20' : trip.status === 'in_progress' ? 'bg-violet-500/20' : 'bg-amber-500/20'
                                                }`}>
                                                <Route size={18} className={trip.status === 'completed' ? 'text-emerald-400' : trip.status === 'in_progress' ? 'text-violet-400' : 'text-amber-400'} />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">{trip.startAddress} → {trip.endAddress}</p>
                                                <p className="text-violet-300 text-xs">{formatDate(trip.createdAt)}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${trip.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                            trip.status === 'in_progress' ? 'bg-violet-500/20 text-violet-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {trip.status === 'completed' ? 'Tugatilgan' : trip.status === 'in_progress' ? 'Yolda' : 'Kutilmoqda'}
                                        </span>
                                    </div>
                                    {(trip.bonusAmount > 0 || trip.penaltyAmount > 0) && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {trip.bonusAmount > 0 && <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none"><TrendingUp size={12} className="flex-shrink-0" /> +{formatMoney(trip.bonusAmount)}</span>}
                                            {trip.penaltyAmount > 0 && <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none"><TrendingDown size={12} className="flex-shrink-0" /> -{formatMoney(trip.penaltyAmount)}</span>}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="bg-white/5 rounded-2xl p-10 text-center border border-white/10">
                                    <History size={48} className="mx-auto mb-3 text-violet-400/50" />
                                    <p className="text-violet-300">Reyslar yoq</p>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'salary' && (
                        <div className="space-y-5 pt-2">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <CircleDollarSign className="text-violet-400" size={22} /> Maosh
                            </h2>

                            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-center overflow-hidden">
                                <p className="text-violet-200 text-xs sm:text-sm mb-2">Jami oylik maosh</p>
                                <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1 truncate">{formatMoney((user?.baseSalary || 0) + totalBonusAmount - totalPenaltyAmount)}</p>
                                <p className="text-violet-200 text-sm">som</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 overflow-hidden">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-white truncate">{formatMoney(user?.baseSalary || 0)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Oylik maosh</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 overflow-hidden">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-white">{totalCompletedTrips}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Reyslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 overflow-hidden">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-emerald-400 truncate">+{formatMoney(totalBonusAmount)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Foyda</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 overflow-hidden">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                        <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-red-400 truncate">-{formatMoney(totalPenaltyAmount)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Zarar</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>


        </div>
    )
}
