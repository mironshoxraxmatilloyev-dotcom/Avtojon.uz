import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { 
  Shield, Users, Plus, LogOut, Phone, Briefcase, User, Copy, Check, 
  Trash2, Search, X, Power, Eye, EyeOff, Edit3, Key,
  Truck, Route, Car, LayoutDashboard, Settings, Menu, ChevronRight
} from 'lucide-react'

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { id: 'businessmen', label: 'Biznesmenlar', icon: Users },
  { id: 'drivers', label: 'Shofyorlar', icon: Truck },
  { id: 'flights', label: 'Reyslar', icon: Route },
  { id: 'vehicles', label: 'Mashinalar', icon: Car },
]

export default function SuperAdminPanel() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [businessmen, setBusinessmen] = useState([])
  const [drivers, setDrivers] = useState([])
  const [flights, setFlights] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingBusinessman, setEditingBusinessman] = useState(null)
  const [showCredentials, setShowCredentials] = useState(null)
  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', businessType: '', phone: '', username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { if (activeTab === 'businessmen') fetchBusinessmen() }, [activeTab])
  useEffect(() => { if (activeTab === 'drivers') fetchDrivers() }, [activeTab])
  useEffect(() => { if (activeTab === 'flights') fetchFlights() }, [activeTab])
  useEffect(() => { if (activeTab === 'vehicles') fetchVehicles() }, [activeTab])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/super-admin/stats')
      setStats(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinessmen = async () => {
    try {
      const { data } = await api.get('/super-admin/businessmen')
      setBusinessmen(data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/super-admin/drivers')
      setDrivers(data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchFlights = async () => {
    try {
      const { data } = await api.get('/super-admin/flights')
      setFlights(data.data || [])
    } catch (err) { console.error(err) }
  }

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/super-admin/vehicles')
      setVehicles(data.data || [])
    } catch (err) { console.error(err) }
  }

  // Businessman CRUD
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fullName || !formData.businessType || !formData.phone) {
      alert.warning('Ogohlantirish', 'Barcha maydonlarni to\'ldiring'); return
    }
    if (!editingBusinessman && (!formData.username || !formData.password)) {
      alert.warning('Ogohlantirish', 'Username va parol kiriting'); return
    }
    if (!editingBusinessman && formData.password.length < 6) {
      alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgi'); return
    }
    setSubmitting(true)
    try {
      if (editingBusinessman) {
        await api.put('/super-admin/businessmen/' + editingBusinessman._id, {
          fullName: formData.fullName, businessType: formData.businessType, phone: formData.phone
        })
        setBusinessmen(prev => prev.map(b => b._id === editingBusinessman._id ? { ...b, ...formData } : b))
        alert.success('Muvaffaqiyat', 'Yangilandi!')
      } else {
        const { data } = await api.post('/super-admin/businessmen', formData)
        setBusinessmen(prev => [data.data.businessman, ...prev])
        setShowCredentials({ username: formData.username, password: formData.password })
        alert.success('Muvaffaqiyat', 'Qo\'shildi!')
        fetchStats()
      }
      setShowModal(false); setEditingBusinessman(null)
      setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' })
    } catch (err) {
      alert.error('Xatolik', err.response?.data?.message || 'Xatolik')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!await alert.confirm({ title: "O'chirish", message: "Rostdan o'chirmoqchimisiz?", type: "danger" })) return
    try {
      await api.delete('/super-admin/businessmen/' + id)
      setBusinessmen(prev => prev.filter(b => b._id !== id))
      alert.success('O\'chirildi', 'Biznesmen o\'chirildi')
      fetchStats()
    } catch (err) { alert.error('Xatolik', 'O\'chirishda xatolik') }
  }

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgi'); return
    }
    try {
      await api.post('/super-admin/businessmen/' + passwordModal._id + '/set-password', { password: newPassword })
      setShowCredentials({ username: passwordModal.username, password: newPassword })
      setPasswordModal(null); setNewPassword('')
      alert.success('Yangilandi', 'Parol yangilandi')
    } catch (err) { alert.error('Xatolik', 'Xatolik') }
  }

  const toggleActive = async (b) => {
    try {
      await api.put('/super-admin/businessmen/' + b._id, { isActive: !b.isActive })
      setBusinessmen(prev => prev.map(x => x._id === b._id ? { ...x, isActive: !x.isActive } : x))
      alert.success('Yangilandi', b.isActive ? 'Faolsizlantirildi' : 'Faollashtirildi')
      fetchStats()
    } catch (err) { alert.error('Xatolik', 'Xatolik') }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  // Render sections
  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Umumiy statistika</h2>
      {stats && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Biznesmenlar" value={stats.businessmen.total} 
              sub={<><span className="text-green-400">{stats.businessmen.active} faol</span> / <span className="text-red-400">{stats.businessmen.inactive} faolsiz</span></>} color="indigo" />
            <StatCard icon={Truck} label="Shofyorlar" value={stats.drivers.total} 
              sub={<><span className="text-amber-400">{stats.drivers.busy} band</span> / <span className="text-green-400">{stats.drivers.free} bo'sh</span></>} color="blue" />
            <StatCard icon={Route} label="Reyslar" value={stats.flights.total} 
              sub={<><span className="text-amber-400">{stats.flights.active} faol</span> / <span className="text-green-400">{stats.flights.completed} yakunlangan</span></>} color="green" />
            <StatCard icon={Car} label="Mashinalar" value={stats.vehicles.total} color="purple" />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Foydalanuvchilar taqsimoti */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Foydalanuvchilar taqsimoti</h3>
              <div className="space-y-4">
                <ProgressBar label="Biznesmenlar" value={stats.businessmen.total} max={stats.businessmen.total + stats.drivers.total} color="indigo" />
                <ProgressBar label="Shofyorlar" value={stats.drivers.total} max={stats.businessmen.total + stats.drivers.total} color="blue" />
              </div>
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{stats.businessmen.total + stats.drivers.total}</div>
                  <div className="text-xs text-slate-400">Jami foydalanuvchilar</div>
                </div>
              </div>
            </div>

            {/* Reyslar holati */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Reyslar holati</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <DonutChart 
                  active={stats.flights.active} 
                  completed={stats.flights.completed} 
                  total={stats.flights.total} 
                />
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-slate-400">Faol ({stats.flights.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-slate-400">Yakunlangan ({stats.flights.completed})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab('businessmen')}
              className="group bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/30 rounded-xl p-6 text-left transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Parollarni yangilang</h3>
                  <p className="text-sm text-slate-400">Biznesmenlar parollarini boshqaring</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab('flights')}
              className="group bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-xl p-6 text-left transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Route className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Reyslarni ko'ring</h3>
                  <p className="text-sm text-slate-400">Barcha reyslar statistikasi</p>
                </div>
              </div>
            </button>
          </div>

          {/* Shofyorlar holati */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Shofyorlar holati</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-amber-400">{stats.drivers.busy}</div>
                <div className="text-sm text-slate-400 mt-1">Band shofyorlar</div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.drivers.total > 0 ? (stats.drivers.busy / stats.drivers.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-green-400">{stats.drivers.free}</div>
                <div className="text-sm text-slate-400 mt-1">Bo'sh shofyorlar</div>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${stats.drivers.total > 0 ? (stats.drivers.free / stats.drivers.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderBusinessmen = () => {
    const filtered = businessmen.filter(b => {
      const matchSearch = b.fullName?.toLowerCase().includes(search.toLowerCase()) || b.username?.includes(search)
      const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && b.isActive) || (filterStatus === 'inactive' && !b.isActive)
      return matchSearch && matchStatus
    })
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Biznesmenlar</h2>
          <button onClick={() => { setEditingBusinessman(null); setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' }); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm">
            <Plus size={18} /> Yangi
          </button>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none">
            <option value="all">Barchasi</option>
            <option value="active">Faol</option>
            <option value="inactive">Faolsiz</option>
          </select>
        </div>
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b._id} className={`bg-slate-800 rounded-lg p-4 border ${b.isActive ? 'border-slate-700' : 'border-red-900/50 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${b.isActive ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{b.fullName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${b.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {b.isActive ? 'Faol' : 'Faolsiz'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{b.businessType}</span>
                      <span>{b.phone}</span>
                      <span className="text-indigo-400">@{b.username}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingBusinessman(b); setFormData({ fullName: b.fullName, businessType: b.businessType, phone: b.phone, username: '', password: '' }); setShowModal(true) }}
                    className="p-2 hover:bg-slate-700 rounded text-blue-400"><Edit3 size={16} /></button>
                  <button onClick={() => { setPasswordModal(b); setNewPassword('') }}
                    className="p-2 hover:bg-slate-700 rounded text-amber-400"><Key size={16} /></button>
                  <button onClick={() => toggleActive(b)}
                    className={`p-2 hover:bg-slate-700 rounded ${b.isActive ? 'text-green-400' : 'text-slate-500'}`}><Power size={16} /></button>
                  <button onClick={() => handleDelete(b._id)}
                    className="p-2 hover:bg-slate-700 rounded text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDrivers = () => {
    const filtered = drivers.filter(d => d.fullName?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search))
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Shofyorlar ({drivers.length})</h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="grid gap-2">
          {filtered.map(d => (
            <div key={d._id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d.status === 'busy' ? 'bg-amber-600' : 'bg-green-600'}`}>
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{d.fullName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${d.status === 'busy' ? 'bg-amber-900/50 text-amber-400' : 'bg-green-900/50 text-green-400'}`}>
                        {d.status === 'busy' ? 'Band' : 'Bo\'sh'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{d.phone}</span>
                      <span className="text-indigo-400">@{d.username}</span>
                      {d.user && <span className="text-slate-500">({d.user.fullName})</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-center py-8">Shofyorlar topilmadi</p>}
        </div>
      </div>
    )
  }

  const renderFlights = () => {
    const filtered = flights.filter(f => {
      const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase()) || f.driver?.fullName?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || f.status === filterStatus
      return matchSearch && matchStatus
    })
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Reyslar ({flights.length})</h2>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none">
            <option value="all">Barchasi</option>
            <option value="active">Faol</option>
            <option value="completed">Yakunlangan</option>
          </select>
        </div>
        <div className="grid gap-2">
          {filtered.map(f => (
            <div key={f._id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${f.status === 'active' ? 'bg-amber-600' : 'bg-green-600'}`}>
                    <Route className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{f.name || 'Reys'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${f.status === 'active' ? 'bg-amber-900/50 text-amber-400' : 'bg-green-900/50 text-green-400'}`}>
                        {f.status === 'active' ? 'Faol' : 'Yakunlangan'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{f.driver?.fullName || '-'}</span>
                      <span>{f.vehicle?.plateNumber || '-'}</span>
                      <span>{new Date(f.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-center py-8">Reyslar topilmadi</p>}
        </div>
      </div>
    )
  }

  const renderVehicles = () => {
    const filtered = vehicles.filter(v => v.plateNumber?.toLowerCase().includes(search.toLowerCase()) || v.brand?.toLowerCase().includes(search.toLowerCase()))
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Mashinalar ({vehicles.length})</h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="grid gap-2">
          {filtered.map(v => (
            <div key={v._id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-600">
                  <Car className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-white">{v.plateNumber}</div>
                  <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                    <span>{v.brand || '-'} {v.year || ''}</span>
                    {v.currentDriver && <span className="text-green-400">{v.currentDriver.fullName}</span>}
                    {v.user && <span className="text-slate-500">({v.user.fullName})</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500 text-center py-8">Mashinalar topilmadi</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">Super Admin</h1>
            <p className="text-xs text-slate-400">Boshqaruv paneli</p>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {MENU_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); setSearch(''); setFilterStatus('all') }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}>
              <item.icon size={20} />
              <span>{item.label}</span>
              {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition">
            <LogOut size={20} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-700 rounded-lg text-white">
            <Menu size={24} />
          </button>
          <span className="font-bold text-white">{MENU_ITEMS.find(m => m.id === activeTab)?.label}</span>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'businessmen' && renderBusinessmen()}
              {activeTab === 'drivers' && renderDrivers()}
              {activeTab === 'flights' && renderFlights()}
              {activeTab === 'vehicles' && renderVehicles()}
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="font-bold text-white">{editingBusinessman ? 'Tahrirlash' : 'Yangi biznesmen'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">To'liq ism</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Biznes turi</label>
                <input type="text" value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              {!editingBusinessman && (
                <div className="pt-3 border-t border-slate-700 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Username</label>
                    <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Parol (kamida 6 ta belgi)</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium disabled:opacity-50">
                {submitting ? 'Saqlanmoqda...' : (editingBusinessman ? 'Saqlash' : 'Yaratish')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-sm border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h2 className="font-bold text-white">Parolni yangilash</h2>
                <p className="text-xs text-slate-400">{passwordModal.fullName}</p>
              </div>
              <button onClick={() => setPasswordModal(null)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500" placeholder="Yangi parol" autoFocus />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button onClick={handlePasswordUpdate} disabled={!newPassword || newPassword.length < 6}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 rounded-lg text-white text-sm font-medium disabled:opacity-50">Yangilash</button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-sm border border-slate-700">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="font-bold text-white">Kirish ma'lumotlari</h2>
              <button onClick={() => setShowCredentials(null)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-3">
                <p className="text-green-400 text-xs mb-2">Bu ma'lumotlarni saqlang!</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-900 px-2 py-1.5 rounded text-white text-sm">{showCredentials.username}</code>
                    <button onClick={() => copyToClipboard(showCredentials.username, 'u')} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white">
                      {copiedField === 'u' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-900 px-2 py-1.5 rounded text-white text-sm">{showCredentials.password}</code>
                    <button onClick={() => copyToClipboard(showCredentials.password, 'p')} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white">
                      {copiedField === 'p' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowCredentials(null)} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm">Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    indigo: 'bg-indigo-600/20 text-indigo-400',
    blue: 'bg-blue-600/20 text-blue-400',
    green: 'bg-green-600/20 text-green-400',
    purple: 'bg-purple-600/20 text-purple-400',
  }
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs">{sub}</div>}
    </div>
  )
}

// Progress Bar Component
function ProgressBar({ label, value, max, color }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const colors = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
  }
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Donut Chart Component
function DonutChart({ active, completed, total }) {
  const activePercent = total > 0 ? (active / total) * 100 : 0
  const completedPercent = total > 0 ? (completed / total) * 100 : 0
  const circumference = 2 * Math.PI * 45
  const activeOffset = circumference - (activePercent / 100) * circumference
  const completedOffset = circumference - (completedPercent / 100) * circumference
  
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle cx="64" cy="64" r="45" fill="none" stroke="#334155" strokeWidth="12" />
        {/* Completed (green) */}
        <circle 
          cx="64" cy="64" r="45" fill="none" 
          stroke="#22c55e" strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={completedOffset}
          className="transition-all duration-1000 ease-out"
        />
        {/* Active (amber) - offset by completed */}
        <circle 
          cx="64" cy="64" r="45" fill="none" 
          stroke="#f59e0b" strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={activeOffset}
          style={{ strokeDashoffset: circumference - (activePercent / 100) * circumference + completedPercent / 100 * circumference }}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{total}</div>
          <div className="text-xs text-slate-400">Jami</div>
        </div>
      </div>
    </div>
  )
}
