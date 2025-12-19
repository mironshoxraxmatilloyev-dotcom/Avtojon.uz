import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import {
  Car, Plus, LogOut, Search, X, Truck, ChevronRight, AlertTriangle, 
  CheckCircle, RefreshCw, Fuel, Gauge, Calendar, MoreVertical, Trash2, Edit2,
  Settings, TrendingUp, Zap
} from 'lucide-react'

const FUEL = { petrol: 'Benzin', diesel: 'Dizel', gas: 'Gaz', metan: 'Metan' }
const STATUS_CONFIG = {
  excellent: { label: 'A\'lo', color: 'emerald', icon: CheckCircle },
  normal: { label: 'Yaxshi', color: 'blue', icon: CheckCircle },
  attention: { label: 'Diqqat', color: 'amber', icon: AlertTriangle },
  critical: { label: 'Kritik', color: 'red', icon: AlertTriangle }
}
const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(n || 0)

export default function FleetDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editVehicle, setEditVehicle] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showMenu, setShowMenu] = useState(null)

  const [form, setForm] = useState({
    plateNumber: '', brand: '', model: '', year: new Date().getFullYear(),
    fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: '', vin: ''
  })

  useEffect(() => { fetchVehicles() }, [])

  const fetchVehicles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const { data } = await api.get('/vehicles')
      setVehicles(data.data || [])
    } catch {
      alert.error('Xatolik', 'Mashinalarni yuklashda xatolik')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const stats = useMemo(() => ({
    total: vehicles.length,
    excellent: vehicles.filter(v => v.status === 'normal' || v.status === 'excellent').length,
    attention: vehicles.filter(v => v.status === 'attention' || v.status === 'critical').length,
    totalKm: vehicles.reduce((s, v) => s + (v.currentOdometer || 0), 0)
  }), [vehicles])

  const filteredVehicles = useMemo(() => {
    let result = vehicles
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v => 
        v.plateNumber?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q)
      )
    }
    if (filter === 'attention') result = result.filter(v => v.status === 'attention' || v.status === 'critical')
    if (filter === 'excellent') result = result.filter(v => v.status === 'normal' || v.status === 'excellent')
    return result
  }, [vehicles, search, filter])

  const openModal = useCallback((vehicle = null) => {
    setEditVehicle(vehicle)
    if (vehicle) {
      setForm({
        plateNumber: vehicle.plateNumber || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        fuelType: vehicle.fuelType || 'diesel',
        fuelTankCapacity: vehicle.fuelTankCapacity?.toString() || '',
        currentOdometer: vehicle.currentOdometer?.toString() || '',
        vin: vehicle.vin || ''
      })
    } else {
      setForm({ plateNumber: '', brand: '', model: '', year: new Date().getFullYear(), fuelType: 'diesel', fuelTankCapacity: '', currentOdometer: '', vin: '' })
    }
    setShowModal(true)
    setShowMenu(null)
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!form.plateNumber || !form.brand) {
      alert.warning('Ogohlantirish', 'Davlat raqami va marka majburiy')
      return
    }
    setSaving(true)
    try {
      const body = {
        ...form,
        year: parseInt(form.year) || new Date().getFullYear(),
        fuelTankCapacity: form.fuelTankCapacity ? parseFloat(form.fuelTankCapacity) : null,
        currentOdometer: form.currentOdometer ? parseFloat(form.currentOdometer) : 0
      }
      if (editVehicle) {
        await api.put(`/vehicles/${editVehicle._id}`, body)
        alert.success('Yangilandi')
      } else {
        await api.post('/vehicles', body)
        alert.success('Qo\'shildi')
      }
      setShowModal(false)
      fetchVehicles()
    } catch (err) {
      alert.error('Xatolik', err.userMessage || 'Saqlanmadi')
    } finally {
      setSaving(false)
    }
  }, [form, editVehicle, fetchVehicles])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Mashinani o\'chirmoqchimisiz?')) return
    setShowMenu(null)
    setVehicles(prev => prev.filter(v => v._id !== id))
    try {
      await api.delete(`/vehicles/${id}`)
      alert.success('O\'chirildi')
    } catch {
      alert.error('Xatolik')
      fetchVehicles()
    }
  }, [fetchVehicles])

  if (loading) return <Skeleton />

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Header */}
      <header className="bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <Zap className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Avtopark</h1>
                <p className="text-sm text-slate-400">{user?.companyName || 'Fleet Pro'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => fetchVehicles(true)} 
                disabled={refreshing} 
                className="p-3 hover:bg-white/5 active:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => { logout(); navigate('/login') }} 
                className="p-3 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-400 transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Premium Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Car} 
            gradient="from-blue-500 to-blue-600"
            value={stats.total} 
            label="Jami transport" 
            onClick={() => setFilter('all')} 
            active={filter === 'all'} 
          />
          <StatCard 
            icon={CheckCircle} 
            gradient="from-emerald-500 to-emerald-600"
            value={stats.excellent} 
            label="Yaxshi holat" 
            onClick={() => setFilter('excellent')} 
            active={filter === 'excellent'} 
          />
          <StatCard 
            icon={AlertTriangle} 
            gradient="from-amber-500 to-orange-500"
            value={stats.attention} 
            label="Diqqat talab" 
            onClick={() => setFilter('attention')} 
            active={filter === 'attention'}
            pulse={stats.attention > 0}
          />
          <StatCard 
            icon={TrendingUp} 
            gradient="from-purple-500 to-pink-500"
            value={`${(stats.totalKm / 1000).toFixed(0)}k`} 
            label="Jami masofa" 
          />
        </div>

        {/* Search & Add */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-white/5 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all text-base"
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button 
            onClick={() => openModal()} 
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="hidden sm:inline">Qo'shish</span>
          </button>
        </div>

        {/* Active Filter */}
        {filter !== 'all' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filtr:</span>
            <button 
              onClick={() => setFilter('all')} 
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-sm text-white flex items-center gap-2 transition-all"
            >
              {filter === 'attention' ? '⚠️ Diqqat talab' : '✅ Yaxshi holat'}
              <X size={14} />
            </button>
          </div>
        )}

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <EmptyState onAdd={() => openModal()} hasVehicles={vehicles.length > 0} />
        ) : (
          <div className="grid gap-3">
            {filteredVehicles.map((v) => (
              <VehicleCard 
                key={v._id} 
                vehicle={v} 
                onClick={() => navigate(`/fleet/vehicle/${v._id}`)}
                onEdit={() => openModal(v)}
                onDelete={() => handleDelete(v._id)}
                showMenu={showMenu === v._id}
                onMenuToggle={() => setShowMenu(showMenu === v._id ? null : v._id)}
              />
            ))}
          </div>
        )}

        {search && filteredVehicles.length > 0 && (
          <p className="text-center text-sm text-slate-500 py-2">{filteredVehicles.length} ta natija topildi</p>
        )}
      </main>

      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(null)} />}

      {/* Modal */}
      {showModal && (
        <Modal title={editVehicle ? 'Tahrirlash' : 'Yangi mashina'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <Input 
              label="Davlat raqami" 
              value={form.plateNumber} 
              onChange={v => setForm(f => ({ ...f, plateNumber: v.toUpperCase() }))} 
              placeholder="01A123BC" 
              autoFocus 
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marka" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} placeholder="MAN" required />
              <Input label="Model" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="TGX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Yil" type="number" value={form.year} onChange={v => setForm(f => ({ ...f, year: v }))} />
              <Select label="Yoqilg'i" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={[
                { value: 'diesel', label: 'Dizel' },
                { value: 'petrol', label: 'Benzin' },
                { value: 'gas', label: 'Gaz' },
                { value: 'metan', label: 'Metan' }
              ]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bak (L)" type="number" value={form.fuelTankCapacity} onChange={v => setForm(f => ({ ...f, fuelTankCapacity: v }))} placeholder="400" />
              <Input label="Odometr (km)" type="number" value={form.currentOdometer} onChange={v => setForm(f => ({ ...f, currentOdometer: v }))} placeholder="0" />
            </div>
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </>
              ) : editVehicle ? 'Yangilash' : 'Saqlash'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ========== COMPONENTS ==========

const Skeleton = memo(() => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      <div className="h-16 bg-slate-800/50 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-800/50 rounded-2xl" />)}
      </div>
      <div className="h-14 bg-slate-800/50 rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-2xl" />)}
    </div>
  </div>
))

const StatCard = memo(({ icon: Icon, gradient, value, label, onClick, active, pulse }) => (
  <button 
    onClick={onClick} 
    className={`relative overflow-hidden bg-slate-800/40 backdrop-blur rounded-2xl p-4 border transition-all text-left group ${
      active ? 'border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/20' : 'border-white/5 hover:border-white/10 hover:bg-slate-800/60'
    }`}
  >
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
        <Icon size={20} className="text-white" />
      </div>
      {pulse && <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </div>
  </button>
))

const VehicleCard = memo(({ vehicle, onClick, onEdit, onDelete, showMenu, onMenuToggle }) => {
  const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.normal
  const isWarning = vehicle.status === 'attention' || vehicle.status === 'critical'
  
  return (
    <div className={`group relative bg-slate-800/40 backdrop-blur hover:bg-slate-800/60 rounded-2xl border transition-all ${
      isWarning ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-white/5 hover:border-white/10'
    }`}>
      <div onClick={onClick} className="p-4 cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Vehicle Icon */}
          <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center ${
            isWarning ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20'
          }`}>
            <Truck className={`w-7 h-7 ${isWarning ? 'text-amber-400' : 'text-blue-400'}`} />
            {isWarning && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{vehicle.plateNumber}</h3>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                status.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                status.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                status.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {status.label}
              </span>
            </div>
            <p className="text-slate-400">{vehicle.brand} {vehicle.model} {vehicle.year && `• ${vehicle.year}`}</p>
          </div>

          {/* Desktop Stats */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-slate-900/50 rounded-xl">
              <p className="text-white font-semibold">{fmt(vehicle.currentOdometer)}</p>
              <p className="text-xs text-slate-500">km</p>
            </div>
            <div className="text-center px-4 py-2 bg-slate-900/50 rounded-xl">
              <p className="text-white font-semibold">{FUEL[vehicle.fuelType] || '-'}</p>
              <p className="text-xs text-slate-500">Yoqilg'i</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onMenuToggle() }} 
              className="p-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <MoreVertical size={20} />
            </button>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="flex md:hidden items-center gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400">
            <Gauge size={16} />
            <span className="text-sm">{fmt(vehicle.currentOdometer)} km</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Fuel size={16} />
            <span className="text-sm">{FUEL[vehicle.fuelType] || '-'}</span>
          </div>
          {vehicle.year && (
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={16} />
              <span className="text-sm">{vehicle.year}</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute right-4 top-16 z-40 bg-slate-800 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl py-2 min-w-[160px] animate-fadeIn">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit() }} 
            className="w-full px-4 py-3 text-left text-white hover:bg-white/5 flex items-center gap-3 transition-all"
          >
            <Edit2 size={16} className="text-blue-400" /> Tahrirlash
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete() }} 
            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-all"
          >
            <Trash2 size={16} /> O'chirish
          </button>
        </div>
      )}
    </div>
  )
})

const EmptyState = memo(({ onAdd, hasVehicles }) => (
  <div className="bg-slate-800/30 backdrop-blur rounded-3xl border border-white/5 p-10 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl">
      <Car className="w-10 h-10 text-slate-500" />
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      {hasVehicles ? 'Natija topilmadi' : 'Avtopark bo\'sh'}
    </h3>
    <p className="text-slate-400 mb-6 max-w-sm mx-auto">
      {hasVehicles ? 'Qidiruv so\'rovingizga mos mashina topilmadi' : 'Avtoparkingizni boshqarish uchun birinchi mashinani qo\'shing'}
    </p>
    {!hasVehicles && (
      <button 
        onClick={onAdd} 
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl text-white font-semibold transition-all shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
      >
        <Plus size={20} /> Mashina qo'shish
      </button>
    )}
  </div>
))

const Modal = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
    <div 
      className="bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </div>
  </div>
))

const Input = memo(({ label, type = 'text', value, onChange, placeholder, autoFocus, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-4 py-3.5 bg-slate-800/50 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-slate-800/80 transition-all"
    />
  </div>
))

const Select = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3.5 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))