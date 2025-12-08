import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
    LogOut, Truck, Play, CheckCircle, Plus, History, Wallet, Route, MapPin, Map,
    Clock, TrendingUp, TrendingDown, Award, Navigation, X, Camera, Sparkles, Zap, Target,
    Star, CircleDollarSign
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../services/api'
import { showToast } from '../../components/Toast'

const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
    iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40]
})

// Xaritani haydovchi joylashuviga markazlashtirish
function RecenterMap({ location }) {
    const map = useMap()
    useEffect(() => {
        if (location) {
            map.setView([location.lat, location.lng], map.getZoom())
        }
    }, [location, map])
    return null
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

    const fetchData = async () => {
        try {
            const tripsRes = await api.get('/driver/me/trips')
            const allTrips = tripsRes.data.data || []
            setTrips(allTrips)
            setActiveTrip(allTrips.find(t => t.status === 'in_progress') || null)
            setPendingTrips(allTrips.filter(t => t.status === 'pending'))
        } catch (error) { console.error(error) }
        finally { setLoading(false) }
    }

    const [gpsAccuracy, setGpsAccuracy] = useState(null)

    const sendLocation = async (position) => {
        const accuracy = position.coords.accuracy

        // Juda yomon aniqlikni rad etish (1km dan ko'p = kesh yoki xato)
        if (accuracy > 1000) {
            console.warn('⚠️ GPS noaniq, kutilmoqda:', Math.round(accuracy), 'm')
            setGpsStatus('waiting')
            setGpsAccuracy(accuracy)
            // Noaniq joylashuvni ko'rsatmaymiz - faqat status ko'rsatamiz
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
        }

        console.log('📍 GPS:', loc.lat.toFixed(6), loc.lng.toFixed(6), `±${Math.round(accuracy)}m`)

        // Faqat yaxshi aniqlikda serverga yuborish (500m dan kam)
        if (accuracy < 500) {
            try {
                await api.post('/driver/me/location', loc)
                console.log('✅ Serverga yuborildi')
            } catch (error) {
                console.error('❌ Server xatolik:', error)
            }
        } else {
            console.log('⏳ Aniqlik yetarli emas, serverga yuborilmadi:', Math.round(accuracy), 'm')
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

    useEffect(() => {
        fetchData()

        if (!navigator.geolocation) {
            setGpsStatus('error')
            return
        }

        let watchId = null
        let retryInterval = null

        // MUHIM: maximumAge: 0 - keshdan olmaslik, har doim yangi GPS
        // Birinchi: tez network joylashuv (lekin keshsiz)
        navigator.geolocation.getCurrentPosition(
            sendLocation,
            (err) => handleGpsError(err, false),
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        )

        // Aniq GPS kuzatish - KESHSIZ
        setTimeout(() => {
            watchId = navigator.geolocation.watchPosition(
                sendLocation,
                (err) => handleGpsError(err, true),
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 0  // KESHSIZ - har doim yangi GPS
                }
            )
        }, 1000)

        // Fallback: har 15 sekundda yangi GPS so'rash
        retryInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                sendLocation,
                () => { },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0  // KESHSIZ
                }
            )
        }, 15000)

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
            if (retryInterval) clearInterval(retryInterval)
        }
    }, [])

    const handleLogout = () => { logout(); window.location.href = '/login' }
    const handleCompleteTrip = async () => {
        if (!activeTrip) return
        try { await api.put(`/driver/me/trips/${activeTrip._id}/complete`); showToast.success('Reys tugatildi!'); fetchData() }
        catch (error) { showToast.error(error.response?.data?.message || 'Xatolik') }
    }
    const handleStartPendingTrip = async (tripId) => {
        try { await api.put(`/driver/me/trips/${tripId}/start`); showToast.success('Reys boshlandi!'); fetchData() }
        catch (error) { showToast.error(error.response?.data?.message || 'Xatolik') }
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
        try {
            const rate = CURRENCY_RATES[expenseForm.currency] || 1
            await api.post('/driver/me/expenses', {
                ...expenseForm,
                amount: Number(expenseForm.amount),
                fuelLiters: expenseForm.fuelLiters ? Number(expenseForm.fuelLiters) : undefined,
                fuelPricePerLiter: expenseForm.fuelLiters ? Number(expenseForm.amount) / Number(expenseForm.fuelLiters) : undefined,
                tripId: activeTrip?._id,
                exchangeRate: rate
            })
            showToast.success('Xarajat qoshildi!'); setShowExpenseModal(false)
            setExpenseForm({ expenseType: 'fuel', amount: '', description: '', fuelLiters: '', receiptImage: '', country: 'UZB', currency: 'UZS' }); setImagePreview(null); fetchData()
        } catch (error) { showToast.error(error.response?.data?.message || 'Xatolik') }
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

            {/* Header */}
            <header className="relative z-20 px-4 pt-4 pb-2">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <Truck className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0a1a] flex items-center justify-center">
                                        <Zap size={10} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white flex items-center gap-2">Avtojon <Sparkles className="w-4 h-4 text-amber-400" /></h1>
                                    <p className="text-sm text-violet-300">{user?.fullName || 'Haydovchi'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold ${gpsStatus === 'excellent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    gpsStatus === 'good' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        gpsStatus === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                            gpsStatus === 'waiting' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                gpsStatus === 'denied' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    gpsStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${gpsStatus === 'excellent' || gpsStatus === 'good' ? 'bg-emerald-400 animate-pulse' :
                                        gpsStatus === 'active' ? 'bg-blue-400 animate-pulse' :
                                            gpsStatus === 'waiting' ? 'bg-amber-400 animate-pulse' :
                                                'bg-red-400'
                                        }`}></span>
                                    {gpsStatus === 'excellent' ? '📍 GPS' :
                                        gpsStatus === 'good' ? '📍 GPS' :
                                            gpsStatus === 'active' ? 'GPS' :
                                                gpsStatus === 'waiting' ? '⏳' :
                                                    gpsStatus === 'denied' ? '🚫' : 'GPS'}
                                    {gpsAccuracy && gpsStatus !== 'error' && gpsStatus !== 'denied' && (
                                        <span className="ml-1">±{Math.round(gpsAccuracy)}m</span>
                                    )}
                                </div>
                                <button onClick={handleLogout} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20">
                                    <LogOut size={20} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <nav className="relative z-20 px-4 py-3 sticky top-0">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-1.5 flex gap-1">
                        {[
                            { id: 'home', label: 'Asosiy', icon: Target },
                            { id: 'map', label: 'Xarita', icon: Map },
                            { id: 'history', label: 'Tarix', icon: History },
                            { id: 'salary', label: 'Maosh', icon: CircleDollarSign }
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${tab === id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30' : 'text-violet-300 hover:bg-white/5'
                                    }`}>
                                <Icon size={18} /> {label}
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
                                            <div className="grid grid-cols-3 gap-3 mb-5">
                                                <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                                                    <p className="text-violet-200 text-xs mb-1">Berilgan</p>
                                                    <p className="text-white font-bold">{formatMoney(activeTrip.tripBudget)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                                                    <p className="text-violet-200 text-xs mb-1">Sarflangan</p>
                                                    <p className="text-amber-300 font-bold">{formatMoney(activeTrip.totalExpenses || 0)}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                                                    <p className="text-violet-200 text-xs mb-1">Qoldiq</p>
                                                    <p className={`font-bold ${(activeTrip.remainingBudget || 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {formatMoney(activeTrip.remainingBudget || activeTrip.tripBudget)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button onClick={handleCompleteTrip} className="flex-1 bg-white text-violet-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl">
                                                <CheckCircle size={22} /> Tugatish
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
                                                <button onClick={() => handleStartPendingTrip(trip._id)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-violet-500/30">
                                                    <Play size={18} /> Boshlash
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 text-center border border-white/10">
                                    <div className="w-20 h-20 bg-violet-500/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                                        <Truck size={40} className="text-violet-400" />
                                    </div>
                                    <h3 className="text-white font-bold text-xl mb-2">Reys yoq</h3>
                                    <p className="text-violet-300">Hozirda sizga biriktirilgan reys yoq</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 group">
                                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-4xl font-bold text-white mb-1">{completedTrips}</p>
                                    <p className="text-violet-300 text-sm">Tugatilgan reyslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 group">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-400 mb-1">+{formatMoney(totalBonus)}</p>
                                    <p className="text-violet-300 text-sm">Jami bonuslar</p>
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
                                            <p className={`font-bold ${gpsAccuracy < 50 ? 'text-emerald-400' : gpsAccuracy < 200 ? 'text-amber-400' : gpsAccuracy < 1000 ? 'text-orange-400' : 'text-red-400'}`}>
                                                ±{Math.round(gpsAccuracy || 0)} metr
                                                {gpsAccuracy > 1000 && <span className="text-xs ml-1">⚠️</span>}
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

                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10" style={{ height: '350px' }}>
                                {currentLocation ? (
                                    <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <RecenterMap location={currentLocation} />
                                        <Marker position={[currentLocation.lat, currentLocation.lng]} icon={truckIcon}>
                                            <Popup>
                                                <div className="text-center p-2">
                                                    <p className="font-bold">{user?.fullName}</p>
                                                    <p className="text-xs text-gray-500">±{Math.round(gpsAccuracy || 0)}m aniqlik</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-slate-900/50">
                                        <div className="text-center px-6">
                                            <MapPin size={48} className="mx-auto mb-3 text-violet-400 animate-bounce" />
                                            <p className="text-violet-300 mb-2 font-semibold">
                                                {gpsStatus === 'waiting' ? 'GPS aniqlik kutilmoqda...' : 'GPS aniqlanmoqda...'}
                                            </p>
                                            <p className="text-violet-400 text-xs mb-3">
                                                {gpsStatus === 'denied' ? '🚫 Joylashuv ruxsati berilmagan' :
                                                    gpsStatus === 'unavailable' ? '📡 GPS mavjud emas' :
                                                        gpsStatus === 'timeout' ? '⏳ GPS javob bermayapti' :
                                                            gpsStatus === 'waiting' ? `⚠️ Aniqlik: ±${Math.round(gpsAccuracy || 0)}m - GPS yoqilganmi?` :
                                                                gpsStatus === 'error' ? '❌ GPS xatolik' :
                                                                    '⏳ Aniq joylashuv kutilmoqda...'}
                                            </p>
                                            {gpsStatus === 'waiting' && (
                                                <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs">
                                                    📱 Telefoningizda GPS yoqilganligini tekshiring. Ochiq joyga chiqing.
                                                </div>
                                            )}
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
                                        <div className="flex gap-3 mt-3">
                                            {trip.bonusAmount > 0 && <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg text-sm"><TrendingUp size={14} /> +{formatMoney(trip.bonusAmount)}</span>}
                                            {trip.penaltyAmount > 0 && <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-3 py-1 rounded-lg text-sm"><TrendingDown size={14} /> -{formatMoney(trip.penaltyAmount)}</span>}
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

                            <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-center">
                                <p className="text-violet-200 text-sm mb-2">Jami oylik maosh</p>
                                <p className="text-5xl font-bold text-white mb-1">{formatMoney((user?.baseSalary || 0) + totalBonus - totalPenalty)}</p>
                                <p className="text-violet-200">som</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                    <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center mb-3">
                                        <Wallet className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">{formatMoney(user?.baseSalary || 0)}</p>
                                    <p className="text-violet-300 text-sm">Oylik maosh</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
                                        <Star className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-white">{completedTrips}</p>
                                    <p className="text-violet-300 text-sm">Reyslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-400">+{formatMoney(totalBonus)}</p>
                                    <p className="text-violet-300 text-sm">Bonuslar</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center mb-3">
                                        <TrendingDown className="w-5 h-5 text-red-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-red-400">-{formatMoney(totalPenalty)}</p>
                                    <p className="text-violet-300 text-sm">Jarimalar</p>
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
