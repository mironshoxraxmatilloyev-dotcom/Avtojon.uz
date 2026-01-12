import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  AlertCircle, ArrowLeft, Building2, Calendar, Car, CheckCircle, Circle, CircleDot, Clock, Droplet, FileText, Fuel, MapPin, Navigation, Package, Pencil, Phone, Route, Shield, TrendingDown, TrendingUp, Truck, User, Utensils, Wallet, Wrench, X, Plus, Activity, ChevronRight, Play, Gauge, Globe, Flag, Trash2, Filter
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert, DriverDetailSkeleton, NetworkError, NotFoundError } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { useSocket } from '../hooks/useSocket'
import { ExpenseModal } from '../components/flightDetail/AllModals'

export default function DriverDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDemo } = useAuthStore()
  const alert = useAlert()
  const isDemoMode = isDemo()
  const { socket } = useSocket()

  const [driver, setDriver] = useState(null)
  const [flights, setFlights] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseLoading, setExpenseLoading] = useState(false)

  useEffect(() => {
    if (showFlightModal || showExpenseModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showFlightModal, showExpenseModal])

  const [flightForm, setFlightForm] = useState({
    startOdometer: '',
    startFuel: '',
    fromCity: '',
    toCity: '',
    payment: '',
    givenBudget: '',
    fromCoords: null,
    toCoords: null,
    flightType: 'domestic',
    fuelType: 'metan',
    fuelUnit: 'kub',
    note: ''
  })

  const fetchData = useCallback(async (showLoader = true) => {
    // Vaqtinchalik ID tekshirish - temp_ bilan boshlanuvchi ID lar hali saqlanmagan
    if (id?.startsWith('temp_')) {
      setError({ type: 'notfound', message: 'Bu haydovchi hali saqlanmagan' })
      setLoading(false)
      return
    }

    if (showLoader) setLoading(true)
    setError(null)
    try {
      // 🚀 Parallel so'rovlar - tezroq yuklash
      const driverUrl = `/drivers/${id}`
      const [driverRes, flightsRes] = await Promise.all([
        api.get(driverUrl),
        api.get('/flights', { params: { driverId: id, limit: 20 } })
      ])
      const driverData = driverRes.data.data
      setDriver(driverData)
      setVehicle(driverData?.vehicle || null) // Backend dan keladi
      setFlights(flightsRes.data.data || [])
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setError({ type: 'notfound', message: 'Haydovchi topilmadi' })
      } else {
        setError({
          type: err.isNetworkError ? 'network' : 'generic',
          message: err.userMessage || "Ma'lumotlarni yuklashda xatolik"
        })
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!socket) return
    const handleFlightUpdate = (data) => {
      if (data.flight?.driver === id || data.flight?.driver?._id === id) {
        fetchData(false)
      }
    }
    const handleDriverUpdate = (data) => {
      if (data.driver?._id === id || data.driverId === id) {
        fetchData(false)
      }
    }
    const handleFlightDeleted = (data) => {
      if (data.flightId) {
        setFlights(prev => prev.filter(f => f._id !== data.flightId))
      }
    }
    socket.on('flight-started', handleFlightUpdate)
    socket.on('flight-updated', handleFlightUpdate)
    socket.on('flight-completed', handleFlightUpdate)
    socket.on('flight-confirmed', handleFlightUpdate)
    socket.on('flight-cancelled', handleFlightUpdate)
    socket.on('flight-deleted', handleFlightDeleted)
    socket.on('driver-updated', handleDriverUpdate)
    return () => {
      socket.off('flight-started', handleFlightUpdate)
      socket.off('flight-updated', handleFlightUpdate)
      socket.off('flight-completed', handleFlightUpdate)
      socket.off('flight-confirmed', handleFlightUpdate)
      socket.off('flight-cancelled', handleFlightUpdate)
      socket.off('flight-deleted', handleFlightDeleted)
      socket.off('driver-updated', handleDriverUpdate)
    }
  }, [socket, id, fetchData])

  if (loading) return <DriverDetailSkeleton />
  if (loading) return <DriverDetailSkeleton />

  if (error) {
    if (error.type === 'notfound') {
      return <NotFoundError title="Shofyor topilmadi" message="Bu shofyor mavjud emas yoki o'chirilgan" onBack={() => navigate('/dashboard/drivers')} />
    }
    if (error.type === 'network') {
      return <NetworkError onRetry={fetchData} message={error.message} />
    }
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Qayta urinish</button>
        </div>
      </div>
    )
  }
  const handleStartFlight = async (e) => {
    e.preventDefault()
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya.')
      setShowFlightModal(false)
      return
    }
    if (!flightForm.fromCity || !flightForm.toCity) {
      showToast.error('Qayerdan va qayerga shaharlarini kiriting!')
      return
    }
    const payload = {
      driverId: id,
      startOdometer: Number(flightForm.startOdometer) || 0,
      startFuel: Number(flightForm.startFuel) || 0,
      fuelType: flightForm.fuelType || 'metan',
      fuelUnit: flightForm.fuelUnit || 'litr',
      flightType: flightForm.flightType,
      firstLeg: {
        fromCity: flightForm.fromCity,
        toCity: flightForm.toCity,
        fromCoords: flightForm.fromCoords,
        toCoords: flightForm.toCoords,
        payment: Number(flightForm.payment) || 0,
        givenBudget: Number(flightForm.givenBudget) || 0,
        note: flightForm.note
      }
    }
    const fromCity = flightForm.fromCity
    const toCity = flightForm.toCity

    // 🚀 Optimistic update - haydovchini band qilish va xarajatlarni o'chirish
    const beforeExpenses = driver.expenses?.filter(exp => exp.timing === 'before') || []
    const beforeExpensesTotal = beforeExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const newBalance = Math.max(0, (driver.currentBalance || 0) - beforeExpensesTotal)

    setDriver(prev => ({
      ...prev,
      status: 'busy',
      currentBalance: newBalance,
      expenses: prev.expenses?.filter(exp => exp.timing !== 'before') || []
    }))

    setShowFlightModal(false)
    setFlightForm({
      startOdometer: '',
      startFuel: '',
      fromCity: '',
      toCity: '',
      payment: '',
      givenBudget: '',
      fromCoords: null,
      toCoords: null,
      flightType: 'domestic',
      fuelType: 'metan',
      fuelUnit: 'kub',
      note: ''
    })
    showToast.success(`Mashrut ochilmoqda: ${fromCity} → ${toCity}`)
    api.post('/flights', payload)
      .then((res) => navigate(`/dashboard/flights/${res.data.data._id}`))
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
        // Revert on error
        fetchData(false)
      })
  }

  const activeFlight = flights.find(f => f.status === 'active')

  const handleAddExpense = async (expenseData) => {
    if (isDemoMode) {
      alert.info('Demo rejim', 'Demo versiyada ishlamaydi')
      return
    }

    setExpenseLoading(true)
    try {
      if (editingExpense) {
        // Optimistic update for edit
        const oldAmountUZS = editingExpense.amount || 0
        const newAmountUZS = expenseData.amount || 0
        const amountDiff = newAmountUZS - oldAmountUZS

        setDriver(prev => ({
          ...prev,
          expenses: prev.expenses?.map(e =>
            e._id === editingExpense._id ? { ...e, ...expenseData } : e
          ) || []
        }))

        // Update existing expense
        await api.put(`/drivers/${id}/expenses/${editingExpense._id}`, {
          ...expenseData,
          timing: editingExpense.timing // Keep original timing
        })
        showToast.success('Xarajat yangilandi')
      } else {
        // Add new expense - reys boshlanmaganda haydovchiga xarajat qo'shish
        const tempId = `temp_${Date.now()}`
        const newExpense = {
          ...expenseData,
          _id: tempId,
          date: new Date().toISOString()
        }

        // Optimistic update for add
        setDriver(prev => ({
          ...prev,
          expenses: [...(prev.expenses || []), newExpense]
        }))

        await api.post(`/drivers/${id}/add-expense`, {
          ...expenseData,
          timing: expenseData.timing || 'before'  // Reys boshlanmaganda 'before' bo'ladi
        })
        showToast.success('Xarajat qo\'shildi')
      }
      setEditingExpense(null)
      setShowExpenseModal(false)
      // Optimistic update yetarli - fetchData chaqirilmaslik
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
      // Revert on error
      fetchData(false)
    } finally {
      setExpenseLoading(false)
    }
  }

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'

  const driverStatusConfig = {
    busy: { label: 'Marshrutda', color: 'from-orange-500 to-amber-600', icon: Activity, bg: 'bg-orange-500' },
    offline: { label: 'Offline', color: 'from-slate-500 to-slate-600', icon: Clock, bg: 'bg-slate-500' },
    available: { label: "Bo'sh", color: 'from-emerald-500 to-teal-600', icon: CheckCircle, bg: 'bg-emerald-500' }
  }

  const totalPayment = flights.reduce((sum, f) => sum + (f.totalPayment || 0), 0)
  const totalExpenses = flights.reduce((sum, f) => sum + (f.totalExpenses || 0), 0)
  const totalProfit = flights.reduce((sum, f) => sum + (f.profit || 0), 0)
  const totalEarnings = (driver?.baseSalary || 0) + totalProfit

  if (!driver) return null

  const currentStatus = driverStatusConfig[driver.status] || driverStatusConfig.available
  const StatusIcon = currentStatus.icon


  return (
    <div className="space-y-5 pb-8">
      {/* Header with Action */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2d2d44] to-[#1a1a2e] text-white p-5 sm:p-6 rounded-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="relative">
          <button
            onClick={() => navigate('/dashboard/drivers')}
            className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
            <span>Haydovchilarga qaytish</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-lg">
                {driver.fullName?.charAt(0) || 'S'}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 ${currentStatus.bg} rounded-xl flex items-center justify-center border-2 border-[#1a1a2e]`}>
                <StatusIcon size={14} className="text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{driver.fullName}</h1>
              <p className="text-slate-400">@{driver.username}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 bg-gradient-to-r ${currentStatus.color} rounded-lg text-sm font-medium`}>
                  {currentStatus.label}
                </span>
                <span className="text-slate-400 text-sm flex items-center gap-1.5">
                  <Calendar size={14} /> {formatDate(driver.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Card-inside header */}
          {activeFlight ? (
            <div
              onClick={() => navigate(`/dashboard/flights/${activeFlight._id}`)}
              className="mt-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Route size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Faol marshrut</p>
                    <p className="font-bold text-white text-lg">{activeFlight.name || 'Joriy mashrut'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl">
                  <Play size={16} className="text-white" />
                  <span className="text-white font-medium">Davom</span>
                  <ChevronRight size={16} className="text-white" />
                </div>
              </div>
            </div>
          ) : driver.status !== 'busy' && (
            <div
              onClick={() => setShowFlightModal(true)}
              className="mt-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4 cursor-pointer hover:from-blue-600 hover:to-indigo-600 transition shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Truck size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Haydovchi bo'sh</p>
                    <p className="font-bold text-white text-lg">Yangi marshrut boshlash</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl">
                  <Play size={16} className="text-white" />
                  <span className="text-white font-medium">Boshlash</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Moliyaviy */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Moliyaviy</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-3xl font-bold text-emerald-600">{formatMoney(driver.totalEarnings || 0)}</p>
                <p className="text-sm text-gray-500 mt-2">Jami daromad</p>
              </div>
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-3xl font-bold text-amber-600">{formatMoney(driver.pendingEarnings || 0)}</p>
                <p className="text-sm text-gray-500 mt-2">Kutilmoqda</p>
              </div>
            </div>

            {/* Joriy balans-haydovchidagi pul */}
            {driver.currentBalance !== undefined && (
              <div className={`mt-4 p-4 rounded-xl ${driver.currentBalance > 0 ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : 'bg-slate-100 border border-slate-200'} `}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-6 h-6" />
                    <div>
                      <p className={`text-sm ${driver.currentBalance > 0 ? 'text-purple-200' : 'text-slate-500'} `}>Haydovchidagi pul</p>
                      <p className={`text-2xl font-bold ${driver.currentBalance > 0 ? 'text-white' : 'text-slate-600'} `}>{formatMoney(driver.currentBalance || 0)} so'm</p>
                    </div>
                  </div>
                  <p className={`text-xs ${driver.currentBalance > 0 ? 'text-purple-200' : 'text-slate-400'} `}>
                    {driver.currentBalance > 0 ? 'Avvalgi marshrutdan qolgan' : 'Qoldiq yo\'q'}
                  </p>
                </div>
              </div>
            )}

            {/* Marshrutlardan ulushlar */}
            {flights.filter(f => f.status === 'completed' && f.driverProfitAmount > 0).length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-600 font-medium mb-3">Marshrutlardan ulushlar</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {flights.filter(f => f.status === 'completed' && f.driverProfitAmount > 0).slice(0, 5).map(f => (
                    <div key={f._id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate flex-1">{f.name}</span>
                      <span className="text-purple-600 font-semibold ml-2">
                        +{formatMoney(f.driverProfitAmount)} ({f.driverProfitPercent || 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Jami daromad</p>
                <p className="text-3xl font-bold text-white">{formatMoney(driver.totalEarnings || 0)} <span className="text-base text-blue-200">so'm</span></p>
              </div>
              <TrendingUp size={32} className="text-emerald-300" />
            </div>
          </div>

          {/* Reyslar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Route size={20} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">Reyslar</h2>
                <span className="text-sm text-gray-400">({flights.length})</span>
              </div>
              {flights.filter(f => f.status === 'active').length > 0 && (
                <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium animate-pulse">
                  {flights.filter(f => f.status === 'active').length} faol
                </span>
              )}
            </div>
            {flights.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {flights.slice(0, 10).map((flight) => {
                  const hasDebt = flight.status === 'completed' && flight.driverOwes > 0
                  const paidAmount = flight.driverPaidAmount || 0
                  const remaining = (flight.driverOwes || 0) - paidAmount
                  const isPaid = flight.driverPaymentStatus === 'paid'
                  const isPartial = flight.driverPaymentStatus === 'partial'

                  return (
                    <div
                      key={flight._id}
                      onClick={() => navigate(`/dashboard/flights/${flight._id}`)}
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition border border-gray-100"
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${flight.status === 'active' ? 'bg-orange-500' :
                        flight.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-400'} `}>
                        <Route size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{flight.name || 'Marshrut'}</p>
                        <p className="text-sm text-gray-500">{formatDate(flight.createdAt)} • {flight.totalDistance || 0} km</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`text-sm font-medium ${flight.status === 'active' ? 'text-orange-600' :
                          flight.status === 'completed' ? 'text-emerald-600' : 'text-gray-500'} `}>
                          {flight.status === 'active' ? 'Faol' : flight.status === 'completed' ? 'Yopilgan' : 'Bekor'}
                        </span>
                        {flight.driverProfitAmount > 0 && (
                          <p className="text-sm font-bold text-purple-600">Ulush: +{formatMoney(flight.driverProfitAmount)}</p>
                        )}
                        {hasDebt && !isPaid && (
                          <p className={`text-xs ${isPartial ? 'text-amber-600' : 'text-red-500'} `}>
                            {isPartial ? `Qoldi: ${formatMoney(remaining)} ` : `Beradi: ${formatMoney(flight.driverOwes)} `}
                          </p>
                        )}
                        {isPaid && flight.driverOwes > 0 && (
                          <p className="text-xs text-emerald-600">✓ To'langan</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Route size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Hali reyslar yo'q</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <h2 className="font-bold text-gray-900 text-lg">Ma'lumotlar</h2>
              </div>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition flex items-center gap-2 border border-purple-200 hover:border-purple-300"
                title="Xarajat qo'shish"
              >
                <Plus size={18} />
                <span className="text-sm font-medium">Xarajat qo'shish</span>
              </button>
            </div>

            {/* Telefon */}
            <div className="p-5 bg-gray-50 rounded-2xl flex items-center gap-4 mb-4 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Phone size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Telefon</p>
                <p className="font-bold text-gray-900 text-lg">{driver.phone || 'Kiritilmagan'}</p>
              </div>
            </div>

            {/* Mashina */}
            {vehicle ? (
              <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={18} className="text-blue-200" />
                  <span className="text-blue-200 text-sm">Mashina</span>
                </div>
                <p className="text-3xl font-bold">{vehicle.plateNumber}</p>
                <p className="text-blue-200 mt-1">{vehicle.brand} {vehicle.model}</p>
              </div>
            ) : (
              <div className="p-5 bg-gray-50 rounded-2xl flex items-center gap-4 border border-gray-100">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Truck size={22} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mashina</p>
                  <p className="font-semibold text-gray-500">Biriktirilmagan</p>
                </div>
              </div>
            )}

            {/* Xarajatlar-Zamonaviy dizayn */}
            {driver.expenses && driver.expenses.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">💰 Xarajatlar</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {driver.expenses.slice(-50).reverse().map((exp, idx) => {
                    // EXPENSE_CATEGORIES dan label olish
                    const expenseLabel = (() => {
                      const labels = {
                        'fuel': "Yoqilg'i", 'fuel_metan': 'Metan', 'fuel_propan': 'Propan',
                        'fuel_benzin': 'Benzin', 'fuel_diesel': 'Dizel', 'food': 'Ovqat',
                        'toll': "Yo'l to'lovi", 'wash': 'Moyka', 'fine': 'Jarima',
                        'repair_small': "Mayda ta'mir", 'repair_major': "Katta ta'mir",
                        'oil': 'Moy almashtirish', 'filter': 'Filtr', 'filter_air': 'Havo filtri',
                        'filter_oil': 'Moy filtri', 'filter_cabin': 'Salon filtri',
                        'filter_gas': 'Gaz filtri', 'tire': 'Shina', 'accident': 'Avariya',
                        'insurance': "Sug'urta", 'border': 'Chegara', 'border_customs': 'Bojxona',
                        'border_transit': 'Tranzit', 'border_insurance': "Chegara sug'urta",
                        'border_other': 'Chegara boshqa', 'other': 'Boshqa'
                      }
                      return labels[exp.type] || exp.type
                    })()

                    // Icon va rang
                    const getExpenseIcon = (type) => {
                      const icons = {
                        'fuel': { icon: Fuel, color: '#3b82f6' },
                        'fuel_metan': { icon: CircleDot, color: '#3b82f6' },
                        'fuel_propan': { icon: Circle, color: '#eab308' },
                        'fuel_benzin': { icon: Droplet, color: '#ef4444' },
                        'fuel_diesel': { icon: Droplet, color: '#3b82f6' },
                        'food': { icon: Utensils, color: '#f97316' },
                        'toll': { icon: Car, color: '#6366f1' },
                        'wash': { icon: Droplet, color: '#06b6d4' },
                        'fine': { icon: FileText, color: '#ef4444' },
                        'repair_small': { icon: Wrench, color: '#f59e0b' },
                        'repair_major': { icon: Wrench, color: '#dc2626' },
                        'oil': { icon: Droplet, color: '#8b5cf6' },
                        'filter': { icon: Filter, color: '#10b981' }, // Filter icon needs import or use generic
                        'filter_air': { icon: Filter, color: '#10b981' },
                        'filter_oil': { icon: Droplet, color: '#8b5cf6' },
                        'filter_cabin': { icon: Filter, color: '#14b8a6' },
                        'filter_gas': { icon: CircleDot, color: '#f59e0b' },
                        'tire': { icon: Circle, color: '#1f2937' },
                        'accident': { icon: AlertCircle, color: '#ef4444' },
                        'insurance': { icon: Shield, color: '#10b981' },
                        'border': { icon: Navigation, color: '#8b5cf6' },
                        'border_customs': { icon: Building2, color: '#6366f1' },
                        'border_transit': { icon: Truck, color: '#f59e0b' },
                        'border_insurance': { icon: Shield, color: '#10b981' },
                        'border_other': { icon: MapPin, color: '#64748b' },
                        'other': { icon: Package, color: '#64748b' }
                      }
                      return icons[type] || { icon: Package, color: '#64748b' }
                    }

                    const { icon: Icon, color } = getExpenseIcon(exp.type)

                    return (
                      <div
                        key={exp._id || idx}
                        className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                            style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}>
                            <Icon size={24} style={{ color: color }} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-bold text-gray-900 text-base">{expenseLabel}</p>
                                <p className="text-sm text-gray-500">
                                  📅 {new Date(exp.date).toLocaleDateString('uz-UZ', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <p className="font-bold text-red-600 text-lg">-{formatMoney(exp.amount)} so'm</p>
                            </div>

                            {/* Description */}
                            {exp.description && (
                              <p className="text-sm text-gray-600 mb-2 bg-white/60 p-2 rounded-lg">
                                💬 {exp.description}
                              </p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  // Edit funksiyasi-ExpenseModal ochish
                                  setEditingExpense(exp)
                                  setShowExpenseModal(true)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                              >
                                <Pencil size={14} />
                                Tahrirlash
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm("Xarajatni o'chirishni xohlaysizmi?")) {
                                    try {
                                      // Delete API call
                                      await api.delete(`/drivers/${id}/expenses/${exp._id}`)
                                      showToast.success("Xarajat o'chirildi")
                                      fetchData(false)
                                    } catch (err) {
                                      showToast.error("Xatolik yuz berdi")
                                    }
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
                              >
                                <Trash2 size={14} />
                                O'chirish
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Marshrut ochish Modal */}
      {showFlightModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto"
          onClick={() => setShowFlightModal(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div
              className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Yangi marshrut</h2>
                      <p className="text-emerald-300 text-base">{driver.fullName}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowFlightModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleStartFlight} className="p-6 space-y-5">
                {/* Avvalgi qoldiq-agar bor bo'lsa */}
                {driver.currentBalance > 0 && (
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-6 h-6 text-purple-400" />
                        <div>
                          <p className="text-purple-300 text-sm">Avvalgi marshrutdan qolgan</p>
                          <p className="text-white font-bold text-xl">{formatMoney(driver.currentBalance)} so'm</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {vehicle && (
                  <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center gap-4">
                    <Truck size={22} className="text-blue-400" />
                    <div>
                      <p className="font-semibold text-white text-base">{vehicle.plateNumber}</p>
                      <p className="text-sm text-blue-300">{vehicle.brand}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-base font-medium text-emerald-200 mb-3">Marshrut turi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFlightForm({ ...flightForm, flightType: 'domestic' })}
                      className={`p-4 rounded-xl border-2 transition ${flightForm.flightType === 'domestic'
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400'} `}
                    >
                      <Flag size={28} className="mx-auto" />
                      <p className="font-medium text-base mt-1">Mahalliy</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlightForm({ ...flightForm, flightType: 'international' })}
                      className={`p-4 rounded-xl border-2 transition ${flightForm.flightType === 'international'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400'} `}
                    >
                      <Globe size={28} className="mx-auto" />
                      <p className="font-medium text-base mt-1">Xalqaro</p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base text-emerald-200 mb-2">
                      <Gauge size={14} className="inline mr-1" /> Spidometr (km)
                    </label>
                    <input
                      type="number"
                      value={flightForm.startOdometer}
                      onChange={(e) => setFlightForm({ ...flightForm, startOdometer: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="block text-base text-emerald-200 mb-2">
                      <Fuel size={14} className="inline mr-1" /> Yoqilg'i
                    </label>
                    <input
                      type="number"
                      value={flightForm.startFuel}
                      onChange={(e) => setFlightForm({ ...flightForm, startFuel: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>



                <div>
                  <label className="block text-base text-emerald-200 mb-2">Yoqilg'i turi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'metan', label: 'Metan', Icon: CircleDot, color: 'text-green-500', unit: 'kub' },
                      { value: 'propan', label: 'Propan', Icon: Circle, color: 'text-yellow-500', unit: 'kub' },
                      { value: 'benzin', label: 'Benzin', Icon: Fuel, color: 'text-red-500', unit: 'litr' },
                      { value: 'diesel', label: 'Dizel', Icon: Droplet, color: 'text-blue-500', unit: 'litr' }
                    ].map(fuel => (
                      <button
                        key={fuel.value}
                        type="button"
                        onClick={() => setFlightForm({ ...flightForm, fuelType: fuel.value, fuelUnit: fuel.unit })}
                        className={`p-3 rounded-xl border text-center transition ${flightForm.fuelType === fuel.value
                          ? 'border-emerald-500 bg-emerald-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400'} `}
                      >
                        <fuel.Icon size={24} className={`mx-auto ${fuel.color} `} />
                        <p className="text-xs mt-1">{fuel.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-base font-medium text-emerald-300 mb-3">Birinchi buyurtma</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Qayerdan *</label>
                      <AddressAutocomplete
                        value={flightForm.fromCity}
                        onChange={(val) => setFlightForm({ ...flightForm, fromCity: val })}
                        onSelect={(s) => {
                          setFlightForm(prev => ({ ...prev, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } }))
                        }}
                        placeholder="Toshkent"
                        focusColor="green"
                        domesticOnly={flightForm.flightType === 'domestic'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Qayerga *</label>
                      <AddressAutocomplete
                        value={flightForm.toCity}
                        onChange={(val) => setFlightForm({ ...flightForm, toCity: val })}
                        onSelect={(s) => {
                          setFlightForm(prev => ({ ...prev, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } }))
                        }}
                        placeholder="Samarqand"
                        focusColor="green"
                        domesticOnly={flightForm.flightType === 'domestic'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Berilgan pul (so'm)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={flightForm.givenBudget ? new Intl.NumberFormat('uz-UZ').format(flightForm.givenBudget) : ''}
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/\D/g, '')
                          setFlightForm({ ...flightForm, givenBudget: rawValue })
                        }}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                        placeholder="200,000"
                      />
                    </div>

                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    <FileText size={14} className="inline mr-1" /> Izoh (ixtiyoriy)
                  </label>
                  <textarea
                    value={flightForm.note}
                    onChange={(e) => setFlightForm({ ...flightForm, note: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-slate-500 focus:border-emerald-500 focus:outline-none min-h-[80px] resize-none"
                    placeholder="Marshrut bo'yicha qo'shimcha izohlar..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Play size={20} /> Marshrutni boshlash
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Xarajat qo'shish Modal */}
      {showExpenseModal && (
        <ExpenseModal
          flight={null}
          selectedLeg={null}
          editingExpense={editingExpense}
          onClose={() => {
            setShowExpenseModal(false)
            setEditingExpense(null)
          }}
          onSubmit={handleAddExpense}
        />
      )}
    </div>
  )
}
