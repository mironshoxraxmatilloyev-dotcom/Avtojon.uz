import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { Shield, Users, Plus, LogOut, Phone, Briefcase, User, Copy, Check, Trash2, RefreshCw, Search, X, Power } from 'lucide-react'

export default function SuperAdminPanel() {
    const { logout } = useAuthStore()
    const navigate = useNavigate()
    const alert = useAlert()

    const [businessmen, setBusinessmen] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showCredentials, setShowCredentials] = useState(null)
    const [search, setSearch] = useState('')
    const [formData, setFormData] = useState({ fullName: '', businessType: '', phone: '' })
    const [submitting, setSubmitting] = useState(false)
    const [copiedField, setCopiedField] = useState(null)

    useEffect(() => { fetchBusinessmen() }, [])

    const fetchBusinessmen = async () => {
        try {
            const { data } = await api.get('/super-admin/businessmen')
            setBusinessmen(data.data || [])
        } catch (err) {
            alert.error('Xatolik', 'Malumotlarni yuklashda xatolik')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.fullName || !formData.businessType || !formData.phone) {
            alert.warning('Ogohlantirish', 'Barcha maydonlarni toldiring')
            return
        }
        setSubmitting(true)
        try {
            const { data } = await api.post('/super-admin/businessmen', formData)
            setBusinessmen(prev => [data.data.businessman, ...prev])
            setShowCredentials(data.data.credentials)
            setShowModal(false)
            setFormData({ fullName: '', businessType: '', phone: '' })
            alert.success('Muvaffaqiyat', 'Biznesmen qoshildi!')
        } catch (err) {
            alert.error('Xatolik', err.response?.data?.message || 'Xatolik yuz berdi')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Rostdan ochirmoqchimisiz?')) return
        try {
            await api.delete('/super-admin/businessmen/' + id)
            setBusinessmen(prev => prev.filter(b => b._id !== id))
            alert.success('Ochirildi', 'Biznesmen ochirildi')
        } catch (err) {
            alert.error('Xatolik', 'Ochirishda xatolik')
        }
    }

    const handleResetPassword = async (id) => {
        try {
            const { data } = await api.post('/super-admin/businessmen/' + id + '/reset-password')
            setShowCredentials(data.data)
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

    const filteredBusinessmen = businessmen.filter(b =>
        b.fullName.toLowerCase().includes(search.toLowerCase()) ||
        b.businessType.toLowerCase().includes(search.toLowerCase()) ||
        b.phone.includes(search)
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Super Admin</h1>
                                <p className="text-xs text-purple-300">Boshqaruv paneli</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all">
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Chiqish</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{businessmen.length}</p>
                                <p className="text-xs text-gray-400">Jami biznesmenlar</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <Power className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{businessmen.filter(b => b.isActive).length}</p>
                                <p className="text-xs text-gray-400">Faol</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..."
                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
                    </div>
                    <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all">
                        <Plus size={20} />
                        Biznesmen qoshish
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredBusinessmen.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Biznesmenlar topilmadi</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredBusinessmen.map((b) => (
                            <div key={b._id} className={'bg-white/10 backdrop-blur rounded-xl p-4 sm:p-5 border transition-all ' + (b.isActive ? 'border-white/10' : 'border-red-500/30 opacity-60')}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={'w-12 h-12 rounded-xl flex items-center justify-center ' + (b.isActive ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-600')}>
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{b.fullName}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-sm text-gray-400"><Briefcase size={14} />{b.businessType}</span>
                                                <span className="flex items-center gap-1 text-sm text-gray-400"><Phone size={14} />{b.phone}</span>
                                            </div>
                                            <p className="text-xs text-purple-400 mt-1">Login: <span className="font-mono">{b.username}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleResetPassword(b._id)} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-all" title="Parolni yangilash"><RefreshCw size={18} /></button>
                                        <button onClick={() => toggleActive(b)} className={'p-2 rounded-lg transition-all ' + (b.isActive ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400')} title={b.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}><Power size={18} /></button>
                                        <button onClick={() => handleDelete(b._id)} className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-all" title="Ochirish"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10">
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Yangi biznesmen</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Toliq ism</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" placeholder="Ism Familiya" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Biznes turi</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="text" value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" placeholder="Taxi park, Yuk tashish..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Telefon</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" placeholder="+998 90 123 45 67" />
                                </div>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                                {submitting ? 'Yaratilmoqda...' : 'Yaratish'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showCredentials && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10">
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Kirish malumotlari</h2>
                            <button onClick={() => setShowCredentials(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                <p className="text-green-400 text-sm mb-3">Bu malumotlarni saqlang! Parol faqat bir marta korsatiladi.</p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400">Login</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-white font-mono">{showCredentials.username}</code>
                                            <button onClick={() => copyToClipboard(showCredentials.username, 'username')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all">
                                                {copiedField === 'username' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Parol</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-white font-mono">{showCredentials.password || showCredentials.newPassword}</code>
                                            <button onClick={() => copyToClipboard(showCredentials.password || showCredentials.newPassword, 'password')} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all">
                                                {copiedField === 'password' ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowCredentials(null)} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all">Yopish</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
