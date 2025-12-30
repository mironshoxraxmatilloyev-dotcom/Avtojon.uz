import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { Plus, Truck, Home, BarChart3, AlertTriangle, Crown, Sparkles, Mic } from 'lucide-react'
import { HomeTab, StatsTab, ServiceTab, VehicleModal, UpgradeModal, ExpiredView } from '../../components/fleet'
import VoiceVehicleCreator from '../../components/fleet/VoiceVehicleCreator'

// Cache
const CACHE_KEY = 'fleet_vehicles'
const CACHE_SUB_KEY = 'fleet_subscription'
const getCache = (key) => {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    const { value, timestamp } = JSON.parse(data)
    const ttl = key === CACHE_SUB_KEY ? 30 * 1000 : 5 * 60 * 1000
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(key)
      return null
    }
    return value
  } catch { return null }
}
const setCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }))
  } catch { }
}
const clearSubCache = () => {
  try { localStorage.removeItem(CACHE_SUB_KEY) } catch { }
}

export default function FleetDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const isMounted = useRef(true)

  const [vehicles, setVehicles] = useState(() => getCache(CACHE_KEY) || [])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [showMenu, setShowMenu] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [subscription, setSubscription] = useState(() => getCache(CACHE_SUB_KEY))
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [fleetAnalytics, setFleetAnalytics] = useState(null)

  const [form, setForm] = useState({
    plateNumber: '', brand: '', year: new Date().getFullYear(),
    fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: ''
  })

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    setVH()
    window.addEventListener('resize', setVH)
    return () => window.removeEventListener('resize', setVH)
  }, [])

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        clearSubCache()
        const { data } = await api.get('/vehicles/subscription')
        if (isMounted.current) {
          setSubscription(data.data)
          setCache(CACHE_SUB_KEY, data.data)
        }
      } catch { }
    }
    loadSubscription()
  }, [])

  useEffect(() => {
    if (!subscription?.endDate) return
    const updateTimeLeft = () => {
      const diff = new Date(subscription.endDate) - new Date()
      if (diff <= 0) {
        setTimeLeft('Tugadi')
        setSubscription(prev => prev ? { ...prev, isExpired: true } : null)
        return
      }
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
      setTimeLeft(`${days} kun`)
    }
    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000)
    return () => clearInterval(interval)
  }, [subscription?.endDate])

  useEffect(() => { fetchVehicles() }, [])

  // Fleet analytics yuklash
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data } = await api.get('/maintenance/fleet/analytics')
        if (isMounted.current) setFleetAnalytics(data.data)
      } catch { }
    }
    loadAnalytics()
  }, [vehicles])

  const fetchVehicles = useCallback(async () => {
    const hasCache = getCache(CACHE_KEY)
    if (!hasCache) setLoading(true)
    try {
      const { data } = await api.get('/vehicles')
      if (isMounted.current) {
        setVehicles(data.data || [])
        setCache(CACHE_KEY, data.data || [])
      }
    } catch { }
    finally { if (isMounted.current) setLoading(false) }
  }, [])

  const stats = useMemo(() => ({
    total: vehicles.length,
    excellent: vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length,
    attention: vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length,
    totalKm: vehicles.reduce((s, v) => s + (v.currentOdometer || 0), 0)
  }), [vehicles])

  const filteredVehicles = useMemo(() => {
    if (!search) return vehicles
    const q = search.toLowerCase()
    return vehicles.filter(v =>
      v.plateNumber?.toLowerCase().includes(q) ||
      v.brand?.toLowerCase().includes(q)
    )
  }, [vehicles, search])

  const openModal = useCallback((vehicle = null) => {
    setEditVehicle(vehicle)
    setForm(vehicle ? {
      plateNumber: vehicle.plateNumber || '',
      brand: vehicle.brand || '',
      year: vehicle.year || new Date().getFullYear(),
      fuelType: vehicle.fuelType || 'diesel',
      fuelTankCapacity: vehicle.fuelTankCapacity?.toString() || '',
      currentOdometer: vehicle.currentOdometer?.toString() || ''
    } : {
      plateNumber: '', brand: '', year: new Date().getFullYear(),
      fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: ''
    })
    setShowModal(true)
    setShowMenu(null)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!form.plateNumber || !form.brand) {
      alert.warning('Ogohlantirish', 'Raqam va marka majburiy')
      return
    }
    const body = {
      plateNumber: form.plateNumber,
      brand: form.brand,
      year: parseInt(form.year) || new Date().getFullYear(),
      fuelType: form.fuelType,
      fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : null,
      currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0,
      status: 'normal'
    }
    setShowModal(false)

    if (editVehicle && editVehicle._id) {
      setVehicles(prev => {
        const updated = prev.map(v => v._id === editVehicle._id ? { ...v, ...body } : v)
        setCache(CACHE_KEY, updated)
        return updated
      })
      alert.success('Yangilandi')
      api.put(`/vehicles/${editVehicle._id}`, body).catch(() => fetchVehicles())
    } else {
      try {
        const res = await api.post('/vehicles', body)
        if (res.data?.data?._id) {
          setVehicles(prev => {
            const updated = [res.data.data, ...prev]
            setCache(CACHE_KEY, updated)
            return updated
          })
          alert.success('Mashina qo\'shildi')
        }
      } catch (err) {
        alert.error('Xatolik', err.response?.data?.message || 'Mashina qo\'shishda xatolik')
        fetchVehicles()
      }
    }
  }, [form, editVehicle, fetchVehicles, alert])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('O\'chirmoqchimisiz?')) return
    setShowMenu(null)
    setVehicles(prev => {
      const updated = prev.filter(v => v._id !== id)
      setCache(CACHE_KEY, updated)
      return updated
    })
    alert.success('O\'chirildi')
    api.delete(`/vehicles/${id}`).catch(() => fetchVehicles())
  }, [fetchVehicles, alert])

  // Ovoz bilan mashina qo'shish
  const handleVoiceVehicle = useCallback(async (vehicleData) => {
    setShowVoiceModal(false)
    
    try {
      const res = await api.post('/vehicles', vehicleData)
      if (res.data?.data?._id) {
        setVehicles(prev => {
          const updated = [res.data.data, ...prev]
          setCache(CACHE_KEY, updated)
          return updated
        })
        alert.success('🎤 Mashina qo\'shildi!')
      }
    } catch (err) {
      alert.error('Xatolik', err.response?.data?.message || 'Mashina qo\'shishda xatolik')
      fetchVehicles()
    }
  }, [fetchVehicles, alert])

  const navItems = [
    { id: 'home', icon: Home, label: 'Avtopark' },
    { id: 'stats', icon: BarChart3, label: 'Statistika' },
    { id: 'service', icon: AlertTriangle, label: 'Diqqat' }
  ]

  if (subscription?.isExpired) {
    return <ExpiredView showModal={showUpgradeModal} setShowModal={setShowUpgradeModal} />
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      {/* PRO Sidebar - Desktop - Fixed Height No Scroll */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-200/60 flex-shrink-0 h-screen overflow-hidden fixed left-0 top-0">
        {/* Logo Section */}
        <div className="p-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/logo.jpg" 
                alt="Avtojon Logo" 
                className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-blue-500/30"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md flex items-center justify-center shadow-md">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Avtojon
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Fleet Management Pro</p>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/25">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || 'Foydalanuvchi'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@avtopark.uz'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - Flex grow but no scroll */}
        <nav className="flex-1 px-4 py-2 flex-shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Asosiy</p>
          <div className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  activeTab === item.id 
                    ? 'bg-white/20' 
                    : 'bg-slate-100 group-hover:bg-slate-200'
                }`}>
                  <item.icon size={16} />
                </div>
                <span className="text-sm">{item.label}</span>
                {item.id === 'service' && stats.attention > 0 && (
                  <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-bold ${
                    activeTab === item.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {stats.attention}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Subscription Card - Compact */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className={`p-3 rounded-xl border ${
            subscription?.plan === 'pro' 
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/50' 
              : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50'
          }`}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                subscription?.plan === 'pro' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/30' 
                  : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/30'
              }`}>
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {subscription?.plan === 'pro' ? 'Pro Tarif' : 'Trial'}
                </p>
                <p className="text-[10px] text-slate-500">{timeLeft} qoldi</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                subscription?.plan === 'pro'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25'
              }`}
            >
              {subscription?.plan === 'pro' ? 'Uzaytirish' : 'Pro ga o\'tish'}
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-[280px] pb-20 lg:pb-0">
        {/* PRO Header - Status bar safe area */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 pt-[env(safe-area-inset-top,24px)] lg:pt-0">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile Logo */}
                <div className="lg:hidden relative">
                  <img 
                    src="/logo.jpg" 
                    alt="Avtojon Logo" 
                    className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/25"
                  />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold text-slate-900">
                    {navItems.find(n => n.id === activeTab)?.label}
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-500">
                    {stats.total} ta mashina
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Subscription */}
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className={`lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${
                    subscription?.plan === 'pro'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <Crown size={12} />
                  {timeLeft}
                </button>
                
                {/* Add Button */}
                {activeTab === 'home' && (
                  <>
                    <button
                      onClick={() => setShowVoiceModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/30 active:scale-[0.98]"
                    >
                      <Mic size={16} strokeWidth={2.5} />
                      <span className="hidden sm:inline">🎤</span>
                    </button>
                    <button
                      onClick={() => openModal()}
                      className="flex items-center gap-1.5 px-3 lg:px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 rounded-xl text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span className="hidden sm:inline">Mashina qo'shish</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - Bottom nav uchun padding */}
        <div className="p-4 lg:p-6 pb-24 lg:pb-6">
          {activeTab === 'home' && (
            <HomeTab
              vehicles={filteredVehicles}
              stats={stats}
              search={search}
              setSearch={setSearch}
              onVehicleClick={(v) => navigate(`/fleet/vehicle/${v._id}`)}
              onEdit={openModal}
              onDelete={handleDelete}
              showMenu={showMenu}
              setShowMenu={setShowMenu}
              loading={loading}
              openModal={openModal}
              fleetAnalytics={fleetAnalytics}
            />
          )}
          {activeTab === 'stats' && <StatsTab vehicles={vehicles} stats={stats} />}
          {activeTab === 'service' && <ServiceTab vehicles={vehicles} navigate={navigate} />}
        </div>
      </main>

      {/* Bottom Navigation - Mobile - FIXED position */}
      <nav className="lg:hidden fixed-bottom-nav bg-white border-t border-slate-200/80" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999 }}>
        <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom,0px)]">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                activeTab === item.id 
                  ? 'bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/30' 
                  : ''
              }`}>
                <item.icon 
                  size={22} 
                  className={activeTab === item.id ? 'text-white' : 'text-slate-500'}
                  strokeWidth={activeTab === item.id ? 2.5 : 1.5}
                />
              </div>
              <span className={`text-[10px] font-semibold ${
                activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
              {item.id === 'service' && stats.attention > 0 && (
                <span className="absolute top-1 right-1/4 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {stats.attention}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {showModal && (
        <VehicleModal
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          isEdit={!!editVehicle}
        />
      )}
      {showVoiceModal && (
        <VoiceVehicleCreator
          onResult={handleVoiceVehicle}
          onClose={() => setShowVoiceModal(false)}
        />
      )}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          canClose={!subscription?.isExpired}
        />
      )}
      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(null)} />}
    </div>
  )
}
