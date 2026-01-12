import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { Plus, Home, BarChart3, AlertTriangle, Crown, Sparkles, Mic, User, Settings, LogOut } from 'lucide-react'
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
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
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
        alert.success('Mashina qo\'shildi!')
      }
    } catch (err) {
      alert.error('Xatolik', err.response?.data?.message || 'Mashina qo\'shishda xatolik')
      fetchVehicles()
    }
  }, [fetchVehicles, alert])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (subscription?.isExpired) {
    return <ExpiredView showModal={showUpgradeModal} setShowModal={setShowUpgradeModal} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img src="/main_logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg" />
            <div>
              <h1 className="text-lg font-bold">
                <span className="text-slate-800">avto</span>
                <span className="text-amber-500">JON</span>
              </h1>
              <p className="text-[10px] text-slate-400">Fleet Management</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="p-3">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName || 'Foydalanuvchi'}</p>
                <p className="text-[10px] text-slate-400">{stats.total} ta mashina</p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <NavItem icon={Home} label="Avtopark" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={BarChart3} label="Statistika" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <NavItem icon={AlertTriangle} label="Diqqat" active={activeTab === 'service'} onClick={() => setActiveTab('service')} badge={stats.attention} />
        </nav>

        {/* Subscription */}
        <div className="p-3 border-t border-slate-100">
          <div className={`p-3 rounded-xl ${subscription?.plan === 'pro' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className={`w-4 h-4 ${subscription?.plan === 'pro' ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span className="text-xs font-bold text-slate-700">{subscription?.plan === 'pro' ? 'Pro' : 'Trial'}</span>
              <span className="text-[10px] text-slate-500 ml-auto">{timeLeft}</span>
            </div>
            <button onClick={() => setShowUpgradeModal(true)} className={`w-full py-2 rounded-lg text-xs font-semibold text-white ${subscription?.plan === 'pro' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              {subscription?.plan === 'pro' ? 'Uzaytirish' : 'Pro ga o\'tish'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main 
        className="lg:ml-64 lg:pb-6 pb-36 overflow-y-auto"
        style={{ height: '100vh' }}
      >
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 safe-top">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/main_logo.jpg" alt="Logo" className="w-9 h-9 rounded-xl shadow" />
                <div>
                  <h1 className="text-base font-bold">
                    <span className="text-slate-800">avto</span>
                    <span className="text-amber-500">JON</span>
                  </h1>
                  <p className="text-[10px] text-slate-400">{stats.total} ta mashina</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowUpgradeModal(true)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${subscription?.plan === 'pro' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  <Crown size={12} />
                  {timeLeft}
                </button>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-4 top-14 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-[180px]">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-800 text-sm">{user?.fullName}</p>
                  <p className="text-[10px] text-slate-400">{user?.phone}</p>
                </div>
                <button onClick={handleLogout} className="w-full px-3 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm">
                  <LogOut size={16} />
                  Chiqish
                </button>
              </div>
            </>
          )}
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activeTab === 'home' ? 'Avtopark' : activeTab === 'stats' ? 'Statistika' : 'Diqqat talab'}
              </h2>
              <p className="text-sm text-slate-500">{stats.total} ta mashina</p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'home' && (
                <>
                  <button onClick={() => setShowVoiceModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-xl text-white font-semibold text-sm shadow-lg shadow-violet-500/25">
                    <Mic size={18} />
                    Ovoz
                  </button>
                  <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-semibold text-sm shadow-lg shadow-indigo-500/25">
                    <Plus size={18} />
                    Qo'shish
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6 pb-40 lg:pb-6">
          {activeTab === 'home' && (
            <HomeTab
              vehicles={filteredVehicles}
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
              onAlertClick={() => setActiveTab('service')}
            />
          )}
          {activeTab === 'stats' && <StatsTab vehicles={vehicles} stats={stats} />}
          {activeTab === 'service' && <ServiceTab vehicles={vehicles} navigate={navigate} />}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-bottom">
        <div className="grid grid-cols-4 h-16">
          <BottomNavItem icon={Home} label="Avtopark" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <BottomNavItem icon={BarChart3} label="Statistika" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
          <BottomNavItem icon={Mic} label="Ovoz" isSpecial onClick={() => setShowVoiceModal(true)} />
          <BottomNavItem icon={AlertTriangle} label="Diqqat" active={activeTab === 'service'} onClick={() => setActiveTab('service')} badge={stats.attention} />
        </div>
      </nav>

      {/* Modals */}
      {showModal && <VehicleModal form={form} setForm={setForm} onSubmit={handleSubmit} onClose={() => setShowModal(false)} isEdit={!!editVehicle} />}
      {showVoiceModal && <VoiceVehicleCreator onResult={handleVoiceVehicle} onClose={() => setShowVoiceModal(false)} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} canClose={!subscription?.isExpired} />}
      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(null)} />}
    </div>
  )
}

// Nav Item Component
const NavItem = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
      active ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
    {badge > 0 && (
      <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-bold ${active ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
        {badge}
      </span>
    )}
  </button>
)

// Bottom Nav Item
const BottomNavItem = ({ icon: Icon, label, active, onClick, badge, isSpecial }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 relative">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
      active ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : ''
    }`}>
      <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} strokeWidth={active ? 2.5 : 1.5} />
    </div>
    <span className={`text-[10px] font-medium ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      {label}
    </span>
    {badge > 0 && (
      <span className="absolute top-0 right-4 min-w-[16px] h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
        {badge}
      </span>
    )}
  </button>
)
