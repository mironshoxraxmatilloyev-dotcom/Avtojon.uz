import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
    LogOut, Truck, Play, CheckCircle, Plus, History, Wallet, Route, MapPin, Map,
    Clock, TrendingUp, TrendingDown, Award, Navigation, X, Camera, Sparkles, Zap, Target,
    Star, CircleDollarSign, Bell
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../services/api'
import { showToast } from '../../components/Toast'
import { connectSocket, joinDriverRoom, disconnectSocket, getSocket } from '../../services/socket'

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
                console.log('Bounds error:', e)
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
    } catch (error) {
        console.error('Marshrut olish xatosi:', error)
        return null
    }
}

export default function DriverHome() {
    const { user, logout } = useAuthStore()
    const [activeTrip, setActiveTrip] = useState(null)
    const [pendingTrips, setPendingTrips] = useState([])
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('home')
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [expenseForm, setExpenseForm] = useState({
        expenseType: 'fuel', amount: '', description: '', fuelLiters: '', receiptImage: '',
        country: 'UZB', currency: 'UZS'
    })
    const [imagePreview, setImagePreview] = useState(null)
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

    const fetchData = useCallback(async () => {
        try {
            const [tripsRes, profileRes] = await Promise.all([
                api.get('/driver/me/trips'),
                api.get('/driver/me')
            ])
            
            const allTrips = tripsRes.data.data || []
            setTrips(allTrips)
            setActiveTrip(allTrips.find(t => t.status === 'in_progress') || null)
            setPendingTrips(allTrips.filter(t => t.status === 'pending'))
            
            // Serverdan oxirgi joylashuvni olish
            const driverData = profileRes.data.data
            console.log('📦 Driver data:', driverData)
            
            // Driver ID ni saqlash (socket uchun)
            if (driverData?._id) {
                setDriverId(driverData._id)
            }
            
            if (driverData?.lastLocation) {
                const loc = driverData.lastLocation
                console.log('📍 lastLocation:', loc)
                
                if (loc.lat && loc.lng) {
                    setCurrentLocation({
                        lat: loc.lat,
                        lng: loc.lng,
                        accuracy: loc.accuracy || 100,
                        speed: loc.speed || 0
                    })
                    setGpsAccuracy(loc.accuracy || 100)
                    setGpsStatus(loc.accuracy < 50 ? 'excellent' : loc.accuracy < 200 ? 'good' : 'active')
                    console.log('✅ Joylashuv olindi:', loc.lat, loc.lng)
                }
            } else {
                console.log('⚠️ lastLocation topilmadi')
            }
        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }, [])

    const [gpsAccuracy, setGpsAccuracy] = useState(null)

    // Faol reys uchun marshrut olish
    useEffect(() => {
        async function fetchTripRoute() {
            if (activeTrip && activeTrip.startCoords && activeTrip.endCoords) {
                setTripStartCoords(activeTrip.startCoords)
                setTripEndCoords(activeTrip.endCoords)
                const route = await getRouteFromAPI(
                    activeTrip.startCoords.lat, activeTrip.startCoords.lng,
                    activeTrip.endCoords.lat, activeTrip.endCoords.lng
                )
                if (route) {
                    setRouteCoords(route.coordinates)
                    setRouteInfo({ distance: route.distance, duration: route.duration })
                }
            } else if (activeTrip) {
                // Koordinatalar yo'q bo'lsa, manzillardan qidirish
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
                        if (route) {
                            setRouteCoords(route.coordinates)
                            setRouteInfo({ distance: route.distance, duration: route.duration })
                        }
                    }
                } catch (err) {
                    console.error('Marshrut olishda xato:', err)
                }
            }
        }
        fetchTripRoute()
    }, [activeTrip])

    const sendLocation = async (position) => {
        const accuracy = position.coords.accuracy

        // Juda yomon aniqlikni rad etish (100km dan ko'p = kesh yoki xato)
        if (accuracy > 100000) {
            console.warn('⚠️ GPS juda noaniq, rad etildi:', Math.round(accuracy), 'm')
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

        console.log('📍 GPS:', loc.lat.toFixed(6), loc.lng.toFixed(6), `±${Math.round(accuracy)}m`)

        // Har doim serverga yuborish (aniqlik qanday bo'lmasin)
        // Server o'zi qaror qiladi - saqlash yoki yo'q
        try {
            await api.post('/driver/me/location', loc)
            console.log('✅ GPS serverga yuborildi')
        } catch (error) {
            console.error('❌ Server xatolik:', error)
        }
    }

    const handleGpsError = (error, setRetry) => {
        console.error('❌ GPS error:', error.code, error.message)

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
            console.log('⏳ Socket: driverId kutilmoqda...')
            return
        }

        console.log('🔌 Socket ulanmoqda, driverId:', driverId)
        const socket = connectSocket()
        
        // Socket ulanganidan keyin xonaga qo'shilish
        const joinRoom = () => {
            joinDriverRoom(driverId)
            console.log('✅ Socket ulandi va xonaga qo\'shildi')
        }

        if (socket.connected) {
            joinRoom()
        } else {
            socket.on('connect', joinRoom)
        }

        // Yangi reys xabarini tinglash
        const handleNewTrip = (data) => {
            console.log('🔔 Yangi reys keldi:', data)
            showToast.success('🚛 Yangi reys!', data.message || 'Sizga yangi reys tayinlandi')
            setNewTripNotification(data.trip)
            
            // Ma'lumotlarni yangilash
            fetchData()
            
            // 5 sekunddan keyin notification ni yashirish
            setTimeout(() => setNewTripNotification(null), 5000)
        }

        // Reys bekor qilinganda
        const handleTripCancelled = (data) => {
            console.log('🔔 Reys bekor qilindi:', data)
            showToast.error('❌ Reys bekor qilindi!', data.message || 'Sizning reysingiz bekor qilindi')
            
            // Ma'lumotlarni yangilash
            fetchData()
        }

        socket.on('new-trip', handleNewTrip)
        socket.on('trip-cancelled', handleTripCancelled)

        return () => {
            socket.off('connect', joinRoom)
            socket.off('new-trip', handleNewTrip)
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
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => { setImagePreview(reader.result); setExpenseForm({ ...expenseForm, receiptImage: reader.result }) }
            reader.readAsDataURL(file)
        }
    }
    const CURRENCY_RATES = { USD: 1, UZS: 12800, KZT: 450, RUB: 90 }

    const handleAddExpense = async (e) => {
        e.preventDefault()
        
        // Faol reys tekshiruvi
        if (!activeTrip?._id) {
            showToast.error('Faol reys topilmadi!')
            return
        }
        
        // Summa tekshiruvi
        if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
            showToast.error('Summani kiriting!')
            return
        }
        
        try {
            const rate = CURRENCY_RATES[expenseForm.currency] || 1
            const amountNum = Number(expenseForm.amount)
            
            console.log('Xarajat yuborilmoqda:', {
                amount: amountNum,
                currency: expenseForm.currency,
                tripId: activeTrip._id,
                exchangeRate: rate
            })
            
            await api.post('/driver/me/expenses', {
                ...expenseForm,
                amount: amountNum,
                fuelLiters: expenseForm.fuelLiters ? Number(expenseForm.fuelLiters) : undefined,
                fuelPricePerLiter: expenseForm.fuelLiters ? amountNum / Number(expenseForm.fuelLiters) : undefined,
                tripId: activeTrip._id,
                exchangeRate: rate
            })
            showToast.success('Xarajat qoshildi!')
            setShowExpenseModal(false)
            setExpenseForm({ expenseType: 'fuel', amount: '', description: '', fuelLiters: '', receiptImage: '', country: 'UZB', currency: 'UZS' })
            setImagePreview(null)
            fetchData()
        } catch (error) { 
            console.error('Xarajat xatosi:', error)
            showToast.error(error.response?.data?.message || 'Xatolik yuz berdi') 
        }
    }

    const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
    const formatDate = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'
    const completedTrips = trips.filter(t => t.status === 'completed').length
    const totalBonus = trips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0)
    const totalPenalty = trips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0)

    const expenseTypes = [
        { key: 'fuel', label: 'Yoqilgi', emoji: '⛽' },
        { key: 'toll', label: 'Yol', emoji: '🛣️' },
        { key: 'repair', label: 'Tamir', emoji: '🔧' },
        { key: 'parking', label: 'Parking', emoji: '🅿️' },
        { key: 'food', label: 'Ovqat', emoji: '🍽️' },
        { key: 'other', label: 'Boshqa', emoji: '📦' }
    ]

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl animate-spin" style={{ animationDuration: '3s' }}></div>
                    <div className="absolute inset-1 bg-[#0a0a1a] rounded-xl flex items-center justify-center">
                        <Truck className="w-8 h-8 text-violet-400" />
                    </div>
                </div>
                <p className="text-violet-300">Yuklanmoqda...</p>
            </div>
        </div>
    )

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
                                        {newTripNotification.startAddress} → {newTripNotification.endAddress}
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
                            {activeTrip ? (
                                <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-6">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>

                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                                    <Route size={24} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-lg">Faol reys</h3>
                                                    <p className="text-violet-200 text-sm">Yoldasiz</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                                <span className="text-emerald-300 text-sm font-semibold">LIVE</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/10">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center py-1">
                                                    <div className="w-4 h-4 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50"></div>
                                                    <div className="w-0.5 h-12 bg-gradient-to-b from-emerald-400 to-amber-400 my-1"></div>
                                                    <div className="w-4 h-4 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"></div>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <p className="text-violet-200 text-xs font-medium mb-1">BOSHLANISH</p>
                                                        <p className="text-white font-semibold">{activeTrip.startAddress || 'Belgilanmagan'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-violet-200 text-xs font-medium mb-1">TUGASH</p>
                                                        <p className="text-white font-semibold">{activeTrip.endAddress || 'Belgilanmagan'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {activeTrip.tripBudget > 0 && (
                                            <div className="grid grid-cols-3 gap-2 mb-5">
                                                <div className="bg-white/10 rounded-xl p-2 sm:p-3 text-center border border-white/10 overflow-hidden">
                                                    <p className="text-violet-200 text-[10px] sm:text-xs mb-1">Berilgan</p>
                                                    <p className="text-white font-bold text-xs sm:text-sm truncate">{formatMoney(activeTrip.tripBudget)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-2 sm:p-3 text-center border border-white/10 overflow-hidden">
                                                    <p className="text-violet-200 text-[10px] sm:text-xs mb-1">Sarflangan</p>
                                                    <p className="text-amber-300 font-bold text-xs sm:text-sm truncate">{formatMoney(activeTrip.totalExpenses || 0)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-2 sm:p-3 text-center border border-white/10 overflow-hidden">
                                                    <p className="text-violet-200 text-[10px] sm:text-xs mb-1">Qoldiq</p>
                                                    <p className={`font-bold text-xs sm:text-sm truncate ${(activeTrip.remainingBudget || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {formatMoney(activeTrip.remainingBudget || activeTrip.tripBudget)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleCompleteTrip} 
                                                disabled={actionLoading}
                                                className="flex-1 bg-white text-violet-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading ? <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div> : <CheckCircle size={22} />} 
                                                {actionLoading ? 'Kutilmoqda...' : 'Tugatish'}
                                            </button>
                                            <button onClick={() => setShowExpenseModal(true)} className="flex-1 bg-white/20 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 border border-white/20">
                                                <Plus size={22} /> Xarajat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : pendingTrips.length > 0 ? (
                                <div className="space-y-4">
                                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                        <Clock className="text-amber-400" size={22} /> Kutilayotgan reyslar
                                    </h2>
                                    {pendingTrips.map((trip) => (
                                        <div key={trip._id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">Kutilmoqda</span>
                                                    <p className="text-white font-semibold mt-2">{trip.startAddress} → {trip.endAddress}</p>
                                                    <p className="text-violet-300 text-sm">{trip.vehicle?.plateNumber}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleStartPendingTrip(trip._id)} 
                                                    disabled={actionLoading}
                                                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Play size={18} />} 
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
                                    <h3 className="text-white font-bold text-lg sm:text-xl mb-1 sm:mb-2">Reys yoq</h3>
                                    <p className="text-violet-300 text-sm sm:text-base">Hozirda sizga biriktirilgan reys yoq</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 group overflow-hidden">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <p className="text-3xl sm:text-4xl font-bold text-white mb-0.5 sm:mb-1">{completedTrips}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Tugatilgan reyslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 group overflow-hidden">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-2 sm:mb-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                        <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-emerald-400 mb-0.5 sm:mb-1 truncate">+{formatMoney(totalBonus)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Jami bonuslar</p>
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
                            {activeTrip && routeInfo && (
                                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl p-4 border border-blue-500/20 mb-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Route size={20} className="text-blue-400" />
                                        <span className="text-white font-semibold">Faol marshrut</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">{routeInfo.distance}</p>
                                            <p className="text-blue-300 text-xs">km qoldi</p>
                                        </div>
                                        <div className="bg-white/10 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">{routeInfo.duration < 60 ? routeInfo.duration + ' daq' : Math.round(routeInfo.duration/60) + ' soat'}</p>
                                            <p className="text-amber-300 text-xs">taxminiy vaqt</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10" style={{ height: '400px' }}>
                                {currentLocation ? (
                                    <>
                                    <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={isNavigating ? 16 : (activeTrip && routeCoords.length > 0 ? 10 : 16)} style={{ height: '100%', width: '100%' }}>
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
                                                        <p className="text-xs">{activeTrip?.startAddress}</p>
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
                                                        <p className="text-xs">{activeTrip?.endAddress}</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}
                                    </MapContainer>
                                    
                                    {/* Meni top tugmasi */}
                                    <button
                                        onClick={() => setIsNavigating(!isNavigating)}
                                        className={`absolute bottom-4 right-4 z-[1000] p-4 rounded-full shadow-lg transition-all ${
                                            isNavigating 
                                                ? 'bg-blue-600 text-white shadow-blue-500/50' 
                                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <Navigation size={24} className={isNavigating ? 'animate-pulse' : ''} />
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
                                <p className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-1 truncate">{formatMoney((user?.baseSalary || 0) + totalBonus - totalPenalty)}</p>
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
                                    <p className="text-lg sm:text-2xl font-bold text-white">{completedTrips}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Reyslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 overflow-hidden">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-emerald-400 truncate">+{formatMoney(totalBonus)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Bonuslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 overflow-hidden">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                        <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                                    </div>
                                    <p className="text-lg sm:text-2xl font-bold text-red-400 truncate">-{formatMoney(totalPenalty)}</p>
                                    <p className="text-violet-300 text-xs sm:text-sm">Jarimalar</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center z-50">
                    <div className="bg-[#12122a] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                        <div className="relative p-6 border-b border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20"></div>
                            <div className="relative flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Xarajat qoshish</h2>
                                        <p className="text-violet-300 text-sm">Reys xarajatlarini kiriting</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-violet-300">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddExpense} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-violet-200 mb-3">Xarajat turi</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {expenseTypes.map(({ key, label, emoji }) => (
                                        <button key={key} type="button" onClick={() => setExpenseForm({ ...expenseForm, expenseType: key })}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${expenseForm.expenseType === key ? 'border-violet-500 bg-violet-500/20' : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}>
                                            <span className="text-2xl mb-1 block">{emoji}</span>
                                            <p className="text-xs font-medium text-white">{label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Davlat tanlash */}
                            <div>
                                <label className="block text-sm font-semibold text-violet-200 mb-3">Davlat</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { code: 'UZB', flag: '🇺🇿', name: "O'zbekiston", curr: 'UZS' },
                                        { code: 'QZ', flag: '🇰🇿', name: "Qozog'iston", curr: 'KZT' },
                                        { code: 'RU', flag: '🇷🇺', name: 'Rossiya', curr: 'RUB' }
                                    ].map(({ code, flag, name, curr }) => (
                                        <button key={code} type="button"
                                            onClick={() => setExpenseForm({ ...expenseForm, country: code, currency: curr })}
                                            className={`p-3 rounded-xl border-2 transition-all text-center ${expenseForm.country === code
                                                ? 'border-violet-500 bg-violet-500/20'
                                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }`}>
                                            <span className="text-2xl">{flag}</span>
                                            <p className="text-xs font-medium text-white mt-1">{name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summa va valyuta */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-violet-200 mb-2">Summa *</label>
                                    <input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-semibold placeholder-violet-400/50 focus:border-violet-500 focus:outline-none"
                                        placeholder="0" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-violet-200 mb-2">Valyuta</label>
                                    <select value={expenseForm.currency}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                                        className="w-full px-3 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none">
                                        <option value="UZS" className="bg-slate-900">UZS</option>
                                        <option value="KZT" className="bg-slate-900">KZT</option>
                                        <option value="RUB" className="bg-slate-900">RUB</option>
                                        <option value="USD" className="bg-slate-900">USD</option>
                                    </select>
                                </div>
                            </div>

                            {expenseForm.expenseType === 'fuel' && (
                                <div>
                                    <label className="block text-sm font-semibold text-violet-200 mb-2">Litr</label>
                                    <input type="number" value={expenseForm.fuelLiters} onChange={(e) => setExpenseForm({ ...expenseForm, fuelLiters: e.target.value })}
                                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400/50 focus:border-violet-500 focus:outline-none"
                                        placeholder="Necha litr?" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-violet-200 mb-2">Izoh</label>
                                <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-violet-400/50 focus:border-violet-500 focus:outline-none"
                                    placeholder="Qoshimcha malumot..." />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-violet-200 mb-2">Chek rasmi</label>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="receipt-image" />
                                <label htmlFor="receipt-image" className="flex items-center justify-center gap-3 w-full px-4 py-5 bg-white/5 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/10 transition-all">
                                    <Camera size={24} className="text-violet-400" />
                                    <span className="text-violet-300 font-medium">Rasm yuklash</span>
                                </label>
                                {imagePreview && (
                                    <div className="mt-3 relative">
                                        <img src={imagePreview} alt="Chek" className="w-full h-40 object-cover rounded-xl" />
                                        <button type="button" onClick={() => { setImagePreview(null); setExpenseForm({ ...expenseForm, receiptImage: '' }) }}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30">
                                <Plus size={20} /> Qoshish
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
