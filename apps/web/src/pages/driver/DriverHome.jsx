import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
    LogOut, Truck, Play, CheckCircle, History, Wallet, Route, MapPin, Map,
    Clock, TrendingUp, TrendingDown, Award, Navigation, X, Sparkles, Zap, Target,
    Star, CircleDollarSign, Bell, WifiOff, RefreshCw, Fuel, ChevronRight, Eye
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../services/api'
import { showToast } from '../../components/Toast'
import { connectSocket, joinDriverRoom } from '../../services/socket'
import { DriverHomeSkeleton } from '../../components/ui'

// Yashil dumaloq nuqta - haydovchi joylashuvi uchun
const driverLocationIcon = L.divIcon({
    className: 'driver-location-marker',
    html: `
        <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; background: #10b981; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
            <div style="position: relative; width: 24px; height: 24px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);"></div>
        </div>
        <style>
            @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
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
    const [selectedFlight, setSelectedFlight] = useState(null) // Tarix modal uchun

    const [error, setError] = useState(null)

    // 🚀 Optimizatsiya: fetchData faqat kerakli ma'lumotlarni oladi
    const fetchData = useCallback(async (options = {}) => {
        const { silent = false } = options
        if (!silent) setError(null)

        try {
            // Parallel so'rovlar - tezroq
            const [tripsRes, profileRes, flightsRes] = await Promise.all([
                api.get('/driver/me/trips'),
                api.get('/driver/me'),
                api.get('/driver/me/flights').catch(() => ({ data: { data: [] } }))
            ])

            const allTrips = tripsRes.data.data || []
            const allFlights = flightsRes.data.data || []
            const driverData = profileRes.data.data

            // 🚀 Batch state update - bir marta render
            setTrips(allTrips)
            setActiveTrip(allTrips.find(t => t.status === 'in_progress') || null)
            setPendingTrips(allTrips.filter(t => t.status === 'pending'))
            setFlights(allFlights)
            setActiveFlight(allFlights.find(f => f.status === 'active') || null)

            if (driverData?._id) setDriverId(driverData._id)

            if (driverData?.lastLocation?.lat && driverData?.lastLocation?.lng) {
                const loc = driverData.lastLocation
                setCurrentLocation({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy || 100, speed: loc.speed || 0 })
                setGpsAccuracy(loc.accuracy || 100)
                setGpsStatus(loc.accuracy < 50 ? 'excellent' : loc.accuracy < 200 ? 'good' : 'active')
            }
        } catch (err) {
            if (!silent) {
                setError({ type: err.isNetworkError ? 'network' : 'generic', message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik' })
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const [gpsAccuracy, setGpsAccuracy] = useState(null)

    // Faol reys uchun marshrut olish (Trip va Flight)
    useEffect(() => {
        async function fetchRoute() {
            // Flight tizimi (yangi) - birinchi va oxirgi buyurtma koordinatalari
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

        // Juda yomon aniqlikni rad etish (100km dan ko'p = kesh yoki xato)
        if (accuracy > 100000) {
            setGpsStatus('waiting')
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
        } catch {
            // Silent - GPS xatosi
        }
    }

    const handleGpsError = (error, setRetry) => {
        if (error.code === 1) {
            setGpsStatus('denied')
        } else if (error.code === 2) {
            setGpsStatus('unavailable')
            if (setRetry) setGpsRetryCount(prev => prev + 1)
        } else if (error.code === 3) {
            setGpsStatus('timeout')
            if (setRetry) setGpsRetryCount(prev => prev + 1)
        } else {
            setGpsStatus('error')
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

        // 🚀 Flight yangilanganda - optimized, fetchData chaqirmasdan
        const handleFlightUpdated = (data) => {
            if (!data.flight) return

            setActiveFlight(prev => {
                if (!prev || prev._id !== data.flight._id) return prev

                // Yangi xarajat qo'shilganini tekshirish
                const oldCount = prev.expenses?.length || 0
                const newCount = data.flight.expenses?.length || 0
                if (newCount > oldCount) {
                    const newExpense = data.flight.expenses[newCount - 1]
                    const labels = {
                        fuel_benzin: 'Benzin', fuel_diesel: 'Dizel', fuel_gas: 'Gaz',
                        fuel_metan: 'Metan', fuel_propan: 'Propan', food: 'Ovqat',
                        repair: 'Ta\'mir', toll: 'Yo\'l to\'lovi', fine: 'Jarima', other: 'Boshqa'
                    }
                    showToast.info(`💰 Yangi xarajat: ${labels[newExpense?.type] || 'Xarajat'} - ${formatMoney(newExpense?.amount)} so'm`)
                }
                return data.flight
            })

            // Flights ro'yxatini ham yangilash (fetchData o'rniga)
            setFlights(prev => prev.map(f => f._id === data.flight._id ? data.flight : f))
        }

        // 🚀 Flight yopilganda - optimistic update
        const handleFlightCompleted = (data) => {
            showToast.success('✅ Reys yopildi!', data.message || 'Reys muvaffaqiyatli yopildi')
            if (data.flight) {
                setActiveFlight(null)
                setFlights(prev => prev.map(f => f._id === data.flight._id ? data.flight : f))
            } else {
                fetchData({ silent: true })
            }
        }

        // 🚀 Reys bekor qilinganda - optimistic update
        const handleTripCancelled = (data) => {
            showToast.error('❌ Reys bekor qilindi!', data.message || 'Sizning reysingiz bekor qilindi')
            setActiveTrip(null)
            setActiveFlight(null)
            fetchData({ silent: true })
        }

        // 🚀 Flight bekor qilinganda
        const handleFlightCancelled = (data) => {
            showToast.error('❌ Reys bekor qilindi!', data.message || 'Sizning reysingiz bekor qilindi')
            setActiveFlight(null)
            if (data.flight) {
                setFlights(prev => prev.map(f => f._id === data.flight._id ? data.flight : f))
            } else {
                fetchData({ silent: true })
            }
        }

        // 🚀 Reys o'chirilganda
        const handleFlightDeleted = (data) => {
            showToast.warning('🗑️ Reys o\'chirildi!', data.message || 'Sizning reysingiz o\'chirildi')
            setActiveFlight(null)
            setFlights(prev => prev.filter(f => f._id !== data.flightId))
        }

        socket.on('new-trip', handleNewTrip)
        socket.on('new-flight', handleNewFlight)
        socket.on('flight-started', handleNewFlight)
        socket.on('flight-updated', handleFlightUpdated)
        socket.on('flight-completed', handleFlightCompleted)
        socket.on('trip-cancelled', handleTripCancelled)
        socket.on('flight-cancelled', handleFlightCancelled)
        socket.on('flight-deleted', handleFlightDeleted)

        return () => {
            socket.off('connect', joinRoom)
            socket.off('new-trip', handleNewTrip)
            socket.off('new-flight', handleNewFlight)
            socket.off('flight-started', handleNewFlight)
            socket.off('flight-updated', handleFlightUpdated)
            socket.off('flight-completed', handleFlightCompleted)
            socket.off('trip-cancelled', handleTripCancelled)
            socket.off('flight-cancelled', handleFlightCancelled)
            socket.off('flight-deleted', handleFlightDeleted)
        }
    }, [driverId, fetchData])

    // 🚀 Optimizatsiya: GPS intervallarni kamaytirish
    useEffect(() => {
        fetchData()

        if (!navigator.geolocation) {
            setGpsStatus('error')
            return
        }

        let watchId = null
        let gpsInterval = null

        setGpsStatus('checking')

        // 1. Birinchi: tez network joylashuv
        navigator.geolocation.getCurrentPosition(
            sendLocation,
            (err) => handleGpsError(err, false),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        )

        // 2. Aniq GPS kuzatish - asosiy
        watchId = navigator.geolocation.watchPosition(
            sendLocation,
            (err) => handleGpsError(err, true),
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
        )

        // 3. Har 15 sekundda yangilash (10 va 30 o'rniga bitta)
        gpsInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                sendLocation,
                () => { },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 }
            )
        }, 15000)

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
            if (gpsInterval) clearInterval(gpsInterval)
        }
    }, [])

    const [actionLoading, setActionLoading] = useState(false)

    const handleLogout = () => { logout(); window.location.href = '/login' }

    // 🚀 Optimistic update - darhol UI yangilanadi
    const handleCompleteTrip = async () => {
        if (!activeTrip || actionLoading) return

        const tripId = activeTrip._id
        // Optimistic: darhol UI yangilash
        setActiveTrip(null)
        setTrips(prev => prev.map(t => t._id === tripId ? { ...t, status: 'completed' } : t))
        showToast.success('Reys tugatildi!')

        // Fonda API so'rov
        api.put(`/driver/me/trips/${tripId}/complete`)
            .catch(err => {
                showToast.error(err.response?.data?.message || 'Xatolik')
                fetchData({ silent: true }) // Xatolikda qayta yuklash
            })
    }

    // 🚀 Flight buyurtmaini tugatish - optimistic
    const handleCompleteLeg = async () => {
        if (!activeFlight || actionLoading) return

        const currentLeg = activeFlight.legs?.find(leg => leg.status === 'in_progress')
        if (!currentLeg) {
            showToast.error('Faol buyurtma topilmadi')
            return
        }

        const flightId = activeFlight._id
        const legId = currentLeg._id

        // Optimistic: darhol UI yangilash
        setActiveFlight(prev => ({
            ...prev,
            legs: prev.legs.map(leg =>
                leg._id === legId ? { ...leg, status: 'completed' } : leg
            )
        }))
        showToast.success('buyurtma tugatildi!')

        // Fonda API so'rov
        api.put(`/driver/me/flights/${flightId}/legs/${legId}/complete`)
            .then(res => {
                if (res.data.data) setActiveFlight(res.data.data)
            })
            .catch(err => {
                showToast.error(err.response?.data?.message || 'Xatolik')
                fetchData({ silent: true })
            })
    }

    // 🚀 Flight tasdiqlash - optimistic
    const handleConfirmFlight = async () => {
        if (!activeFlight || actionLoading) return

        const flightId = activeFlight._id
        setActionLoading(true)

        // Optimistic: darhol UI yangilash
        setActiveFlight(prev => ({
            ...prev,
            driverConfirmed: true,
            driverConfirmedAt: new Date()
        }))

        try {
            const res = await api.put(`/driver/me/flights/${flightId}/confirm`)
            if (res.data.data) setActiveFlight(res.data.data)
            showToast.success('Reys tasdiqlandi!')
        } catch (err) {
            // Xatolikda qaytarish
            setActiveFlight(prev => ({
                ...prev,
                driverConfirmed: false,
                driverConfirmedAt: null
            }))
            showToast.error(err.response?.data?.message || 'Xatolik')
        } finally {
            setActionLoading(false)
        }
    }

    // 🚀 Pending trip boshlash - optimistic
    const handleStartPendingTrip = async (tripId) => {
        if (actionLoading) return

        const trip = pendingTrips.find(t => t._id === tripId)
        if (!trip) return

        // Optimistic: darhol UI yangilash
        setPendingTrips(prev => prev.filter(t => t._id !== tripId))
        setActiveTrip({ ...trip, status: 'in_progress' })
        showToast.success('Reys boshlandi!')

        // Fonda API so'rov
        api.put(`/driver/me/trips/${tripId}/start`)
            .catch(err => {
                showToast.error(err.response?.data?.message || 'Xatolik')
                fetchData({ silent: true })
            })
    }
    // 🚀 Memoized formatters
    const formatMoney = useCallback((n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0', [])
    const formatDate = useCallback((d) => d ? new Date(d).toLocaleString('uz-UZ') : '-', [])

    // 🚀 Memoized statistika - faqat flights/trips o'zgarganda qayta hisoblanadi
    const stats = useMemo(() => {
        const completedFlights = flights.filter(f => f.status === 'completed').length
        const totalProfit = flights.reduce((sum, f) => sum + (f.profit > 0 ? f.profit : 0), 0)
        const totalLoss = flights.reduce((sum, f) => sum + (f.profit < 0 ? Math.abs(f.profit) : 0), 0)
        const completedTrips = trips.filter(t => t.status === 'completed').length
        const totalBonus = trips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0)
        const totalPenalty = trips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0)

        return {
            totalCompletedTrips: completedFlights + completedTrips,
            totalBonusAmount: totalProfit + totalBonus,
            totalPenaltyAmount: totalLoss + totalPenalty
        }
    }, [flights, trips])

    const { totalCompletedTrips, totalBonusAmount, totalPenaltyAmount } = stats

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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-950">
            {/* Background Effects - Premium */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]"></div>
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

            {/* Header - Premium */}
            <header className="relative z-20 px-3 sm:px-4 pt-4 sm:pt-5 pb-2">
                <div className="max-w-lg mx-auto">
                    <div className="relative overflow-hidden bg-slate-800/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl">

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl sm:rounded-2xl blur-md opacity-60"></div>
                                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl">
                                        <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-2 border-slate-800 flex items-center justify-center shadow-lg">
                                        <Zap size={10} className="sm:w-3 sm:h-3 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">Avtojon <Sparkles className="w-4 h-4 text-amber-400" /></h1>
                                    <p className="text-sm text-slate-300 truncate max-w-[120px] sm:max-w-[160px]">{user?.fullName || 'Haydovchi'}</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="p-2.5 sm:p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl sm:rounded-2xl border border-red-500/20 transition-all hover:scale-105 active:scale-95">
                                <LogOut size={18} className="sm:w-5 sm:h-5 text-red-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs - Premium */}
            <nav className="relative z-20 px-3 sm:px-4 py-3 sticky top-0">
                <div className="max-w-lg mx-auto">
                    <div className="bg-slate-800/60 backdrop-blur-2xl rounded-2xl p-1.5 sm:p-2 flex gap-1 shadow-xl">
                        {[
                            { id: 'home', label: 'Asosiy', icon: Target },
                            { id: 'map', label: 'Xarita', icon: Map },
                            { id: 'history', label: 'Tarix', icon: History },
                            // { id: 'salary', label: 'Maosh', icon: CircleDollarSign }
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 py-3 sm:py-3.5 px-2 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${tab === id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}>
                                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                            {/* FLIGHT TIZIMI - Premium */}
                            {activeFlight ? (
                                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-900/40">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-xl"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/20 rounded-full -ml-16 -mb-16 blur-xl"></div>

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-white/30 rounded-xl sm:rounded-2xl blur-md"></div>
                                                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/20">
                                                        <Route size={22} className="sm:w-7 sm:h-7 text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-lg sm:text-xl">{activeFlight.name || 'Faol reys'}</h3>
                                                    <p className="text-emerald-100 text-sm flex items-center gap-1.5">
                                                        {activeFlight.flightType === 'international' ? '🌍 Xalqaro reys' : '🇺🇿 Mahalliy reys'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
                                                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></span>
                                                <span className="text-white text-xs sm:text-sm font-bold tracking-wider">LIVE</span>
                                            </div>
                                        </div>

                                        {/* buyurtmalar - Premium */}
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 border border-white/20">
                                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                                <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider">buyurtmalar</p>
                                                <span className="px-2.5 py-1 bg-white/20 rounded-full text-white text-xs font-bold">{activeFlight.legs?.length || 0}</span>
                                            </div>
                                            <div className="space-y-2.5">
                                                {activeFlight.legs?.map((leg, idx) => (
                                                    <div key={leg._id || idx} className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${leg.status === 'in_progress' ? 'bg-white/20 border border-white/30' : 'bg-white/5'
                                                        }`}>
                                                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${leg.status === 'completed' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' :
                                                            leg.status === 'in_progress' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-pulse' :
                                                                'bg-white/20 text-white/60'
                                                            }`}>
                                                            {leg.status === 'completed' ? '✓' : idx + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm sm:text-base font-semibold truncate">{leg.fromCity} → {leg.toCity}</p>
                                                            <p className="text-emerald-200 text-xs sm:text-sm">{leg.distance || 0} km • {formatMoney(leg.payment)} so'm</p>
                                                        </div>
                                                        {leg.status === 'in_progress' && (
                                                            <span className="px-2 py-1 bg-amber-500/30 rounded-lg text-amber-200 text-[10px] sm:text-xs font-semibold">Yo'lda</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Statistika - Premium */}
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                                            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
                                                <p className="text-emerald-100 text-[10px] sm:text-xs font-medium mb-1">Masofa</p>
                                                <p className="text-white font-bold text-base sm:text-lg">{activeFlight.totalDistance || 0}</p>
                                                <p className="text-emerald-200 text-[10px] sm:text-xs">km</p>
                                            </div>
                                            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
                                                <p className="text-emerald-100 text-[10px] sm:text-xs font-medium mb-1">To'lov</p>
                                                <p className="text-white font-bold text-sm sm:text-base truncate">{formatMoney(activeFlight.totalPayment)}</p>
                                                <p className="text-emerald-200 text-[10px] sm:text-xs">so'm</p>
                                            </div>
                                            <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
                                                <p className="text-emerald-100 text-[10px] sm:text-xs font-medium mb-1">Xarajat</p>
                                                <p className="text-amber-300 font-bold text-sm sm:text-base truncate">{formatMoney(activeFlight.totalExpenses)}</p>
                                                <p className="text-emerald-200 text-[10px] sm:text-xs">so'm</p>
                                            </div>
                                        </div>

                                        {/* Xarajatlar ro'yxati - Realtime */}
                                        {activeFlight.expenses && activeFlight.expenses.length > 0 && (
                                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/20">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-white/80 text-xs sm:text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                                        <Wallet size={14} /> Xarajatlar
                                                    </p>
                                                    <span className="px-2.5 py-1 bg-amber-500/20 rounded-full text-amber-300 text-xs font-bold">
                                                        {activeFlight.expenses.length} ta
                                                    </span>
                                                </div>
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                    {activeFlight.expenses.slice(-5).reverse().map((exp, idx) => {
                                                        const isFuel = exp.type?.startsWith('fuel_')
                                                        const expenseLabels = {
                                                            fuel_benzin: '⛽ Benzin',
                                                            fuel_diesel: '🛢️ Dizel',
                                                            fuel_gas: '🔵 Gaz',
                                                            fuel_metan: '🟢 Metan',
                                                            fuel_propan: '🟡 Propan',
                                                            food: '🍽️ Ovqat',
                                                            repair: '🔧 Ta\'mir',
                                                            toll: '🛣️ Yo\'l to\'lovi',
                                                            fine: '📋 Jarima',
                                                            other: '📦 Boshqa'
                                                        }
                                                        return (
                                                            <div key={exp._id || idx} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg">{expenseLabels[exp.type]?.split(' ')[0] || '📦'}</span>
                                                                    <div>
                                                                        <p className="text-white text-sm font-medium">
                                                                            {expenseLabels[exp.type]?.split(' ').slice(1).join(' ') || exp.type}
                                                                        </p>
                                                                        {isFuel && exp.quantity && (
                                                                            <p className="text-emerald-300 text-[10px]">{exp.quantity} {exp.quantityUnit || 'L'}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-amber-300 font-bold text-sm">-{formatMoney(exp.amount)}</p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                {activeFlight.expenses.length > 5 && (
                                                    <p className="text-center text-emerald-200 text-xs mt-2">
                                                        +{activeFlight.expenses.length - 5} ta boshqa xarajat
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Qoldiq */}
                                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                                            <div className="flex items-center justify-between">
                                                <span className="text-emerald-100 text-sm">Qoldiq (yo'l xarajati):</span>
                                                <span className={`font-bold text-lg ${(activeFlight.finalBalance || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                                                    {formatMoney(Math.abs(activeFlight.finalBalance || 0))} so'm
                                                    {(activeFlight.finalBalance || 0) < 0 && ' (kamomad)'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Tasdiqlash tugmasi */}
                                        {!activeFlight.driverConfirmed ? (
                                            <button
                                                onClick={handleConfirmFlight}
                                                disabled={actionLoading}
                                                className="w-full mt-4 bg-white text-emerald-600 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base hover:bg-emerald-50 transition-colors"
                                            >
                                                {actionLoading ? (
                                                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <CheckCircle size={20} />
                                                )}
                                                {actionLoading ? 'Kutilmoqda...' : 'Reysni tasdiqlash'}
                                            </button>
                                        ) : (
                                            <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl border border-white/20">
                                                <CheckCircle size={18} className="text-emerald-300" />
                                                <span className="text-emerald-200 text-sm font-medium">Tasdiqlangan</span>
                                            </div>
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
                                <div className="relative overflow-hidden bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 sm:p-10 text-center border border-white/10 shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-transparent"></div>
                                    <div className="relative">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 border border-violet-500/20">
                                            <Truck size={40} className="sm:w-12 sm:h-12 text-violet-400" />
                                        </div>
                                        <h3 className="text-white font-bold text-xl sm:text-2xl mb-2 sm:mb-3">Reys yo'q</h3>
                                        <p className="text-slate-400 text-sm sm:text-base max-w-xs mx-auto">Hozirda sizga biriktirilgan reys yo'q. Yangi reys tayinlanganda xabar olasiz.</p>
                                    </div>
                                </div>
                            )}

                            {/* Statistika kartochkalari - Premium */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="relative">
                                        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-xl shadow-violet-500/30 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                        </div>
                                        <p className="text-4xl sm:text-5xl font-bold text-white mb-1">{totalCompletedTrips}</p>
                                        <p className="text-slate-400 text-xs sm:text-sm font-medium">Tugatilgan reyslar</p>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                                    <div className="relative">
                                        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                            <Award className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                        </div>
                                        <p className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1 truncate">+{formatMoney(totalBonusAmount)}</p>
                                        <p className="text-slate-400 text-xs sm:text-sm font-medium">Jami foyda</p>
                                    </div>
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
                                                {routeInfo.duration < 60 ? routeInfo.duration + ' daq' : Math.round(routeInfo.duration / 60) + ' soat'}
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
                                            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={driverLocationIcon}>
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
                                            className={`absolute bottom-4 right-4 z-[1000] px-4 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2 ${isNavigating
                                                ? 'bg-emerald-600 text-white shadow-emerald-500/50'
                                                : 'bg-white text-gray-700 hover:bg-gray-100 shadow-xl'
                                                }`}
                                        >
                                            {isNavigating ? (
                                                <span className="relative flex h-5 w-5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500"></span>
                                                </span>
                                            ) : (
                                                <Navigation size={20} />
                                            )}
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

                            {/* Yangi Flight tizimi reyslari */}
                            {flights.length > 0 && flights.map((flight) => (
                                <button
                                    key={flight._id}
                                    type="button"
                                    className="w-full text-left bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                    onClick={() => setSelectedFlight(flight)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${flight.status === 'completed' ? 'bg-emerald-500/20' :
                                                flight.status === 'active' ? 'bg-violet-500/20' : 'bg-red-500/20'
                                                }`}>
                                                <Route size={18} className={
                                                    flight.status === 'completed' ? 'text-emerald-400' :
                                                        flight.status === 'active' ? 'text-violet-400' : 'text-red-400'
                                                } />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">{flight.name || 'Reys'}</p>
                                                <p className="text-violet-300 text-xs">{formatDate(flight.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${flight.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                flight.status === 'active' ? 'bg-violet-500/20 text-violet-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {flight.status === 'completed' ? 'Tugatilgan' : flight.status === 'active' ? 'Faol' : 'Bekor'}
                                            </span>
                                            <ChevronRight size={18} className="text-violet-400" />
                                        </div>
                                    </div>

                                    {/* Flight statistikasi */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="bg-white/5 rounded-lg p-2 text-center">
                                            <p className="text-violet-300 text-[10px]">buyurtmalar</p>
                                            <p className="text-white font-bold text-sm">{flight.legs?.length || 0}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2 text-center">
                                            <p className="text-violet-300 text-[10px]">Masofa</p>
                                            <p className="text-white font-bold text-sm">{flight.totalDistance || 0} km</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-2 text-center">
                                            <p className="text-violet-300 text-[10px]">To'lov</p>
                                            <p className="text-emerald-400 font-bold text-sm">{formatMoney(flight.totalPayment)}</p>
                                        </div>
                                    </div>

                                    {/* Foyda/Zarar va shofyor ulushi */}
                                    {flight.status === 'completed' && (
                                        <div className="flex flex-wrap gap-2">
                                            {flight.profit > 0 && (
                                                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                                                    <TrendingUp size={12} className="flex-shrink-0" /> Foyda: {formatMoney(flight.profit)}
                                                </span>
                                            )}
                                            {flight.profit < 0 && (
                                                <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                                                    <TrendingDown size={12} className="flex-shrink-0" /> Zarar: {formatMoney(Math.abs(flight.profit))}
                                                </span>
                                            )}
                                            {flight.driverProfitAmount > 0 && (
                                                <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
                                                    <Award size={12} className="flex-shrink-0" /> Ulush: {formatMoney(flight.driverProfitAmount)} ({flight.driverProfitPercent}%)
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Batafsil ko'rish hint */}
                                    <p className="text-violet-400 text-xs text-center mt-3 flex items-center justify-center gap-1">
                                        <Eye size={12} /> Batafsil ko'rish uchun bosing
                                    </p>
                                </button>
                            ))}

                            {/* Eski Trip tizimi reyslari */}
                            {trips.length > 0 && trips.map((trip) => (
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
                            ))}

                            {/* Hech qanday reys yo'q */}
                            {flights.length === 0 && trips.length === 0 && (
                                <div className="bg-white/5 rounded-2xl p-10 text-center border border-white/10">
                                    <History size={48} className="mx-auto mb-3 text-violet-400/50" />
                                    <p className="text-violet-300">Reyslar yo'q</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Maosh bo'limi - hozircha o'chirilgan
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
                    */}
                </div>
            </main>

            {/* Flight batafsil modal */}
            {selectedFlight && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto"
                    onClick={() => setSelectedFlight(null)}
                >
                    <div
                        className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-4 rounded-t-2xl ${selectedFlight.status === 'completed' ? 'bg-emerald-600' :
                            selectedFlight.status === 'active' ? 'bg-violet-600' : 'bg-red-600'
                            }`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Route className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{selectedFlight.name || 'Reys'}</h2>
                                        <p className="text-white/80 text-xs">{formatDate(selectedFlight.createdAt)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFlight(null)}
                                    className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Statistika */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-violet-300 text-xs mb-1">Jami to'lov</p>
                                    <p className="text-emerald-400 font-bold">{formatMoney(selectedFlight.totalPayment)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-violet-300 text-xs mb-1">Jami xarajat</p>
                                    <p className="text-amber-400 font-bold">{formatMoney(selectedFlight.totalExpenses)}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-violet-300 text-xs mb-1">Masofa</p>
                                    <p className="text-white font-bold">{selectedFlight.totalDistance || 0} km</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-violet-300 text-xs mb-1">{(selectedFlight.profit || 0) >= 0 ? 'Foyda' : 'Zarar'}</p>
                                    <p className={`font-bold ${(selectedFlight.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatMoney(Math.abs(selectedFlight.profit || 0))}
                                    </p>
                                </div>
                            </div>

                            {/* Shofyor ulushi */}
                            {selectedFlight.driverProfitAmount > 0 && (
                                <div className="bg-amber-500/20 rounded-xl p-3 border border-amber-500/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-amber-300 text-sm">Sizning ulushingiz ({selectedFlight.driverProfitPercent}%)</span>
                                        <span className="text-amber-400 font-bold">{formatMoney(selectedFlight.driverProfitAmount)} so'm</span>
                                    </div>
                                </div>
                            )}

                            {/* buyurtmalar */}
                            {selectedFlight.legs && selectedFlight.legs.length > 0 && (
                                <div>
                                    <h3 className="text-white font-semibold mb-2 text-sm">buyurtmalar ({selectedFlight.legs.length})</h3>
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {selectedFlight.legs.map((leg, idx) => (
                                            <div key={leg._id || idx} className="bg-white/5 rounded-lg p-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white">{idx + 1}. {leg.fromCity} → {leg.toCity}</span>
                                                    <span className="text-emerald-400 font-semibold">{formatMoney(leg.payment)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Xarajatlar */}
                            {selectedFlight.expenses && selectedFlight.expenses.length > 0 && (
                                <div>
                                    <h3 className="text-white font-semibold mb-2 text-sm">Xarajatlar ({selectedFlight.expenses.length})</h3>
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                        {selectedFlight.expenses.map((exp, idx) => (
                                            <div key={exp._id || idx} className="bg-white/5 rounded-lg p-2 text-sm flex justify-between">
                                                <span className="text-white">{exp.type}</span>
                                                <span className="text-amber-400">-{formatMoney(exp.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Qoldiq */}
                            <div className={`rounded-xl p-3 ${(selectedFlight.finalBalance || 0) >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-white text-sm">Qoldiq:</span>
                                    <span className={`font-bold ${(selectedFlight.finalBalance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatMoney(Math.abs(selectedFlight.finalBalance || 0))} so'm
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
