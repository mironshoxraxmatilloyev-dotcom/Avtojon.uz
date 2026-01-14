import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import {
  Users, Plus, Trash2, Search, Power, Edit3, Key,
  Truck, Car, ArrowLeft, Crown, Phone, Building2
} from 'lucide-react'
import {
  Sidebar, MobileHeader, DashboardTab, StatsTab,
  CredentialsModal, PasswordModal, SubscriptionModal, BusinessmanModal
} from '../../components/superadmin'
import SmsPanel from '../../components/admin/SmsPanel'

export default function SuperAdminPanel() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState(null)
  const [businessmen, setBusinessmen] = useState([])
  const [users, setUsers] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [editingBusinessman, setEditingBusinessman] = useState(null)
  const [showCredentials, setShowCredentials] = useState(null)
  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', businessType: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  // Subscription
  const [subscriptionModal, setSubscriptionModal] = useState(null)
  const [subscriptionDays, setSubscriptionDays] = useState(30)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // Tab o'zgarganda modallarni yopish
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    setShowModal(false)
    setShowCredentials(null)
    setPasswordModal(null)
    setSubscriptionModal(null)
    setEditingBusinessman(null)
  }

  useEffect(() => { fetchStats() }, [])
  useEffect(() => { if (activeTab === 'businessmen') fetchBusinessmen() }, [activeTab])
  useEffect(() => { if (activeTab === 'users') fetchUsers() }, [activeTab])
  useEffect(() => { if (activeTab === 'drivers') fetchDrivers() }, [activeTab])
  useEffect(() => { if (activeTab === 'vehicles') fetchVehicles() }, [activeTab])

  const fetchStats = async () => {
    try { const { data } = await api.get('/super-admin/stats'); setStats(data.data) }
    catch (err) { /* Error ignored */ }
    finally { setLoading(false) }
  }

  const fetchBusinessmen = async () => {
    try { const { data } = await api.get('/super-admin/businessmen'); setBusinessmen(data.data || []) }
    catch (err) { /* Error ignored */ }
  }

  const fetchDrivers = async () => {
    try { const { data } = await api.get('/super-admin/drivers'); setDrivers(data.data || []) }
    catch (err) { /* Error ignored */ }
  }

  const fetchUsers = async () => {
    try { const { data } = await api.get('/super-admin/users'); setUsers(data.data || []) }
    catch (err) { /* Error ignored */ }
  }

  const fetchVehicles = async () => {
    try { const { data } = await api.get('/super-admin/vehicles'); setVehicles(data.data || []) }
    catch (err) { /* Error ignored */ }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fullName || !formData.businessType || !formData.phone) {
      alert.warning('Ogohlantirish', 'Barcha maydonlarni toldiring')
      return
    }
    setSubmitting(true)
    try {
      if (editingBusinessman) {
        await api.put('/super-admin/businessmen/' + editingBusinessman._id, formData)
        setBusinessmen(prev => prev.map(b => b._id === editingBusinessman._id ? { ...b, ...formData } : b))
        alert.success('Muvaffaqiyat', 'Yangilandi!')
      } else {
        const { data } = await api.post('/super-admin/businessmen', formData)
        setBusinessmen(prev => [data.data.businessman, ...prev])
        setShowCredentials(data.data.credentials)
        alert.success('Muvaffaqiyat', 'Qoshildi!')
        fetchStats()
      }
      setShowModal(false)
      setEditingBusinessman(null)
      setFormData({ fullName: '', businessType: '', phone: '' })
    } catch (err) { alert.error('Xatolik', err.response?.data?.message || 'Xatolik') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!await alert.confirm({ title: "O'chirish", message: "Rostdan o'chirmoqchimisiz?", type: "danger" })) return
    try {
      await api.delete('/super-admin/businessmen/' + id)
      setBusinessmen(prev => prev.filter(b => b._id !== id))
      alert.success("O'chirildi", "Biznesmen o'chirildi")
      fetchStats()
    } catch (err) { alert.error('Xatolik', "O'chirishda xatolik") }
  }

  const handleDeleteUser = async (id) => {
    if (!await alert.confirm({ title: "O'chirish", message: "Rostdan o'chirmoqchimisiz?", type: "danger" })) return
    try {
      await api.delete('/super-admin/users/' + id)
      setUsers(prev => prev.filter(u => u._id !== id))
      alert.success("O'chirildi", "Foydalanuvchi o'chirildi")
      fetchStats()
    } catch (err) { alert.error('Xatolik', "O'chirishda xatolik") }
  }

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgi')
      return
    }
    try {
      // User yoki Businessman ekanligini aniqlash
      const isUser = users.some(u => u._id === passwordModal._id)
      const endpoint = isUser
        ? `/super-admin/users/${passwordModal._id}/set-password`
        : `/super-admin/businessmen/${passwordModal._id}/set-password`

      await api.post(endpoint, { password: newPassword })
      setShowCredentials({ username: passwordModal.username, password: newPassword })
      setPasswordModal(null)
      setNewPassword('')
      alert.success('Yangilandi', 'Parol yangilandi')
    } catch (err) { alert.error('Xatolik', err.response?.data?.message || 'Xatolik') }
  }

  const toggleActive = async (b) => {
    try {
      await api.put('/super-admin/businessmen/' + b._id, { isActive: !b.isActive })
      setBusinessmen(prev => prev.map(x => x._id === b._id ? { ...x, isActive: !x.isActive } : x))
      alert.success('Yangilandi', b.isActive ? 'Faolsizlantirildi' : 'Faollashtirildi')
      fetchStats()
    } catch (err) { alert.error('Xatolik', 'Xatolik') }
  }

  const handleExtendSubscription = async () => {
    if (!subscriptionModal) return
    setSubscriptionLoading(true)
    try {
      await api.post(`/super-admin/${subscriptionModal.type}/${subscriptionModal.data._id}/subscription/extend`, { days: subscriptionDays })
      alert.success('Muvaffaqiyat', `Obuna ${subscriptionDays} kunga uzaytirildi`)
      if (subscriptionModal.type === 'businessmen') fetchBusinessmen()
      else fetchUsers()
      setSubscriptionModal(null)
      setSubscriptionDays(30)
    } catch (err) { alert.error('Xatolik', err.response?.data?.message || 'Xatolik') }
    finally { setSubscriptionLoading(false) }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const filteredBusinessmen = businessmen.filter(b =>
    b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    b.username?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  // Render content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab stats={stats} setActiveTab={handleTabChange} />
      case 'stats': return <StatsTab stats={stats} setActiveTab={handleTabChange} />
      case 'sms': return <SmsPanel />
      case 'businessmen': return renderBusinessmen()
      case 'users': return renderUsers()
      case 'drivers': return renderDrivers()
      case 'vehicles': return renderVehicles()
      default: return <DashboardTab stats={stats} setActiveTab={handleTabChange} />
    }
  }


  // Biznesmenlar - Pro Design
  const renderBusinessmen = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('dashboard')} className="w-11 h-11 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-colors border border-white/5">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Biznesmenlar</h2>
            <p className="text-slate-400 text-xs">{businessmen.length} ta biznesmen ro'yxatda</p>
          </div>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingBusinessman(null); setFormData({ fullName: '', businessType: '', phone: '' }) }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all shadow-lg shadow-violet-500/30"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Yangi</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Ism yoki username bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-slate-800/30 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredBusinessmen.map(b => (
          <div key={b._id} className="group bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${b.isActive ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30' : 'bg-slate-600'}`}>
                  {b.fullName?.charAt(0) || '?'}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${b.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-lg truncate">{b.fullName}</p>
                  <p className="text-slate-400 text-sm">@{b.username}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 size={12} /> {b.businessType}
                    </span>
                    {b.phone && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={12} /> {b.phone}
                      </span>
                    )}
                  </div>
                  {/* Ro'yxatdan o'tgan sana */}
                  <p className="text-xs text-slate-500 mt-1">
                    📅 {formatFullDate(b.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <ActionButton icon={Crown} color="violet" onClick={() => setSubscriptionModal({ type: 'businessmen', data: b })} title="Obuna" />
                <ActionButton icon={Key} color="amber" onClick={() => setPasswordModal(b)} title="Parol" />
                <ActionButton icon={Edit3} color="blue" onClick={() => { setEditingBusinessman(b); setFormData({ fullName: b.fullName, businessType: b.businessType, phone: b.phone }); setShowModal(true) }} title="Tahrirlash" />
                <ActionButton icon={Power} color={b.isActive ? 'green' : 'red'} onClick={() => toggleActive(b)} title={b.isActive ? 'O\'chirish' : 'Yoqish'} />
                <ActionButton icon={Trash2} color="red" onClick={() => handleDelete(b._id)} title="O'chirish" />
              </div>
            </div>

            {/* Subscription Badge */}
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-500">Obuna holati</span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${b.subscription?.endDate && new Date(b.subscription.endDate) > new Date()
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                {b.subscription?.endDate
                  ? new Date(b.subscription.endDate) > new Date()
                    ? `✓ ${new Date(b.subscription.endDate).toLocaleDateString('uz-UZ')} gacha`
                    : '✗ Tugagan'
                  : '⏳ Trial'}
              </span>
            </div>
          </div>
        ))}

        {filteredBusinessmen.length === 0 && (
          <EmptyState
            icon={Users}
            title={search ? 'Hech narsa topilmadi' : 'Biznesmenlar yo\'q'}
            subtitle={search ? 'Boshqa so\'z bilan qidiring' : 'Yangi biznesmen qo\'shing'}
          />
        )}
      </div>
    </div>
  )

  // Users - Pro Design
  const renderUsers = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')} className="w-11 h-11 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center border border-white/5">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Individual foydalanuvchilar</h2>
          <p className="text-slate-400 text-xs">{users.length} ta foydalanuvchi</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input type="text" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-800/30 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50" />
      </div>

      <div className="space-y-3">
        {filteredUsers.map(u => (
          <div key={u._id} className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/30">
                  {u.fullName?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-lg truncate">{u.fullName || 'Noma\'lum'}</p>
                  <p className="text-slate-400 text-sm">@{u.username}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {u.phone && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={12} /> {u.phone}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ro'yxatdan o'tdi: {u.createdAt ? formatDateSimple(u.createdAt) : 'Noma\'lum'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ActionButton icon={Crown} color="violet" onClick={() => setSubscriptionModal({ type: 'users', data: u })} title="Obuna" />
                <ActionButton icon={Key} color="amber" onClick={() => setPasswordModal(u)} title="Parol" />
                <ActionButton icon={Trash2} color="red" onClick={() => handleDeleteUser(u._id)} title="O'chirish" />
              </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && <EmptyState icon={Users} title="Foydalanuvchilar yo'q" />}
      </div>
    </div>
  )

  // Drivers - Pro Design
  const renderDrivers = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')} className="w-11 h-11 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center border border-white/5">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Haydovchilar</h2>
          <p className="text-slate-400 text-xs">{drivers.length} ta shofyor</p>
        </div>
      </div>

      <div className="grid gap-3">
        {drivers.map(d => (
          <div key={d._id} className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${d.status === 'busy' ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'}`}>
                {d.fullName?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg truncate">{d.fullName}</p>
                <p className="text-slate-400 text-sm">@{d.username}</p>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-medium ${d.status === 'busy' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {d.status === 'busy' ? '🚛 Band' : '✓ Bosh'}
              </span>
            </div>
          </div>
        ))}
        {drivers.length === 0 && <EmptyState icon={Truck} title="Haydovchilar yo'q" />}
      </div>
    </div>
  )

  // Vehicles - Pro Design
  const renderVehicles = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')} className="w-11 h-11 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center border border-white/5">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Mashinalar</h2>
          <p className="text-slate-400 text-xs">{vehicles.length} ta mashina</p>
        </div>
      </div>

      <div className="grid gap-3">
        {vehicles.map(v => (
          <div key={v._id} className="bg-slate-800/30 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg">{v.plateNumber}</p>
                <p className="text-slate-400 text-sm">{v.brand} {v.model} • {v.year}</p>
              </div>
              <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-medium">
                ✓ Faol
              </span>
            </div>
          </div>
        ))}
        {vehicles.length === 0 && <EmptyState icon={Car} title="Mashinalar yo'q" />}
      </div>
    </div>
  )

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar - fixed position */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="fixed top-0 left-0 h-screen w-64 z-40 overflow-hidden">
          <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <MobileHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />

        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {loading ? <LoadingState /> : renderContent()}
        </main>
      </div>

      {/* Modals */}
      <BusinessmanModal show={showModal} editing={editingBusinessman} formData={formData} setFormData={setFormData} submitting={submitting} onSubmit={handleSubmit} onClose={() => { setShowModal(false); setEditingBusinessman(null) }} />
      <CredentialsModal credentials={showCredentials} onClose={() => setShowCredentials(null)} onCopy={copyToClipboard} copiedField={copiedField} />
      <PasswordModal user={passwordModal} newPassword={newPassword} setNewPassword={setNewPassword} showPassword={showNewPassword} setShowPassword={setShowNewPassword} onSubmit={handlePasswordUpdate} onClose={() => { setPasswordModal(null); setNewPassword('') }} />
      <SubscriptionModal data={subscriptionModal?.data} days={subscriptionDays} setDays={setSubscriptionDays} loading={subscriptionLoading} onSubmit={handleExtendSubscription} onClose={() => { setSubscriptionModal(null); setSubscriptionDays(30) }} />
    </div>
  )
}

// Helper Components
function formatDate(dateString) {
  if (!dateString) return 'Noma\'lum'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Soatlar
  if (diffHours < 1) return 'Hozir'
  if (diffHours < 24) return `${diffHours} soat oldin`

  // Kunlar
  if (diffDays === 0) return `Bugun ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays === 1) return `Kecha ${date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`
  if (diffDays < 7) return `${diffDays} kun oldin`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta oldin`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} oy oldin`

  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFullDate(dateString) {
  if (!dateString) return 'Noma\'lum'
  const date = new Date(dateString)
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateSimple(dateString) {
  if (!dateString) return 'Noma\'lum'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function ActionButton({ icon: Icon, color, onClick, title }) {
  const colors = {
    violet: 'text-violet-400 hover:bg-violet-500/20',
    amber: 'text-amber-400 hover:bg-amber-500/20',
    blue: 'text-blue-400 hover:bg-blue-500/20',
    green: 'text-green-400 hover:bg-green-500/20',
    red: 'text-red-400 hover:bg-red-500/20',
  }
  return (
    <button onClick={onClick} title={title} className={`p-2.5 rounded-xl transition-all ${colors[color]}`}>
      <Icon size={18} />
    </button>
  )
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-slate-600" />
      </div>
      <p className="text-slate-400 font-medium">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Yuklanmoqda...</p>
      </div>
    </div>
  )
}
