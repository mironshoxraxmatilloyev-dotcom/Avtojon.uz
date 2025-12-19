import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { 
  Shield, Users, Plus, LogOut, Phone, Briefcase, User, Copy, Check, 
  Trash2, Search, X, Power, Eye, EyeOff, Edit3, Key, Calendar,
  Truck, Route, Car
} from 'lucide-react'

export default function SuperAdminPanel() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()

  const [businessmen, setBusinessmen] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBusinessman, setEditingBusinessman] = useState(null)
  const [showCredentials, setShowCredentials] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [formData, setFormData] = useState({ 
    fullName: '', businessType: '', phone: '', username: '', password: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => { 
    fetchData() 
  }, [])

  const fetchData = async () => {
    try {
      const [businessmenRes, statsRes] = await Promise.all([
        api.get('/super-admin/businessmen'),
        api.get('/super-admin/stats')
      ])
      setBusinessmen(businessmenRes.data.data || [])
      setStats(statsRes.data.data)
    } catch (err) {
      alert.error('Xatolik', 'Ma\'lumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fullName || !formData.businessType || !formData.phone) {
      alert.warning('Ogohlantirish', 'Barcha maydonlarni to\'ldiring')
      return
    }
    if (!editingBusinessman && (!formData.username || !formData.password)) {
      alert.warning('Ogohlantirish', 'Username va parol kiriting')
      return
    }
    if (!editingBusinessman && formData.password.length < 6) {
      alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }

    setSubmitting(true)
    try {
      if (editingBusinessman) {
        await api.put('/super-admin/businessmen/' + editingBusinessman._id, {
          fullName: formData.fullName,
          businessType: formData.businessType,
          phone: formData.phone
        })
        setBusinessmen(prev => prev.map(b => 
          b._id === editingBusinessman._id 
            ? { ...b, fullName: formData.fullName, businessType: formData.businessType, phone: formData.phone }
            : b
        ))
        alert.success('Muvaffaqiyat', 'Ma\'lumotlar yangilandi!')
      } else {
        const { data } = await api.post('/super-admin/businessmen', {
          fullName: formData.fullName,
          businessType: formData.businessType,
          phone: formData.phone,
          username: formData.username,
          password: formData.password
        })
        setBusinessmen(prev => [data.data.businessman, ...prev])
        setShowCredentials({ username: formData.username, password: formData.password })
        alert.success('Muvaffaqiyat', 'Biznesmen qo\'shildi!')
      }
      setShowModal(false)
      setEditingBusinessman(null)
      setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' })
    } catch (err) {
      alert.error('Xatolik', err.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await alert.confirm({
      title: "O'chirish", message: "Rostdan o'chirmoqchimisiz?", confirmText: "Ha", type: "danger"
    })
    if (!confirmed) return
    try {
      await api.delete('/super-admin/businessmen/' + id)
      setBusinessmen(prev => prev.filter(b => b._id !== id))
      alert.success('O\'chirildi', 'Biznesmen o\'chirildi')
    } catch (err) {
      alert.error('Xatolik', 'O\'chirishda xatolik')
    }
  }

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert.warning('Ogohlantirish', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak')
      return
    }
    try {
      await api.post('/super-admin/businessmen/' + passwordModal._id + '/set-password', { password: newPassword })
      setShowCredentials({ username: passwordModal.username, password: newPassword })
      setPasswordModal(null)
      setNewPassword('')
      alert.success('Yangilandi', 'Parol yangilandi')
    } catch (err) {
      alert.error('Xatolik', 'Parolni yangilashda xatolik')
    }
  }

  const toggleActive = async (b) => {
    try {
      await api.put('/super-admin/businessmen/' + b._id, { isActive: !b.isActive })
      setBusinessmen(prev => prev.map(x => x._id === b._id ? { ...x, isActive: !x.isActive } : x))
      alert.success('Yangilandi', b.isActive ? 'Faolsizlantirildi' : 'Faollashtirildi')
    } catch (err) {
      alert.error('Xatolik', 'Yangilashda xatolik')
    }
  }

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const filteredBusinessmen = businessmen.filter(b => {
    const matchSearch = b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.businessType?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search) || b.username?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && b.isActive) || (filterStatus === 'inactive' && !b.isActive)
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin</h1>
              <p className="text-xs text-slate-400">Boshqaruv paneli</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-600 rounded-lg text-white transition">
            <LogOut size={18} />
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Statistika */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.businessmen.total}</p>
                  <p className="text-xs text-slate-400">Biznesmenlar</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <span className="text-green-400">{stats.businessmen.active} faol</span>
                {stats.businessmen.inactive > 0 && <span className="ml-2 text-red-400">{stats.businessmen.inactive} faolsiz</span>}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.drivers.total}</p>
                  <p className="text-xs text-slate-400">Shofyorlar</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <span className="text-amber-400">{stats.drivers.busy} band</span>
                <span className="ml-2 text-green-400">{stats.drivers.free} bo'sh</span>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Route className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.flights.total}</p>
                  <p className="text-xs text-slate-400">Reyslar</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                <span className="text-amber-400">{stats.flights.active} faol</span>
                <span className="ml-2 text-green-400">{stats.flights.completed} yakunlangan</span>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.vehicles.total}</p>
                  <p className="text-xs text-slate-400">Mashinalar</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" value={search} onChange={(e) => setSearch(e.target.value)} 
              placeholder="Qidirish..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" 
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}>
                {s === 'all' ? 'Barchasi' : s === 'active' ? 'Faol' : 'Faolsiz'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditingBusinessman(null); setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' }); setShowModal(true) }} 
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition">
            <Plus size={18} />
            <span>Yangi</span>
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredBusinessmen.length === 0 ? (
          <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Biznesmenlar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBusinessmen.map((b) => (
              <div key={b._id} className={`bg-slate-800 rounded-xl p-4 border transition ${b.isActive ? 'border-slate-700' : 'border-red-900/50 opacity-60'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${b.isActive ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{b.fullName}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${b.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {b.isActive ? 'Faol' : 'Faolsiz'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Briefcase size={14} />{b.businessType}</span>
                        <span className="flex items-center gap-1"><Phone size={14} />{b.phone}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Login:</span>
                        <code className="px-2 py-0.5 bg-slate-900 rounded text-indigo-400 text-sm">{b.username}</code>
                        <button onClick={() => copyToClipboard(b.username, b._id)} className="p-1 hover:bg-slate-700 rounded">
                          {copiedField === b._id ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-500" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingBusinessman(b); setFormData({ fullName: b.fullName, businessType: b.businessType, phone: b.phone, username: '', password: '' }); setShowModal(true) }} 
                      className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-blue-400" title="Tahrirlash">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => { setPasswordModal(b); setNewPassword(''); setShowNewPassword(false) }} 
                      className="p-2 bg-amber-900/30 hover:bg-amber-900/50 rounded-lg text-amber-400" title="Parol">
                      <Key size={18} />
                    </button>
                    <button onClick={() => toggleActive(b)} 
                      className={`p-2 rounded-lg ${b.isActive ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`} title={b.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}>
                      <Power size={18} />
                    </button>
                    <button onClick={() => handleDelete(b._id)} className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-red-400" title="O'chirish">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">{editingBusinessman ? 'Tahrirlash' : 'Yangi biznesmen'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">To'liq ism *</label>
                <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="Ism Familiya" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Biznes turi *</label>
                <input type="text" value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="Yuk tashish, Taxi..." />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Telefon *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="+998 90 123 45 67" />
              </div>
              {!editingBusinessman && (
                <>
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-sm text-slate-400 mb-3">Kirish ma'lumotlari</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Username *</label>
                        <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="username" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Parol * (kamida 6 ta belgi)</label>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" placeholder="••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              <button type="submit" disabled={submitting} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition disabled:opacity-50">
                {submitting ? 'Saqlanmoqda...' : (editingBusinessman ? 'Saqlash' : 'Yaratish')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-white">Parolni yangilash</h2>
                <p className="text-sm text-slate-400">{passwordModal.fullName}</p>
              </div>
              <button onClick={() => setPasswordModal(null)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Yangi parol (kamida 6 ta belgi)</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500" placeholder="Yangi parol" autoFocus />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button onClick={handlePasswordUpdate} disabled={!newPassword || newPassword.length < 6}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                Yangilash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Kirish ma'lumotlari</h2>
              <button onClick={() => setShowCredentials(null)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-4">
                <p className="text-green-400 text-sm mb-3">Bu ma'lumotlarni saqlang!</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Login</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-slate-900 px-3 py-2 rounded text-white font-mono">{showCredentials.username}</code>
                      <button onClick={() => copyToClipboard(showCredentials.username, 'cred_u')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">
                        {copiedField === 'cred_u' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Parol</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-slate-900 px-3 py-2 rounded text-white font-mono">{showCredentials.password}</code>
                      <button onClick={() => copyToClipboard(showCredentials.password, 'cred_p')} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-white">
                        {copiedField === 'cred_p' ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowCredentials(null)} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition">Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
