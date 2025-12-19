import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { 
  Shield, Users, Plus, LogOut, Phone, Briefcase, User, Copy, Check, 
  Trash2, Search, X, Power, Eye, EyeOff, Edit3, Key, Calendar,
  TrendingUp, Activity, UserCheck, UserX
} from 'lucide-react'

export default function SuperAdminPanel() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()

  const [businessmen, setBusinessmen] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBusinessman, setEditingBusinessman] = useState(null)
  const [showCredentials, setShowCredentials] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [formData, setFormData] = useState({ 
    fullName: '', 
    businessType: '', 
    phone: '',
    username: '',
    password: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => { fetchBusinessmen() }, [])

  const fetchBusinessmen = async () => {
    try {
      const { data } = await api.get('/super-admin/businessmen')
      setBusinessmen(data.data || [])
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
    
    // Yangi biznesmen uchun username va parol majburiy
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
        // Tahrirlash
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
        // Yangi qo'shish
        const { data } = await api.post('/super-admin/businessmen', {
          fullName: formData.fullName,
          businessType: formData.businessType,
          phone: formData.phone,
          username: formData.username,
          password: formData.password
        })
        setBusinessmen(prev => [data.data.businessman, ...prev])
        setShowCredentials({
          username: formData.username,
          password: formData.password
        })
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
      title: "O'chirish",
      message: "Rostdan o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
      confirmText: "Ha, o'chirish",
      type: "danger"
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
      await api.post('/super-admin/businessmen/' + passwordModal._id + '/set-password', {
        password: newPassword
      })
      setShowCredentials({
        username: passwordModal.username,
        password: newPassword
      })
      setPasswordModal(null)
      setNewPassword('')
      setShowNewPassword(false)
      alert.success('Yangilandi', 'Parol yangilandi')
    } catch (err) {
      alert.error('Xatolik', 'Parolni yangilashda xatolik')
    }
  }

  const toggleActive = async (businessman) => {
    try {
      await api.put('/super-admin/businessmen/' + businessman._id, { isActive: !businessman.isActive })
      setBusinessmen(prev => prev.map(b => b._id === businessman._id ? { ...b, isActive: !b.isActive } : b))
      alert.success('Yangilandi', businessman.isActive ? 'Faolsizlantirildi' : 'Faollashtirildi')
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

  const openEditModal = (businessman) => {
    setEditingBusinessman(businessman)
    setFormData({
      fullName: businessman.fullName,
      businessType: businessman.businessType,
      phone: businessman.phone,
      username: '',
      password: ''
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingBusinessman(null)
    setFormData({ fullName: '', businessType: '', phone: '', username: '', password: '' })
    setShowModal(true)
  }

  const filteredBusinessmen = businessmen.filter(b => {
    const matchSearch = b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.businessType?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search) ||
      b.username?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && b.isActive) || 
      (filterStatus === 'inactive' && !b.isActive)
    return matchSearch && matchStatus
  })

  const stats = {
    total: businessmen.length,
    active: businessmen.filter(b => b.isActive).length,
    inactive: businessmen.filter(b => !b.isActive).length
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Super Admin</h1>
                <p className="text-sm text-purple-300">Biznesmenlarni boshqarish</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-white transition-all border border-white/10">
              <LogOut size={18} />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur rounded-2xl p-5 border border-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-blue-300">Jami biznesmenlar</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur rounded-2xl p-5 border border-green-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
                <p className="text-sm text-green-300">Faol</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur rounded-2xl p-5 border border-red-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.inactive}</p>
                <p className="text-sm text-red-300">Faolsiz</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Ism, biznes turi, telefon yoki username bo'yicha qidirish..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all" 
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {status === 'all' ? 'Barchasi' : status === 'active' ? 'Faol' : 'Faolsiz'}
              </button>
            ))}
          </div>
          <button 
            onClick={openAddModal} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/25"
          >
            <Plus size={20} />
            <span>Yangi biznesmen</span>
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredBusinessmen.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">Biznesmenlar topilmadi</p>
            <p className="text-gray-500">Yangi biznesmen qo'shish uchun yuqoridagi tugmani bosing</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBusinessmen.map((b) => (
              <div 
                key={b._id} 
                className={`bg-white/10 backdrop-blur rounded-2xl p-5 border transition-all hover:bg-white/15 ${
                  b.isActive ? 'border-white/10' : 'border-red-500/30 opacity-70'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      b.isActive 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : 'bg-gray-600'
                    }`}>
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{b.fullName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {b.isActive ? 'Faol' : 'Faolsiz'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Briefcase size={14} className="text-purple-400" />
                          {b.businessType}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone size={14} className="text-blue-400" />
                          {b.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-500" />
                          {formatDate(b.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Login:</span>
                        <code className="px-2 py-0.5 bg-black/30 rounded text-purple-300 font-mono text-sm">{b.username}</code>
                        <button 
                          onClick={() => copyToClipboard(b.username, b._id + '_username')}
                          className="p-1 hover:bg-white/10 rounded transition-all"
                        >
                          {copiedField === b._id + '_username' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => openEditModal(b)} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 transition-all"
                      title="Tahrirlash"
                    >
                      <Edit3 size={16} />
                      <span className="hidden sm:inline">Tahrirlash</span>
                    </button>
                    <button 
                      onClick={() => { setPasswordModal(b); setNewPassword(''); setShowNewPassword(false) }} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-xl text-amber-400 transition-all"
                      title="Parolni yangilash"
                    >
                      <Key size={16} />
                      <span className="hidden sm:inline">Parol</span>
                    </button>
                    <button 
                      onClick={() => toggleActive(b)} 
                      className={`p-2.5 rounded-xl transition-all ${
                        b.isActive 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400'
                      }`}
                      title={b.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}
                    >
                      <Power size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(b._id)} 
                      className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 transition-all"
                      title="O'chirish"
                    >
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  {editingBusinessman ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editingBusinessman ? 'Tahrirlash' : 'Yangi biznesmen'}
                </h2>
              </div>
              <button onClick={() => { setShowModal(false); setEditingBusinessman(null) }} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">To'liq ism *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all" 
                    placeholder="Ism Familiya" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Biznes turi *</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.businessType} 
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all" 
                    placeholder="Yuk tashish, Taxi park..." 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Telefon *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="tel" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all" 
                    placeholder="+998 90 123 45 67" 
                  />
                </div>
              </div>

              {/* Username va Parol - faqat yangi qo'shishda */}
              {!editingBusinessman && (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-semibold text-purple-200 mb-4">🔐 Kirish ma'lumotlari</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
                        <input 
                          type="text" 
                          value={formData.username} 
                          onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all font-mono" 
                          placeholder="username" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Parol * (kamida 6 ta belgi)</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            value={formData.password} 
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all" 
                            placeholder="••••••••" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-all"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
              >
                {submitting ? 'Saqlanmoqda...' : (editingBusinessman ? 'Saqlash' : 'Yaratish')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Update Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Parolni yangilash</h2>
                  <p className="text-sm text-gray-400">{passwordModal.fullName}</p>
                </div>
              </div>
              <button onClick={() => setPasswordModal(null)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Yangi parol (kamida 6 ta belgi)</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all" 
                    placeholder="Yangi parolni kiriting" 
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-all"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button 
                onClick={handlePasswordUpdate}
                disabled={!newPassword || newPassword.length < 6}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25"
              >
                Parolni yangilash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Kirish ma'lumotlari</h2>
              </div>
              <button onClick={() => setShowCredentials(null)} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 text-sm mb-4 flex items-center gap-2">
                  <Activity size={16} />
                  Bu ma'lumotlarni saqlang! Parol faqat bir marta ko'rsatiladi.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Login (Username)</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/40 px-4 py-3 rounded-xl text-white font-mono text-lg">{showCredentials.username}</code>
                      <button 
                        onClick={() => copyToClipboard(showCredentials.username, 'cred_username')} 
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                      >
                        {copiedField === 'cred_username' ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Parol</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/40 px-4 py-3 rounded-xl text-white font-mono text-lg">{showCredentials.password || showCredentials.newPassword}</code>
                      <button 
                        onClick={() => copyToClipboard(showCredentials.password || showCredentials.newPassword, 'cred_password')} 
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                      >
                        {copiedField === 'cred_password' ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowCredentials(null)} 
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
