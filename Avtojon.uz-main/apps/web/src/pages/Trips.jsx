import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, CheckCircle, XCircle, X, Route, Truck, User, ArrowRight, Wallet, Calendar, ArrowUpRight, Activity, Clock } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'

export default function Trips() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingTrip, setCompletingTrip] = useState(null)
  const [form, setForm] = useState({
    driverId: '', vehicleId: '', startAddress: '', endAddress: '',
    estimatedDuration: '', estimatedDistance: '', tripBudget: '', tripPayment: ''
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  const fetchData = async () => {
    try {
      const [tripsRes, driversRes, vehiclesRes] = await Promise.all([
        api.get('/trips', { params: filter !== 'all' ? { status: filter } : {} }),
        api.get('/drivers'),
        api.get('/vehicles')
      ])
      setTrips(tripsRes.data.data || [])
      setDrivers(driversRes.data.data || [])
      setVehicles(vehiclesRes.data.data || [])
    } catch (error) {
      showToast.error('Malumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filter])

  // Modal ochilganda background scroll ni bloklash
  useEffect(() => {
    if (showModal || showCompleteModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal, showCompleteModal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/trips', {
        ...form,
        estimatedDuration: form.estimatedDuration || undefined,
        estimatedDistance: form.estimatedDistance ? Number(form.estimatedDistance) : undefined,
        tripBudget: form.tripBudget ? Number(form.tripBudget) : undefined,
        tripPayment: form.tripPayment ? Number(form.tripPayment) : undefined
      })
      showToast.success('Reys yaratildi')
      setShowModal(false)
      setForm({ driverId: '', vehicleId: '', startAddress: '', endAddress: '', estimatedDuration: '', estimatedDistance: '', tripBudget: '', tripPayment: '' })
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleStart = async (e, id) => {
    e.stopPropagation()
    try {
      await api.put(`/trips/${id}/start`)
      showToast.success('Reys boshlandi')
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const openCompleteModal = (e, trip) => {
    e.stopPropagation()
    setCompletingTrip(trip)
    setShowCompleteModal(true)
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/trips/${completingTrip._id}/complete`)
      showToast.success('Reys tugatildi')
      setShowCompleteModal(false)
      setCompletingTrip(null)
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleCancel = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Reysni bekor qilishni xohlaysizmi?')) return
    try {
      await api.put(`/trips/${id}/cancel`)
      showToast.success('Reys bekor qilindi')
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('uz-UZ') : '-'
  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

  const statusConfig = {
    pending: { label: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-500 to-yellow-600', dot: 'bg-yellow-500' },
    in_progress: { label: "Yo'lda", color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600', dot: 'bg-blue-500' },
    completed: { label: 'Tugatilgan', color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600', dot: 'bg-green-500' },
    cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600', dot: 'bg-red-500' }
  }

  const filterButtons = [
    { value: 'all', label: 'Barchasi', count: trips.length },
    { value: 'in_progress', label: "Yo'lda" },
    { value: 'pending', label: 'Kutilmoqda' },
    { value: 'completed', label: 'Tugatilgan' },
    { value: 'cancelled', label: 'Bekor' }
  ]

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

  const activeTripsCount = trips.filter(t => t.status === 'in_progress').length
  const pendingTripsCount = trips.filter(t => t.status === 'pending').length
  const completedTripsCount = trips.filter(t => t.status === 'completed').length

  const quickStats = [
    { label: 'Jami reyslar', value: trips.length, icon: Route, color: 'from-blue-400 to-blue-600' },
    { label: "Yo'lda", value: activeTripsCount, icon: Activity, color: 'from-orange-400 to-orange-600' },
    { label: 'Kutilmoqda', value: pendingTripsCount, icon: Clock, color: 'from-yellow-400 to-yellow-600' },
    { label: 'Tugatilgan', value: completedTripsCount, icon: CheckCircle, color: 'from-green-400 to-green-600' },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-8 rounded-3xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {user?.companyName || 'Admin'}! 👋
            </h1>
            <p className="text-blue-200">Reyslarni boshqaring va kuzating</p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setShowModal(true)} 
              className="group px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
              <Plus size={18} /> 
              Yangi reys
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {quickStats.map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="text-blue-200 text-xs">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterButtons.map(({ value, label }) => (
          <button 
            key={value} 
            onClick={() => setFilter(value)}
            className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === value
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <div 
            key={trip._id}
            onClick={() => navigate(`/dashboard/trips/${trip._id}`)}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${statusConfig[trip.status]?.gradient} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-lg">
                    {trip.driver?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-semibold">{trip.driver?.fullName || 'Nomalum'}</p>
                    <p className="text-white/80 text-sm">{trip.vehicle?.plateNumber}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  {statusConfig[trip.status]?.label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Route */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-200"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{trip.startAddress || 'Boshlanish'}</p>
                  <p className="text-gray-400 text-sm my-1">↓</p>
                  <p className="font-medium text-gray-900">{trip.endAddress || 'Tugash'}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Masofa</p>
                  <p className="font-semibold text-gray-900">{trip.estimatedDistance || '-'} km</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Vaqt</p>
                  <p className="font-semibold text-gray-900">{trip.estimatedDuration || '-'}</p>
                </div>
              </div>

              {/* Financial - Yangi tizim */}
              {(trip.income?.amountInUSD > 0 || trip.profitUSD !== undefined) && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl">
                  <Wallet size={18} className="text-blue-600" />
                  <div className="flex-1 flex items-center gap-3 text-sm">
                    {trip.income?.amountInUSD > 0 && (
                      <span className="text-blue-700">
                        <span className="text-gray-500">Daromad:</span> ${trip.income.amountInUSD}
                      </span>
                    )}
                    {trip.profitUSD !== undefined && trip.profitUSD !== 0 && (
                      <span className={trip.profitUSD >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                        <span className="text-gray-500">Foyda:</span> ${trip.profitUSD?.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Eski tizim uchun */}
              {!trip.income?.amountInUSD && (trip.tripBudget > 0 || trip.tripPayment > 0) && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
                  <Wallet size={18} className="text-blue-600" />
                  <div className="flex-1 flex items-center gap-3 text-sm">
                    {trip.tripBudget > 0 && (
                      <span className="text-blue-700">
                        <span className="text-gray-500">Berilgan:</span> {formatMoney(trip.tripBudget)}
                      </span>
                    )}
                    {trip.tripPayment > 0 && (
                      <span className="text-purple-700">
                        <span className="text-gray-500">Haqi:</span> {formatMoney(trip.tripPayment)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bonus/Penalty */}
              {(trip.bonusAmount > 0 || trip.penaltyAmount > 0) && (
                <div className="flex gap-2 mb-4">
                  {trip.bonusAmount > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      +{formatMoney(trip.bonusAmount)} bonus
                    </span>
                  )}
                  {trip.penaltyAmount > 0 && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      -{formatMoney(trip.penaltyAmount)} jarima
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400">{formatDate(trip.createdAt)}</p>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {trip.status === 'pending' && (
                    <button 
                      onClick={(e) => handleStart(e, trip._id)} 
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Boshlash"
                    >
                      <Play size={18} />
                    </button>
                  )}
                  {trip.status === 'in_progress' && (
                    <button 
                      onClick={(e) => openCompleteModal(e, trip)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Tugatish"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {(trip.status === 'pending' || trip.status === 'in_progress') && (
                    <button 
                      onClick={(e) => handleCancel(e, trip._id)} 
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Bekor qilish"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                  <div className="p-2 text-gray-400 group-hover:text-blue-600 transition">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {trips.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reyslar topilmadi</h3>
          <p className="text-gray-500 mb-6">Hozircha bu filtrdagi reyslar yoq</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Birinchi reysni yarating
          </button>
        </div>
      )}

      {/* Add Trip Modal - Pro Design */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="relative p-6 border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-3xl"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Route className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Yangi reys</h2>
                    <p className="text-blue-300 text-sm">Reys malumotlarini kiriting</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Shofyor */}
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">Shofyor *</label>
                <select 
                  value={form.driverId} 
                  onChange={(e) => {
                    const driverId = e.target.value
                    const assignedVehicle = vehicles.find(v => 
                      v.currentDriver === driverId || 
                      v.currentDriver?._id === driverId ||
                      String(v.currentDriver) === driverId
                    )
                    setForm({...form, driverId, vehicleId: assignedVehicle?._id || ''})
                  }} 
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition" 
                  required
                >
                  <option value="" className="bg-slate-900">Shofyorni tanlang</option>
                  {drivers.filter(d => d.status !== 'busy').map(d => {
                    const vehicle = vehicles.find(v => 
                      v.currentDriver === d._id || 
                      v.currentDriver?._id === d._id ||
                      String(v.currentDriver) === d._id
                    )
                    return (
                      <option key={d._id} value={d._id} className="bg-slate-900">
                        {d.fullName} {vehicle ? `→ ${vehicle.plateNumber}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Mashina */}
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">Mashina *</label>
                {form.vehicleId ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-3">
                      <Truck size={20} />
                      <span className="font-medium">{vehicles.find(v => v._id === form.vehicleId)?.plateNumber} - {vehicles.find(v => v._id === form.vehicleId)?.brand}</span>
                    </div>
                    <button type="button" onClick={() => setForm({...form, vehicleId: ''})} className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <select value={form.vehicleId} onChange={(e) => setForm({...form, vehicleId: e.target.value})} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition" required>
                    <option value="" className="bg-slate-900">Mashinani tanlang</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id} className="bg-slate-900">{v.plateNumber} - {v.brand}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Manzillar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Qayerdan *</label>
                  <input 
                    type="text" 
                    value={form.startAddress} 
                    onChange={(e) => setForm({...form, startAddress: e.target.value})} 
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="Toshkent" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Qayerga *</label>
                  <input 
                    type="text" 
                    value={form.endAddress} 
                    onChange={(e) => setForm({...form, endAddress: e.target.value})} 
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="Samarqand" 
                    required 
                  />
                </div>
              </div>

              {/* Vaqt va masofa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Taxminiy vaqt</label>
                  <input 
                    type="text" 
                    value={form.estimatedDuration} 
                    onChange={(e) => setForm({...form, estimatedDuration: e.target.value})} 
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="2 kun" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Masofa (km)</label>
                  <input 
                    type="number" 
                    value={form.estimatedDistance} 
                    onChange={(e) => setForm({...form, estimatedDistance: e.target.value})} 
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                    placeholder="300" 
                  />
                </div>
              </div>

              {/* Moliyaviy */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <Wallet size={18} />
                  <span className="font-semibold">Moliyaviy malumotlar</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Berilgan pul</label>
                    <input 
                      type="number" 
                      value={form.tripBudget} 
                      onChange={(e) => setForm({...form, tripBudget: e.target.value})} 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="500000" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Reys haqi</label>
                    <input 
                      type="number" 
                      value={form.tripPayment} 
                      onChange={(e) => setForm({...form, tripPayment: e.target.value})} 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="200000" 
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                <Plus size={20} /> Reys yaratish
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Complete Trip Modal - Pro Design */}
      {showCompleteModal && completingTrip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="relative p-6 border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-t-3xl"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Reysni tugatish</h2>
                    <p className="text-emerald-300 text-sm">Moliyaviy hisobot</p>
                  </div>
                </div>
                <button onClick={() => setShowCompleteModal(false)} className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleComplete} className="p-6 space-y-5">
              {/* Driver Info */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {completingTrip.driver?.fullName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{completingTrip.driver?.fullName}</p>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      {completingTrip.startAddress} → {completingTrip.endAddress}
                    </p>
                  </div>
                </div>
              </div>
              
              {completingTrip.tripBudget > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <span className="text-blue-300 flex items-center gap-2"><Wallet size={18} /> Berilgan pul</span>
                    <span className="font-bold text-blue-400 text-lg">{formatMoney(completingTrip.tripBudget)} som</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <span className="text-amber-300">Sarflangan</span>
                    <span className="font-bold text-amber-400 text-lg">{formatMoney(completingTrip.totalExpenses || 0)} som</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 rounded-xl border ${(completingTrip.remainingBudget || completingTrip.tripBudget) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <span className={`${(completingTrip.remainingBudget || completingTrip.tripBudget) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>Qoldiq</span>
                    <span className={`font-bold text-lg ${(completingTrip.remainingBudget || completingTrip.tripBudget) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatMoney(completingTrip.remainingBudget || completingTrip.tripBudget)} som
                    </span>
                  </div>
                  <div className="text-center py-3">
                    <p className="text-sm text-slate-400">
                      {(completingTrip.remainingBudget || completingTrip.tripBudget) > 0 
                        ? '✅ Ortib qolgan pul bonus sifatida qoshiladi' 
                        : (completingTrip.remainingBudget || completingTrip.tripBudget) < 0 
                          ? '⚠️ Ortiqcha sarflangan pul jarima sifatida yoziladi'
                          : ''}
                    </p>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all"
              >
                <CheckCircle size={20} /> Reysni tugatish
              </button>
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
