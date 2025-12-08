import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, MapPin, Clock, Route, Fuel, Wrench, Car, User, Truck,
  Calendar, Wallet, TrendingUp, TrendingDown, CheckCircle, Play, XCircle,
  ChevronRight, Navigation, Timer, Banknote, Receipt, Coffee,
  ParkingCircle, MoreHorizontal, Activity, Gauge, Plus, Trash2, Edit3,
  DollarSign, Flag, AlertTriangle, Calculator
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'

// Konfiguratsiyalar
const COUNTRIES = {
  UZB: { name: "O'zbekiston", flag: '🇺🇿', currency: 'UZS' },
  QZ: { name: "Qozog'iston", flag: '🇰🇿', currency: 'KZT' },
  RU: { name: 'Rossiya', flag: '🇷🇺', currency: 'RUB' }
}

const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar' },
  UZS: { symbol: "so'm", name: "So'm" },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

const UNEXPECTED_TYPES = {
  tire: { label: "G'ildirak", icon: '🛞' },
  repair: { label: 'Remont', icon: '🔧' },
  fine: { label: 'Jarima', icon: '📋' },
  other: { label: 'Boshqa', icon: '📦' }
}

const statusConfig = {
  pending: { label: 'Kutilmoqda', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
  in_progress: { label: "Yo'lda", color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Activity },
  completed: { label: 'Tugatilgan', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Bekor', color: 'from-red-500 to-rose-600', bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle }
}

export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState({ USD: 1, UZS: 12800, KZT: 450, RUB: 90 })
  
  // Modal states
  const [showFuelModal, setShowFuelModal] = useState(false)
  const [showRoadModal, setShowRoadModal] = useState(false)
  const [showUnexpectedModal, setShowUnexpectedModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('QZ')

  useEffect(() => {
    fetchTrip()
    fetchRates()
  }, [id])

  const fetchTrip = async () => {
    try {
      const res = await api.get(`/trips/${id}`)
      setTrip(res.data.data)
    } catch (error) {
      showToast.error('Reys topilmadi')
      navigate('/dashboard/trips')
    } finally {
      setLoading(false)
    }
  }

  const fetchRates = async () => {
    try {
      const res = await api.get('/trips/currency-rates')
      if (res.data.data) setRates(res.data.data)
    } catch (e) { /* default rates ishlatiladi */ }
  }

  const formatMoney = (n, currency = 'USD') => {
    if (!n && n !== 0) return '0'
    const formatted = new Intl.NumberFormat('uz-UZ').format(n)
    if (currency === 'USD') return `$${formatted}`
    return `${formatted} ${CURRENCIES[currency]?.symbol || ''}`
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!trip) return null

  const currentStatus = statusConfig[trip.status] || statusConfig.pending
  const StatusIcon = currentStatus.icon

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentStatus.color} text-white p-8 rounded-3xl`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative">
          <button 
            onClick={() => navigate('/dashboard/trips')} 
            className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Reyslarga qaytish</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center shadow-2xl">
              <Route size={40} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold flex items-center gap-2">
                  <StatusIcon size={16} />
                  {currentStatus.label}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                  <span className="text-2xl md:text-3xl font-bold">{trip.startAddress || 'Boshlanish'}</span>
                </div>
                <Navigation size={24} className="text-white/60" />
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-white/60 rounded-full"></div>
                  <span className="text-2xl md:text-3xl font-bold">{trip.endAddress || 'Tugash'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  {formatDate(trip.createdAt)}
                </span>
                {trip.odometer?.traveled > 0 && (
                  <span className="flex items-center gap-2">
                    <Gauge size={16} />
                    {trip.odometer.traveled.toLocaleString()} km yurdi
                  </span>
                )}
                {trip.fuelSummary?.consumption > 0 && (
                  <span className="flex items-center gap-2">
                    <Fuel size={16} />
                    {trip.fuelSummary.consumption} L/km
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                <p className="text-2xl font-bold">{formatMoney(trip.income?.amountInUSD || 0)}</p>
                <p className="text-white/70 text-sm">Daromad</p>
              </div>
              <div className="text-center px-6 py-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                <p className={`text-2xl font-bold ${trip.profitUSD >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {formatMoney(trip.profitUSD || 0)}
                </p>
                <p className="text-white/70 text-sm">Sof foyda</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ODOMETR */}
          <OdometerSection trip={trip} onUpdate={fetchTrip} />

          {/* YOQILG'I */}
          <FuelSection 
            trip={trip} 
            rates={rates}
            onAddFuel={() => setShowFuelModal(true)}
            onUpdate={fetchTrip}
          />

          {/* YO'L XARAJATLARI */}
          <RoadExpensesSection 
            trip={trip}
            onEdit={(country) => { setSelectedCountry(country); setShowRoadModal(true) }}
          />

          {/* KUTILMAGAN XARAJATLAR */}
          <UnexpectedSection 
            trip={trip}
            onAdd={() => setShowUnexpectedModal(true)}
            onUpdate={fetchTrip}
          />

          {/* ITOG HISOB */}
          <ProfitSection trip={trip} />
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Shofyor va Mashina */}
          <DriverVehicleCard trip={trip} navigate={navigate} />

          {/* Vaqt jadvali */}
          <TimelineCard trip={trip} formatDateTime={formatDateTime} />

          {/* Tezkor amallar */}
          <QuickActions 
            trip={trip} 
            onEdit={() => setShowEditModal(true)}
            onUpdate={fetchTrip}
          />
        </div>
      </div>

      {/* MODALLAR */}
      {showFuelModal && (
        <FuelModal 
          tripId={id}
          rates={rates}
          onClose={() => setShowFuelModal(false)}
          onSuccess={() => { setShowFuelModal(false); fetchTrip() }}
        />
      )}

      {showRoadModal && (
        <RoadExpenseModal
          tripId={id}
          country={selectedCountry}
          currentData={trip.roadExpenses?.[selectedCountry.toLowerCase()]}
          rates={rates}
          onClose={() => setShowRoadModal(false)}
          onSuccess={() => { setShowRoadModal(false); fetchTrip() }}
        />
      )}

      {showUnexpectedModal && (
        <UnexpectedModal
          tripId={id}
          rates={rates}
          onClose={() => setShowUnexpectedModal(false)}
          onSuccess={() => { setShowUnexpectedModal(false); fetchTrip() }}
        />
      )}

      {showEditModal && (
        <EditTripModal
          trip={trip}
          rates={rates}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => { setShowEditModal(false); fetchTrip() }}
        />
      )}
    </div>
  )
}


// ============ ODOMETR SECTION ============
function OdometerSection({ trip, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    start: trip.odometer?.start || 0,
    end: trip.odometer?.end || 0,
    traveled: trip.odometer?.traveled || 0
  })
  const [saving, setSaving] = useState(false)

  // Start va End kiritilganda traveled avtomatik hisoblansin
  const calculatedTraveled = form.start > 0 && form.end > form.start 
    ? form.end - form.start 
    : form.traveled

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/trips/${trip._id}`, { 
        odometerStart: form.start,
        odometerEnd: form.end,
        traveledKm: calculatedTraveled
      })
      showToast.success('Masofa saqlandi')
      setEditing(false)
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik yuz berdi')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Odometr (Kilometr)</h2>
            <p className="text-gray-500 text-sm">Chiqish, kelish va yurgan masofa</p>
          </div>
        </div>
        <button 
          onClick={() => setEditing(!editing)}
          className="p-2 hover:bg-gray-100 rounded-xl transition"
        >
          <Edit3 size={20} className="text-gray-500" />
        </button>
      </div>

      {editing ? (
        <div className="space-y-4">
          {/* Chiqish va Kelish */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🚀 Chiqishdagi KM</label>
              <input
                type="number"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xl font-bold text-center"
                placeholder="150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏁 Kelgandagi KM</label>
              <input
                type="number"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-xl font-bold text-center"
                placeholder="156500"
              />
            </div>
          </div>

          {/* Yurgan masofa */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-emerald-700 font-medium">📍 Yurgan masofa:</span>
              <span className="text-2xl font-bold text-emerald-600">{calculatedTraveled.toLocaleString()} km</span>
            </div>
            {form.start > 0 && form.end > form.start && (
              <p className="text-xs text-emerald-500 mt-1">{form.end.toLocaleString()} - {form.start.toLocaleString()} = {calculatedTraveled.toLocaleString()} km</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              Bekor
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 3 ta ko'rsatkich */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl text-center border border-blue-200">
              <p className="text-xs text-blue-500 mb-1">🚀 Chiqishdagi</p>
              <p className="text-2xl font-bold text-blue-600">{(trip.odometer?.start || 0).toLocaleString()}</p>
              <p className="text-xs text-blue-400">km</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl text-center border border-purple-200">
              <p className="text-xs text-purple-500 mb-1">🏁 Kelgandagi</p>
              <p className="text-2xl font-bold text-purple-600">{(trip.odometer?.end || 0).toLocaleString()}</p>
              <p className="text-xs text-purple-400">km</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl text-center border border-emerald-200">
              <p className="text-xs text-emerald-500 mb-1">📍 Yurgan</p>
              <p className="text-2xl font-bold text-emerald-600">{(trip.odometer?.traveled || 0).toLocaleString()}</p>
              <p className="text-xs text-emerald-400">km</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ FUEL SECTION ============
function FuelSection({ trip, rates, onAddFuel, onUpdate }) {
  const handleDelete = async (fuelId) => {
    if (!confirm("Yoqilg'i yozuvini o'chirishni xohlaysizmi?")) return
    try {
      await api.delete(`/trips/${trip._id}/fuel/${fuelId}`)
      showToast.success("O'chirildi")
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  const [editingRemaining, setEditingRemaining] = useState(false)
  const [remaining, setRemaining] = useState(trip.fuelSummary?.remaining || 0)

  const saveRemaining = async () => {
    try {
      await api.put(`/trips/${trip._id}`, { fuelRemaining: remaining })
      showToast.success('Saqlandi')
      setEditingRemaining(false)
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Fuel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Yoqilg'i (Salarka)</h2>
            <p className="text-gray-500 text-sm">Davlatlar bo'yicha</p>
          </div>
        </div>
        <button 
          onClick={onAddFuel}
          className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      {/* Davlatlar bo'yicha summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(COUNTRIES).map(([code, country]) => {
          const data = trip.fuelSummary?.[code.toLowerCase()] || { liters: 0, totalUSD: 0 }
          return (
            <div key={code} className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{country.flag}</span>
                <span className="font-medium text-gray-700">{country.name}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{data.liters || 0} L</p>
              <p className="text-sm text-gray-500">${(data.totalUSD || 0).toFixed(2)}</p>
            </div>
          )
        })}
      </div>

      {/* Astatka va jami */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl">
        <div className="text-center">
          <p className="text-sm text-gray-500">Jami quyilgan</p>
          <p className="text-xl font-bold text-gray-900">{trip.fuelSummary?.totalLiters || 0} L</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Astatka (qoldiq)</p>
          {editingRemaining ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={remaining}
                onChange={(e) => setRemaining(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded text-center"
              />
              <button onClick={saveRemaining} className="text-green-600">✓</button>
              <button onClick={() => setEditingRemaining(false)} className="text-red-600">✕</button>
            </div>
          ) : (
            <p 
              className="text-xl font-bold text-orange-600 cursor-pointer hover:underline"
              onClick={() => setEditingRemaining(true)}
            >
              {trip.fuelSummary?.remaining || 0} L
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Yegan</p>
          <p className="text-xl font-bold text-red-600">{trip.fuelSummary?.totalUsed || 0} L</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Rashod</p>
          <p className="text-xl font-bold text-blue-600">{trip.fuelSummary?.consumption || 0} L/km</p>
        </div>
      </div>

      {/* Yoqilg'i yozuvlari */}
      {trip.fuelEntries && trip.fuelEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Barcha yozuvlar</h3>
          {trip.fuelEntries.map((entry) => (
            <div key={entry._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl group">
              <span className="text-2xl">{COUNTRIES[entry.country]?.flag}</span>
              <div className="flex-1">
                <p className="font-medium">{entry.liters} litr × {entry.pricePerLiter} {CURRENCIES[entry.currency]?.symbol}</p>
                {entry.note && <p className="text-sm text-gray-500">{entry.note}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold">${entry.totalInUSD?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => handleDelete(entry._id)}
                className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Jami */}
      <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl text-white">
        <div className="flex justify-between items-center">
          <span className="font-medium">Jami yoqilg'i xarajati:</span>
          <span className="text-2xl font-bold">${(trip.fuelSummary?.totalUSD || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}


// ============ ROAD EXPENSES SECTION ============
function RoadExpensesSection({ trip, onEdit }) {
  const countries = ['UZB', 'QZ', 'RU']
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Yo'l xarajatlari</h2>
          <p className="text-gray-500 text-sm">Chegara, GAI, yo'l puli, stoyanka</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {countries.map((code) => {
          const country = COUNTRIES[code]
          const data = trip.roadExpenses?.[code.toLowerCase()] || {}
          const total = data.totalInUSD || 0
          
          return (
            <div key={code} className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{country.flag}</span>
                  <span className="font-bold text-gray-900 text-sm">{country.name}</span>
                </div>
                <button 
                  onClick={() => onEdit(code)}
                  className="p-1.5 hover:bg-white rounded-lg transition"
                >
                  <Edit3 size={14} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">🛂 Chegara:</span>
                  <span className="font-medium">${data.border || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">👮 GAI:</span>
                  <span className="font-medium">${data.gai || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">🛣️ Yo'l puli:</span>
                  <span className="font-medium">${data.toll || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">🅿️ Stoyanka:</span>
                  <span className="font-medium">${data.parking || 0}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-medium text-gray-700 text-sm">Jami:</span>
                  <span className="font-bold text-purple-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Jami */}
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl text-white">
        <div className="flex justify-between items-center">
          <span className="font-medium">Jami yo'l xarajatlari:</span>
          <span className="text-2xl font-bold">${(trip.roadExpenses?.totalUSD || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

// ============ UNEXPECTED EXPENSES SECTION ============
function UnexpectedSection({ trip, onAdd, onUpdate }) {
  const handleDelete = async (expenseId) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return
    try {
      await api.delete(`/trips/${trip._id}/unexpected/${expenseId}`)
      showToast.success("O'chirildi")
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kutilmagan xarajatlar</h2>
            <p className="text-gray-500 text-sm">G'ildirak, remont, jarima va boshqa</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      {trip.unexpectedExpenses && trip.unexpectedExpenses.length > 0 ? (
        <div className="space-y-2">
          {trip.unexpectedExpenses.map((exp) => (
            <div key={exp._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group">
              <span className="text-2xl">{UNEXPECTED_TYPES[exp.type]?.icon || '📦'}</span>
              <div className="flex-1">
                <p className="font-medium">{UNEXPECTED_TYPES[exp.type]?.label || exp.type}</p>
                {exp.description && <p className="text-sm text-gray-500">{exp.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">${exp.amountInUSD?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => handleDelete(exp._id)}
                className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <AlertTriangle size={40} className="mx-auto mb-2 opacity-30" />
          <p>Kutilmagan xarajat yo'q</p>
        </div>
      )}

      {/* Jami */}
      {trip.unexpectedTotalUSD > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white">
          <div className="flex justify-between items-center">
            <span className="font-medium">Jami kutilmagan:</span>
            <span className="text-2xl font-bold">${(trip.unexpectedTotalUSD || 0).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ PROFIT SECTION ============
function ProfitSection({ trip }) {
  const expenses = [
    { label: "Yoqilg'i", value: trip.fuelSummary?.totalUSD || 0, icon: '⛽' },
    { label: "Yo'l xarajatlari", value: trip.roadExpenses?.totalUSD || 0, icon: '🛣️' },
    { label: 'Ovqat (Pitanya)', value: trip.food?.amountInUSD || 0, icon: '🍲' },
    { label: 'Kutilmagan', value: trip.unexpectedTotalUSD || 0, icon: '⚠️' },
    { label: 'Shofyor oyligi', value: trip.driverSalary?.amountInUSD || 0, icon: '👨‍✈️' },
  ]

  const totalExpenses = trip.totalExpensesUSD || 0
  const income = trip.income?.amountInUSD || 0
  const profit = trip.profitUSD || 0

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Itog hisob</h2>
          <p className="text-gray-500 text-sm">Daromad va xarajatlar</p>
        </div>
      </div>

      {/* Daromad */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-medium text-gray-700">Daromad (Reys haqi)</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">${income.toFixed(2)}</span>
        </div>
      </div>

      {/* Xarajatlar */}
      <div className="space-y-2 mb-4">
        {expenses.map((exp, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span>{exp.icon}</span>
              <span className="text-gray-600">{exp.label}</span>
            </div>
            <span className="font-medium text-red-500">-${exp.value.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Jami xarajat */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl mb-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Jami xarajatlar:</span>
          <span className="text-xl font-bold text-red-600">-${totalExpenses.toFixed(2)}</span>
        </div>
      </div>

      {/* SOF FOYDA */}
      <div className={`p-6 rounded-2xl ${profit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-sm">Sof foyda</p>
            <p className="text-3xl font-bold">${profit.toFixed(2)}</p>
          </div>
          {profit >= 0 ? (
            <TrendingUp size={48} className="text-white/30" />
          ) : (
            <TrendingDown size={48} className="text-white/30" />
          )}
        </div>
        <div className="mt-2 text-sm text-white/70">
          Formula: ${income.toFixed(2)} - ${totalExpenses.toFixed(2)} = ${profit.toFixed(2)}
        </div>
      </div>
    </div>
  )
}


// ============ DRIVER & VEHICLE CARD ============
function DriverVehicleCard({ trip, navigate }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shofyor va mashina</h2>
        </div>
      </div>

      {/* Driver Card */}
      <div 
        onClick={() => navigate(`/dashboard/drivers/${trip.driver?._id}`)}
        className="group p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white mb-4 cursor-pointer hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold">
            {trip.driver?.fullName?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-lg">{trip.driver?.fullName || 'Nomalum'}</p>
            <p className="text-blue-200 text-sm">{trip.driver?.phone || ''}</p>
          </div>
          <ChevronRight size={20} className="text-blue-200 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Vehicle Card */}
      <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center">
            <Truck size={28} className="text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-xl text-gray-900">{trip.vehicle?.plateNumber || '-'}</p>
            <p className="text-gray-500">{trip.vehicle?.brand} {trip.vehicle?.model}</p>
          </div>
        </div>
      </div>

      {/* Shofyor oyligi */}
      {trip.driverSalary?.amountInUSD > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Shofyor oyligi:</span>
            <span className="font-bold text-emerald-600">${trip.driverSalary.amountInUSD.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ TIMELINE CARD ============
function TimelineCard({ trip, formatDateTime }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Vaqt jadvali</h2>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500"></div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg z-10">
              <Calendar size={18} className="text-white" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-gray-400 uppercase">Yaratilgan</p>
              <p className="font-semibold text-gray-900">{formatDateTime(trip.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg z-10 ${trip.startedAt ? 'bg-purple-500' : 'bg-gray-200'}`}>
              <Play size={18} className={trip.startedAt ? 'text-white' : 'text-gray-400'} />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-gray-400 uppercase">Boshlangan</p>
              <p className={`font-semibold ${trip.startedAt ? 'text-gray-900' : 'text-gray-400'}`}>
                {trip.startedAt ? formatDateTime(trip.startedAt) : 'Hali boshlanmagan'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg z-10 ${trip.completedAt ? 'bg-emerald-500' : 'bg-gray-200'}`}>
              <CheckCircle size={18} className={trip.completedAt ? 'text-white' : 'text-gray-400'} />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs text-gray-400 uppercase">Tugatilgan</p>
              <p className={`font-semibold ${trip.completedAt ? 'text-gray-900' : 'text-gray-400'}`}>
                {trip.completedAt ? formatDateTime(trip.completedAt) : 'Hali tugatilmagan'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ QUICK ACTIONS ============
function QuickActions({ trip, onEdit, onUpdate }) {
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      await api.put(`/trips/${trip._id}/start`)
      showToast.success('Reys boshlandi!')
      onUpdate()
    } catch (e) {
      showToast.error(e.response?.data?.message || 'Xatolik')
    }
    setLoading(false)
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      await api.put(`/trips/${trip._id}/complete`)
      showToast.success('Reys tugatildi!')
      onUpdate()
    } catch (e) {
      showToast.error(e.response?.data?.message || 'Xatolik')
    }
    setLoading(false)
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
      <h3 className="font-bold mb-4">Tezkor amallar</h3>
      
      <div className="space-y-3">
        <button 
          onClick={onEdit}
          className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition"
        >
          <Edit3 size={20} />
          <span>Reysni tahrirlash</span>
        </button>

        {trip.status === 'pending' && (
          <button 
            onClick={handleStart}
            disabled={loading}
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center gap-3 transition disabled:opacity-50"
          >
            <Play size={20} />
            <span>Reysni boshlash</span>
          </button>
        )}

        {trip.status === 'in_progress' && (
          <button 
            onClick={handleComplete}
            disabled={loading}
            className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center gap-3 transition disabled:opacity-50"
          >
            <CheckCircle size={20} />
            <span>Reysni tugatish</span>
          </button>
        )}
      </div>
    </div>
  )
}


// ============ FUEL MODAL ============
function FuelModal({ tripId, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    country: 'UZB',
    liters: '',
    pricePerLiter: '',
    currency: 'UZS',
    note: ''
  })
  const [saving, setSaving] = useState(false)

  // Davlat o'zgarganda default valyutani o'zgartirish
  useEffect(() => {
    const defaultCurrency = COUNTRIES[form.country]?.currency || 'USD'
    setForm(f => ({ ...f, currency: defaultCurrency }))
  }, [form.country])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.liters || !form.pricePerLiter) {
      showToast.error("Litr va narxni kiriting")
      return
    }
    setSaving(true)
    try {
      await api.post(`/trips/${tripId}/fuel`, {
        country: form.country,
        liters: Number(form.liters),
        pricePerLiter: Number(form.pricePerLiter),
        currency: form.currency,
        exchangeRate: rates[form.currency] || 1,
        note: form.note
      })
      showToast.success("Yoqilg'i qo'shildi")
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik yuz berdi')
    }
    setSaving(false)
  }

  const total = (Number(form.liters) || 0) * (Number(form.pricePerLiter) || 0)
  const totalUSD = form.currency === 'USD' ? total : total / (rates[form.currency] || 1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Fuel className="text-orange-500" />
          Yoqilg'i qo'shish
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Davlat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Davlat</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(COUNTRIES).map(([code, country]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setForm({ ...form, country: code })}
                  className={`p-3 rounded-xl border-2 transition ${
                    form.country === code 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{country.flag}</span>
                  <p className="text-xs mt-1">{country.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Litr va narx */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Litr</label>
              <input
                type="number"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Litr narxi</label>
              <input
                type="number"
                value={form.pricePerLiter}
                onChange={(e) => setForm({ ...form, pricePerLiter: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                placeholder="12500"
              />
            </div>
          </div>

          {/* Valyuta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
            >
              {Object.entries(CURRENCIES).map(([code, curr]) => (
                <option key={code} value={code}>{curr.name} ({curr.symbol})</option>
              ))}
            </select>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
              placeholder="Qo'shimcha ma'lumot"
            />
          </div>

          {/* Jami */}
          <div className="p-4 bg-orange-50 rounded-xl">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Jami:</span>
              <span className="font-bold">{total.toLocaleString()} {CURRENCIES[form.currency]?.symbol}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>USD da:</span>
              <span className="font-medium text-orange-600">${totalUSD.toFixed(2)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ ROAD EXPENSE MODAL ============
function RoadExpenseModal({ tripId, country, currentData, rates, onClose, onSuccess }) {
  const countryInfo = COUNTRIES[country]
  const [form, setForm] = useState({
    border: currentData?.border || 0,
    gai: currentData?.gai || 0,
    toll: currentData?.toll || 0,
    parking: currentData?.parking || 0,
    currency: 'USD'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/trips/${tripId}/road-expenses/${country.toLowerCase()}`, {
        ...form,
        exchangeRate: rates[form.currency] || 1
      })
      showToast.success('Saqlandi')
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik')
    }
    setSaving(false)
  }

  const total = Number(form.border) + Number(form.gai) + Number(form.toll) + Number(form.parking)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="text-2xl">{countryInfo?.flag}</span>
          {countryInfo?.name} yo'l xarajatlari
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🛂 Chegara</label>
            <input
              type="number"
              value={form.border}
              onChange={(e) => setForm({ ...form, border: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">👮 GAI</label>
            <input
              type="number"
              value={form.gai}
              onChange={(e) => setForm({ ...form, gai: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🛣️ Yo'l puli</label>
            <input
              type="number"
              value={form.toll}
              onChange={(e) => setForm({ ...form, toll: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🅿️ Stoyanka</label>
            <input
              type="number"
              value={form.parking}
              onChange={(e) => setForm({ ...form, parking: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            >
              {Object.entries(CURRENCIES).map(([code, curr]) => (
                <option key={code} value={code}>{curr.name} ({curr.symbol})</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-600">Jami:</span>
              <span className="font-bold text-purple-600">${total}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">
              Bekor
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ============ UNEXPECTED EXPENSE MODAL ============
function UnexpectedModal({ tripId, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: 'other',
    amount: '',
    currency: 'USD',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount) {
      showToast.error('Summani kiriting')
      return
    }
    setSaving(true)
    try {
      await api.post(`/trips/${tripId}/unexpected`, {
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency,
        exchangeRate: rates[form.currency] || 1,
        description: form.description
      })
      showToast.success("Xarajat qo'shildi")
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik')
    }
    setSaving(false)
  }

  const amountUSD = form.currency === 'USD' 
    ? Number(form.amount) || 0 
    : (Number(form.amount) || 0) / (rates[form.currency] || 1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="text-red-500" />
          Kutilmagan xarajat
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(UNEXPECTED_TYPES).map(([code, type]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setForm({ ...form, type: code })}
                  className={`p-3 rounded-xl border-2 transition text-center ${
                    form.type === code 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <p className="text-xs mt-1">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summa</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              >
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="Nima uchun sarflandi?"
            />
          </div>

          <div className="p-4 bg-red-50 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-600">USD da:</span>
              <span className="font-bold text-red-600">${amountUSD.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">
              Bekor
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ EDIT TRIP MODAL ============
function EditTripModal({ trip, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    income: trip.income?.amount || 0,
    incomeCurrency: trip.income?.currency || 'USD',
    driverSalary: trip.driverSalary?.amount || 0,
    driverSalaryCurrency: trip.driverSalary?.currency || 'USD',
    food: trip.food?.amount || 0,
    foodCurrency: trip.food?.currency || 'USD',
    startAddress: trip.startAddress || '',
    endAddress: trip.endAddress || '',
    estimatedDuration: trip.estimatedDuration || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/trips/${trip._id}`, {
        income: Number(form.income),
        incomeCurrency: form.incomeCurrency,
        incomeExchangeRate: rates[form.incomeCurrency] || 1,
        driverSalary: Number(form.driverSalary),
        driverSalaryCurrency: form.driverSalaryCurrency,
        driverSalaryExchangeRate: rates[form.driverSalaryCurrency] || 1,
        food: Number(form.food),
        foodCurrency: form.foodCurrency,
        foodExchangeRate: rates[form.foodCurrency] || 1,
        startAddress: form.startAddress,
        endAddress: form.endAddress,
        estimatedDuration: form.estimatedDuration
      })
      showToast.success('Saqlandi')
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 my-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Edit3 className="text-blue-500" />
          Reysni tahrirlash
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Yo'nalish */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qayerdan</label>
              <input
                type="text"
                value={form.startAddress}
                onChange={(e) => setForm({ ...form, startAddress: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                placeholder="Toshkent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qayerga</label>
              <input
                type="text"
                value={form.endAddress}
                onChange={(e) => setForm({ ...form, endAddress: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                placeholder="Moskva"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taxminiy vaqt</label>
            <input
              type="text"
              value={form.estimatedDuration}
              onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl"
              placeholder="5 kun"
            />
          </div>

          {/* Daromad */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <label className="block text-sm font-medium text-blue-700 mb-2">💰 Daromad (Reys haqi)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={form.income}
                onChange={(e) => setForm({ ...form, income: e.target.value })}
                className="px-4 py-3 border border-blue-200 rounded-xl"
                placeholder="2000"
              />
              <select
                value={form.incomeCurrency}
                onChange={(e) => setForm({ ...form, incomeCurrency: e.target.value })}
                className="px-4 py-3 border border-blue-200 rounded-xl"
              >
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Shofyor oyligi */}
          <div className="p-4 bg-green-50 rounded-xl">
            <label className="block text-sm font-medium text-green-700 mb-2">👨‍✈️ Shofyor oyligi</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={form.driverSalary}
                onChange={(e) => setForm({ ...form, driverSalary: e.target.value })}
                className="px-4 py-3 border border-green-200 rounded-xl"
                placeholder="300"
              />
              <select
                value={form.driverSalaryCurrency}
                onChange={(e) => setForm({ ...form, driverSalaryCurrency: e.target.value })}
                className="px-4 py-3 border border-green-200 rounded-xl"
              >
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pitanya */}
          <div className="p-4 bg-amber-50 rounded-xl">
            <label className="block text-sm font-medium text-amber-700 mb-2">🍲 Pitanya (Ovqat)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={form.food}
                onChange={(e) => setForm({ ...form, food: e.target.value })}
                className="px-4 py-3 border border-amber-200 rounded-xl"
                placeholder="200"
              />
              <select
                value={form.foodCurrency}
                onChange={(e) => setForm({ ...form, foodCurrency: e.target.value })}
                className="px-4 py-3 border border-amber-200 rounded-xl"
              >
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">
              Bekor
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
