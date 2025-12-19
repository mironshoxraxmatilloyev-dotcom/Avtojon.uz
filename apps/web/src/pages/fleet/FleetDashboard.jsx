import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import {
  Car, Plus, LogOut, Search, X, Truck, ChevronRight, AlertTriangle, 
  CheckCircle, RefreshCw, Fuel, Gauge, Calendar, MoreVertical, Trash2, Edit2,
  TrendingUp, Zap, Crown, Clock, Home, User, BarChart3
} from 'lucide-react'

// 🚀 CONSTANTS
const FUEL = { petrol: 'Benzin', diesel: 'Dizel', gas: 'Gaz', metan: 'Metan' }
const STATUS_CONFIG = {
  excellent: { label: 'A\'lo', color: 'emerald', icon: CheckCircle },
  normal: { label: 'Yaxshi', color: 'blue', icon: CheckCircle },
  attention: { label: 'Diqqat', color: 'amber', icon: AlertTriangle },
  critical: { label: 'Kritik', color: 'red', icon: AlertTriangle }
}
const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)

// 🚀 LOCAL CACHE - Offline support
const CACHE_KEY = 'fleet_vehicles'
const CACHE_SUB_KEY = 'fleet_subscription'
const getCache = (key) => {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    const { value, timestamp } = JSON.parse(data)
    // 5 daqiqa cache
    if (Date.now() - timestamp > 5 * 60 * 1000) return null
    return value
  } catch { return null }
}
const setCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }))
  } catch {}
}

export default function FleetDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const isMounted = useRef(true)

  // 🚀 INSTANT: Cache dan darhol yuklash - loading yo'q
  const [vehicles, setVehicles] = useState(() => getCache(CACHE_KEY) || [])
  const [loading, setLoading] = useState(false) // Loading yo'q - darhol UI ko'rsatamiz
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(null)
  
  // 🚀 INSTANT: Obuna cache dan
  const [subscription, setSubscription] = useState(() => getCache(CACHE_SUB_KEY))
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  const [form, setForm] = useState({
    plateNumber: '', brand: '', model: '', year: new Date().getFullYear(),
    fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: '', vin: ''
  })
  
  const [activeTab, setActiveTab] = useState('home')

  // 🚀 Cleanup
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // 🚀 INSTANT: Obuna yuklash - fonda
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const { data } = await api.get('/vehicles/subscription')
        if (isMounted.current) {
          setSubscription(data.data)
          setCache(CACHE_SUB_KEY, data.data)
        }
      } catch {}
    }
    loadSubscription()
  }, [])

  // Qolgan vaqtni hisoblash
  useEffect(() => {
    if (!subscription?.endDate) return
    
    const updateTimeLeft = () => {
      const now = new Date()
      const end = new Date(subscription.endDate)
      const diff = end - now
      
      if (diff <= 0) {
        setTimeLeft('Muddat tugadi')
        setSubscription(prev => prev ? { ...prev, isExpired: true, canUse: false } : null)
        setShowUpgradeModal(true) // Avtomatik modal ochish
        return
      }
      
      const days = Math.floor(diff / (24 * 60 * 60 * 1000))
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
      const seconds = Math.floor((diff % (60 * 1000)) / 1000)
      
      if (days > 0) {
        setTimeLeft(`${days} kun ${hours} soat`)
      } else if (hours > 0) {
        setTimeLeft(`${hours} soat ${minutes} daqiqa`)
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }
    
    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [subscription?.endDate])

  // Pro ga o'tish
  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const { data } = await api.post('/vehicles/subscription/upgrade')
      setSubscription(data.data)
      setShowUpgradeModal(false)
      alert.success('Tabriklaymiz!', 'Pro tarifga muvaffaqiyatli o\'tdingiz!')
    } catch (err) {
      alert.error('Xatolik', err.userMessage || 'Xatolik yuz berdi')
    } finally {
      setUpgrading(false)
    }
  }

  // Obuna tugagan bo'lsa avtomatik modal ochish
  useEffect(() => {
    if (subscription?.isExpired) {
      setShowUpgradeModal(true)
    }
  }, [subscription?.isExpired])

  // 🚀 INSTANT: Fonda yuklash
  useEffect(() => { fetchVehicles() }, [])

  const fetchVehicles = useCallback(async (isRefresh = false) => {
    // Cache bor bo'lsa loading ko'rsatmaslik
    const hasCache = getCache(CACHE_KEY)
    if (isRefresh) setRefreshing(true)
    else if (!hasCache) setLoading(true)
    
    try {
      const { data } = await api.get('/vehicles')
      if (isMounted.current) {
        setVehicles(data.data || [])
        setCache(CACHE_KEY, data.data || [])
      }
    } catch {
      // Offline - cache dan foydalanish
      if (!hasCache) alert.error('Xatolik', 'Mashinalarni yuklashda xatolik')
    } finally {
      if (isMounted.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  const stats = useMemo(() => ({
    total: vehicles.length,
    excellent: vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length,
    attention: vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length,
    totalKm: vehicles.reduce((s, v) => s + (v.currentOdometer || 0), 0)
  }), [vehicles])

  const filteredVehicles = useMemo(() => {
    let result = vehicles
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v => 
        v.plateNumber?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q)
      )
    }
    if (filter === 'attention') result = result.filter(v => v.status === 'attention' || v.status === 'critical')
    if (filter === 'excellent') result = result.filter(v => v.status === 'normal' || v.status === 'excellent')
    return result
  }, [vehicles, search, filter])

  const openModal = useCallback((vehicle = null) => {
    setEditVehicle(vehicle)
    if (vehicle) {
      setForm({
        plateNumber: vehicle.plateNumber || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        fuelType: vehicle.fuelType || 'diesel',
        fuelTankCapacity: vehicle.fuelTankCapacity?.toString() || '',
        currentOdometer: vehicle.currentOdometer?.toString() || '',
        vin: vehicle.vin || ''
      })
    } else {
      setForm({ plateNumber: '', brand: '', model: '', year: new Date().getFullYear(), fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: '', vin: '' })
    }
    setShowModal(true)
    setShowMenu(null)
  }, [])

  // 🚀 OPTIMISTIC UPDATE - Darhol UI yangilanadi
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!form.plateNumber || !form.brand) {
      alert.warning('Ogohlantirish', 'Davlat raqami va marka majburiy')
      return
    }
    
    const body = {
      ...form,
      year: parseInt(form.year) || new Date().getFullYear(),
      fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : null,
      currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0,
      status: 'normal'
    }
    
    // 🚀 INSTANT: Modal darhol yopiladi
    setShowModal(false)
    
    if (editVehicle) {
      // 🚀 OPTIMISTIC: Darhol UI yangilanadi
      setVehicles(prev => {
        const updated = prev.map(v => v._id === editVehicle._id ? { ...v, ...body } : v)
        setCache(CACHE_KEY, updated)
        return updated
      })
      alert.success('Yangilandi')
      
      // Fonda API
      api.put(`/vehicles/${editVehicle._id}`, body).catch(() => fetchVehicles())
    } else {
      // 🚀 OPTIMISTIC: Yangi mashina darhol ko'rinadi
      const tempId = 'temp_' + Date.now()
      const newVehicle = { ...body, _id: tempId, createdAt: new Date().toISOString() }
      setVehicles(prev => {
        const updated = [newVehicle, ...prev]
        setCache(CACHE_KEY, updated)
        return updated
      })
      alert.success('Qo\'shildi')
      
      // Fonda API - haqiqiy ID olish
      api.post('/vehicles', body)
        .then(res => {
          if (res.data?.data?._id) {
            setVehicles(prev => {
              const updated = prev.map(v => v._id === tempId ? res.data.data : v)
              setCache(CACHE_KEY, updated)
              return updated
            })
          }
        })
        .catch(() => fetchVehicles())
    }
  }, [form, editVehicle, fetchVehicles])

  // 🚀 OPTIMISTIC DELETE
  const handleDelete = useCallback(async (id) => {
    if (!confirm('Mashinani o\'chirmoqchimisiz?')) return
    setShowMenu(null)
    
    // 🚀 INSTANT: Darhol o'chirish
    setVehicles(prev => {
      const updated = prev.filter(v => v._id !== id)
      setCache(CACHE_KEY, updated)
      return updated
    })
    alert.success('O\'chirildi')
    
    // Fonda API
    api.delete(`/vehicles/${id}`).catch(() => fetchVehicles())
  }, [fetchVehicles])

  // 🚀 Loading yo'q - darhol UI ko'rsatamiz
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Header */}
      <header className="bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Zap className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">Avtopark</h1>
                <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[120px] sm:max-w-none">{user?.companyName || 'Fleet Pro'}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button 
                onClick={() => fetchVehicles(true)} 
                disabled={refreshing} 
                className="p-2 sm:p-3 hover:bg-white/5 active:bg-white/10 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw size={18} className={`sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => { logout(); navigate('/login') }} 
                className="p-2 sm:p-3 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg sm:rounded-xl text-slate-400 hover:text-red-400 transition-all"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-6 space-y-4 sm:space-y-6">
        {/* Obuna Banner */}
        {subscription && (
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            subscription.isExpired 
              ? 'bg-red-500/10 border border-red-500/30' 
              : subscription.plan === 'trial' 
                ? 'bg-amber-500/10 border border-amber-500/30' 
                : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              {subscription.isExpired ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
              ) : subscription.plan === 'trial' ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className={`text-sm sm:text-base font-semibold ${
                  subscription.isExpired ? 'text-red-400' : subscription.plan === 'trial' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {subscription.isExpired 
                    ? 'Obuna tugadi!' 
                    : subscription.plan === 'trial' 
                      ? `Trial - ${timeLeft}` 
                      : 'Pro ✓'}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 truncate">
                  {subscription.isExpired 
                    ? 'Pro tarifga o\'ting' 
                    : subscription.plan === 'trial' 
                      ? 'Barcha funksiyalar' 
                      : 'Cheksiz'}
                </p>
              </div>
            </div>
            {(subscription.isExpired || subscription.plan === 'trial') && (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
              >
                <Crown size={14} className="sm:w-4 sm:h-4" /> Pro
              </button>
            )}
          </div>
        )}

        {/* Bloklangan holat */}
        {subscription?.isExpired && (
          <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-white/5">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Obuna muddati tugadi</h3>
            <p className="text-slate-400 mb-6">Avtopark tizimidan foydalanish uchun Pro tarifga o'ting</p>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all inline-flex items-center gap-2"
            >
              <Crown size={20} /> Pro tarifga o'tish - 50,000 so'm/oy
            </button>
          </div>
        )}

        {/* Premium Stats - faqat aktiv obunada va home tabda */}
        {!subscription?.isExpired && activeTab === 'home' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <StatCard 
            icon={Car} 
            gradient="from-blue-500 to-blue-600"
            value={stats.total} 
            label="Jami" 
            fullLabel="Jami transport"
            onClick={() => setFilter('all')} 
            active={filter === 'all'} 
          />
          <StatCard 
            icon={CheckCircle} 
            gradient="from-emerald-500 to-emerald-600"
            value={stats.excellent} 
            label="Yaxshi" 
            fullLabel="Yaxshi holat"
            onClick={() => setFilter('excellent')} 
            active={filter === 'excellent'} 
          />
          <StatCard 
            icon={AlertTriangle} 
            gradient="from-amber-500 to-orange-500"
            value={stats.attention} 
            label="Diqqat" 
            fullLabel="Diqqat talab"
            onClick={() => setFilter('attention')} 
            active={filter === 'attention'}
            pulse={stats.attention > 0}
          />
          <StatCard 
            icon={TrendingUp} 
            gradient="from-purple-500 to-pink-500"
            value={`${(stats.totalKm / 1000).toFixed(0)}k`} 
            label="Masofa" 
            fullLabel="Jami masofa"
          />
        </div>
        )}

        {/* Search & Add - faqat aktiv obunada va home tabda */}
        {!subscription?.isExpired && activeTab === 'home' && (
        <>
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3.5 bg-slate-800/50 border border-white/5 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all text-sm sm:text-base"
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
          </div>
          <button 
            onClick={() => openModal()} 
            className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl sm:rounded-2xl text-white font-semibold flex items-center gap-1.5 sm:gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Qo'shish</span>
          </button>
        </div>

        {/* Active Filter */}
        {filter !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filtr:</span>
            <button 
              onClick={() => setFilter('all')} 
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-sm text-white flex items-center gap-2 transition-all"
            >
              {filter === 'attention' ? '⚠️ Diqqat talab' : '✅ Yaxshi holat'}
              <X size={14} />
            </button>
          </div>
        )}

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <EmptyState onAdd={() => openModal()} hasVehicles={vehicles.length > 0} />
        ) : (
          <div className="grid gap-3">
            {filteredVehicles.map((v) => (
              <VehicleCard 
                key={v._id} 
                vehicle={v} 
                onClick={() => navigate(`/fleet/vehicle/${v._id}`)}
                onEdit={() => openModal(v)}
                onDelete={() => handleDelete(v._id)}
                showMenu={showMenu === v._id}
                onMenuToggle={() => setShowMenu(showMenu === v._id ? null : v._id)}
              />
            ))}
          </div>
        )}

        {search && filteredVehicles.length > 0 && (
          <p className="text-center text-sm text-slate-500 py-2">{filteredVehicles.length} ta natija topildi</p>
        )}
        </>
        )}

        {/* Statistika Tab */}
        {!subscription?.isExpired && activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Umumiy statistika
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Jami mashinalar</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Jami masofa</p>
                  <p className="text-2xl font-bold text-white">{fmt(stats.totalKm)} km</p>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-emerald-400 text-sm mb-1">Yaxshi holat</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.excellent}</p>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <p className="text-amber-400 text-sm mb-1">Diqqat talab</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.attention}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-3">Yoqilg'i turlari</h3>
              <div className="space-y-2">
                {Object.entries(FUEL).map(([key, label]) => {
                  const count = vehicles.filter(v => v.fuelType === key).length
                  const percent = stats.total > 0 ? (count / stats.total * 100).toFixed(0) : 0
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm w-16">{label}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-white text-sm font-medium w-8">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Xizmat Tab */}
        {!subscription?.isExpired && activeTab === 'service' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                Xizmat ko'rsatish
              </h3>
              {vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length > 0 ? (
                <div className="space-y-3">
                  {vehicles.filter(v => v.status === 'attention' || v.status === 'critical').map(v => (
                    <div 
                      key={v._id} 
                      onClick={() => navigate(`/fleet/vehicle/${v._id}`)}
                      className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-all"
                    >
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{v.plateNumber}</p>
                        <p className="text-amber-400 text-sm">{v.brand} {v.model}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-400">Barcha mashinalar yaxshi holatda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profil Tab */}
        {!subscription?.isExpired && activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user?.companyName || 'Fleet Pro'}</h3>
                  <p className="text-slate-400">{user?.email || user?.phone}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400">Obuna</span>
                  <span className={`font-semibold ${subscription?.plan === 'pro' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {subscription?.plan === 'pro' ? 'Pro ✓' : 'Trial'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                  <span className="text-slate-400">Mashinalar</span>
                  <span className="text-white font-semibold">{stats.total} ta</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { logout(); navigate('/login') }}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <LogOut size={20} />
              Chiqish
            </button>
          </div>
        )}
      </main>

      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(null)} />}

      {/* Modal */}
      {showModal && (
        <Modal title={editVehicle ? 'Tahrirlash' : 'Yangi mashina'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <Input 
              label="Davlat raqami" 
              value={form.plateNumber} 
              onChange={v => setForm(f => ({ ...f, plateNumber: v.toUpperCase() }))} 
              placeholder="01A123BC" 
              autoFocus 
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marka" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="MAN" required />
              <Input label="Model" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="TGX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Yil" type="number" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} />
              <Select label="Yoqilg'i" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={[
                { value: 'diesel', label: 'Dizel' },
                { value: 'petrol', label: 'Benzin' },
                { value: 'gas', label: 'Gaz' },
                { value: 'metan', label: 'Metan' }
              ]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bak (L)" type="number" value={form.fuelTankCapacity} onChange={v => setForm(f => ({ ...f, fuelTankCapacity: v }))} placeholder="400" />
              <Input label="Odometr (km)" type="number" value={form.currentOdometer} onChange={v => setForm(f => ({ ...f, currentOdometer: v }))} placeholder="0" />
            </div>
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </>
              ) : editVehicle ? 'Yangilash' : 'Saqlash'}
            </button>
          </form>
        </Modal>
      )}

      {/* Upgrade Modal - obuna tugaganda yopib bo'lmaydi */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Pro Tarif</h2>
                    <p className="text-sm text-slate-400">Avtopark nazorati</p>
                  </div>
                </div>
                {/* Faqat obuna tugamagan bo'lsa yopish tugmasi ko'rinadi */}
                {!subscription?.isExpired && (
                  <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X size={20} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-500/20">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">50,000</span>
                  <span className="text-slate-400">so'm/oy</span>
                </div>
                <p className="text-sm text-slate-400">Barcha funksiyalar, cheksiz mashinalar</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Cheksiz mashinalar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Yoqilg'i va moy nazorati</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Shina va xizmat tarixi</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-slate-300">Hisobotlar va statistika</span>
                </div>
              </div>
              
              <button 
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {upgrading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Crown size={20} /> Pro ga o'tish
                  </>
                )}
              </button>
              
              <p className="text-xs text-slate-500 text-center mt-4">
                To'lov Click, Payme yoki bank kartasi orqali
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - faqat mobilda */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAdd={() => openModal()} 
      />
    </div>
  )
}

// ========== BOTTOM NAVIGATION ==========

const BottomNav = memo(({ activeTab = 'home', onTabChange, onAdd }) => (
  <div 
    className="lg:hidden"
    style={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      zIndex: 99999,
      background: '#0f172a',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 8px' }}>
      <NavItem icon={Home} label="Avtopark" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
      <NavItem icon={BarChart3} label="Statistika" active={activeTab === 'stats'} onClick={() => onTabChange('stats')} />
      <button 
        onClick={onAdd}
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid #0f172a',
          marginTop: '-20px',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)'
        }}
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </button>
      <NavItem icon={Car} label="Xizmat" active={activeTab === 'service'} onClick={() => onTabChange('service')} />
      <NavItem icon={User} label="Profil" active={activeTab === 'profile'} onClick={() => onTabChange('profile')} />
    </div>
  </div>
))

const NavItem = memo(({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 12px',
      background: 'transparent',
      border: 'none',
      color: active ? '#60a5fa' : '#64748b',
      cursor: 'pointer'
    }}
  >
    <div style={{ 
      padding: '6px', 
      borderRadius: '8px', 
      background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent' 
    }}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span style={{ fontSize: '10px', fontWeight: 500 }}>{label}</span>
  </button>
))

// ========== COMPONENTS ==========

const Skeleton = memo(() => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-16 bg-slate-800/50 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl" />)}
      </div>
      <div className="h-14 bg-slate-800/50 rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-2xl" />)}
    </div>
  </div>
))

const StatCard = memo(({ icon: Icon, gradient, value, label, fullLabel, onClick, active, pulse }) => (
  <button 
    onClick={onClick} 
    className={`relative overflow-hidden bg-slate-800/40 backdrop-blur rounded-xl sm:rounded-2xl p-3 sm:p-4 border transition-all text-left group ${
      active ? 'border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20' : 'border-white/5 hover:border-white/10 hover:bg-slate-800/60'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${gradient} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
        <Icon size={18} className="text-white sm:w-5 sm:h-5" />
      </div>
      {pulse && <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-amber-500 rounded-full animate-pulse" />}
    </div>
    <div className="mt-2 sm:mt-3">
      <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
      <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{fullLabel || label}</span>
      </p>
    </div>
  </button>
))

const VehicleCard = memo(({ vehicle, onClick, onEdit, onDelete, showMenu, onMenuToggle }) => {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical'
  
  return (
    <div className={`group relative bg-slate-800/40 backdrop-blur hover:bg-slate-800/60 rounded-xl sm:rounded-2xl border transition-all ${
      isWarning ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-white/5 hover:border-white/10'
    }`}>
      <div onClick={onClick} className="p-3 sm:p-4 cursor-pointer">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Vehicle Icon */}
          <div className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
            isWarning ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20'
          }`}>
            <Truck className={`w-5 h-5 sm:w-7 sm:h-7 ${isWarning ? 'text-amber-400' : 'text-blue-400'}`} />
            {isWarning && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
              <h3 className="text-sm sm:text-lg font-bold text-white truncate">{vehicle.plateNumber}</h3>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                status.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                status.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                status.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {status.label}
              </span>
            </div>
            <p className="text-xs sm:text-base text-slate-400 truncate">{vehicle.brand} {vehicle.model}</p>
          </div>

          {/* Desktop Stats */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-slate-900/50 rounded-xl">
              <p className="text-white font-semibold">{fmt(vehicle.currentOdometer)}</p>
              <p className="text-xs text-slate-500">km</p>
            </div>
            <div className="text-center px-4 py-2 bg-slate-900/50 rounded-xl">
              <p className="text-white font-semibold">{FUEL[vehicle.fuelType] || '-'}</p>
              <p className="text-xs text-slate-500">Yoqilg'i</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onMenuToggle() }} 
              className="p-2 sm:p-2.5 hover:bg-white/10 active:bg-white/15 rounded-lg sm:rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <MoreVertical size={18} className="sm:w-5 sm:h-5" />
            </button>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="flex lg:hidden items-center gap-3 sm:gap-4 mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
            <Gauge size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{fmt(vehicle.currentOdometer)} km</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
            <Fuel size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">{FUEL[vehicle.fuelType] || '-'}</span>
          </div>
          {vehicle.year && (
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <span className="text-sm">{vehicle.year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-4 top-16 z-40 bg-slate-800 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl py-2 min-w-[160px] animate-fadeIn">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit() }} 
            className="w-full px-4 py-3 text-left text-white hover:bg-white/5 flex items-center gap-3 transition-all"
          >
            <Edit2 size={16} className="text-blue-400" /> Tahrirlash
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete() }} 
            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-all"
          >
            <Trash2 size={16} /> O'chirish
          </button>
        </div>
      )}
    </div>
  )
})

const EmptyState = memo(({ onAdd, hasVehicles }) => (
  <div className="bg-slate-800/30 backdrop-blur rounded-3xl border border-white/5 p-10 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
      <Car className="w-10 h-10 text-slate-500" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      {hasVehicles ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
    </h3>
    <p className="text-slate-400 mb-6 max-w-sm mx-auto">
      {hasVehicles ? 'Qidiruv so\'rovingizga mos mashina topilmadi' : 'Avtoparkingizni boshqarish uchun birinchi mashinani qo\'shing'}
    </p>
    {!hasVehicles && (
      <button 
        onClick={onAdd} 
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl text-white font-semibold transition-all shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
      >
        <Plus size={20} /> Mashina qo'shish
      </button>
    )}
  </div>
))

const Modal = memo(({ title, onClose, children }) => (
  <div 
    className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end lg:items-center justify-center p-0 lg:p-4"
    style={{ zIndex: 999999 }}
    onClick={onClose}
  >
    <div 
      className="bg-slate-900 w-full lg:max-w-md lg:rounded-3xl border-t lg:border border-white/10 shadow-2xl overflow-hidden animate-fadeIn"
      style={{ 
        maxHeight: 'calc(100vh - 60px)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px'
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 lg:p-5 border-b border-white/5 sticky top-0 bg-slate-900 z-10">
        <h2 className="text-lg lg:text-xl font-bold text-white">{title}</h2>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {children}
      </div>
    </div>
  </div>
))

const Input = memo(({ label, type = 'text', value, onChange, placeholder, autoFocus, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-4 py-3.5 bg-slate-800/50 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all"
    />
  </div>
))

const Select = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3.5 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))