import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { Plus, LogOut, Truck, Clock, Home, BarChart3, AlertTriangle } from 'lucide-react'
import { HomeTab, StatsTab, ServiceTab, VehicleModal, UpgradeModal, ExpiredView } from '../../components/fleet'

// Cache
const CACHE_KEY = 'fleet_vehicles'
const CACHE_SUB_KEY = 'fleet_subscription'
const getCache = (key) => {
  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    const { value, timestamp } = JSON.parse(data)
    // Subscription cache faqat 30 sekund
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
// Subscription cache ni tozalash
const clearSubCache = () => {
  try { localStorage.removeItem(CACHE_SUB_KEY) } catch { }
}

export default function FleetDashboard() {
  const { user, logout } = useAuthStore()
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
  const [upgrading, setUpgrading] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  const [form, setForm] = useState({
    plateNumber: '', brand: '', model: '', year: new Date().getFullYear(),
    fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: ''
  })

  // 🔥 Mobile viewport height fix - Instagram kabi
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)
    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        // Har safar yangi ma'lumot olish
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
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      fuelType: vehicle.fuelType || 'diesel',
      fuelTankCapacity: vehicle.fuelTankCapacity?.toString() || '',
      currentOdometer: vehicle.currentOdometer?.toString() || ''
    } : {
      plateNumber: '', brand: '', model: '', year: new Date().getFullYear(),
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
      ...form,
      year: parseInt(form.year) || new Date().getFullYear(),
      fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : null,
      currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0,
      status: 'normal'
    }
    setShowModal(false)

    if (editVehicle) {
      setVehicles(prev => {
        const updated = prev.map(v => v._id === editVehicle._id ? { ...v, ...body } : v)
        setCache(CACHE_KEY, updated)
        return updated
      })
      alert.success('Yangilandi')
      api.put(`/vehicles/${editVehicle._id}`, body).catch(() => fetchVehicles())
    } else {
      // Yangi mashina qo'shish - avval API ga so'rov, keyin UI yangilash
      try {
        const res = await api.post('/vehicles', body)
        if (res.data?.data?._id) {
          setVehicles(prev => {
            const updated = [res.data.data, ...prev]
            setCache(CACHE_KEY, updated)
            return updated
          })
          alert.success('Qo\'shildi')
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

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const { data } = await api.post('/vehicles/subscription/upgrade')
      setSubscription(data.data)
      setShowUpgradeModal(false)
      alert.success('Pro tarifga o\'tdingiz!')
    } catch (err) {
      alert.error('Xatolik', err.userMessage || 'Xatolik')
    } finally { setUpgrading(false) }
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Avtopark' },
    { id: 'stats', icon: BarChart3, label: 'Statistika' },
    { id: 'service', icon: AlertTriangle, label: 'Diqqat' }
  ]

  if (subscription?.isExpired) {
    return <ExpiredView showModal={showUpgradeModal} setShowModal={setShowUpgradeModal} />
  }

  // Bottom Nav Component - Instagram kabi fixed
  const BottomNav = () => (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[99999] bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
      style={{ 
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      <div 
        className="flex items-center justify-around py-1 px-1"
        style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
      >
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all relative ${
              activeTab === item.id ? 'text-blue-400' : 'text-slate-500 active:text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-blue-500/20' : ''}`}>
              <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.id === 'service' && stats.attention > 0 && (
              <span className="absolute top-1 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {stats.attention}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex flex-col items-center gap-0.5 py-2 px-4 text-slate-500 active:text-red-400"
        >
          <div className="p-1.5">
            <LogOut size={24} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium">Chiqish</span>
        </button>
      </div>
    </nav>
  )

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-slate-950 overflow-hidden">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/50 border-r border-white/5 p-6 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Avtopark</h1>
            <p className="text-xs text-slate-500">Fleet Management</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {item.id === 'service' && stats.attention > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.attention}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${subscription?.plan === 'pro' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-sm text-slate-300">
                {subscription?.isExpired ? 'Tugagan' : `${subscription?.plan === 'trial' ? 'Trial' : 'Pro'} • ${timeLeft}`}
              </span>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Uzaytirish
            </button>
          </div>

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content - scrollable */}
      <main className="flex-1 flex flex-col min-h-0 lg:h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-slate-900/50 border-b border-white/5 px-4 py-3 lg:px-8 lg:py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-white">
                  {navItems.find(n => n.id === activeTab)?.label}
                </h2>
                <p className="text-xs lg:text-sm text-slate-500">{user?.fullName || user?.companyName || 'Foydalanuvchi'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile subscription badge */}
              <div className="lg:hidden">
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg font-medium"
                >
                  {subscription?.isExpired ? 'Tugagan' : timeLeft}
                </button>
              </div>
              {activeTab === 'home' && (
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-all active:scale-95"
                >
                  <Plus size={18} />
                  <span className="text-sm">Mashina</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content - scrollable area with bottom padding for nav */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
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
            />
          )}
          {activeTab === 'stats' && <StatsTab vehicles={vehicles} stats={stats} />}
          {activeTab === 'service' && <ServiceTab vehicles={vehicles} navigate={navigate} />}
        </div>

        {/* Bottom Navigation - Mobile only - fixed position */}
        <BottomNav />
      </main>

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
