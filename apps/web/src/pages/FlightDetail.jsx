import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Plus,
  X,
  Route,
  Fuel,
  Gauge,
  MapPin,
  Wallet,
  CheckCircle,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Navigation,
  ChevronRight,
  Map,
  Globe,
  Flag,
  ArrowRight
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import {
  useAlert,
  FlightDetailSkeleton,
  NetworkError,
  NotFoundError
} from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'
import LocationPicker from '../components/LocationPicker'
import { useSocket } from '../contexts/SocketContext'

// Davlatlar
const COUNTRIES = {
  UZB: { name: "O'zbekiston", flag: '🇺🇿' },
  KZ: { name: 'Qozog\'iston', flag: '🇰🇿' },
  RU: { name: 'Rossiya', flag: '🇷🇺' }
}

// Valyutalar
const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar' },
  UZS: { symbol: 'so\'m', name: 'So\'m' },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

// Asosiy xarajat kategoriyalari
const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Yoqilg\'i', icon: '⛽', color: 'from-amber-500 to-orange-500' },
  { value: 'food', label: 'Ovqat', icon: '🍽️', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: 'Ta\'mir', icon: '🔧', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: 'Yo\'l to\'lovi', icon: '🛣️', color: 'from-blue-500 to-indigo-500' },
  { value: 'fine', label: 'Jarima', icon: '📋', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', icon: '📦', color: 'from-gray-500 to-slate-500' }
]

// Yoqilg'i turlari
const FUEL_TYPES = [
  { value: 'fuel_benzin', label: 'Benzin', icon: '⛽', unit: 'litr' },
  { value: 'fuel_diesel', label: 'Dizel (Salarka)', icon: '🛢️', unit: 'litr' },
  { value: 'fuel_gas', label: 'Gaz', icon: '🔵', unit: 'kub' },
  { value: 'fuel_metan', label: 'Metan', icon: '🟢', unit: 'kub' },
  { value: 'fuel_propan', label: 'Propan', icon: '🟡', unit: 'litr' }
]

// Display uchun barcha turlar
const EXPENSE_TYPES = [
  ...FUEL_TYPES.map(f => ({ ...f, color: 'from-amber-500 to-orange-500' })),
  { value: 'food', label: 'Ovqat', icon: '🍽️', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: 'Ta\'mir', icon: '🔧', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: 'Yo\'l to\'lovi', icon: '🛣️', color: 'from-blue-500 to-indigo-500' },
  { value: 'fine', label: 'Jarima', icon: '📋', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', icon: '📦', color: 'from-gray-500 to-slate-500' }
]

export default function FlightDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDemo } = useAuthStore()
  const alert = useAlert()
  const isDemoMode = isDemo()
  const { socket } = useSocket()

  const [flight, setFlight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [showLegModal, setShowLegModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showBorderModal, setShowBorderModal] = useState(false)
  const [showPlatonModal, setShowPlatonModal] = useState(false)

  // Forms
  const [legForm, setLegForm] = useState({ 
    fromCity: '', toCity: '', payment: '', givenBudget: '', distance: '',
    fromCoords: null, toCoords: null
  })
  const [expenseForm, setExpenseForm] = useState({ 
    category: 'fuel', 
    type: 'fuel_benzin', 
    amount: '', 
    description: '', 
    quantity: '',
    pricePerUnit: '',
    odometer: '',
    stationName: '',
    location: null
  })
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', endFuel: '' })
  const [borderForm, setBorderForm] = useState({
    fromCountry: 'UZB', toCountry: 'KZ', borderName: '',
    customsFee: '', transitFee: '', insuranceFee: '', otherFees: '', currency: 'USD', note: ''
  })
  const [platonForm, setPlatonForm] = useState({ amount: '', currency: 'RUB', distanceKm: '', note: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchFlight = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/flights/${id}`)
      setFlight(res.data.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError({ type: 'notfound', message: 'Reys topilmadi' })
      } else {
        setError({
          type: err.isNetworkError ? 'network' : 'generic',
          message: err.userMessage || 'Ma\'lumotlarni yuklashda xatolik'
        })
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  // Dastlabki yuklash
  useEffect(() => { fetchFlight() }, [fetchFlight])
  
  // Socket orqali realtime yangilanishlar
  useEffect(() => {
    if (!socket) return
    
    const handleFlightUpdate = (data) => {
      // Agar bu reys yangilangan bo'lsa
      if (data.flight?._id === id) {
        setFlight(data.flight)
        if (data.message) {
          showToast.success(data.message)
        }
      }
    }
    
    socket.on('flight-updated', handleFlightUpdate)
    socket.on('flight-completed', handleFlightUpdate)
    
    return () => {
      socket.off('flight-updated', handleFlightUpdate)
      socket.off('flight-completed', handleFlightUpdate)
    }
  }, [socket, id])

  if (loading) {
    return <FlightDetailSkeleton />
  }

  if (error) {
    if (error.type === 'notfound') {
      return <NotFoundError title="Reys topilmadi" message="Bu reys mavjud emas yoki o'chirilgan" onBack={() => navigate('/dashboard/drivers')} />
    }
    if (error.type === 'network') {
      return <NetworkError onRetry={fetchFlight} message={error.message} />
    }
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={fetchFlight} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Qayta urinish</button>
        </div>
      </div>
    )
  }

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

  // Masofa hisoblash (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c)
  }

  // Koordinatalar o'zgarganda masofani hisoblash
  const updateDistanceFromCoords = (fromCoords, toCoords) => {
    if (fromCoords && toCoords) {
      const dist = calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng)
      setLegForm(prev => ({ ...prev, distance: dist }))
    }
  }

  // Manzil tanlanganda (autocomplete)
  const handleFromSelect = (suggestion) => {
    const newFromCoords = { lat: suggestion.lat, lng: suggestion.lng }
    setLegForm(prev => {
      // Agar toCoords mavjud bo'lsa, masofani hisoblash
      const dist = prev.toCoords 
        ? calculateDistance(newFromCoords.lat, newFromCoords.lng, prev.toCoords.lat, prev.toCoords.lng)
        : prev.distance
      return { 
        ...prev, 
        fromCity: suggestion.name,
        fromCoords: newFromCoords,
        distance: dist
      }
    })
  }

  const handleToSelect = (suggestion) => {
    const newToCoords = { lat: suggestion.lat, lng: suggestion.lng }
    setLegForm(prev => {
      // Oldingi bosqichdan fromCoords olish
      const lastLeg = flight?.legs?.[flight.legs.length - 1]
      const fromCoords = prev.fromCoords || lastLeg?.toCoords
      
      // Agar fromCoords mavjud bo'lsa, masofani hisoblash
      const dist = fromCoords 
        ? calculateDistance(fromCoords.lat, fromCoords.lng, newToCoords.lat, newToCoords.lng)
        : prev.distance
      return { 
        ...prev, 
        toCity: suggestion.name,
        toCoords: newToCoords,
        distance: dist
      }
    })
  }

  // Xaritadan tanlanganda (faqat tugash nuqtasi)
  const handleLocationSelect = (data) => {
    // Oldingi bosqichdan boshlanish nuqtasini olish
    const lastLeg = flight?.legs?.[flight.legs.length - 1]
    const fromCity = lastLeg?.toCity || legForm.fromCity || data.startAddress
    const fromCoords = lastLeg?.toCoords || legForm.fromCoords || data.startPoint
    
    setLegForm(prev => ({
      ...prev,
      fromCity: fromCity,
      toCity: data.endAddress,
      fromCoords: fromCoords,
      toCoords: data.endPoint,
      distance: data.distance || ''
    }))
    setShowLocationPicker(false)
    setShowLegModal(true) // Modal qaytsin
  }

  // Xaritadan tanlash tugmasini bosganda
  const openLocationPicker = () => {
    setShowLegModal(false) // Modal yopilsin
    setShowLocationPicker(true) // Xarita ochilsin
  }

  // Yangi bosqich qo'shish
  const handleAddLeg = (e) => {
    e.preventDefault()
    
    // Validatsiyalar
    if (!legForm.toCity?.trim()) {
      showToast.error('Qayerga shahrini kiriting!')
      return
    }

    const fromCity = legForm.fromCity || (flight.legs?.length > 0 ? flight.legs[flight.legs.length - 1].toCity : '')
    
    if (fromCity.toLowerCase() === legForm.toCity.trim().toLowerCase()) {
      showToast.error('Boshlanish va tugash nuqtalari bir xil bo\'lmasligi kerak!')
      return
    }

    const legData = {
      fromCity: fromCity,
      toCity: legForm.toCity.trim(),
      fromCoords: legForm.fromCoords,
      toCoords: legForm.toCoords,
      payment: Number(legForm.payment) || 0,
      givenBudget: Number(legForm.givenBudget) || 0,
      distance: Number(legForm.distance) || 0
    }

    // Darhol yopish
    setShowLegModal(false)
    setLegForm({ fromCity: '', toCity: '', payment: '', givenBudget: '', distance: '', fromCoords: null, toCoords: null })
    showToast.success(`${fromCity} → ${legForm.toCity} qo'shildi`)

    // Fonda API
    api.post(`/flights/${id}/legs`, legData)
      .then(() => fetchFlight())
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchFlight()
      })
  }

  // Xarajat qo'shish
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (submitting) return
    
    // Validatsiyalar
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert.warning('Maydon to\'ldirilmagan', 'Xarajat summasini kiriting!')
      return
    }

    const isFuel = expenseForm.category === 'fuel'
    const fuelType = FUEL_TYPES.find(f => f.value === expenseForm.type)
    const expenseLabel = isFuel ? fuelType?.label : EXPENSE_CATEGORIES.find(c => c.value === expenseForm.category)?.label

    // Darhol modal yopilsin
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(expenseForm.amount)
    const payload = {
      type: isFuel ? expenseForm.type : expenseForm.category,
      amount: Number(expenseForm.amount),
      description: expenseForm.description
    }

    // Yoqilg'i uchun qo'shimcha ma'lumotlar
    if (isFuel) {
      payload.quantity = expenseForm.quantity ? Number(expenseForm.quantity) : null
      payload.quantityUnit = expenseForm.quantity ? fuelType?.unit || 'litr' : null
      payload.pricePerUnit = expenseForm.pricePerUnit ? Number(expenseForm.pricePerUnit) : null
      payload.odometer = expenseForm.odometer ? Number(expenseForm.odometer) : null
      payload.stationName = expenseForm.stationName || null
      payload.location = expenseForm.location || null
    }

    setShowExpenseModal(false)
    setExpenseForm({ 
      category: 'fuel', type: 'fuel_benzin', amount: '', description: '', 
      quantity: '', pricePerUnit: '', odometer: '', stationName: '', location: null 
    })
    showToast.success(`${expenseLabel}: ${formattedAmount} so'm qo'shildi`)
    
    // Fonda API so'rovi
    api.post(`/flights/${id}/expenses`, payload)
      .then(() => fetchFlight())
      .catch((error) => {
        showToast.error(error.response?.data?.message || 'Xatolik yuz berdi')
        fetchFlight()
      })
  }

  // Xarajat o'chirish
  const handleDeleteExpense = async (expenseId) => {
    const confirmed = await alert.confirm({
      title: "Xarajatni o'chirish",
      message: "Bu xarajatni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.",
      confirmText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      type: "danger"
    })

    if (!confirmed) return

    showToast.success('Xarajat o\'chirildi')

    // Fonda API
    api.delete(`/flights/${id}/expenses/${expenseId}`)
      .then(() => fetchFlight())
      .catch(() => {
        showToast.error('Xarajatni o\'chirishda xatolik')
        fetchFlight()
      })
  }

  // ============ XALQARO REYS FUNKSIYALARI ============
  
  // Chegara xarajati qo'shish
  const handleAddBorderCrossing = (e) => {
    e.preventDefault()
    
    const borderData = {
      ...borderForm,
      customsFee: Number(borderForm.customsFee) || 0,
      transitFee: Number(borderForm.transitFee) || 0,
      insuranceFee: Number(borderForm.insuranceFee) || 0,
      otherFees: Number(borderForm.otherFees) || 0
    }

    // Darhol yopish
    setShowBorderModal(false)
    setBorderForm({ fromCountry: 'UZB', toCountry: 'KZ', borderName: '', customsFee: '', transitFee: '', insuranceFee: '', otherFees: '', currency: 'USD', note: '' })
    showToast.success('Chegara xarajati qo\'shildi!')

    // Fonda API
    api.post(`/flights/${id}/border-crossing`, borderData)
      .then(() => fetchFlight())
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchFlight()
      })
  }

  // Chegara xarajatini o'chirish
  const handleDeleteBorderCrossing = async (crossingId) => {
    const confirmed = await alert.confirm({
      title: "Chegara xarajatini o'chirish",
      message: "Bu xarajatni o'chirishni xohlaysizmi?",
      confirmText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      type: "danger"
    })
    if (!confirmed) return

    showToast.success('Chegara xarajati o\'chirildi')

    // Fonda API
    api.delete(`/flights/${id}/border-crossing/${crossingId}`)
      .then(() => fetchFlight())
      .catch(() => {
        showToast.error('Xatolik')
        fetchFlight()
      })
  }

  // Platon saqlash
  const handleSavePlaton = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await api.put(`/flights/${id}/platon`, {
        ...platonForm,
        amount: Number(platonForm.amount) || 0,
        distanceKm: Number(platonForm.distanceKm) || 0
      })
      alert.success('Platon saqlandi! 🚛')
      setShowPlatonModal(false)
      setPlatonForm({ amount: '', currency: 'RUB', distanceKm: '', note: '' })
      fetchFlight()
    } catch (error) {
      alert.error('Xatolik', error.response?.data?.message || 'Serverda xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  // Reysni yopish
  const handleComplete = async (e) => {
    e.preventDefault()
    
    // Tasdiqlash
    const confirmed = await alert.confirm({
      title: "Reysni yopish",
      message: `${flight.name} reysini yopishni xohlaysizmi? Yopilgandan keyin yangi bosqich yoki xarajat qo'shib bo'lmaydi.`,
      confirmText: "Ha, yopish",
      cancelText: "Bekor qilish",
      type: "warning"
    })

    if (!confirmed) return

    const completeData = {
      endOdometer: Number(completeForm.endOdometer) || 0,
      endFuel: Number(completeForm.endFuel) || 0
    }

    // Darhol yopish
    setShowCompleteModal(false)
    showToast.success('Reys yopildi!')

    // Fonda API
    api.put(`/flights/${id}/complete`, completeData)
      .then(() => fetchFlight())
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchFlight()
      })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!flight) return null

  const isActive = flight.status === 'active'
  const lastLeg = flight.legs?.[flight.legs.length - 1]

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative">
          {/* Back button */}
          <button 
            onClick={() => navigate('/dashboard/drivers')}
            className="flex items-center gap-2 text-emerald-300 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={20} />
            <span>Orqaga</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
                isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                {flight.driver?.fullName?.charAt(0) || '?'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{flight.name || 'Yangi reys'}</h1>
                <p className="text-emerald-200">{flight.driver?.fullName} • {flight.vehicle?.plateNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-4 py-2 rounded-xl font-medium ${
                isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {isActive ? '🟢 Faol reys' : '✅ Yopilgan'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Route size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{flight.legs?.length || 0}</p>
                  <p className="text-emerald-200 text-xs">Bosqichlar</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatMoney(flight.totalPayment)}</p>
                  <p className="text-emerald-200 text-xs">Mijozdan</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Wallet size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-300">{formatMoney(flight.totalGivenBudget)}</p>
                  <p className="text-emerald-200 text-xs">Yo'l uchun</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  (flight.finalBalance || 0) >= 0 ? 'bg-gradient-to-br from-cyan-400 to-cyan-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                }`}>
                  <DollarSign size={18} className="text-white" />
                </div>
                <div>
                  <p className={`text-xl font-bold ${(flight.finalBalance || 0) >= 0 ? 'text-cyan-300' : 'text-red-300'}`}>
                    {formatMoney(Math.abs(flight.finalBalance || 0))}
                  </p>
                  <p className="text-emerald-200 text-xs">{(flight.finalBalance || 0) >= 0 ? 'Qoldiq' : 'Kamomad'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
                  <TrendingDown size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-red-300">
                    -{formatMoney(flight.totalExpenses || 0)}
                  </p>
                  <p className="text-emerald-200 text-xs">Sarflangan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 column layout on desktop */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Odometer, Fuel, Legs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Odometer & Fuel Info */}
          <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Gauge className="text-blue-600" size={16} />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Odometr</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Boshlang'ich</p>
              <p className="text-sm font-bold text-gray-900">{formatMoney(flight.startOdometer || 0)} km</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Tugash</p>
              <p className="text-sm font-bold text-gray-900">{flight.endOdometer ? formatMoney(flight.endOdometer) : '-'} km</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-[10px] text-blue-500">Jami yurgan</p>
              <p className="text-sm font-bold text-blue-600">
                {flight.endOdometer && flight.startOdometer 
                  ? formatMoney(flight.endOdometer - flight.startOdometer) 
                  : formatMoney(flight.totalDistance || 0)} km
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Fuel className="text-amber-600" size={16} />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Yoqilg'i</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Boshlang'ich</p>
              <p className="text-sm font-bold text-gray-900">{flight.startFuel || 0} L</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[10px] text-gray-400">Qoldiq</p>
              <p className="text-sm font-bold text-gray-900">{flight.endFuel || '-'} L</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-[10px] text-amber-500">Jami sarflangan</p>
              <p className="text-sm font-bold text-amber-600">
                {(() => {
                  // Xarajatlardan yoqilg'i miqdorini hisoblash
                  const totalFuel = flight.expenses?.reduce((sum, exp) => {
                    if (exp.type?.startsWith('fuel_') && exp.quantity) {
                      return sum + Number(exp.quantity)
                    }
                    return sum
                  }, 0) || 0
                  return totalFuel > 0 ? `${totalFuel} L` : '-'
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legs Section */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Route className="text-emerald-600" size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Bosqichlar</h3>
              <p className="text-xs text-gray-500">{flight.legs?.length || 0} ta bosqich</p>
            </div>
          </div>
          {isActive && (
            <button
              onClick={() => {
                setLegForm({ 
                  fromCity: lastLeg?.toCity || '', 
                  toCity: '', 
                  payment: '', 
                  distance: '' 
                })
                setShowLegModal(true)
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition flex items-center gap-1"
            >
              <Plus size={14} /> Bosqich qo'shish
            </button>
          )}
        </div>

        {/* Legs Timeline - scrollable */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {flight.legs?.map((leg, idx) => (
            <div key={leg._id || idx} className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                  leg.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-medium text-gray-900 truncate">{leg.fromCity}</span>
                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{leg.toCity}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    <span>{leg.distance || 0} km</span>
                    {leg.status === 'completed' && <span className="text-emerald-600">✓ Tugatilgan</span>}
                    {leg.status === 'in_progress' && <span className="text-blue-600">🚛 Yo'lda</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-emerald-600 text-sm">{formatMoney(leg.payment)}</p>
                  <p className="text-[10px] text-gray-400">mijozdan</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!flight.legs || flight.legs.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            <Route size={40} className="mx-auto mb-2 opacity-50" />
            <p>Hali bosqichlar yo'q</p>
          </div>
        )}
      </div>
        </div>

        {/* Right Column - Expenses */}
        <div className="lg:sticky lg:top-4 lg:self-start">
      {/* Expenses Section */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Xarajatlar</h3>
              <p className="text-xs text-gray-500">Jami: {formatMoney(flight.totalExpenses)} so'm</p>
            </div>
          </div>
          {isActive && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg text-xs font-medium hover:shadow-lg transition flex items-center gap-1"
            >
              <Plus size={14} /> Xarajat qo'shish
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {flight.expenses?.map((exp) => {
            const expType = EXPENSE_TYPES.find(t => t.value === exp.type)
            const isFuel = exp.type && exp.type.startsWith('fuel_')
            return (
              <div key={exp._id} className="bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${expType?.color || 'from-gray-500 to-slate-500'} flex items-center justify-center text-lg flex-shrink-0`}>
                    {expType?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{expType?.label || exp.type}</p>
                    {/* Yoqilg'i uchun qo'shimcha info */}
                    {isFuel && exp.quantity && (
                      <p className="text-[10px] text-gray-400">
                        {exp.quantity} {exp.quantityUnit || 'L'} 
                        {exp.odometer && ` • ${formatMoney(exp.odometer)} km`}
                        {exp.stationName && ` • ${exp.stationName}`}
                      </p>
                    )}
                    {!isFuel && exp.description && (
                      <p className="text-[10px] text-gray-400 truncate">{exp.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-red-600 text-sm">-{formatMoney(exp.amount)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {(!flight.expenses || flight.expenses.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            <Wallet size={40} className="mx-auto mb-2 opacity-50" />
            <p>Hali xarajatlar yo'q</p>
          </div>
        )}
      </div>
        </div>
      </div>

      {/* ============ XALQARO REYS BO'LIMLARI ============ */}
      {flight.flightType === 'international' && (
        <>
          {/* Chegara xarajatlari */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Flag className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Chegara xarajatlari</h3>
                  <p className="text-sm text-gray-500">Bojxona, tranzit, sug'urta</p>
                </div>
              </div>
              {isActive && (
                <button
                  onClick={() => {
                    // Reysning countriesInRoute dan davlatlarni olish va birinchi chegarani default qilish
                    const countries = flight.countriesInRoute || ['UZB', 'KZ']
                    setBorderForm({
                      fromCountry: countries[0] || 'UZB',
                      toCountry: countries[1] || 'KZ',
                      borderName: '',
                      customsFee: '',
                      transitFee: '',
                      insuranceFee: '',
                      otherFees: '',
                      currency: 'USD',
                      note: ''
                    })
                    setShowBorderModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus size={18} /> Qo'shish
                </button>
              )}
            </div>

            <div className="space-y-3">
              {flight.borderCrossings?.map((bc) => (
                <div key={bc._id} className="bg-gradient-to-r from-gray-50 to-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{COUNTRIES[bc.fromCountry]?.flag}</span>
                      <ArrowRight size={16} className="text-gray-400" />
                      <span className="text-xl">{COUNTRIES[bc.toCountry]?.flag}</span>
                      {bc.borderName && <span className="text-sm text-gray-500 ml-2">({bc.borderName})</span>}
                    </div>
                    {isActive && (
                      <button 
                        onClick={() => handleDeleteBorderCrossing(bc._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="bg-white p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-400">Bojxona</p>
                      <p className="font-semibold">${bc.customsFee || 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-400">Tranzit</p>
                      <p className="font-semibold">${bc.transitFee || 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-400">Sug'urta</p>
                      <p className="font-semibold">${bc.insuranceFee || 0}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-400">Jami</p>
                      <p className="font-bold text-indigo-600">${(bc.totalInUSD || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400">{formatMoney(bc.totalInUZS || Math.round((bc.totalInUSD || 0) * 12800))} so'm</p>
                    </div>
                  </div>
                  {bc.note && <p className="text-xs text-gray-400 mt-2">{bc.note}</p>}
                </div>
              ))}
              
              {(!flight.borderCrossings || flight.borderCrossings.length === 0) && (
                <div className="text-center py-6 text-gray-400">
                  <Flag size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Chegara xarajatlari kiritilmagan</p>
                </div>
              )}

              {flight.borderCrossingsTotalUSD > 0 && (
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-xl text-white">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Jami chegara xarajatlari:</span>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${flight.borderCrossingsTotalUSD.toFixed(2)}</p>
                      <p className="text-indigo-200 text-sm">
                        {formatMoney(flight.borderCrossingsTotalUZS || Math.round(flight.borderCrossingsTotalUSD * 12800))} so'm
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Platon (Rossiya) */}
          {flight.countriesInRoute?.includes('RU') && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-xl">
                    🚛
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Platon</h3>
                    <p className="text-sm text-gray-500">Rossiya yo'l to'lovi (12+ tonna)</p>
                  </div>
                </div>
                {isActive && (
                  <button
                    onClick={() => {
                      setPlatonForm({
                        amount: flight.platon?.amount || '',
                        currency: flight.platon?.currency || 'RUB',
                        distanceKm: flight.platon?.distanceKm || '',
                        note: flight.platon?.note || ''
                      })
                      setShowPlatonModal(true)
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition"
                  >
                    {flight.platon?.amount ? 'Tahrirlash' : 'Qo\'shish'}
                  </button>
                )}
              </div>

              {flight.platon?.amount > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-gray-500 mb-1">Summa</p>
                    <p className="text-xl font-bold text-rose-600">
                      {flight.platon.amount} {CURRENCIES[flight.platon.currency]?.symbol || '₽'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-gray-500 mb-1">USD da</p>
                    <p className="text-xl font-bold text-rose-600">${(flight.platon.amountInUSD || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-red-50 p-4 rounded-xl text-center">
                    <p className="text-xs text-gray-500 mb-1">Masofa (RU)</p>
                    <p className="text-xl font-bold text-rose-600">{flight.platon.distanceKm || 0} km</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>Platon kiritilmagan</p>
                </div>
              )}
            </div>
          )}

          {/* Davlatlar bo'yicha xulosa */}
          {flight.countryExpenses && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Globe className="text-cyan-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Davlatlar bo'yicha xulosa</h3>
                  <p className="text-sm text-gray-500">Har bir davlatdagi xarajatlar</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {['uzb', 'kz', 'ru'].map(code => {
                  const country = COUNTRIES[code.toUpperCase()]
                  const data = flight.countryExpenses[code] || {}
                  
                  return (
                    <div key={code} className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{country?.flag}</span>
                        <span className="font-bold text-gray-900">{country?.name}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Masofa:</span>
                          <span className="font-medium">{data.distanceKm || 0} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Yoqilg'i:</span>
                          <span className="font-medium">{data.fuelLiters || 0} L (${(data.fuelCostUSD || 0).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Yo'l xarajati:</span>
                          <span className="font-medium">${(data.roadExpensesUSD || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-700">Jami:</span>
                          <span className="font-bold text-cyan-600">${(data.totalUSD || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      {isActive && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowCompleteModal(true)}
            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:shadow-xl transition flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Reysni yopish
          </button>
        </div>
      )}

      {/* Completed Summary - olib tashlandi, header da bor */}

      {/* Add Leg Modal */}
      {showLegModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowLegModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Route className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Yangi bosqich</h2>
                      <p className="text-emerald-300 text-sm">{legForm.fromCity || lastLeg?.toCity || 'Boshlanish'} dan</p>
                    </div>
                  </div>
                  <button onClick={() => setShowLegModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddLeg} className="p-6 space-y-4">
                {/* Xaritadan tanlash */}
                <button
                  type="button"
                  onClick={openLocationPicker}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition"
                >
                  <Map size={18} /> Xaritadan tanlash
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-slate-900 text-slate-500 text-sm">yoki qo'lda kiriting</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Qayerdan</label>
                  <AddressAutocomplete
                    value={legForm.fromCity}
                    onChange={(val) => setLegForm({ ...legForm, fromCity: val })}
                    onSelect={handleFromSelect}
                    placeholder={lastLeg?.toCity || 'Toshkent'}
                    focusColor="green"
                    domesticOnly={flight?.flightType === 'domestic'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Qayerga *</label>
                  <AddressAutocomplete
                    value={legForm.toCity}
                    onChange={(val) => setLegForm({ ...legForm, toCity: val })}
                    onSelect={handleToSelect}
                    placeholder="Samarqand"
                    focusColor="green"
                    domesticOnly={flight?.flightType === 'domestic'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Mijozdan to'lov</label>
                    <input
                      type="number"
                      value={legForm.payment}
                      onChange={(e) => setLegForm({ ...legForm, payment: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Yo'l xarajati</label>
                    <input
                      type="number"
                      value={legForm.givenBudget}
                      onChange={(e) => setLegForm({ ...legForm, givenBudget: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                      placeholder="200000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Masofa (km)</label>
                  <input
                    type="number"
                    value={legForm.distance}
                    onChange={(e) => setLegForm({ ...legForm, distance: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    placeholder="150"
                  />
                </div>

                {/* Oldingi qoldiq ko'rsatish */}
                {flight?.legs?.length > 0 && flight.legs[flight.legs.length - 1].balance > 0 && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-300 text-sm">Oldingi qoldiq:</span>
                      <span className="text-emerald-400 font-bold">+{formatMoney(flight.legs[flight.legs.length - 1].balance)} so'm</span>
                    </div>
                    <p className="text-xs text-emerald-300/70 mt-1">Bu summa avtomatik qo'shiladi</p>
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                  Qo'shish
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowExpenseModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Xarajat qo'shish</h2>
                      <p className="text-orange-300 text-sm">{flight.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                {/* Asosiy kategoriyalar */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Xarajat turi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setExpenseForm({ 
                          ...expenseForm, 
                          category: value,
                          type: value === 'fuel' ? 'fuel_benzin' : value,
                          quantity: value === 'fuel' ? expenseForm.quantity : ''
                        })}
                        className={`p-3 rounded-xl border text-center transition ${
                          expenseForm.category === value
                            ? 'border-orange-500 bg-orange-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <p className="text-xs mt-1">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yoqilg'i turi - select */}
                {expenseForm.category === 'fuel' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Yoqilg'i turi</label>
                    <select
                      value={expenseForm.type}
                      onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-green-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      {FUEL_TYPES.map(({ value, label, icon }) => (
                        <option key={value} value={value} className="bg-slate-800 text-white">
                          {icon} {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Yoqilg'i uchun miqdor (ixtiyoriy) */}
                {expenseForm.category === 'fuel' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Miqdori ({FUEL_TYPES.find(f => f.value === expenseForm.type)?.unit || 'litr'}) - ixtiyoriy
                    </label>
                    <input
                      type="number"
                      value={expenseForm.quantity}
                      onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                )}

                {/* Odometr - faqat yoqilg'i uchun */}
                {expenseForm.category === 'fuel' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      <Gauge size={14} className="inline mr-1" /> Odometr (km) - ixtiyoriy
                    </label>
                    <input
                      type="number"
                      value={expenseForm.odometer}
                      onChange={(e) => setExpenseForm({ ...expenseForm, odometer: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder={flight?.startOdometer ? `Boshlang'ich: ${flight.startOdometer} km` : "123456"}
                    />
                    {flight?.startOdometer > 0 && expenseForm.odometer && (
                      <p className="text-xs text-blue-400 mt-1">
                        Yurgan masofa: {Number(expenseForm.odometer) - flight.startOdometer} km
                      </p>
                    )}
                  </div>
                )}

                {/* AZS nomi va joylashuv - faqat yoqilg'i uchun */}
                {expenseForm.category === 'fuel' && (
                  <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        <MapPin size={14} className="inline mr-1" /> Joylashuv
                      </label>
                      
                      {/* GPS tugmasi */}
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  const { latitude, longitude } = position.coords
                                  // Reverse geocoding - koordinatadan manzil olish
                                  try {
                                    const res = await fetch(
                                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                                    )
                                    const data = await res.json()
                                    const address = data.address
                                    const locationName = address?.city || address?.town || address?.village || address?.county || data.display_name?.split(',')[0] || 'Noma\'lum'
                                    
                                    setExpenseForm({
                                      ...expenseForm,
                                      stationName: locationName,
                                      location: { lat: latitude, lng: longitude, name: locationName }
                                    })
                                    showToast.success(`📍 Joylashuv aniqlandi: ${locationName}`)
                                  } catch {
                                    setExpenseForm({
                                      ...expenseForm,
                                      location: { lat: latitude, lng: longitude, name: null }
                                    })
                                    showToast.success('📍 GPS koordinatalar aniqlandi')
                                  }
                                },
                                (error) => {
                                  showToast.error('GPS xatosi: ' + (error.message || 'Joylashuvni aniqlab bo\'lmadi'))
                                },
                                { enableHighAccuracy: true, timeout: 10000 }
                              )
                            } else {
                              showToast.error('GPS qo\'llab-quvvatlanmaydi')
                            }
                          }}
                          className="flex-1 py-2.5 bg-blue-500/20 text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition flex items-center justify-center gap-2 border border-blue-500/30"
                        >
                          <Navigation size={16} />
                          GPS bilan aniqlash
                        </button>
                      </div>
                      
                      {/* Qo'lda yozish - AddressAutocomplete */}
                      <AddressAutocomplete
                        value={expenseForm.stationName}
                        onChange={(val) => setExpenseForm({ ...expenseForm, stationName: val })}
                        onSelect={(selected) => {
                          setExpenseForm({
                            ...expenseForm,
                            stationName: selected.name,
                            location: { lat: selected.lat, lng: selected.lng, name: selected.name }
                          })
                        }}
                        placeholder="AZS yoki shahar nomini yozing..."
                        focusColor="blue"
                        domesticOnly={true}
                      />
                      
                      {/* Aniqlangan joylashuv */}
                      {expenseForm.location && (
                        <div className="mt-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-400 text-xs">
                            <CheckCircle size={14} />
                            <span>
                              {expenseForm.location.name || `${expenseForm.location.lat?.toFixed(4)}, ${expenseForm.location.lng?.toFixed(4)}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExpenseForm({ ...expenseForm, location: null })}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                  </div>
                )}

                {/* Summa */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Summa (so'm) *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none text-lg font-semibold"
                    placeholder="100000"
                    required
                  />
                  {expenseForm.amount && (
                    <p className="text-xs text-orange-400 mt-1">
                      {new Intl.NumberFormat('uz-UZ').format(expenseForm.amount)} so'm
                    </p>
                  )}
                </div>

                {/* Izoh */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Izoh</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                    placeholder="Qo'shimcha ma'lumot..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saqlanmoqda...
                    </>
                  ) : 'Qo\'shish'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Complete Flight Modal */}
      {showCompleteModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowCompleteModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Reysni yopish</h2>
                      <p className="text-blue-300 text-sm">{flight.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCompleteModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleComplete} className="p-6 space-y-4">
                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jami to'lov:</span>
                    <span className="text-emerald-400 font-bold">{formatMoney(flight.totalPayment)} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jami xarajat:</span>
                    <span className="text-red-400 font-bold">{formatMoney(flight.totalExpenses)} so'm</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-semibold">{flight.profit >= 0 ? 'Foyda:' : 'Zarar:'}</span>
                    <span className={`font-bold ${flight.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {flight.profit < 0 ? '-' : ''}{formatMoney(Math.abs(flight.profit))} so'm
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Tugash odometr (km)</label>
                    <input
                      type="number"
                      value={completeForm.endOdometer}
                      onChange={(e) => setCompleteForm({ ...completeForm, endOdometer: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder={String((flight.startOdometer || 0) + (flight.totalDistance || 0))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Qoldiq yoqilg'i (L)</label>
                    <input
                      type="number"
                      value={completeForm.endFuel}
                      onChange={(e) => setCompleteForm({ ...completeForm, endFuel: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      placeholder="50"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                  Reysni yopish
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Location Picker */}
      {showLocationPicker && (
        <LocationPicker
          onSelect={handleLocationSelect}
          onClose={() => {
            setShowLocationPicker(false)
            setShowLegModal(true) // Modal qaytsin
          }}
          initialStart={legForm.fromCoords || (flight?.legs?.length > 0 ? flight.legs[flight.legs.length - 1].toCoords : null)}
          initialStartAddress={legForm.fromCity || (flight?.legs?.length > 0 ? flight.legs[flight.legs.length - 1].toCity : '')}
          endOnly={flight?.legs?.length > 0} // 2+ bosqichda faqat tugash nuqtasi
        />
      )}

      {/* Border Crossing Modal (Xalqaro reyslar uchun) */}
      {showBorderModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowBorderModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Flag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Chegara xarajati</h2>
                      <p className="text-indigo-300 text-sm">
                        {COUNTRIES[borderForm.fromCountry]?.flag} {COUNTRIES[borderForm.fromCountry]?.name} → {COUNTRIES[borderForm.toCountry]?.flag} {COUNTRIES[borderForm.toCountry]?.name}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowBorderModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddBorderCrossing} className="p-6 space-y-4">
                {/* Chegara yo'nalishi - reysda tanlangan davlatlar asosida */}
                {flight.countriesInRoute && flight.countriesInRoute.length > 2 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Qaysi chegara?</label>
                    <div className="flex gap-2">
                      {flight.countriesInRoute.slice(0, -1).map((fromCode, idx) => {
                        const toCode = flight.countriesInRoute[idx + 1]
                        const isSelected = borderForm.fromCountry === fromCode && borderForm.toCountry === toCode
                        return (
                          <button
                            key={`${fromCode}-${toCode}`}
                            type="button"
                            onClick={() => setBorderForm({ ...borderForm, fromCountry: fromCode, toCountry: toCode })}
                            className={`flex-1 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            <span className="text-lg">{COUNTRIES[fromCode]?.flag}</span>
                            <ArrowRight size={14} />
                            <span className="text-lg">{COUNTRIES[toCode]?.flag}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Chegara nomi - AddressAutocomplete bilan */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Chegara punkti</label>
                  <AddressAutocomplete
                    value={borderForm.borderName}
                    onChange={(val) => setBorderForm({ ...borderForm, borderName: val })}
                    onSelect={(selected) => setBorderForm({ ...borderForm, borderName: selected.name })}
                    placeholder="Yallama, Troitsk, Oybek..."
                    focusColor="indigo"
                    domesticOnly={false}
                  />
                </div>

                {/* Valyuta */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Valyuta</label>
                  <select
                    value={borderForm.currency}
                    onChange={(e) => setBorderForm({ ...borderForm, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {Object.entries(CURRENCIES).map(([code, c]) => (
                      <option key={code} value={code} className="bg-slate-900">{c.symbol} - {c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Xarajatlar */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">🛂 Bojxona</label>
                    <input
                      type="number"
                      value={borderForm.customsFee}
                      onChange={(e) => setBorderForm({ ...borderForm, customsFee: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">🚛 Tranzit</label>
                    <input
                      type="number"
                      value={borderForm.transitFee}
                      onChange={(e) => setBorderForm({ ...borderForm, transitFee: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">🛡️ Sug'urta</label>
                    <input
                      type="number"
                      value={borderForm.insuranceFee}
                      onChange={(e) => setBorderForm({ ...borderForm, insuranceFee: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">📦 Boshqa</label>
                    <input
                      type="number"
                      value={borderForm.otherFees}
                      onChange={(e) => setBorderForm({ ...borderForm, otherFees: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Izoh */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Izoh</label>
                  <input
                    type="text"
                    value={borderForm.note}
                    onChange={(e) => setBorderForm({ ...borderForm, note: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="Qo'shimcha ma'lumot"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Qo\'shish'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Platon Modal (Rossiya yo'l to'lovi) */}
      {showPlatonModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowPlatonModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center text-2xl">
                      🚛
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Platon to'lovi</h2>
                      <p className="text-rose-300 text-sm">Rossiya yo'l to'lovi (12+ tonna)</p>
                    </div>
                  </div>
                  <button onClick={() => setShowPlatonModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSavePlaton} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Summa</label>
                    <input
                      type="number"
                      value={platonForm.amount}
                      onChange={(e) => setPlatonForm({ ...platonForm, amount: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                      placeholder="5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Valyuta</label>
                    <select
                      value={platonForm.currency}
                      onChange={(e) => setPlatonForm({ ...platonForm, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-rose-500 focus:outline-none"
                    >
                      <option value="RUB" className="bg-slate-900">₽ Rubl</option>
                      <option value="USD" className="bg-slate-900">$ Dollar</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Rossiyada yurgan masofa (km)</label>
                  <input
                    type="number"
                    value={platonForm.distanceKm}
                    onChange={(e) => setPlatonForm({ ...platonForm, distanceKm: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                    placeholder="2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Izoh</label>
                  <input
                    type="text"
                    value={platonForm.note}
                    onChange={(e) => setPlatonForm({ ...platonForm, note: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                    placeholder="Qo'shimcha ma'lumot"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
