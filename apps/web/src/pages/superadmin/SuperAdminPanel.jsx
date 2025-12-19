import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { 
  Shield, Users, Plus, LogOut, User, Copy, Check, 
  Trash2, Search, X, Power, Eye, EyeOff, Edit3, Key,
  Truck, Route, Car, LayoutDashboard, Menu, ChevronRight, BarChart3
} from 'lucide-react'

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
  { id: 'stats', label: 'Statistika', icon: BarChart3 },
  { id: 'businessmen', label: 'Biznesmenlar', icon: Users },
  { id: 'drivers', label: 'Shofyorlar', icon: Truck },
  { id: 'flights', label: 'Reyslar', icon: Route },
  { id: 'vehicles', label: 'Mashinalar', icon: Car },
]

// StatCard komponenti
const StatCard = ({ icon: Icon, label, value, sub, color }) => {
  const colors = {
    indigo: 'from-indigo-900/40 to-indigo-800/20 border-indigo-500/20 hover:border-indigo-400/40',
    blue: 'from-blue-900/40 to-blue-800/20 border-blue-500/20 hover:border-blue-400/40',
    green: 'from-green-900/40 to-green-800/20 border-green-500/20 hover:border-green-400/40',
    purple: 'from-purple-900/40 to-purple-800/20 border-purple-500/20 hover:border-purple-400/40',
  }
  const iconColors = {
    indigo: 'bg-indigo-600/30 text-indigo-400',
    blue: 'bg-blue-600/30 text-blue-400',
    green: 'bg-green-600/30 text-green-400',
    purple: 'bg-purple-600/30 text-purple-400',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 border transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${iconColors[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
      {sub && <div className="mt-3 text-xs">{sub}</div>}
    </div>
  )
}

// ProgressBar komponenti
const ProgressBar = ({ label, value, max, color }) => {
  const percent = max > 0 ? (value / max) * 100 : 0
  const barColors = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  }
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">{value}</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${barColors[color]} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

// 3D Donut Chart komponenti
const DonutChart3D = ({ data, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90 drop-shadow-2xl">
        <defs>
          <filter id="shadow3d" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5"/>
          </filter>
          {data.map((item, i) => (
            <linearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={item.color} stopOpacity="1"/>
              <stop offset="100%" stopColor={item.colorDark} stopOpacity="1"/>
            </linearGradient>
          ))}
        </defs>
        {data.map((item, i) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0
          const angle = (percent / 100) * 360
          const startAngle = currentAngle
          currentAngle += angle
          
          const radius = 40
          const circumference = 2 * Math.PI * radius
          const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`
          const strokeDashoffset = -(startAngle / 360) * circumference
          
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={`url(#gradient-${i})`}
              strokeWidth="18"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              filter="url(#shadow3d)"
              className="transition-all duration-1000 hover:opacity-80"
              style={{ transformOrigin: 'center' }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{total}</span>
        <span className="text-xs text-slate-400">Jami</span>
      </div>
    </div>
  )
}

// 3D Bar Chart komponenti
const BarChart3D = ({ data, height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="flex items-end justify-around gap-4 px-4" style={{ height }}>
      {data.map((item, i) => {
        const barHeightPx = Math.max((item.value / maxValue) * (height - 40), 30)
        return (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            {/* Value label */}
            <div className="text-lg font-bold text-white mb-1">{item.value}</div>
            <div className="relative w-full max-w-[70px] group" style={{ height: height - 60 }}>
              {/* 3D effect - back face */}
              <div 
                className="absolute -right-2 bottom-0 w-full rounded-t-lg opacity-40"
                style={{ 
                  height: barHeightPx,
                  background: item.colorDark,
                  transform: 'skewY(-3deg)',
                }}
              />
              {/* Main bar */}
              <div 
                className="absolute bottom-0 w-full rounded-t-xl transition-all duration-700 ease-out group-hover:scale-105"
                style={{ 
                  height: barHeightPx,
                  background: `linear-gradient(180deg, ${item.color} 0%, ${item.colorDark} 100%)`,
                  boxShadow: `0 10px 40px ${item.color}40, inset 0 2px 10px rgba(255,255,255,0.2)`,
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-t-xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
                </div>
              </div>
            </div>
            <span className="text-sm text-slate-400 text-center mt-2">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Animated Counter komponenti
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = parseInt(value)
    if (start === end) return
    
    const incrementTime = duration / end
    const timer = setInterval(() => {
      start += 1
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, Math.max(incrementTime, 10))
    
    return () => clearInterval(timer)
  }, [value, duration])
  
  return <span>{count}</span>
}

// Glassmorphism Card komponenti
const GlassCard = ({ children, className = '', glow = '' }) => (
  <div className={`relative overflow-hidden bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 ${className}`}>
    {glow && <div className={`absolute -top-20 -right-20 w-40 h-40 ${glow} rounded-full blur-3xl opacity-30`} />}
    {glow && <div className={`absolute -bottom-20 -left-20 w-40 h-40 ${glow} rounded-full blur-3xl opacity-20`} />}
    <div className="relative z-10">{children}</div>
  </div>
)

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
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchBusinessmen = async () => {
    try { const { data } = await api.get('/super-admin/businessmen'); setBusinessmen(data.data || []) }
    catch (err) { console.error(err) }
  }

  const fetchDrivers = async () => {
    try { const { data } = await api.get('/super-admin/drivers'); setDrivers(data.data || []) }
    catch (err) { console.error(err) }
  }

  const fetchFlights = async () => {
    try { const { data } = await api.get('/super-admin/flights'); setFlights(data.data || []) }
    catch (err) { console.error(err) }
  }

  const fetchVehicles = async () => {
    try { const { data } = await api.get('/super-admin/vehicles'); setVehicles(data.data || []) }
    catch (err) { console.error(err) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fullName || !formData.businessType || !formData.phone) { alert.warning('Ogohlantirish', 'Barcha maydonlarni toldiring'); return }
    if (!editingBusinessman && (!formData.username || !formData.password)) { alert.warning('Ogohlantirish', 'Username va parol kiriting'); return }
    if (!editingBusinessman && formData.password.length < 6) { alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgi'); return }
    setSubmitting(true)
    try {
      if (editingBusinessman) {
        await api.put('/super-admin/businessmen/' + editingBusinessman._id, { fullName: formData.fullName, businessType: formData.businessType, phone: formData.phone })
        setBusinessmen(prev => prev.map(b => b._id === editingBusinessman._id ? { ...b, ...formData } : b))
        alert.success('Muvaffaqiyat', 'Yangilandi!')
      } else {
        const { data } = await api.post('/super-admin/businessmen', formData)
        setBusinessmen(prev => [data.data.businessman, ...prev])
        setShowCredentials({ username: formData.username, password: formData.password })
        alert.success('Muvaffaqiyat', 'Qoshildi!')
        fetchStats()
      }
      setShowModal(false); setEditingBusinessman(null)
      setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' })
    } catch (err) { alert.error('Xatolik', err.response?.data?.message || 'Xatolik') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!await alert.confirm({ title: "O'chirish", message: "Rostdan o'chirmoqchimisiz?", type: "danger" })) return
    try { await api.delete('/super-admin/businessmen/' + id); setBusinessmen(prev => prev.filter(b => b._id !== id)); alert.success("O'chirildi", "Biznesmen o'chirildi"); fetchStats() }
    catch (err) { alert.error('Xatolik', "O'chirishda xatolik") }
  }

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) { alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgi'); return }
    try { await api.post('/super-admin/businessmen/' + passwordModal._id + '/set-password', { password: newPassword }); setShowCredentials({ username: passwordModal.username, password: newPassword }); setPasswordModal(null); setNewPassword(''); alert.success('Yangilandi', 'Parol yangilandi') }
    catch (err) { alert.error('Xatolik', 'Xatolik') }
  }

  const toggleActive = async (b) => {
    try { await api.put('/super-admin/businessmen/' + b._id, { isActive: !b.isActive }); setBusinessmen(prev => prev.map(x => x._id === b._id ? { ...x, isActive: !x.isActive } : x)); alert.success('Yangilandi', b.isActive ? 'Faolsizlantirildi' : 'Faollashtirildi'); fetchStats() }
    catch (err) { alert.error('Xatolik', 'Xatolik') }
  }

  const copyToClipboard = (text, field) => { navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000) }
  const handleLogout = () => { logout(); navigate('/login') }

  // Dashboard - 4 ta stat + 2 ta katta karta
  const renderDashboard = () => (
    <div className="space-y-8">
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Biznesmenlar" value={stats.businessmen.total} sub={<><span className="text-green-400">{stats.businessmen.active} faol</span> / <span className="text-red-400">{stats.businessmen.inactive} faolsiz</span></>} color="indigo" />
          <StatCard icon={Truck} label="Shofyorlar" value={stats.drivers.total} sub={<><span className="text-amber-400">{stats.drivers.busy} band</span> / <span className="text-green-400">{stats.drivers.free} bosh</span></>} color="blue" />
          <StatCard icon={Route} label="Reyslar" value={stats.flights.total} sub={<><span className="text-amber-400">{stats.flights.active} faol</span> / <span className="text-green-400">{stats.flights.completed} yakunlangan</span></>} color="green" />
          <StatCard icon={Car} label="Mashinalar" value={stats.vehicles.total} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button onClick={() => setActiveTab('businessmen')} className="group relative overflow-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 hover:from-indigo-800/60 hover:to-purple-800/60 border border-indigo-500/30 hover:border-indigo-400/50 rounded-3xl p-8 text-left transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 shadow-xl hover:shadow-indigo-500/20">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-400/30 transition-all duration-700" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-400/30 transition-all duration-700" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-400/50 transform group-hover:rotate-3 transition-all duration-500">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">Parollarni yangilang</h3>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Biznesmenlar parollarini boshqaring</p>
            <div className="mt-4 flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
              <span className="text-sm font-medium">Kirish</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>

        <button onClick={() => setActiveTab('stats')} className="group relative overflow-hidden bg-gradient-to-br from-emerald-900/50 to-teal-900/50 hover:from-emerald-800/60 hover:to-teal-800/60 border border-emerald-500/30 hover:border-emerald-400/50 rounded-3xl p-8 text-left transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 shadow-xl hover:shadow-emerald-500/20">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-all duration-700" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl group-hover:bg-teal-400/30 transition-all duration-700" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-400/50 transform group-hover:rotate-3 transition-all duration-500">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors">Statistikani ko'ring</h3>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Umumiy statistika va grafiklarni ko'ring</p>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <span className="text-sm font-medium">Kirish</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </div>
    </div>
  )

  // Statistika sahifasi - 3D grafiklar bilan
  const renderStats = () => {
    if (!stats) return <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
    
    const userDistribution = [
      { label: 'Biznesmenlar', value: stats.businessmen.total, color: '#818cf8', colorDark: '#4f46e5' },
      { label: 'Shofyorlar', value: stats.drivers.total, color: '#38bdf8', colorDark: '#0284c7' },
    ]
    
    const businessmenStatus = [
      { label: 'Faol', value: stats.businessmen.active, color: '#4ade80', colorDark: '#16a34a' },
      { label: 'Faolsiz', value: stats.businessmen.inactive, color: '#f87171', colorDark: '#dc2626' },
    ]
    
    const driverStatus = [
      { label: 'Band', value: stats.drivers.busy, color: '#fbbf24', colorDark: '#d97706' },
      { label: 'Bosh', value: stats.drivers.free, color: '#4ade80', colorDark: '#16a34a' },
    ]
    
    const flightStatus = [
      { label: 'Faol', value: stats.flights.active, color: '#fbbf24', colorDark: '#d97706' },
      { label: 'Yakunlangan', value: stats.flights.completed, color: '#4ade80', colorDark: '#16a34a' },
      { label: 'Bekor', value: stats.flights.cancelled || 0, color: '#f87171', colorDark: '#dc2626' },
    ]
    
    const overviewData = [
      { label: 'Biznesmenlar', value: stats.businessmen.total, color: '#818cf8', colorDark: '#4f46e5' },
      { label: 'Shofyorlar', value: stats.drivers.total, color: '#38bdf8', colorDark: '#0284c7' },
      { label: 'Reyslar', value: stats.flights.total, color: '#4ade80', colorDark: '#16a34a' },
      { label: 'Mashinalar', value: stats.vehicles.total, color: '#c084fc', colorDark: '#9333ea' },
    ]
    
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Statistika</h2>
            <p className="text-slate-400 text-sm">Tizim haqida umumiy ma'lumotlar</p>
          </div>
        </div>

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6" glow="bg-indigo-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white"><AnimatedCounter value={stats.businessmen.total} /></p>
                <p className="text-sm text-slate-400">Biznesmenlar</p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs">
              <span className="text-green-400">● {stats.businessmen.active} faol</span>
              <span className="text-red-400">● {stats.businessmen.inactive} faolsiz</span>
            </div>
          </GlassCard>

          <GlassCard className="p-6" glow="bg-blue-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white"><AnimatedCounter value={stats.drivers.total} /></p>
                <p className="text-sm text-slate-400">Shofyorlar</p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs">
              <span className="text-amber-400">● {stats.drivers.busy} band</span>
              <span className="text-green-400">● {stats.drivers.free} bosh</span>
            </div>
          </GlassCard>

          <GlassCard className="p-6" glow="bg-green-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/40">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white"><AnimatedCounter value={stats.flights.total} /></p>
                <p className="text-sm text-slate-400">Reyslar</p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs">
              <span className="text-amber-400">● {stats.flights.active} faol</span>
              <span className="text-green-400">● {stats.flights.completed} tugagan</span>
            </div>
          </GlassCard>

          <GlassCard className="p-6" glow="bg-purple-500">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-4xl font-bold text-white"><AnimatedCounter value={stats.vehicles.total} /></p>
                <p className="text-sm text-slate-400">Mashinalar</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Umumiy ko'rinish - Bar Chart */}
          <GlassCard className="p-6 lg:col-span-2" glow="bg-indigo-500">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              Umumiy ko'rinish
            </h3>
            <BarChart3D data={overviewData} height={180} />
          </GlassCard>

          {/* Foydalanuvchilar taqsimoti - Donut */}
          <GlassCard className="p-6" glow="bg-blue-500">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Foydalanuvchilar
            </h3>
            <div className="flex flex-col items-center">
              <DonutChart3D data={userDistribution} size={160} />
              <div className="mt-4 flex gap-6">
                {userDistribution.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Biznesmenlar holati */}
          <GlassCard className="p-6" glow="bg-indigo-500">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              Biznesmenlar holati
            </h3>
            <div className="flex flex-col items-center">
              <DonutChart3D data={businessmenStatus} size={140} />
              <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.businessmen.active}</div>
                  <div className="text-xs text-slate-400">Faol</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.businessmen.inactive}</div>
                  <div className="text-xs text-slate-400">Faolsiz</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Shofyorlar holati */}
          <GlassCard className="p-6" glow="bg-blue-500">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Shofyorlar holati
            </h3>
            <div className="flex flex-col items-center">
              <DonutChart3D data={driverStatus} size={140} />
              <div className="mt-4 grid grid-cols-2 gap-4 w-full">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{stats.drivers.busy}</div>
                  <div className="text-xs text-slate-400">Band</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.drivers.free}</div>
                  <div className="text-xs text-slate-400">Bosh</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Reyslar holati */}
          <GlassCard className="p-6" glow="bg-green-500">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Reyslar holati
            </h3>
            <div className="flex flex-col items-center">
              <DonutChart3D data={flightStatus} size={140} />
              <div className="mt-4 grid grid-cols-3 gap-2 w-full">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2 text-center">
                  <div className="text-xl font-bold text-amber-400">{stats.flights.active}</div>
                  <div className="text-xs text-slate-400">Faol</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-2 text-center">
                  <div className="text-xl font-bold text-green-400">{stats.flights.completed}</div>
                  <div className="text-xs text-slate-400">Tugagan</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2 text-center">
                  <div className="text-xl font-bold text-red-400">{stats.flights.cancelled || 0}</div>
                  <div className="text-xs text-slate-400">Bekor</div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Summary Card */}
        <GlassCard className="p-8" glow="bg-purple-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                <AnimatedCounter value={stats.businessmen.total + stats.drivers.total} />
              </div>
              <div className="text-slate-400 mt-2">Jami foydalanuvchilar</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                <AnimatedCounter value={stats.businessmen.active + stats.drivers.free} />
              </div>
              <div className="text-slate-400 mt-2">Faol foydalanuvchilar</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                <AnimatedCounter value={stats.flights.active} />
              </div>
              <div className="text-slate-400 mt-2">Joriy reyslar</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                <AnimatedCounter value={stats.vehicles.total} />
              </div>
              <div className="text-slate-400 mt-2">Ro'yxatdagi mashinalar</div>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  // Biznesmenlar ro'yxati
  const renderBusinessmen = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Biznesmenlar</h2>
        <button onClick={() => { setEditingBusinessman(null); setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' }); setShowModal(true) }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-5 h-5" /> Yangi qo'shish
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500">
          <option value="all">Barchasi</option>
          <option value="active">Faol</option>
          <option value="inactive">Faolsiz</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-4">
          {businessmen.filter(b => {
            const matchSearch = b.fullName?.toLowerCase().includes(search.toLowerCase()) || b.username?.toLowerCase().includes(search.toLowerCase())
            const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? b.isActive : !b.isActive)
            return matchSearch && matchStatus
          }).map(b => (
            <div key={b._id} className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${b.isActive ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{b.fullName}</h3>
                  <p className="text-sm text-slate-400">@{b.username} • {b.businessType}</p>
                  <p className="text-xs text-slate-500">{b.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => toggleActive(b)} className={`p-2 rounded-lg transition-colors ${b.isActive ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'}`} title={b.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}>
                  <Power className="w-5 h-5" />
                </button>
                <button onClick={() => { setEditingBusinessman(b); setFormData({ fullName: b.fullName, businessType: b.businessType, phone: b.phone, username: b.username, password: '' }); setShowModal(true) }} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors" title="Tahrirlash">
                  <Edit3 className="w-5 h-5" />
                </button>
                <button onClick={() => setPasswordModal(b)} className="p-2 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 rounded-lg transition-colors" title="Parol yangilash">
                  <Key className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(b._id)} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors" title="O'chirish">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Shofyorlar ro'yxati
  const renderDrivers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Shofyorlar</h2>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-4">
          {drivers.map(d => (
            <div key={d._id} className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${d.status === 'busy' ? 'bg-amber-600/20 text-amber-400' : 'bg-green-600/20 text-green-400'}`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{d.fullName}</h3>
                  <p className="text-sm text-slate-400">{d.phone} • {d.status === 'busy' ? 'Band' : 'Bosh'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Reyslar ro'yxati
  const renderFlights = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Reyslar</h2>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-4">
          {flights.map(f => (
            <div key={f._id} className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">{f.fromLocation} → {f.toLocation}</h3>
                  <p className="text-sm text-slate-400">{new Date(f.departureDate).toLocaleDateString('uz-UZ')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${f.status === 'active' ? 'bg-amber-600/20 text-amber-400' : f.status === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                  {f.status === 'active' ? 'Faol' : f.status === 'completed' ? 'Yakunlangan' : f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Mashinalar ro'yxati
  const renderVehicles = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Mashinalar</h2>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-4">
          {vehicles.map(v => (
            <div key={v._id} className="bg-slate-800/80 backdrop-blur rounded-2xl p-4 border border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{v.brand} {v.model}</h3>
                  <p className="text-sm text-slate-400">{v.plateNumber}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Asosiy render
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard()
      case 'stats': return renderStats()
      case 'businessmen': return renderBusinessmen()
      case 'drivers': return renderDrivers()
      case 'flights': return renderFlights()
      case 'vehicles': return renderVehicles()
      default: return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-500" />
              <span className="text-xl font-bold text-white">Super Admin</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800/95 backdrop-blur lg:bg-transparent border-r border-slate-700 lg:border-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform`}>
          <nav className="p-4 lg:p-0 space-y-2 mt-16 lg:mt-0">
            {MENU_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* Biznesmen Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingBusinessman ? 'Tahrirlash' : 'Yangi biznesmen'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="To'liq ism" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
              <input type="text" placeholder="Biznes turi" value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
              <input type="text" placeholder="Telefon" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
              {!editingBusinessman && (
                <>
                  <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500" />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} placeholder="Parol" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </>
              )}
              <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                {submitting ? 'Saqlanmoqda...' : editingBusinessman ? 'Yangilash' : 'Qo\'shish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Parol Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Parol yangilash</h3>
              <button onClick={() => { setPasswordModal(null); setNewPassword('') }} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-slate-400 mb-4">{passwordModal.fullName} uchun yangi parol</p>
            <div className="relative mb-4">
              <input type={showNewPassword ? 'text' : 'password'} placeholder="Yangi parol" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 pr-12" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button onClick={handlePasswordUpdate} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors">
              Yangilash
            </button>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Kirish ma'lumotlari</h3>
              <button onClick={() => setShowCredentials(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">Username</p>
                    <p className="text-white font-mono">{showCredentials.username}</p>
                  </div>
                  <button onClick={() => copyToClipboard(showCredentials.username, 'username')} className="p-2 text-slate-400 hover:text-white">
                    {copiedField === 'username' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-slate-700 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400">Parol</p>
                    <p className="text-white font-mono">{showCredentials.password}</p>
                  </div>
                  <button onClick={() => copyToClipboard(showCredentials.password, 'password')} className="p-2 text-slate-400 hover:text-white">
                    {copiedField === 'password' ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-400 mt-4 text-center">Bu ma'lumotlarni xavfsiz joyda saqlang!</p>
          </div>
        </div>
      )}
    </div>
  )
}
