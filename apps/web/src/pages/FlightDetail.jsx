import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, X, Trash2,
  Truck, User, Calendar, Sparkles, Zap, Wallet,
  FileText, Pencil, Plus
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAlert, FlightDetailSkeleton, NetworkError, NotFoundError } from '../components/ui'
import LocationPicker from '../components/LocationPicker'
import { connectSocket, joinBusinessRoom } from '../services/socket'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../store/authStore'
import {
  OdometerFuelCard,
  LegsWithExpenses,
  InternationalSection,
  FinancialSummary,
  formatMoney
} from '../components/flightDetail'
import FuelConsumptionCard from '../components/flightDetail/FuelConsumptionCard'
import BeforeExpensesCard from '../components/flightDetail/BeforeExpensesCard'
import PostExpensesCard from '../components/flightDetail/PostExpensesCard'
import MajorExpensesCard from '../components/flightDetail/MajorExpensesCard'
import {
  LegModal,
  ExpenseModal,
  CompleteModal,
  PaymentModal,
  PlatonModal,
  DriverPaymentModal,
  FlightEditModal,
  LegEditModal
} from '../components/flightDetail/AllModals'
import FlightExpensesModal from '../components/flightDetail/FlightExpensesModal'

export default function FlightDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const alert = useAlert()
  const { user } = useAuthStore()

  const [flight, setFlight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals
  const [showLegModal, setShowLegModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showFlightExpensesModal, setShowFlightExpensesModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [editingLeg, setEditingLeg] = useState(null)
  const [showPlatonModal, setShowPlatonModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDriverPaymentModal, setShowDriverPaymentModal] = useState(false)
  const [showFlightEditModal, setShowFlightEditModal] = useState(false)

  // Selected items
  const [selectedLegForPayment, setSelectedLegForPayment] = useState(null)
  const [selectedLegForExpense, setSelectedLegForExpense] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedLegIndex, setSelectedLegIndex] = useState(0)
  const [isEditingPayment, setIsEditingPayment] = useState(false)

  // Fetch flight
  const fetchFlight = useCallback(async (showLoader = true) => {
    
    if (id?.startsWith('temp_')) {
      setError({ type: 'notfound', message: 'Bu mashrut hali saqlanmagan' })
      setLoading(false)
      return
    }
    if (showLoader) setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/flights/${id}`)
      setFlight(res.data.data)
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setError({ type: 'notfound', message: 'Mashrut topilmadi' })
      } else {
        setError({ type: err.isNetworkError ? 'network' : 'generic', message: err.userMessage || 'Xatolik' })
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchFlight() }, [id])

  // Socket listeners - to'g'ridan-to'g'ri socket bilan ishlash
  useEffect(() => {
    // flight yuklangunga qadar kutamiz
    if (!flight?.user) return

    // Biznesmen ID ni flight dan olamiz (user authStore dan kelmasa ham ishlaydi)
    const businessId = flight.user._id || flight.user

    // Socket ni olish yoki yaratish
    const socket = connectSocket()

    // Biznesmen room ga ulanish - flight.user dan olamiz
    joinBusinessRoom(businessId)

    const handleUpdate = (data) => {
      // ID larni string ga o'girish va solishtirish
      const eventFlightId = data.flight?._id?.toString()
      const currentFlightId = id?.toString()

      if (eventFlightId && eventFlightId === currentFlightId) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        setFlight(newFlight)
        if (data.message) showToast.success(data.message)
      }
    }

    // flight-completed uchun alohida handler - toast ko'rsatmaslik
    // chunki CompleteModal da allaqachon toast ko'rsatilgan
    const handleCompleted = (data) => {
      const eventFlightId = data.flight?._id?.toString()
      const currentFlightId = id?.toString()

      if (eventFlightId && eventFlightId === currentFlightId) {
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        setFlight(newFlight)
        // Toast ko'rsatmaslik - allaqachon CompleteModal da ko'rsatilgan
      }
    }

    const handleExpenseConfirmed = (data) => {
      // ID larni string ga o'girish va solishtirish
      const eventFlightId = data.flight?._id?.toString()
      const currentFlightId = id?.toString()

      if (eventFlightId && eventFlightId === currentFlightId) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        setFlight(newFlight)
        showToast.success('Haydovchi xarajatni tasdiqladi')
      }
    }

    // Barcha kerakli eventlarni tinglash
    socket.on('flight-updated', handleUpdate)
    socket.on('flight-completed', handleCompleted) // Alohida handler
    socket.on('flight-confirmed', handleUpdate)
    socket.on('expense-confirmed', handleExpenseConfirmed)

    return () => {
      socket.off('flight-updated', handleUpdate)
      socket.off('flight-completed', handleCompleted)
      socket.off('flight-confirmed', handleUpdate)
      socket.off('expense-confirmed', handleExpenseConfirmed)
    }
  }, [id, flight?.user])

  if (loading) return <FlightDetailSkeleton />
  if (error?.type === 'notfound') return <NotFoundError title="Mashrut topilmadi" onBack={() => navigate('/dashboard/drivers')} />
  if (error?.type === 'network') return <NetworkError onRetry={fetchFlight} message={error.message} />
  if (!flight) return null

  const isActive = flight.status === 'active'
  const lastLeg = flight.legs?.[flight.legs.length - 1]

  // Handlers
  const handleAddLeg = () => setShowLegModal(true)

  const handleAddExpense = (leg, idx) => {
    setSelectedLegForExpense({ leg, index: idx })
    setEditingExpense(null)
    setShowExpenseModal(true)
  }

  const handleViewFlightExpenses = () => {
    setShowFlightExpensesModal(true)
  }

  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async (expenseId) => {
    const confirmed = await alert.confirm({ title: "O'chirish", message: "Xarajatni o'chirishni xohlaysizmi?", type: "danger" })
    if (!confirmed) return

    const deletedExpense = flight.expenses?.find(e => e._id === expenseId)
    setFlight(prev => ({
      ...prev,
      expenses: prev.expenses?.filter(e => e._id !== expenseId) || [],
      totalExpenses: (prev.totalExpenses || 0) - (deletedExpense?.amount || 0)
    }))
    showToast.success('Xarajat o\'chirildi')

    api.delete(`/flights/${id}/expenses/${expenseId}`)
      .then(res => res.data?.data && setFlight(res.data.data))
      .catch(() => fetchFlight())
  }

  const handleAddPayment = (leg) => {
    setSelectedLegForPayment(leg)
    setIsEditingPayment(false)
    setShowPaymentModal(true)
  }

  const handleEditPayment = (leg) => {
    setSelectedLegForPayment(leg)
    setIsEditingPayment(true)
    setShowPaymentModal(true)
  }

  const handleEditPlaton = () => setShowPlatonModal(true)

  const handleCancelFlight = async () => {
    const confirmed = await alert.confirm({ title: "Bekor qilish", message: "Marshrutni bekor qilishni xohlaysizmi?", type: "danger" })
    if (!confirmed) return
    setFlight(prev => ({ ...prev, status: 'cancelled' }))
    showToast.success('Marshrut bekor qilindi')
    api.put(`/flights/${id}/cancel`).then(res => res.data?.data && setFlight(res.data.data)).catch(() => fetchFlight())
  }

  const handleDeleteLeg = async (legId) => {
    const confirmed = await alert.confirm({
      title: "Bosqichni o'chirish",
      message: "Ushbu bosqichni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.",
      type: "danger"
    })
    if (!confirmed) return

    try {
      const res = await api.delete(`/flights/${id}/legs/${legId}`)
      if (res.data?.data) {
        setFlight(res.data.data)
        showToast.success('Bosqich o\'chirildi')
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const handleUpdateLeg = async (data) => {
    if (!editingLeg) return

    try {
      const res = await api.put(`/flights/${id}/legs/${editingLeg._id}`, data)
      if (res.data?.data) {
        setFlight(res.data.data)
        showToast.success('Bosqich yangilandi')
        setEditingLeg(null)
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  const handleDeleteFlight = async () => {
    const confirmed = await alert.confirm({ title: "O'chirish", message: "Marshrutni butunlay o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.", type: "danger" })
    if (!confirmed) return

    try {
      await api.delete(`/flights/${id}`)
      showToast.success('Marshrut o\'chirildi')
      navigate('/dashboard/drivers')
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  // Hisob-kitoblar
  // Reys oldidan xarajatlarni ajratish
  const beforeExpenses = (flight.expenses || []).filter(e => e.timing === 'before')
  const beforeExpensesTotal = beforeExpenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

  // Reysdan keyingi xarajatlar
  const afterExpenses = (flight.expenses || []).filter(e => e.timing === 'after')
  const afterExpensesTotal = afterExpenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

  // YANGI: Katta xarajatlarni ajratish (expenseClass: 'heavy')
  const majorExpenses = (flight.expenses || []).filter(e => e.expenseClass === 'heavy')
  const majorExpensesTotal = majorExpenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

  // YANGI: Faqat yengil xarajatlar (expenseClass: 'light' yoki undefined)
  const lightExpenses = (flight.expenses || []).filter(e => !e.expenseClass || e.expenseClass === 'light')
  const lightExpensesTotal = lightExpenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

  const borderExpenses = flight.borderCrossingsTotalUZS || (flight.borderCrossingsTotalUSD ? Math.round(flight.borderCrossingsTotalUSD * 12800) : 0)
  const platonExpenses = flight.platon?.amountInUZS || (flight.platon?.amountInUSD ? Math.round(flight.platon.amountInUSD * 12800) : 0)

  // YANGI: Jami xarajatlar - FAQAT YENGIL XARAJATLAR (katta xarajatlar alohida)
  // Chegara va Platon ham yengil xarajatlar hisoblanadi
  const allExpenses = lightExpensesTotal + borderExpenses + platonExpenses

  // Jami kirim (avvalgi qoldiq bilan)
  const previousBalance = flight.previousBalance || 0
  
  // MUHIM: Faqat naqd to'lovlar shofyor qo'liga tushadi
  const cashPayments = (flight.legs || []).reduce((sum, leg) => {
    return sum + (leg.paymentType === 'cash' ? (leg.payment || 0) : 0)
  }, 0)
  
  // Peritsena to'lovlar firma hisobida qoladi
  const peritsenaPayments = (flight.legs || []).reduce((sum, leg) => {
    return sum + (leg.paymentType === 'peritsena' ? (leg.payment || 0) : 0)
  }, 0)
  
  // TUZATILDI: totalIncome ga previousBalance qo'shilmaydi (u eski reysdan qolgan pul)
  const totalIncome = cashPayments + peritsenaPayments + (flight.totalGivenBudget || 0)
  
  // Peritsena firma xarajatlari
  const peritsenaFee = flight.totalPeritsenaFee || 0
  
  // Sof foyda (Peritsena xarajatlari ayirilgan, KATTA XARAJATLAR AYIRILMAGAN)
  // MUHIM: previousBalance bu yerda ishlatilmaydi, chunki u eski reysdan qolgan pul
  const netProfit = totalIncome - allExpenses - peritsenaFee
  
  // YANGI: Haydovchining qo'lidagi pul - backend dan keladi
  const driverCashInHand = flight.driverCashInHand || 0

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-5">
      {/* Header - Rounded Container */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden mb-4">
        <div className="px-5 sm:px-8 py-6">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard/drivers')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Orqaga</span>
          </button>

          {/* Header Content */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left - Driver Info */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ${isActive
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                  {flight.driver?.fullName?.charAt(0) || '?'}
                </div>
                {isActive && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-slate-900">
                    <Zap size={12} className="text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {flight.name || 'Yangi marshrut'}
                  </h1>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {isActive ? 'Faol' : 'Yopilgan'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <span className="flex items-center gap-1.5">
                    <User size={14} />
                    {flight.driver?.fullName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Truck size={14} />
                    {flight.vehicle?.plateNumber}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(flight.createdAt).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - 5 ta asosiy ko'rsatkich */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            {/* 1. Yo'l uchun berilgan */}
            <div className="bg-amber-500/20 rounded-xl p-4 border border-amber-500/30">
              <p className="text-amber-400 font-bold text-xl sm:text-2xl">{formatMoney(flight.totalGivenBudget || 0)}</p>
              <p className="text-amber-300/70 text-xs mt-1">Yo'l uchun</p>
            </div>

            {/* 2. Mijozdan olingan (naqd + peritsena) */}
            <div className="bg-emerald-500/20 rounded-xl p-4 border border-emerald-500/30">
              <p className="text-emerald-400 font-bold text-xl sm:text-2xl">+{formatMoney(cashPayments + peritsenaPayments)}</p>
              <p className="text-emerald-300/70 text-xs mt-1">
                Mijozdan ({flight.legs?.length || 0} ta reys)
              </p>
              {peritsenaPayments > 0 && (
                <p className="text-emerald-300/50 text-xs mt-1">
                  {formatMoney(cashPayments)} naqd + {formatMoney(peritsenaPayments)} peritsena
                </p>
              )}
            </div>

            {/* 3. Sarflangan (faqat yengil xarajatlar) */}
            <div className="bg-red-500/20 rounded-xl p-4 border border-red-500/30">
              <p className="text-red-400 font-bold text-xl sm:text-2xl">-{formatMoney(allExpenses)}</p>
              <p className="text-red-300/70 text-xs mt-1">Sarflangan (yengil)</p>
              {majorExpensesTotal > 0 && (
                <p className="text-orange-300/70 text-xs mt-1">
                  Katta: -{formatMoney(majorExpensesTotal)}
                </p>
              )}
            </div>

            {/* 4. YANGI: Haydovchining qo'lidagi pul */}
            <div className={`rounded-xl p-4 border ${driverCashInHand >= 0 ? 'bg-purple-500/20 border-purple-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
              <p className={`font-bold text-xl sm:text-2xl ${driverCashInHand >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                {formatMoney(driverCashInHand)}
              </p>
              <p className={`text-xs mt-1 ${driverCashInHand >= 0 ? 'text-purple-300/70' : 'text-rose-300/70'}`}>
                Haydovchida
              </p>
              <p className="text-purple-300/50 text-xs mt-1">
                {driverCashInHand >= 0 ? 'Berishi kerak' : 'Olishi kerak'}
              </p>
            </div>

            {/* 5. Sof foyda */}
            {isActive ? (
              // Faol marshrut - sof foyda ko'rsatish
              <div className={`rounded-xl p-4 border ${netProfit >= 0 ? 'bg-blue-500/20 border-blue-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
                <p className={`font-bold text-xl sm:text-2xl ${netProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
                </p>
                <p className={`text-xs mt-1 ${netProfit >= 0 ? 'text-blue-300/70' : 'text-rose-300/70'}`}>
                  Sof foyda
                </p>
                {/* Peritsena firma xarajatlari ko'rsatish */}
                {peritsenaFee > 0 && (
                  <p className="text-blue-300/50 text-xs mt-1">
                    Firma xarajati: -{formatMoney(peritsenaFee)}
                  </p>
                )}
                {/* Reys oldidan xarajatlar ko'rsatish */}
                {beforeExpensesTotal > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-red-300">
                      Reys oldidan: -{formatMoney(beforeExpensesTotal)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Yopilgan mashrut - biznes foydasi
              <div className={`rounded-xl p-4 border ${(flight.businessProfit || netProfit) >= 0 ? 'bg-blue-500/20 border-blue-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
                <p className={`font-bold text-xl sm:text-2xl ${(flight.businessProfit || netProfit) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {(flight.businessProfit || netProfit) >= 0 ? '+' : ''}{formatMoney(flight.businessProfit || netProfit)}
                </p>
                <p className="text-xs mt-1 text-blue-300/70">
                  Biznes foydasi {flight.driverProfitPercent ? `(${flight.driverProfitPercent}% ayirilgan)` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flight Notes - Agar bor bo'lsa yoki faol reys bo'lsa */}
      {(flight.notes || isActive) && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm group relative">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Marshrut bo'yicha umumiy izoh</p>
                {isActive && (
                  <button
                    onClick={() => setShowFlightEditModal(true)}
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Izohni tahrirlash"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
              {flight.notes ? (
                <p className="text-white text-base leading-relaxed">{flight.notes}</p>
              ) : (
                <button
                  onClick={() => setShowFlightEditModal(true)}
                  className="text-slate-500 text-sm hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} /> Izoh qo'shish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        {/* Avvalgi qoldiq - agar bor bo'lsa */}
        {(flight.previousBalance > 0 || flight.driver?.currentBalance > 0) && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-purple-200 text-sm">Avvalgi marshrutdan qolgan</p>
                  <p className="text-white font-bold text-xl">{formatMoney(flight.previousBalance || 0)} so'm</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-purple-200 text-xs">Haydovchida</p>
                <p className="text-white font-semibold">{flight.driver?.fullName}</p>
              </div>
            </div>
          </div>
        )}

        <OdometerFuelCard flight={flight} onEdit={() => setShowFlightEditModal(true)} />

        {/* Reys oldidan xarajatlar */}
        {beforeExpenses.length > 0 && (
          <BeforeExpensesCard
            expenses={beforeExpenses}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        )}

        {/* Yoqilg'i sarflanishi statistikasi */}
        <FuelConsumptionCard flight={flight} />

        {/* YANGI: Katta xarajatlar - alohida bo'lim */}
        <MajorExpensesCard
          expenses={majorExpenses}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          isActive={isActive}
        />

        <LegsWithExpenses
          flight={flight}
          isActive={isActive}
          onAddLeg={handleAddLeg}
          onAddExpense={handleAddExpense}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onAddPayment={handleAddPayment}
          onEditPayment={handleEditPayment}
          onEditLeg={setEditingLeg}
          onDeleteLeg={handleDeleteLeg}
          selectedLegIndex={selectedLegIndex}
          onSelectedLegChange={setSelectedLegIndex}
          onViewFlightExpenses={handleViewFlightExpenses}
        />

        <InternationalSection
          flight={flight}
          isActive={isActive}
          onEditPlaton={handleEditPlaton}
        />

        {/* Moliyaviy xulosa - faqat yopilgan reyslar uchun */}
        {!isActive && (
          <>
            <FinancialSummary
              flight={flight}
              onCollectPayment={() => setShowDriverPaymentModal(true)}
            />

            {/* Reysdan keyingi xarajatlar */}
            <PostExpensesCard
              expenses={afterExpenses}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />

            {/* Reysdan keyin xarajat qo'shish tugmasi */}
            <div className="mt-4">
              <button
                onClick={() => {
                  setSelectedLegForExpense(null)
                  setEditingExpense(null)
                  setShowExpenseModal(true)
                }}
                className="w-full py-4 bg-white border-2 border-dashed border-purple-300 text-purple-600 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-50 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">+</span>
                </div>
                Reysdan keyin xarajat qo'shish
              </button>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {isActive && (
          <div className="space-y-3 pt-3">
            <button
              onClick={() => setShowCompleteModal(true)}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-xl active:scale-[0.99] transition-all"
            >
              <CheckCircle size={22} />
              Marshrutni yopish
              <Sparkles size={18} className="text-amber-300" />
            </button>

            <button
              onClick={handleCancelFlight}
              className="w-full py-4 bg-white text-red-500 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 border border-red-100 hover:bg-red-50 transition-colors"
            >
              <X size={18} />
              Marshrutni bekor qilish
            </button>

            <button
              onClick={handleDeleteFlight}
              className="w-full py-4 bg-white text-red-600 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 border border-red-100 hover:bg-red-50 transition-colors mt-2"
            >
              <Trash2 size={18} />
              O'chirish
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLegModal && (
        <LegModal
          flight={flight}
          onClose={() => setShowLegModal(false)}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowLegModal(false)
            showToast.success('Buyurtma qo\'shildi')

            // 🚀 Optimistic update
            const tempId = `temp_${Date.now()}`
            const newLeg = { ...data, _id: tempId, createdAt: new Date().toISOString() }
            const newLegsCount = (flight.legs?.length || 0) + 1

            setFlight(prev => ({
              ...prev,
              legs: [...(prev.legs || []), newLeg],
              totalPayment: (prev.totalPayment || 0) + (Number(data.payment) || 0),
              totalGivenBudget: (prev.totalGivenBudget || 0) + (Number(data.givenBudget) || 0)
            }))
            setSelectedLegIndex(newLegsCount - 1)

            // Background da serverga yuborish
            api.post(`/flights/${id}/legs`, data)
              .then(res => {
                if (res.data?.data) {
                  setFlight(res.data.data)
                  const actualLegsCount = res.data.data?.legs?.length || 0
                  if (actualLegsCount > 0) setSelectedLegIndex(actualLegsCount - 1)
                }
              })
              .catch(() => fetchFlight(false))
          }}
          onOpenLocationPicker={() => { setShowLegModal(false); setShowLocationPicker(true) }}
        />
      )}

      {editingLeg && (
        <LegEditModal
          leg={editingLeg}
          onClose={() => setEditingLeg(null)}
          onSubmit={handleUpdateLeg}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal
          flight={flight}
          selectedLeg={selectedLegForExpense}
          editingExpense={editingExpense}
          onClose={() => { setShowExpenseModal(false); setSelectedLegForExpense(null); setEditingExpense(null) }}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowExpenseModal(false)
            showToast.success(editingExpense ? 'Yangilandi' : 'Qo\'shildi')

            // 🚀 Optimistic update - UI ni darhol yangilash
            if (editingExpense) {
              const oldAmountUZS = editingExpense.amountInUZS || editingExpense.amount || 0
              const newAmountUZS = data.amountInUZS || data.amount || 0
              const amountDiff = newAmountUZS - oldAmountUZS

              setFlight(prev => {
                const newTotalExpenses = (prev.totalExpenses || 0) + amountDiff
                const newNetProfit = (prev.totalIncome || 0) - newTotalExpenses

                return {
                  ...prev,
                  expenses: prev.expenses?.map(e =>
                    e._id === editingExpense._id ? { ...e, ...data } : e
                  ) || [],
                  totalExpenses: newTotalExpenses,
                  netProfit: newNetProfit,
                  businessProfit: newNetProfit
                }
              })
              // Background da serverga yuborish
              api.put(`/flights/${id}/expenses/${editingExpense._id}`, {
                ...data,
                timing: editingExpense.timing // Keep original timing
              })
                .catch(() => fetchFlight(false))
            } else {
              const tempId = `temp_${Date.now()}`
              // Agar reys yopilgan bo'lsa, timing = 'after'
              const timing = !isActive ? 'after' : 'during'

              const newExpense = { ...data, _id: tempId, createdAt: new Date().toISOString(), timing }
              const amountUZS = Number(data.amountInUZS) || Number(data.amount) || 0

              setFlight(prev => {
                const newTotalExpenses = (prev.totalExpenses || 0) + amountUZS
                const newNetProfit = (prev.totalIncome || 0) - newTotalExpenses

                return {
                  ...prev,
                  expenses: [...(prev.expenses || []), newExpense],
                  totalExpenses: newTotalExpenses,
                  netProfit: newNetProfit,
                  businessProfit: newNetProfit
                }
              })
              // Background da serverga yuborish
              api.post(`/flights/${id}/expenses`, { ...data, timing })
                .catch(() => fetchFlight(false))
            }

            setSelectedLegForExpense(null)
            setEditingExpense(null)
          }}
        />
      )}

      {showCompleteModal && (
        <CompleteModal
          flight={flight}
          onClose={() => setShowCompleteModal(false)}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowCompleteModal(false)
            showToast.success('Marshrut yopildi')

            // Hisob-kitob
            const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0)
            const totalExpenses = flight.totalExpenses || 0
            const lightExpenses = flight.lightExpenses || 0
            const netProfit = totalIncome - totalExpenses
            const percent = data.driverProfitPercent || 0

            // MUHIM: Shofyor ulushi yengil foydadan (katta xarajatlar ayirilmagan) hisoblanadi
            const basis = totalIncome - lightExpenses
            const driverProfitAmount = basis > 0 && percent > 0 ? Math.round(basis * percent / 100) : 0
            const businessProfit = netProfit - driverProfitAmount

            // 🚀 Optimistic update - shofyor ulushi bilan VA status completed
            setFlight(prev => ({
              ...prev,
              status: 'completed',
              completedAt: new Date().toISOString(),
              endOdometer: data.endOdometer,
              endFuel: data.endFuel,
              driverProfitPercent: percent,
              driverProfitAmount: driverProfitAmount,
              businessProfit: businessProfit,
              driverOwes: businessProfit
            }))

            // Background da serverga yuborish
            api.put(`/flights/${id}/complete`, data)
              .then(res => {
                if (res.data?.data) {
                  setFlight(res.data.data)
                }
              })
              .catch(() => {
                // Xatolik bo'lsa, qayta yuklash
                fetchFlight(false)
              })
          }}
        />
      )}

      {showPaymentModal && selectedLegForPayment && (
        <PaymentModal
          leg={selectedLegForPayment}
          isEditing={isEditingPayment}
          onClose={() => { setShowPaymentModal(false); setSelectedLegForPayment(null); setIsEditingPayment(false) }}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowPaymentModal(false)
            showToast.success(isEditingPayment ? 'To\'lov yangilandi' : 'To\'lov saqlandi')

            // 🚀 Yangi format: { payment, paymentType, transferFeePercent }
            const legId = selectedLegForPayment._id
            const oldPayment = selectedLegForPayment.payment || 0
            const newPayment = typeof data === 'object' ? (data.payment || 0) : Number(data) || 0
            const paymentType = typeof data === 'object' ? (data.paymentType || 'cash') : 'cash'
            const transferFeePercent = typeof data === 'object' ? (data.transferFeePercent || 0) : 0

            setFlight(prev => ({
              ...prev,
              legs: prev.legs?.map(l =>
                l._id === legId ? { ...l, payment: newPayment, paymentType, transferFeePercent } : l
              ) || [],
              totalPayment: (prev.totalPayment || 0) - oldPayment + newPayment
            }))

            setSelectedLegForPayment(null)
            setIsEditingPayment(false)

            // Background da serverga yuborish
            const payload = typeof data === 'object' ? data : { payment: data }
            api.put(`/flights/${id}/legs/${legId}/payment`, payload)
              .then(res => res.data?.data && setFlight(res.data.data))
              .catch(() => fetchFlight(false))
          }}
        />
      )}

      {showPlatonModal && (
        <PlatonModal
          flight={flight}
          onClose={() => setShowPlatonModal(false)}
          onSubmit={(data) => {
            api.put(`/flights/${id}/platon`, data).then(() => fetchFlight())
            setShowPlatonModal(false)
            showToast.success('Platon saqlandi')
          }}
        />
      )}

      {showDriverPaymentModal && (
        <DriverPaymentModal
          flight={flight}
          onClose={() => setShowDriverPaymentModal(false)}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowDriverPaymentModal(false)
            showToast.success('To\'lov qabul qilindi')

            // 🚀 Optimistic update
            const newPaidAmount = (flight.driverPaidAmount || 0) + data.amount
            const totalOwed = flight.driverOwes || 0
            const newRemainingDebt = totalOwed - newPaidAmount
            const newStatus = newRemainingDebt <= 0 ? 'paid' : 'partial'

            setFlight(prev => ({
              ...prev,
              driverPaidAmount: newPaidAmount,
              driverRemainingDebt: newRemainingDebt,
              driverPaymentStatus: newStatus,
              driverPaymentDate: newStatus === 'paid' ? new Date().toISOString() : prev.driverPaymentDate,
              driverPayments: [...(prev.driverPayments || []), { amount: data.amount, date: new Date().toISOString(), note: data.note || '' }]
            }))

            // Background da serverga yuborish
            api.post(`/flights/${id}/driver-payment`, data)
              .then(res => {
                if (res.data?.data) setFlight(res.data.data)
              })
              .catch(err => {
                showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
                fetchFlight(false)
              })
          }}
        />
      )}

      {showLocationPicker && (
        <LocationPicker
          onSelect={() => {
            setShowLocationPicker(false)
            setShowLegModal(true)
          }}
          onClose={() => { setShowLocationPicker(false); setShowLegModal(true) }}
          initialStart={lastLeg?.toCoords}
          initialStartAddress={lastLeg?.toCity}
          endOnly={flight?.legs?.length > 0}
        />
      )}

      {showFlightEditModal && (
        <FlightEditModal
          flight={flight}
          onClose={() => setShowFlightEditModal(false)}
          onSubmit={(data) => {
            // 🚀 Modal ni darhol yopish
            setShowFlightEditModal(false)
            showToast.success('Ma\'lumotlar saqlandi')

            // 🚀 Optimistic update - barcha maydonlar
            setFlight(prev => ({
              ...prev,
              name: data.name || prev.name,
              notes: data.notes,
              startOdometer: data.startOdometer,
              startFuel: data.startFuel,
              totalGivenBudget: data.totalGivenBudget,
              totalPayment: data.totalPayment
            }))

            // Background da serverga yuborish
            api.put(`/flights/${id}`, data)
              .then(res => res.data?.data && setFlight(res.data.data))
              .catch(() => fetchFlight(false))
          }}
        />
      )}
    </div>
  )
}
