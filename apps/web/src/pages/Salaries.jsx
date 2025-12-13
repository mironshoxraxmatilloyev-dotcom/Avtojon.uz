import { useEffect, useState } from 'react'
import {
    Calculator, Check, CreditCard, X, TrendingUp, TrendingDown,
    Wallet, Calendar, ArrowRight, Search, Download, Clock,
    Banknote, FileText, Eye, Award, AlertCircle, CheckCircle2, User, Trash2
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'

export default function Salaries() {
    const [salaries, setSalaries] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedSalary, setSelectedSalary] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [form, setForm] = useState({
        driverId: '',
        periodStart: new Date().toISOString().slice(0, 8) + '01',
        periodEnd: new Date().toISOString().slice(0, 10)
    })

    const fetchData = async () => {
        try {
            const [salRes, drvRes] = await Promise.all([
                api.get('/salaries'),
                api.get('/drivers')
            ])
            setSalaries(salRes.data.data || [])
            setDrivers(drvRes.data.data || [])
        } catch (error) {
            showToast.error('Xatolik')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleCalculate = async (e) => {
        e.preventDefault()
        try {
            await api.post('/salaries/calculate', form)
            showToast.success('Maosh hisoblandi')
            setShowModal(false)
            fetchData()
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Xatolik')
        }
    }

    const handleApprove = async (id) => {
        try {
            await api.put(`/salaries/${id}/approve`)
            showToast.success('Tasdiqlandi')
            fetchData()
        } catch (error) {
            showToast.error('Xatolik')
        }
    }

    const handlePay = async (id) => {
        try {
            await api.put(`/salaries/${id}/pay`)
            showToast.success('To\'langan deb belgilandi')
            fetchData()
        } catch (error) {
            showToast.error('Xatolik')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Maoshni bekor qilishni xohlaysizmi?')) return
        try {
            await api.delete(`/salaries/${id}`)
            showToast.success('Maosh bekor qilindi')
            fetchData()
        } catch (error) {
            showToast.error('Xatolik')
        }
    }

    const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'

    const statusConfig = {
        pending: { label: 'Kutilmoqda', color: 'bg-slate-100 text-slate-700', gradient: 'from-slate-500 to-slate-600', icon: Clock },
        calculated: { label: 'Hisoblangan', color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-indigo-600', icon: Calculator },
        approved: { label: 'Tasdiqlangan', color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-600', icon: CheckCircle2 },
        paid: { label: "Tolangan", color: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-green-600', icon: Check }
    }

    const totalNet = salaries.reduce((sum, s) => sum + (s.netSalary || 0), 0)
    const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.netSalary || 0), 0)
    const totalPending = salaries.filter(s => s.status !== 'paid').reduce((sum, s) => sum + (s.netSalary || 0), 0)
    const totalBonus = salaries.reduce((sum, s) => sum + (s.totalBonus || 0), 0)
    const totalPenalty = salaries.reduce((sum, s) => sum + (s.totalPenalty || 0), 0)

    const filteredSalaries = salaries.filter(sal => {
        const matchesSearch = sal.driver?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || sal.status === statusFilter
        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl animate-pulse"></div>
                        <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
                            <Wallet className="w-8 h-8 text-blue-600 animate-bounce" />
                        </div>
                    </div>
                    <p className="text-gray-500 font-medium">Maoshlar yuklanmoqda...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-sm border border-white/20">Moliya boshqaruvi</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Maoshlar markazi</h1>
                        <p className="text-blue-200 max-w-md">Shofyorlar maoshini hisoblang, tasdiqlang va tolovlarni kuzating</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button className="px-5 py-3 bg-white/10 backdrop-blur-xl text-white rounded-xl font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20">
                            <Download size={18} /> Export
                        </button>
                        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-xl shadow-black/20">
                            <Calculator size={18} /> Maosh hisoblash
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Jami maoshlar</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(totalNet)}</p>
                    <p className="text-xs text-gray-400 mt-1">som</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Tolangan</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(totalPaid)}</p>
                    <p className="text-xs text-emerald-500 mt-1">Yakunlangan</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-amber-500/30">
                        <Clock className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Kutilmoqda</p>
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(totalPending)}</p>
                    <p className="text-xs text-amber-500 mt-1">Jarayonda</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-green-500/30">
                        <Award className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Jami bonus</p>
                    <p className="text-2xl font-bold text-green-600">+{formatMoney(totalBonus)}</p>
                    <p className="text-xs text-gray-400 mt-1">som</p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all">
                    <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-red-500/30">
                        <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">Jami jarima</p>
                    <p className="text-2xl font-bold text-red-600">-{formatMoney(totalPenalty)}</p>
                    <p className="text-xs text-gray-400 mt-1">som</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Shofyor nomini qidiring..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 font-medium">Status:</span>
                        {[
                            { value: 'all', label: 'Barchasi', count: salaries.length },
                            { value: 'calculated', label: 'Hisoblangan', count: salaries.filter(s => s.status === 'calculated').length },
                            { value: 'approved', label: 'Tasdiqlangan', count: salaries.filter(s => s.status === 'approved').length },
                            { value: 'paid', label: "Tolangan", count: salaries.filter(s => s.status === 'paid').length }
                        ].map(item => (
                            <button key={item.value} onClick={() => setStatusFilter(item.value)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${statusFilter === item.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {item.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${statusFilter === item.value ? 'bg-white/20' : 'bg-gray-200'}`}>{item.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Salaries Grid */}
            <div className="grid lg:grid-cols-2 gap-5">
                {filteredSalaries.map((sal) => {
                    const StatusIcon = statusConfig[sal.status]?.icon || Clock
                    return (
                        <div key={sal._id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-2xl transition-all overflow-hidden">
                            <div className={`relative bg-gradient-to-r ${statusConfig[sal.status]?.gradient} p-5 text-white`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/30">
                                            {sal.driver?.fullName?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{sal.driver?.fullName || 'Nomalum'}</p>
                                            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                                                <Calendar size={14} />
                                                <span>{formatDate(sal.periodStart)} - {formatDate(sal.periodEnd)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
                                        <StatusIcon size={14} />
                                        <span className="text-sm font-medium">{statusConfig[sal.status]?.label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center"><Banknote size={14} className="text-gray-600" /></div>
                                            <p className="text-xs text-gray-400">Bazaviy oylik</p>
                                        </div>
                                        <p className="font-bold text-gray-900 text-lg">{formatMoney(sal.baseSalary)}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 bg-purple-200 rounded-lg flex items-center justify-center"><FileText size={14} className="text-purple-600" /></div>
                                            <p className="text-xs text-gray-400">Reys haqi ({sal.tripsCount || 0} ta)</p>
                                        </div>
                                        <p className="font-bold text-purple-700 text-lg">{formatMoney(sal.tripsPayment)}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 bg-emerald-200 rounded-lg flex items-center justify-center"><TrendingUp size={14} className="text-emerald-600" /></div>
                                            <p className="text-xs text-gray-400">Bonus</p>
                                        </div>
                                        <p className="font-bold text-emerald-600 text-lg">+{formatMoney(sal.totalBonus)}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 bg-red-200 rounded-lg flex items-center justify-center"><TrendingDown size={14} className="text-red-600" /></div>
                                            <p className="text-xs text-gray-400">Jarima</p>
                                        </div>
                                        <p className="font-bold text-red-600 text-lg">-{formatMoney(sal.totalPenalty)}</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 mb-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-200 text-sm mb-1">Jami maosh</p>
                                            <p className="text-3xl font-bold text-white">{formatMoney(sal.netSalary)} <span className="text-lg text-blue-200">som</span></p>
                                        </div>
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                                            <Wallet className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {sal.status === 'calculated' && (
                                        <button onClick={() => handleApprove(sal._id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold">
                                            <Check size={18} /> Tasdiqlash
                                        </button>
                                    )}
                                    {sal.status === 'approved' && (
                                        <button onClick={() => handlePay(sal._id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold">
                                            <CreditCard size={18} /> Tolandi
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedSalary(sal)} className="px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center gap-2">
                                        <Eye size={18} /> Batafsil <ArrowRight size={16} />
                                    </button>
                                    {sal.status !== 'paid' && (
                                        <button onClick={() => handleDelete(sal._id)} className="px-4 py-3.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 flex items-center gap-2" title="Bekor qilish">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filteredSalaries.length === 0 && (
                <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Calculator size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{searchTerm || statusFilter !== 'all' ? 'Natija topilmadi' : 'Maoshlar hali hisoblanmagan'}</h3>
                    <p className="text-gray-500 mb-8">Shofyorlar maoshini hisoblash uchun tugmani bosing</p>
                    {!searchTerm && statusFilter === 'all' && (
                        <button onClick={() => setShowModal(true)} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold inline-flex items-center gap-2">
                            <Calculator size={20} /> Maosh hisoblash
                        </button>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-3xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Calculator className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Maosh hisoblash</h2>
                                        <p className="text-blue-200 text-sm mt-1">Davr va shofyorni tanlang</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-xl text-white"><X size={24} /></button>
                            </div>
                        </div>
                        <form onSubmit={handleCalculate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <span className="flex items-center gap-2"><User size={16} className="text-gray-400" /> Shofyor</span>
                                </label>
                                <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl" required>
                                    <option value="">Shofyorni tanlang</option>
                                    {drivers.map(d => <option key={d._id} value={d._id}>{d.fullName}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Boshlanish</label>
                                    <input type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tugash</label>
                                    <input type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl" required />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                <Calculator size={20} /> Hisoblash
                            </button>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {selectedSalary && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4" onClick={() => setSelectedSalary(null)}>
                        <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className={`bg-gradient-to-r ${statusConfig[selectedSalary.status]?.gradient} p-6 rounded-t-3xl`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl border border-white/30">
                                        {selectedSalary.driver?.fullName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedSalary.driver?.fullName}</h2>
                                        <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                                            <Calendar size={14} />
                                            <span>{formatDate(selectedSalary.periodStart)} - {formatDate(selectedSalary.periodEnd)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSalary(null)} className="p-2 hover:bg-white/20 rounded-xl text-white"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="flex justify-center">
                                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${statusConfig[selectedSalary.status]?.color}`}>
                                    {(() => { const SI = statusConfig[selectedSalary.status]?.icon || Clock; return <SI size={18} /> })()}
                                    <span className="font-semibold">{statusConfig[selectedSalary.status]?.label}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">Maosh tarkibi</h3>
                                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center"><Banknote size={18} className="text-gray-600" /></div>
                                        <span className="font-medium text-gray-700">Bazaviy oylik</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{formatMoney(selectedSalary.baseSalary)} som</span>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center"><FileText size={18} className="text-purple-600" /></div>
                                        <div>
                                            <span className="font-medium text-gray-700">Reys haqi</span>
                                            <p className="text-xs text-gray-400">{selectedSalary.tripsCount || 0} ta reys tugatildi</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-purple-700">{formatMoney(selectedSalary.tripsPayment)} som</span>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
                                        <span className="font-medium text-gray-700">Bonus</span>
                                    </div>
                                    <span className="font-bold text-emerald-600">+{formatMoney(selectedSalary.totalBonus)} som</span>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center"><TrendingDown size={18} className="text-red-600" /></div>
                                        <span className="font-medium text-gray-700">Jarima</span>
                                    </div>
                                    <span className="font-bold text-red-600">-{formatMoney(selectedSalary.totalPenalty)} som</span>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
                                <p className="text-blue-200 text-sm mb-2">Jami maosh</p>
                                <p className="text-4xl font-bold">{formatMoney(selectedSalary.netSalary)}</p>
                                <p className="text-blue-200 mt-1">som</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {selectedSalary.status === 'calculated' && (
                                    <button onClick={() => { handleApprove(selectedSalary._id); setSelectedSalary(null); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-amber-500 text-white rounded-xl font-semibold">
                                        <Check size={18} /> Tasdiqlash
                                    </button>
                                )}
                                {selectedSalary.status === 'approved' && (
                                    <button onClick={() => { handlePay(selectedSalary._id); setSelectedSalary(null); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold">
                                        <CreditCard size={18} /> Tolandi
                                    </button>
                                )}
                                <button onClick={() => setSelectedSalary(null)} className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium">Yopish</button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}