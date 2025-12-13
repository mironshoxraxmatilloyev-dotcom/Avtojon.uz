import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { 
  ArrowLeft, Plus, X, Route, Truck, Fuel, Gauge, MapPin, Wallet,
  CheckCircle, Trash2, DollarSign, Clock, TrendingUp, Navigation,
  ChevronRight, AlertCircle, Map
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import AddressAutocomplete from '../components/AddressAutocomplete'
import LocationPicker from '../components/LocationPicker'

const EXPENSE_TYPES = [
  { value: 'fuel', label: 'Yoqilg\'i', icon: '⛽', color: 'from-amber-500 to-orange-500' },
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
  const isDemoMode = isDemo()

  const [flight, setFlight] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modals
  const [showLegModal, setShowLegModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Forms
  const [legForm, setLegForm] = useState({ 
    fromCity: '', toCity: '', payment: '', givenBudget: '', distance: '',
    fromCoords: null, toCoords: null
  })
  const [expenseForm, setExpenseForm] = useState({ type: 'fuel', amount: '', description: '' })
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', endFuel: '' })

  const fetchFlight = async () => {
    try {
      const res = await api.get(`/flights/${id}`)
      setFlight(res.data.data)
    } catch (error) {
      showToast.error('Reys topilmadi')
      navigate('/dashboard/drivers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFlight() }, [id])

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
  const handleAddLeg = async (e) => {
    e.preventDefault()
    if (!legForm.toCity) {
      showToast.error('Qayerga shahrini kiriting!')
      return
    }

    try {
      await api.post(`/flights/${id}/legs`, {
        fromCity: legForm.fromCity || (flight.legs?.length > 0 ? flight.legs[flight.legs.length - 1].toCity : ''),
        toCity: legForm.toCity,
        fromCoords: legForm.fromCoords,
        toCoords: legForm.toCoords,
        payment: Number(legForm.payment) || 0,
        givenBudget: Number(legForm.givenBudget) || 0,
        distance: Number(legForm.distance) || 0
      })
      showToast.success('Yangi bosqich qo\'shildi!')
      setShowLegModal(false)
      setLegForm({ fromCity: '', toCity: '', payment: '', givenBudget: '', distance: '', fromCoords: null, toCoords: null })
      fetchFlight()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // Xarajat qo'shish
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!expenseForm.amount) {
      showToast.error('Summani kiriting!')
      return
    }

    try {
      await api.post(`/flights/${id}/expenses`, {
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        description: expenseForm.description
      })
      showToast.success('Xarajat qo\'shildi!')
      setShowExpenseModal(false)
      setExpenseForm({ type: 'fuel', amount: '', description: '' })
      fetchFlight()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // Xarajat o'chirish
  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/flights/${id}/expenses/${expenseId}`)
      showToast.success('Xarajat o\'chirildi')
      fetchFlight()
    } catch (error) {
      showToast.error('Xatolik')
    }
  }

  // Reysni yopish
  const handleComplete = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/flights/${id}/complete`, {
        endOdometer: Number(completeForm.endOdometer) || 0,
        endFuel: Number(completeForm.endFuel) || 0
      })
      showToast.success('Reys yopildi!')
      setShowCompleteModal(false)
      fetchFlight()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
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
    <div className="space-y-6 pb-8">
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  flight.profit >= 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-red-600'
                }`}>
                  <Navigation size={18} className="text-white" />
                </div>
                <div>
                  <p className={`text-xl font-bold ${flight.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {flight.profit < 0 ? '-' : ''}{formatMoney(Math.abs(flight.profit))}
                  </p>
                  <p className="text-emerald-200 text-xs">{flight.profit >= 0 ? 'Sof foyda' : 'Zarar'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Odometer & Fuel Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Gauge className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Odometr</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Boshlang'ich</p>
              <p className="text-xl font-bold text-gray-900">{flight.startOdometer || 0} km</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Tugash</p>
              <p className="text-xl font-bold text-gray-900">{flight.endOdometer || '-'} km</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Fuel className="text-amber-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Yoqilg'i</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Boshlang'ich</p>
              <p className="text-xl font-bold text-gray-900">{flight.startFuel || 0} L</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Qoldiq</p>
              <p className="text-xl font-bold text-gray-900">{flight.endFuel || '-'} L</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legs Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Route className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Bosqichlar</h3>
              <p className="text-sm text-gray-500">{flight.legs?.length || 0} ta bosqich</p>
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
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus size={18} /> Bosqich qo'shish
            </button>
          )}
        </div>

        {/* Legs Timeline */}
        <div className="space-y-3">
          {flight.legs?.map((leg, idx) => (
            <div key={leg._id || idx} className="relative">
              {idx < flight.legs.length - 1 && (
                <div className="absolute left-5 top-20 w-0.5 h-12 bg-gray-200"></div>
              )}
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                    leg.status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{leg.fromCity}</span>
                      <ChevronRight size={16} className="text-gray-400" />
                      <span className="font-semibold text-gray-900">{leg.toCity}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{leg.distance || 0} km</span>
                      {leg.status === 'completed' && <span className="text-emerald-600">✓ Tugatilgan</span>}
                      {leg.status === 'in_progress' && <span className="text-blue-600">🚛 Yo'lda</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">{formatMoney(leg.payment)}</p>
                    <p className="text-xs text-gray-400">mijozdan</p>
                  </div>
                </div>
                
                {/* Budget va Balance */}
                {(leg.givenBudget > 0 || leg.previousBalance > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2 text-xs">
                    {leg.previousBalance > 0 && (
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-blue-600 font-semibold">{formatMoney(leg.previousBalance)}</p>
                        <p className="text-blue-400">Qoldiq</p>
                      </div>
                    )}
                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                      <p className="text-orange-600 font-semibold">{formatMoney(leg.givenBudget)}</p>
                      <p className="text-orange-400">Berildi</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                      <p className="text-red-600 font-semibold">{formatMoney(leg.spentAmount)}</p>
                      <p className="text-red-400">Sarflandi</p>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${leg.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <p className={`font-semibold ${leg.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatMoney(Math.abs(leg.balance))}
                      </p>
                      <p className={leg.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {leg.balance >= 0 ? 'Qoldiq' : 'Kamomad'}
                      </p>
                    </div>
                  </div>
                )}
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

      {/* Expenses Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Xarajatlar</h3>
              <p className="text-sm text-gray-500">Jami: {formatMoney(flight.totalExpenses)} so'm</p>
            </div>
          </div>
          {isActive && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2"
            >
              <DollarSign size={18} /> Xarajat qo'shish
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {flight.expenses?.map((exp) => {
            const expType = EXPENSE_TYPES.find(t => t.value === exp.type)
            return (
              <div key={exp._id} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${expType?.color || 'from-gray-500 to-slate-500'} flex items-center justify-center text-2xl`}>
                  {expType?.icon || '📦'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{expType?.label || exp.type}</p>
                  {exp.description && <p className="text-xs text-gray-400">{exp.description}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">-{formatMoney(exp.amount)}</p>
                  {isActive && (
                    <button 
                      onClick={() => handleDeleteExpense(exp._id)}
                      className="text-xs text-gray-400 hover:text-red-500 mt-1"
                    >
                      O'chirish
                    </button>
                  )}
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

      {/* Completed Summary */}
      {!isActive && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-emerald-600" size={24} />
            <h3 className="font-bold text-emerald-800">Reys yakunlandi</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-700">{formatMoney(flight.totalPayment)}</p>
              <p className="text-sm text-emerald-600">Jami to'lov</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatMoney(flight.totalExpenses)}</p>
              <p className="text-sm text-red-500">Jami xarajat</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${flight.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {flight.profit < 0 ? '-' : ''}{formatMoney(Math.abs(flight.profit))}
              </p>
              <p className={`text-sm ${flight.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {flight.profit >= 0 ? 'Sof foyda' : 'Zarar'}
              </p>
            </div>
          </div>
        </div>
      )}

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
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Xarajat turi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_TYPES.map(({ value, label, icon, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setExpenseForm({ ...expenseForm, type: value })}
                        className={`p-3 rounded-xl border text-center transition ${
                          expenseForm.type === value
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
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Summa (so'm) *</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                    placeholder="100000"
                    required
                  />
                </div>
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
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:shadow-lg transition">
                  Qo'shish
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
    </div>
  )
}
