import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, X, Route, Truck, ArrowRight, Calendar, ArrowUpRight, 
  Activity, CheckCircle, Play, Fuel, Gauge, MapPin, Wallet,
  ChevronDown, ChevronUp, Trash2, DollarSign
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert } from '../components/ui'

const EXPENSE_TYPES = [
  { value: 'fuel_benzin', label: 'Benzin', icon: '⛽' },
  { value: 'fuel_diesel', label: 'Dizel (Salarka)', icon: '🛢️' },
  { value: 'fuel_gas', label: 'Gaz', icon: '🔵' },
  { value: 'food', label: 'Ovqat', icon: '🍽️' },
  { value: 'repair', label: 'Ta\'mir', icon: '🔧' },
  { value: 'toll', label: 'Yo\'l to\'lovi', icon: '🛣️' },
  { value: 'fine', label: 'Jarima', icon: '📋' },
  { value: 'other', label: 'Boshqa', icon: '📦' }
]

export default function Flights() {
  const { user, isDemo } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [expandedFlight, setExpandedFlight] = useState(null)
  const isDemoMode = isDemo()

  // Modals
  const [showLegModal, setShowLegModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)

  // Forms
  const [legForm, setLegForm] = useState({ toCity: '', payment: '', distance: '' })
  const [expenseForm, setExpenseForm] = useState({ type: 'fuel_benzin', amount: '', description: '', quantity: '' })
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', endFuel: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (isDemoMode) {
      setFlights([])
      setLoading(false)
      return
    }

    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await api.get('/flights', { params })
      setFlights(res.data.data || [])
    } catch (error) {
      showToast.error('Reyslarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }, [filter, isDemoMode])

  useEffect(() => { fetchData() }, [fetchData])

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('uz-UZ') : '-'

  // Yangi bosqich qo'shish
  const handleAddLeg = async (e) => {
    e.preventDefault()
    if (!legForm.toCity) {
      showToast.error('Qayerga shahrini kiriting!')
      return
    }

    try {
      await api.post(`/flights/${selectedFlight._id}/legs`, {
        toCity: legForm.toCity,
        payment: Number(legForm.payment) || 0,
        distance: Number(legForm.distance) || 0
      })
      showToast.success('Yangi bosqich qo\'shildi!')
      setShowLegModal(false)
      setLegForm({ toCity: '', payment: '', distance: '' })
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // Xarajat qo'shish
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!expenseForm.amount) {
      showToast.error('Summani kiriting!')
      return
    }

    setSubmitting(true)
    try {
      const isFuel = ['fuel_benzin', 'fuel_diesel', 'fuel_gas'].includes(expenseForm.type)
      await api.post(`/flights/${selectedFlight._id}/expenses`, {
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        quantity: isFuel && expenseForm.quantity ? Number(expenseForm.quantity) : null,
        quantityUnit: isFuel && expenseForm.quantity ? (expenseForm.type === 'fuel_gas' ? 'kub' : 'litr') : null
      })
      showToast.success('Xarajat qo\'shildi!')
      setShowExpenseModal(false)
      setExpenseForm({ type: 'fuel_benzin', amount: '', description: '', quantity: '' })
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    } finally {
      setSubmitting(false)
    }
  }

  // Reysni yopish
  const handleComplete = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/flights/${selectedFlight._id}/complete`, {
        endOdometer: Number(completeForm.endOdometer) || 0,
        endFuel: Number(completeForm.endFuel) || 0
      })
      showToast.success('Reys yopildi!')
      setShowCompleteModal(false)
      setCompleteForm({ endOdometer: '', endFuel: '' })
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  // Xarajat o'chirish
  const handleDeleteExpense = async (flightId, expenseId) => {
    try {
      await api.delete(`/flights/${flightId}/expenses/${expenseId}`)
      showToast.success('Xarajat o\'chirildi')
      fetchData()
    } catch (error) {
      showToast.error('Xatolik')
    }
  }

  const statusConfig = {
    active: { label: 'Faol', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    completed: { label: 'Yopilgan', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
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

  const activeCount = flights.filter(f => f.status === 'active').length
  const completedCount = flights.filter(f => f.status === 'completed').length

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-green-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 text-green-300 text-sm mb-2">
            <Calendar size={14} />
            <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Reyslar 🚛</h1>
          <p className="text-green-200">Faol va tugatilgan reyslar</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Activity size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{activeCount}</p>
                  <p className="text-green-200 text-xs">Faol reyslar</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <CheckCircle size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{completedCount}</p>
                  <p className="text-blue-200 text-xs">Yopilgan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'active', label: 'Faol' },
          { value: 'completed', label: 'Yopilgan' },
          { value: 'all', label: 'Barchasi' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === value
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Flights List */}
      <div className="space-y-4">
        {flights.map((flight) => (
          <div key={flight._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Flight Header */}
            <div 
              className="p-3 sm:p-5 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedFlight(expandedFlight === flight._id ? null : flight._id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    flight.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {flight.driver?.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{flight.name || 'Yangi reys'}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {flight.flightType === 'international' ? '🌍' : '🇺🇿'} {flight.driver?.fullName} • {flight.vehicle?.plateNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig[flight.status]?.color}`}>
                    {statusConfig[flight.status]?.label}
                  </span>
                  {expandedFlight === flight._id ? <ChevronUp size={18} className="sm:hidden" /> : <ChevronDown size={18} className="sm:hidden" />}
                  {expandedFlight === flight._id ? <ChevronUp size={20} className="hidden sm:block" /> : <ChevronDown size={20} className="hidden sm:block" />}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-3 sm:mt-4">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-400">Bosqichlar</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{flight.legs?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-400">Masofa</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{flight.totalDistance || 0} km</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-400">To'lov</p>
                  <p className="font-bold text-green-600 text-xs sm:text-base truncate">{formatMoney(flight.totalPayment)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs text-gray-400">Foyda</p>
                  <p className={`font-bold text-xs sm:text-base truncate ${flight.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoney(flight.profit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedFlight === flight._id && (
              <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                {/* Odometer & Fuel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-xl">
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Gauge size={12} /> Boshlang'ich km</p>
                    <p className="font-semibold">{flight.startOdometer || 0}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl">
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Fuel size={12} /> Boshlang'ich L</p>
                    <p className="font-semibold">{flight.startFuel || 0}</p>
                  </div>
                  {flight.status === 'completed' && (
                    <>
                      <div className="bg-white p-3 rounded-xl">
                        <p className="text-xs text-gray-400">Tugash km</p>
                        <p className="font-semibold">{flight.endOdometer || 0}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl">
                        <p className="text-xs text-gray-400">Tugash L</p>
                        <p className="font-semibold">{flight.endFuel || 0}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Legs */}
                <div>
                  <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Route size={16} /> Bosqichlar
                  </p>
                  <div className="space-y-2">
                    {flight.legs?.map((leg, idx) => (
                      <div key={leg._id || idx} className="bg-white p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{leg.fromCity} → {leg.toCity}</p>
                            <p className="text-xs text-gray-400">{leg.distance || 0} km</p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-600">{formatMoney(leg.payment)} so'm</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Wallet size={16} /> Xarajatlar ({formatMoney(flight.totalExpenses)} so'm)
                  </p>
                  <div className="space-y-2">
                    {flight.expenses?.map((exp) => (
                      <div key={exp._id} className="bg-white p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{EXPENSE_TYPES.find(t => t.value === exp.type)?.icon || '📦'}</span>
                          <div>
                            <p className="font-medium">{EXPENSE_TYPES.find(t => t.value === exp.type)?.label}</p>
                            {exp.description && <p className="text-xs text-gray-400">{exp.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-red-600">-{formatMoney(exp.amount)}</p>
                          {flight.status === 'active' && (
                            <button 
                              onClick={() => handleDeleteExpense(flight._id, exp._id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!flight.expenses || flight.expenses.length === 0) && (
                      <p className="text-gray-400 text-sm text-center py-2">Xarajatlar yo'q</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {flight.status === 'active' && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => { setSelectedFlight(flight); setShowLegModal(true) }}
                      className="flex-1 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <Plus size={16} className="sm:hidden" />
                      <Plus size={18} className="hidden sm:block" />
                      <span className="sm:hidden">Bosqich</span>
                      <span className="hidden sm:inline">Bosqich qo'shish</span>
                    </button>
                    <button
                      onClick={() => { setSelectedFlight(flight); setShowExpenseModal(true) }}
                      className="flex-1 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-orange-700 transition flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <DollarSign size={16} className="sm:hidden" />
                      <DollarSign size={18} className="hidden sm:block" />
                      Xarajat
                    </button>
                    <button
                      onClick={() => { setSelectedFlight(flight); setShowCompleteModal(true) }}
                      className="flex-1 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <CheckCircle size={16} className="sm:hidden" />
                      <CheckCircle size={18} className="hidden sm:block" />
                      Yopish
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {flights.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reyslar topilmadi</h3>
          <p className="text-gray-500 mb-6">Shofyorlar sahifasidan yangi reys oching</p>
        </div>
      )}


      {/* Add Leg Modal */}
      {showLegModal && selectedFlight && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowLegModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Route className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Yangi bosqich</h2>
                      <p className="text-green-300 text-sm">
                        {selectedFlight.legs?.length > 0 
                          ? `${selectedFlight.legs[selectedFlight.legs.length - 1].toCity} dan` 
                          : 'Birinchi bosqich'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowLegModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddLeg} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Qayerga *</label>
                  <input
                    type="text"
                    value={legForm.toCity}
                    onChange={(e) => setLegForm({ ...legForm, toCity: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                    placeholder="Jizzax"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">To'lov (so'm)</label>
                    <input
                      type="number"
                      value={legForm.payment}
                      onChange={(e) => setLegForm({ ...legForm, payment: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                      placeholder="200000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Masofa (km)</label>
                    <input
                      type="number"
                      value={legForm.distance}
                      onChange={(e) => setLegForm({ ...legForm, distance: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                      placeholder="150"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold">
                  Qo'shish
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && selectedFlight && createPortal(
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
                      <p className="text-orange-300 text-sm">{selectedFlight.name}</p>
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
                    {EXPENSE_TYPES.map(({ value, label, icon }) => (
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
                {['fuel_benzin', 'fuel_diesel', 'fuel_gas'].includes(expenseForm.type) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Miqdori ({expenseForm.type === 'fuel_gas' ? 'kub' : 'litr'})
                    </label>
                    <input
                      type="number"
                      value={expenseForm.quantity}
                      onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                      placeholder={expenseForm.type === 'fuel_gas' ? '50' : '100'}
                    />
                  </div>
                )}
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
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      {showCompleteModal && selectedFlight && createPortal(
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
                      <p className="text-blue-300 text-sm">{selectedFlight.name}</p>
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
                    <span className="text-green-400 font-bold">{formatMoney(selectedFlight.totalPayment)} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jami xarajat:</span>
                    <span className="text-red-400 font-bold">{formatMoney(selectedFlight.totalExpenses)} so'm</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-semibold">Foyda:</span>
                    <span className={`font-bold ${selectedFlight.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatMoney(selectedFlight.profit)} so'm
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
                      placeholder={String(selectedFlight.startOdometer + selectedFlight.totalDistance)}
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

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold">
                  Reysni yopish
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
