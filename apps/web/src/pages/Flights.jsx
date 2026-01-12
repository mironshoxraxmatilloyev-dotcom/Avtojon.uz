import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Plus, X, Route, Calendar, Globe, Flag,
  Activity, CheckCircle, Fuel, Gauge, Wallet,
  ChevronDown, ChevronUp, Trash2, DollarSign, ArrowRight,
  Utensils, Wrench, Car, FileText, Package, CircleDot, Circle, Droplet
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { useAlert } from '../components/ui'
import { useSocket } from '../hooks/useSocket'

// Davlatlar - Flag icon ishlatiladi
const COUNTRIES = {
  UZB: { name: "O'zbekiston", code: 'UZ' },
  KZ: { name: 'Qozog\'iston', code: 'KZ' },
  RU: { name: 'Rossiya', code: 'RU' }
}

// Valyutalar
const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar' },
  UZS: { symbol: 'so\'m', name: 'So\'m' },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

// Asosiy xarajat turlari - Lucide iconlar
const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Yoqilg\'i', Icon: Fuel, color: 'text-amber-500' },
  { value: 'food', label: 'Ovqat', Icon: Utensils, color: 'text-green-500' },
  { value: 'repair', label: 'Ta\'mir', Icon: Wrench, color: 'text-red-500' },
  { value: 'toll', label: 'Yo\'l to\'lovi', Icon: Car, color: 'text-blue-500' },
  { value: 'fine', label: 'Jarima', Icon: FileText, color: 'text-purple-500' },
  { value: 'other', label: 'Boshqa', Icon: Package, color: 'text-gray-500' }
]

// Yoqilg'i turlari - Lucide iconlar
const FUEL_TYPES = [
  { value: 'fuel_metan', label: 'Metan', Icon: CircleDot, color: 'text-green-500', unit: 'kub' },
  { value: 'fuel_propan', label: 'Propan', Icon: Circle, color: 'text-yellow-500', unit: 'kub' },
  { value: 'fuel_benzin', label: 'Benzin', Icon: Fuel, color: 'text-red-500', unit: 'litr' },
  { value: 'fuel_diesel', label: 'Dizel', Icon: Droplet, color: 'text-blue-500', unit: 'litr' }
]

// Eski format uchun (display) - Lucide iconlar
const EXPENSE_TYPES = [
  ...FUEL_TYPES,
  { value: 'food', label: 'Ovqat', Icon: Utensils, color: 'text-green-500' },
  { value: 'repair', label: 'Ta\'mir', Icon: Wrench, color: 'text-red-500' },
  { value: 'toll', label: 'Yo\'l to\'lovi', Icon: Car, color: 'text-blue-500' },
  { value: 'fine', label: 'Jarima', Icon: FileText, color: 'text-purple-500' },
  { value: 'other', label: 'Boshqa', Icon: Package, color: 'text-gray-500' }
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
  const { socket, joinBusinessRoom } = useSocket()

  // 🔌 Biznesmen xonasiga qo'shilish - real-time uchun
  useEffect(() => {
    if (user?._id && !isDemoMode) {
      joinBusinessRoom(user._id)
    }
  }, [user?._id, isDemoMode, joinBusinessRoom])

  // 🔌 Socket.io - Real-time yangilanishlar
  useEffect(() => {
    if (!socket || isDemoMode) return

    // Flight boshlanganda
    socket.on('flight-started', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        setFlights(prev => [newFlight, ...prev])
        showToast.success(data.message || 'Yangi marshrut boshlandi!')
      }
    })

    // Flight yangilanganda (xarajat, buyurtma qo'shilganda)
    socket.on('flight-updated', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        if (data.message) {
          showToast.info(data.message)
        }
      }
    })

    // Flight yopilganda
    socket.on('flight-completed', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        showToast.success(data.message || 'Marshrut yopildi!')
      }
    })

    // Flight tasdiqlanganda
    socket.on('flight-confirmed', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        showToast.success(data.message || 'Mashrut tasdiqlandi!')
      }
    })

    // Flight o'chirilganda
    socket.on('flight-deleted', (data) => {
      if (data.flightId) {
        const deletedId = data.flightId?.toString()
        setFlights(prev => prev.filter(f => f._id?.toString() !== deletedId))
        showToast.warning(data.message || 'Mashrut o\'chirildi')
      }
    })

    // Flight bekor qilinganda
    socket.on('flight-cancelled', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        showToast.warning(data.message || 'Marshrut bekor qilindi')
      }
    })

    // Xarajat tasdiqlanganda (haydovchi tomonidan)
    socket.on('expense-confirmed', (data) => {
      if (data.flight) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(data.flight))
        const newFlightId = newFlight._id?.toString()
        setFlights(prev => prev.map(f => f._id?.toString() === newFlightId ? newFlight : f))
        showToast.success(data.message || 'Haydovchi xarajatni tasdiqladi')
      }
    })

    return () => {
      socket.off('flight-started')
      socket.off('flight-updated')
      socket.off('flight-completed')
      socket.off('flight-confirmed')
      socket.off('flight-deleted')
      socket.off('flight-cancelled')
      socket.off('expense-confirmed')
    }
  }, [socket, isDemoMode])

  // Modals
  const [showLegModal, setShowLegModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showBorderModal, setShowBorderModal] = useState(false)
  const [showPlatonModal, setShowPlatonModal] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)

  // Forms
  const [legForm, setLegForm] = useState({ toCity: '', payment: '', distance: '' })
  const [expenseForm, setExpenseForm] = useState({
    category: 'fuel', // asosiy kategoriya
    type: 'fuel_benzin', // yoqilg'i turi (faqat fuel kategoriyasi uchun)
    amount: '',
    description: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0] // bugungi sana
  })
  const [completeForm, setCompleteForm] = useState({ endOdometer: '', endFuel: '', driverProfitPercent: '' })
  const [borderForm, setBorderForm] = useState({
    fromCountry: 'UZB', toCountry: 'KZ', borderName: '',
    customsFee: '', transitFee: '', insuranceFee: '', otherFees: '', currency: 'USD', note: ''
  })
  const [platonForm, setPlatonForm] = useState({ amount: '', currency: 'RUB', distanceKm: '', note: '' })
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
  const formatDateTime = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    if (isNaN(d.getTime())) return '-'
    
    const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
    const day = d.getDate()
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    
    return `${day}-${month}, ${year} • ${hours}:${minutes}`
  }

  // Yangi buyurtma qo'shish
  const handleAddLeg = (e) => {
    e.preventDefault()
    if (!legForm.toCity) {
      showToast.error('Qayerga shahrini kiriting!')
      return
    }

    const flightId = selectedFlight._id
    const lastLeg = selectedFlight.legs?.[selectedFlight.legs.length - 1]
    const legData = {
      fromCity: lastLeg?.toCity || '',
      toCity: legForm.toCity,
      payment: Number(legForm.payment) || 0,
      distance: Number(legForm.distance) || 0
    }

    // 🚀 OPTIMISTIC UPDATE - UI darhol yangilanadi
    const tempLeg = { _id: 'temp_' + Date.now(), ...legData, status: 'in_progress' }
    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      legs: [...(f.legs || []), tempLeg],
      totalPayment: (f.totalPayment || 0) + legData.payment,
      totalDistance: (f.totalDistance || 0) + legData.distance
    } : f))

    setShowLegModal(false)
    setLegForm({ toCity: '', payment: '', distance: '' })
    showToast.success('Buyurtma qo\'shildi!')

    // Fonda API
    api.post(`/flights/${flightId}/legs`, legData)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchData()
      })
  }

  // Xarajat qo'shish
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (submitting) return

    // Validatsiya
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert.warning('Maydon to\'ldirilmagan', 'Xarajat summasini kiriting!')
      return
    }

    const isFuel = expenseForm.category === 'fuel'
    const fuelType = FUEL_TYPES.find(f => f.value === expenseForm.type)
    const expenseLabel = isFuel ? fuelType?.label : EXPENSE_CATEGORIES.find(c => c.value === expenseForm.category)?.label
    const formattedAmount = new Intl.NumberFormat('uz-UZ').format(expenseForm.amount)

    const expenseData = {
      type: isFuel ? expenseForm.type : expenseForm.category,
      amount: Number(expenseForm.amount),
      description: expenseForm.description,
      quantity: isFuel && expenseForm.quantity ? Number(expenseForm.quantity) : null,
      quantityUnit: isFuel && expenseForm.quantity ? fuelType?.unit || 'litr' : null,
      date: expenseForm.date ? new Date(expenseForm.date) : new Date()
    }
    const flightId = selectedFlight._id

    // 🚀 OPTIMISTIC UPDATE - UI darhol yangilanadi
    const tempExpense = { _id: 'temp_' + Date.now(), ...expenseData }
    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      expenses: [...(f.expenses || []), tempExpense],
      totalExpenses: (f.totalExpenses || 0) + expenseData.amount,
      profit: (f.totalPayment || 0) - ((f.totalExpenses || 0) + expenseData.amount)
    } : f))

    setShowExpenseModal(false)
    setExpenseForm({ category: 'fuel', type: 'fuel_benzin', amount: '', description: '', quantity: '', date: new Date().toISOString().split('T')[0] })
    showToast.success(`${expenseLabel}: ${formattedAmount} so'm qo'shildi`)

    // Fonda API so'rovi
    api.post(`/flights/${flightId}/expenses`, expenseData)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch((error) => {
        showToast.error(error.response?.data?.message || 'Xatolik yuz berdi')
        fetchData()
      })
  }

  // Marshrutni yopish
  const handleComplete = async (e) => {
    e.preventDefault()

    const driverPercent = Number(completeForm.driverProfitPercent) || 0
    // MUHIM: Shofyor ulushi JAMI KIRIMDAN hisoblanadi (reysdan tusgan umumiy foydadan)
    const totalIncome = (selectedFlight.totalPayment || 0) + (selectedFlight.totalGivenBudget || 0)
    const driverAmount = totalIncome > 0 ? Math.round(totalIncome * driverPercent / 100) : 0
    const profit = (selectedFlight.totalPayment || 0) - (selectedFlight.totalExpenses || 0)

    const confirmMessage = totalIncome > 0 && driverPercent > 0
      ? `${selectedFlight.name} reysini yopishni xohlaysizmi?\n\nJami kirim: ${formatMoney(totalIncome)} so'm\nHaydovchiga (${driverPercent}%): ${formatMoney(driverAmount)} so'm\nBiznesmenning sof foydasidan: ${formatMoney(profit - driverAmount)} so'm`
      : `${selectedFlight.name} reysini yopishni xohlaysizmi?`

    const confirmed = await alert.confirm({
      title: "Marshrutni yopish",
      message: confirmMessage,
      confirmText: "Ha, yopish",
      cancelText: "Bekor qilish",
      type: "warning"
    })

    if (!confirmed) return

    const flightId = selectedFlight._id
    const completeData = {
      endOdometer: Number(completeForm.endOdometer) || 0,
      endFuel: Number(completeForm.endFuel) || 0,
      driverProfitPercent: driverPercent
    }

    // 🚀 OPTIMISTIC UPDATE - UI darhol yangilanadi
    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      status: 'completed',
      endOdometer: completeData.endOdometer,
      endFuel: completeData.endFuel,
      driverProfitPercent: driverPercent,
      driverProfitAmount: driverAmount,
      completedAt: new Date()
    } : f))

    setShowCompleteModal(false)
    setCompleteForm({ endOdometer: '', endFuel: '', driverProfitPercent: '' })
    setExpandedFlight(null)
    showToast.success('Marshrut yopildi!')

    // Fonda API
    api.put(`/flights/${flightId}/complete`, completeData)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchData()
      })
  }

  // Chegara xarajati qo'shish (xalqaro reyslar uchun)
  const handleAddBorderCrossing = async (e) => {
    e.preventDefault()
    if (submitting) return

    const flightId = selectedFlight._id
    const data = {
      ...borderForm,
      customsFee: Number(borderForm.customsFee) || 0,
      transitFee: Number(borderForm.transitFee) || 0,
      insuranceFee: Number(borderForm.insuranceFee) || 0,
      otherFees: Number(borderForm.otherFees) || 0
    }
    const totalUSD = data.customsFee + data.transitFee + data.insuranceFee + data.otherFees

    // 🚀 OPTIMISTIC UPDATE
    const tempBorder = { _id: 'temp_' + Date.now(), ...data, totalInUSD: totalUSD }
    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      borderCrossings: [...(f.borderCrossings || []), tempBorder],
      borderCrossingsTotalUSD: (f.borderCrossingsTotalUSD || 0) + totalUSD
    } : f))

    setShowBorderModal(false)
    setBorderForm({ fromCountry: 'UZB', toCountry: 'KZ', borderName: '', customsFee: '', transitFee: '', insuranceFee: '', otherFees: '', currency: 'USD', note: '' })
    showToast.success('Chegara xarajati qo\'shildi!')

    // Fonda API
    api.post(`/flights/${flightId}/border-crossing`, data)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchData()
      })
  }

  // Chegara xarajatini o'chirish
  const handleDeleteBorderCrossing = async (flightId, crossingId) => {
    const confirmed = await alert.confirm({
      title: "Chegara xarajatini o'chirish",
      message: "Bu xarajatni o'chirishni xohlaysizmi?",
      confirmText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      type: "danger"
    })
    if (!confirmed) return

    // 🚀 OPTIMISTIC UPDATE
    const flight = flights.find(f => f._id === flightId)
    const crossing = flight?.borderCrossings?.find(bc => bc._id === crossingId)
    const crossingAmount = crossing?.totalInUSD || 0

    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      borderCrossings: f.borderCrossings?.filter(bc => bc._id !== crossingId) || [],
      borderCrossingsTotalUSD: (f.borderCrossingsTotalUSD || 0) - crossingAmount
    } : f))

    showToast.success('O\'chirildi')
    api.delete(`/flights/${flightId}/border-crossing/${crossingId}`)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch(() => {
        showToast.error('Xatolik')
        fetchData()
      })
  }

  // Platon saqlash (Rossiya yo'l to'lovi)
  const handleSavePlaton = async (e) => {
    e.preventDefault()
    if (submitting) return

    const flightId = selectedFlight._id
    const data = {
      ...platonForm,
      amount: Number(platonForm.amount) || 0,
      distanceKm: Number(platonForm.distanceKm) || 0
    }

    // 🚀 OPTIMISTIC UPDATE
    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      platon: { ...data, amountInUSD: data.amount / 90 }
    } : f))

    setShowPlatonModal(false)
    setPlatonForm({ amount: '', currency: 'RUB', distanceKm: '', note: '' })
    showToast.success('Platon saqlandi!')

    // Fonda API
    api.put(`/flights/${flightId}/platon`, data)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik')
        fetchData()
      })
  }

  // Xarajat o'chirish
  const handleDeleteExpense = async (flightId, expenseId) => {
    const confirmed = await alert.confirm({
      title: "Xarajatni o'chirish",
      message: "Bu xarajatni o'chirishni xohlaysizmi?",
      confirmText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      type: "danger"
    })

    if (!confirmed) return

    // 🚀 OPTIMISTIC UPDATE - UI dan darhol o'chirish
    const flight = flights.find(f => f._id === flightId)
    const expense = flight?.expenses?.find(e => e._id === expenseId)
    const expenseAmount = expense?.amount || 0

    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      expenses: f.expenses?.filter(e => e._id !== expenseId) || [],
      totalExpenses: (f.totalExpenses || 0) - expenseAmount,
      profit: (f.totalPayment || 0) - ((f.totalExpenses || 0) - expenseAmount)
    } : f))

    showToast.success('Xarajat o\'chirildi')

    // Fonda API
    api.delete(`/flights/${flightId}/expenses/${expenseId}`)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch(() => {
        showToast.error('Xarajatni o\'chirishda xatolik')
        fetchData()
      })
  }

  // Marshrutni bekor qilish
  const handleCancelFlight = async (flightId) => {
    const flight = flights.find(f => f._id === flightId)
    if (!flight) return

    const confirmed = await alert.confirm({
      title: "Marshrutni bekor qilish",
      message: `"${flight.name || 'Bu mashrut'}" ni bekor qilishni xohlaysizmi? Haydovchi bo'shatiladi va marshrut bekor qilingan deb belgilanadi.`,
      confirmText: "Ha, bekor qilish",
      cancelText: "Yo'q",
      type: "danger"
    })

    if (!confirmed) return

    // 🚀 OPTIMISTIC UPDATE
    setFlights(prev => prev.map(f => f._id === flightId ? {
      ...f,
      status: 'cancelled'
    } : f))
    setExpandedFlight(null)
    showToast.success('Marshrut bekor qilindi')

    // Fonda API
    api.put(`/flights/${flightId}/cancel`)
      .then((res) => {
        if (res.data?.data) {
          setFlights(prev => prev.map(f => f._id === flightId ? res.data.data : f))
        }
      })
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
        fetchData()
      })
  }

  // Reysni to'liq o'chirish (faqat faol reyslar uchun)
  const handleDeleteFlight = async (flightId) => {
    const flight = flights.find(f => f._id === flightId)
    if (!flight) return

    const confirmed = await alert.confirm({
      title: "Reysni to'liq o'chirish",
      message: `"${flight.name || 'Bu mashrut'}" ni to'liq o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi va reys MongoDB dan ham o'chiriladi.`,
      confirmText: "Ha, o'chirish",
      cancelText: "Yo'q",
      type: "danger"
    })

    if (!confirmed) return

    // 🚀 OPTIMISTIC UPDATE - UI dan darhol o'chirish
    setFlights(prev => prev.filter(f => f._id !== flightId))
    setExpandedFlight(null)
    showToast.success('Reys o\'chirildi')

    // Fonda API
    api.delete(`/flights/${flightId}`)
      .then((res) => {
        showToast.success(res.data?.message || 'Reys o\'chirildi')
      })
      .catch((err) => {
        showToast.error(err.response?.data?.message || 'Reysni o\'chirishda xatolik')
        fetchData()
      })
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
            <span>{(() => {
              const date = new Date()
              const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
              const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
              return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}`
            })()}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Reyslar</h1>
          <p className="text-green-200">Faol va tugatilgan marshrutlar</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Activity size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{activeCount}</p>
                  <p className="text-green-200 text-xs">Faol marshrutlar</p>
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
            className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${filter === value
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
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${flight.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                    {flight.driver?.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{flight.name || 'Yangi marshrut'}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      <span className="inline-flex items-center gap-1">
                        {flight.flightType === 'international' ? <Globe size={12} /> : <Flag size={12} />}
                      </span> {flight.driver?.fullName} • {flight.vehicle?.plateNumber}
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
                  <p className="text-[10px] sm:text-xs text-gray-400">Buyurtmalar</p>
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
                    <Route size={16} /> Buyurtmalar
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
                      <div key={exp._id} className="bg-white p-3 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const expType = EXPENSE_TYPES.find(t => t.value === exp.type)
                              const IconComponent = expType?.Icon || Package
                              return <IconComponent size={20} className={expType?.color || 'text-gray-500'} />
                            })()}
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
                        
                        {/* Qo'shimcha ma'lumotlar - doimo ko'rinadigan */}
                        <div className="text-xs text-gray-500 space-y-1 ml-8 mt-2 p-2 bg-gray-50 rounded-lg">
                          {/* Debug ma'lumot */}
                          <div className="text-red-500 font-bold">DEBUG: Xarajat ID: {exp._id}</div>
                          
                          {/* Sana */}
                          <div className="flex items-center gap-2">
                            <span>📅 {exp.date ? new Date(exp.date).toLocaleDateString('uz-UZ') + ' ' + new Date(exp.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : 'Sana ko\'rsatilmagan'}</span>
                            {exp.timing && (
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                {exp.timing === 'before' ? 'Reys oldidan' : exp.timing === 'after' ? 'Reys keyin' : 'Reys davomida'}
                              </span>
                            )}
                          </div>
                          
                          {/* Yoqilg'i uchun qo'shimcha ma'lumotlar */}
                          {exp.type?.startsWith('fuel_') && (
                            <div className="space-y-0.5">
                              {exp.stationName && <div>⛽ {exp.stationName}</div>}
                              {exp.odometer && <div>📍 Spidometr: {exp.odometer.toLocaleString()} km</div>}
                              {exp.quantity && <div>🛢️ Miqdor: {exp.quantity} {(exp.type === 'fuel_metan' || exp.type === 'fuel_propan') ? 'kub' : 'litr'}</div>}
                              {exp.pricePerUnit && <div>💰 Narx: {formatMoney(exp.pricePerUnit)} / {(exp.type === 'fuel_metan' || exp.type === 'fuel_propan') ? 'kub' : 'litr'}</div>}
                            </div>
                          )}
                          
                          {/* Moy almashtirish uchun */}
                          {exp.type === 'oil' && exp.odometer && (
                            <div>📍 Spidometr: {exp.odometer.toLocaleString()} km</div>
                          )}
                          
                          {/* Shina uchun */}
                          {exp.type === 'tire' && (
                            <div className="space-y-0.5">
                              {exp.odometer && <div>📍 Spidometr: {exp.odometer.toLocaleString()} km</div>}
                              {exp.tireNumber && <div>🛞 Shina raqami: {exp.tireNumber}</div>}
                            </div>
                          )}
                          
                          {/* Valyuta kursi */}
                          {exp.currency && exp.currency !== 'UZS' && exp.exchangeRate && (
                            <div>💱 Kurs: 1 {exp.currency} = {exp.exchangeRate.toLocaleString()} UZS</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!flight.expenses || flight.expenses.length === 0) && (
                      <p className="text-gray-400 text-sm text-center py-2">Xarajatlar yo'q</p>
                    )}
                  </div>
                </div>

                {/* ============ XALQARO MASHRUT BO'LIMLARI ============ */}
                {flight.flightType === 'international' && (
                  <>
                    {/* Chegara xarajatlari */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-700 flex items-center gap-2">
                          <Flag size={16} className="text-indigo-600" /> Chegara xarajatlari
                        </p>
                        {flight.status === 'active' && (
                          <button
                            onClick={() => { setSelectedFlight(flight); setShowBorderModal(true) }}
                            className="text-xs px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                          >
                            + Qo'shish
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {flight.borderCrossings?.map((bc) => (
                          <div key={bc._id} className="bg-white p-3 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{COUNTRIES[bc.fromCountry]?.flag}</span>
                                <ArrowRight size={14} className="text-gray-400" />
                                <span className="text-lg">{COUNTRIES[bc.toCountry]?.flag}</span>
                                {bc.borderName && <span className="text-xs text-gray-500">({bc.borderName})</span>}
                              </div>
                              {flight.status === 'active' && (
                                <button
                                  onClick={() => handleDeleteBorderCrossing(flight._id, bc._id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-gray-400">Bojxona</p>
                                <p className="font-semibold">${bc.customsFee || 0}</p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-gray-400">Tranzit</p>
                                <p className="font-semibold">${bc.transitFee || 0}</p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-gray-400">Sug'urta</p>
                                <p className="font-semibold">${bc.insuranceFee || 0}</p>
                              </div>
                              <div className="bg-gray-50 p-2 rounded-lg text-center">
                                <p className="text-gray-400">Jami</p>
                                <p className="font-bold text-indigo-600">${(bc.totalInUSD || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!flight.borderCrossings || flight.borderCrossings.length === 0) && (
                          <p className="text-gray-400 text-sm text-center py-2">Chegara xarajatlari yo'q</p>
                        )}
                        {flight.borderCrossingsTotalUSD > 0 && (
                          <div className="bg-indigo-50 p-3 rounded-xl flex justify-between items-center">
                            <span className="text-indigo-700 font-medium">Jami chegara xarajatlari:</span>
                            <span className="text-indigo-700 font-bold">${flight.borderCrossingsTotalUSD.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Platon (Rossiya) */}
                    {flight.countriesInRoute?.includes('RU') && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-700 flex items-center gap-2">
                            🚛 Platon (Rossiya yo'l to'lovi)
                          </p>
                          {flight.status === 'active' && (
                            <button
                              onClick={() => {
                                setSelectedFlight(flight)
                                setPlatonForm({
                                  amount: flight.platon?.amount || '',
                                  currency: flight.platon?.currency || 'RUB',
                                  distanceKm: flight.platon?.distanceKm || '',
                                  note: flight.platon?.note || ''
                                })
                                setShowPlatonModal(true)
                              }}
                              className="text-xs px-3 py-1 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200"
                            >
                              {flight.platon?.amount ? 'Tahrirlash' : '+ Qo\'shish'}
                            </button>
                          )}
                        </div>
                        {flight.platon?.amount > 0 ? (
                          <div className="bg-white p-4 rounded-xl">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-rose-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500">Summa</p>
                                <p className="font-bold text-rose-600">{flight.platon.amount} {CURRENCIES[flight.platon.currency]?.symbol}</p>
                              </div>
                              <div className="bg-rose-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500">USD da</p>
                                <p className="font-bold text-rose-600">${(flight.platon.amountInUSD || 0).toFixed(2)}</p>
                              </div>
                              <div className="bg-rose-50 p-3 rounded-lg text-center">
                                <p className="text-xs text-gray-500">Masofa (RU)</p>
                                <p className="font-bold text-rose-600">{flight.platon.distanceKm || 0} km</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm text-center py-2 bg-white rounded-xl">Platon kiritilmagan</p>
                        )}
                      </div>
                    )}

                    {/* Davlatlar bo'yicha xulosa */}
                    {flight.countryExpenses && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Globe size={16} className="text-cyan-600" /> Davlatlar bo'yicha
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['uzb', 'kz', 'ru'].map(code => {
                            const country = COUNTRIES[code.toUpperCase()]
                            const data = flight.countryExpenses[code] || {}
                            if (!data.totalUSD && !data.fuelLiters) return null
                            return (
                              <div key={code} className="bg-white p-3 rounded-xl text-center">
                                <span className="text-2xl">{country?.flag}</span>
                                <p className="text-xs text-gray-500 mt-1">{country?.name}</p>
                                <p className="font-bold text-cyan-600">${(data.totalUSD || 0).toFixed(2)}</p>
                                {data.fuelLiters > 0 && (
                                  <p className="text-xs text-gray-400">{data.fuelLiters} L</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                {flight.status === 'active' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => { setSelectedFlight(flight); setShowLegModal(true) }}
                        className="flex-1 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                      >
                        <Plus size={16} className="sm:hidden" />
                        <Plus size={18} className="hidden sm:block" />
                        <span className="sm:hidden">buyurtma</span>
                        <span className="hidden sm:inline">buyurtma qo'shish</span>
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
                    {/* Bekor qilish va o'chirish tugmalari */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelFlight(flight._id)}
                        className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm border border-red-200"
                      >
                        <X size={16} />
                        Bekor qilish
                      </button>
                      <button
                        onClick={() => handleDeleteFlight(flight._id)}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 size={16} />
                        O'chirish
                      </button>
                    </div>

                    {/* Xalqaro marshrut uchun qo'shimcha tugmalar */}
                    {flight.flightType === 'international' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => { setSelectedFlight(flight); setShowBorderModal(true) }}
                          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
                        >
                          <Flag size={16} />
                          Chegara xarajati
                        </button>
                        {flight.countriesInRoute?.includes('RU') && (
                          <button
                            onClick={() => {
                              setSelectedFlight(flight)
                              setPlatonForm({
                                amount: flight.platon?.amount || '',
                                currency: flight.platon?.currency || 'RUB',
                                distanceKm: flight.platon?.distanceKm || '',
                                note: flight.platon?.note || ''
                              })
                              setShowPlatonModal(true)
                            }}
                            className="flex-1 py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition flex items-center justify-center gap-2 text-sm"
                          >
                            🚛 Platon
                          </button>
                        )}
                      </div>
                    )}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mashrutlar topilmadi</h3>
          <p className="text-gray-500 mb-6">Haydovchilar sahifasidan yangi mashrut oching</p>
        </div>
      )}


      {/* Add Leg Modal */}
      {showLegModal && selectedFlight && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
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
                      <h2 className="text-lg font-bold text-white">Yangi buyurtma</h2>
                      <p className="text-green-300 text-sm">
                        {selectedFlight.legs?.length > 0
                          ? `${selectedFlight.legs[selectedFlight.legs.length - 1].toCity} dan`
                          : 'Birinchi buyurtma'}
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
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
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
                        className={`p-3 rounded-xl border text-center transition ${expenseForm.category === value
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

                {/* Yoqilg'i turlari - faqat fuel tanlanganda */}
                {expenseForm.category === 'fuel' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Yoqilg'i turi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FUEL_TYPES.map(({ value, label, icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setExpenseForm({ ...expenseForm, type: value })}
                          className={`p-2.5 rounded-xl border text-center transition ${expenseForm.type === value
                              ? 'border-green-500 bg-green-500/20 text-white'
                              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                            }`}
                        >
                          <span className="text-lg">{icon}</span>
                          <p className="text-[10px] mt-0.5">{label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Yoqilg'i miqdori */}
                {expenseForm.category === 'fuel' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Miqdori ({FUEL_TYPES.find(f => f.value === expenseForm.type)?.unit || 'litr'})
                    </label>
                    <input
                      type="number"
                      value={expenseForm.quantity}
                      onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                      placeholder="100"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-slate-400 mb-2">Sana</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
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
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
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
                      <h2 className="text-lg font-bold text-white">Marshrutni yopish</h2>
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
                    <span className="text-slate-400">Jami to'lov (mijozdan):</span>
                    <span className="text-green-400 font-bold">{formatMoney(selectedFlight.totalPayment)} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Yo'l xarajati (berilgan):</span>
                    <span className="text-blue-400 font-bold">{formatMoney(selectedFlight.totalGivenBudget)} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jami kirim:</span>
                    <span className="text-cyan-400 font-bold">{formatMoney((selectedFlight.totalPayment || 0) + (selectedFlight.totalGivenBudget || 0))} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jami xarajat:</span>
                    <span className="text-red-400 font-bold">{formatMoney(selectedFlight.totalExpenses)} so'm</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-white font-semibold">Sof foyda:</span>
                    <span className={`font-bold ${selectedFlight.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatMoney(selectedFlight.profit)} so'm
                    </span>
                  </div>
                </div>

                {/* Haydovchi ulushi - har doim ko'rsatiladi */}
                <div className={`bg-gradient-to-r ${selectedFlight.profit > 0 ? 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20' : 'from-red-500/10 to-orange-500/10 border-red-500/20'} rounded-xl p-4 border`}>
                  <label className={`block text-sm font-medium mb-2 ${selectedFlight.profit > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    Haydovchiga jami kirimdan necha % berasiz?
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={completeForm.driverProfitPercent}
                      onChange={(e) => setCompleteForm({ ...completeForm, driverProfitPercent: e.target.value })}
                      className={`flex-1 px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-500 focus:outline-none ${selectedFlight.profit > 0 ? 'border-emerald-500/30 focus:border-emerald-500' : 'border-red-500/30 focus:border-red-500'}`}
                      placeholder="0"
                    />
                    <span className={`font-bold text-lg ${selectedFlight.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>%</span>
                  </div>
                  {completeForm.driverProfitPercent > 0 && (
                    <div className={`mt-3 p-3 rounded-lg flex items-center justify-between ${selectedFlight.profit > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      <span className={`text-sm ${selectedFlight.profit > 0 ? 'text-emerald-300' : 'text-red-300'}`}>Haydovchiga:</span>
                      <span className={`font-bold ${selectedFlight.profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(() => {
                          const totalIncome = (selectedFlight.totalPayment || 0) + (selectedFlight.totalGivenBudget || 0)
                          const driverAmount = totalIncome > 0 ? Math.round(totalIncome * Number(completeForm.driverProfitPercent) / 100) : 0
                          return `${formatMoney(driverAmount)} so'm`
                        })()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Tugash spidometr (km)</label>
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
                  Marshrutni yopish
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Border Crossing Modal (Xalqaro reyslar uchun) */}
      {showBorderModal && selectedFlight && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
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
                      <p className="text-indigo-300 text-sm">Bojxona, tranzit, sug'urta</p>
                    </div>
                  </div>
                  <button onClick={() => setShowBorderModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddBorderCrossing} className="p-6 space-y-4">
                {/* Davlatlar */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Qayerdan</label>
                    <select
                      value={borderForm.fromCountry}
                      onChange={(e) => setBorderForm({ ...borderForm, fromCountry: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.entries(COUNTRIES).map(([code, c]) => (
                        <option key={code} value={code} className="bg-slate-900">{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Qayerga</label>
                    <select
                      value={borderForm.toCountry}
                      onChange={(e) => setBorderForm({ ...borderForm, toCountry: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.entries(COUNTRIES).map(([code, c]) => (
                        <option key={code} value={code} className="bg-slate-900">{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chegara nomi */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Chegara nomi</label>
                  <input
                    type="text"
                    value={borderForm.borderName}
                    onChange={(e) => setBorderForm({ ...borderForm, borderName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    placeholder="Yallama, Troitsk..."
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
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">🚛 Tranzit</label>
                    <input
                      type="number"
                      value={borderForm.transitFee}
                      onChange={(e) => setBorderForm({ ...borderForm, transitFee: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">🛡️ Sug'urta</label>
                    <input
                      type="number"
                      value={borderForm.insuranceFee}
                      onChange={(e) => setBorderForm({ ...borderForm, insuranceFee: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Boshqa</label>
                    <input
                      type="number"
                      value={borderForm.otherFees}
                      onChange={(e) => setBorderForm({ ...borderForm, otherFees: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
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
      {showPlatonModal && selectedFlight && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/90">
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
