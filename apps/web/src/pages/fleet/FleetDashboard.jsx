import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAlert } from '../../components/ui'
import api from '../../services/api'
import { 
  Car, Plus, LogOut, Bell, Search, X,
  Fuel, Settings, AlertTriangle, CheckCircle, Power,
  Hash, Calendar, Gauge, Truck
} from 'lucide-react'

export default function FleetDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'petrol',
    fuelTankCapacity: '',
    fuelConsumptionRate: ''
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles')
      setVehicles(data.data || [])
    } catch (err) {
      alert.error('Xatolik', 'Mashinalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.plateNumber || !formData.brand) {
      alert.warning('Ogohlantirish', 'Davlat raqami va marka majburiy')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await api.post('/vehicles', {
        ...formData,
        year: parseInt(formData.year) || new Date().getFullYear(),
        fuelTankCapacity: parseFloat(formData.fuelTankCapacity) || null,
        fuelConsumptionRate: parseFloat(formData.fuelConsumptionRate) || null
      })
      setVehicles(prev => [data.data, ...prev])
      setShowModal(false)
      resetForm()
      alert.success('Muvaffaqiyat', 'Mashina qoshildi!')
    } catch (err) {
      alert.error('Xatolik', err.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Mashinani ochirmoqchimisiz?')) return
    try {
      await api.delete('/vehicles/' + id)
      setVehicles(prev => prev.filter(v => v._id !== id))
      alert.success('Ochirildi', 'Mashina ochirildi')
    } catch (err) {
      alert.error('Xatolik', 'Ochirishda xatolik')
    }
  }

  const resetForm = () => {
    setFormData({
      plateNumber: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      fuelType: 'petrol',
      fuelTankCapacity: '',
      fuelConsumptionRate: ''
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.brand?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: 'Jami mashinalar', value: vehicles.length, icon: Car, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-600' },
    { label: 'Faol', value: vehicles.filter(v => v.isActive).length, icon: CheckCircle, color: 'green', bg: 'bg-green-100', text: 'text-green-600' },
    { label: 'Benzin', value: vehicles.filter(v => v.fuelType === 'petrol').length, icon: Fuel, color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { label: 'Dizel', value: vehicles.filter(v => v.fuelType === 'diesel').length, icon: Fuel, color: 'orange', bg: 'bg-orange-100', text: 'text-orange-600' },
  ]

  const fuelTypes = [
    { value: 'petrol', label: 'Benzin' },
    { value: 'diesel', label: 'Dizel' },
    { value: 'gas', label: 'Gaz' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Avtopark</h1>
                <p className="text-xs text-slate-500">{user?.companyName || 'Mashina nazorati'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 relative">
                <Bell size={20} />
              </button>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-700">{user?.fullName}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-slate-600 hover:text-red-600 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mashina qidirish..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all">
            <Plus size={20} />
            Mashina qoshish
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Mashinalar yoq</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Avtoparkingizni boshqarish uchun birinchi mashinangizni qoshing</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold shadow-lg transition-all">
              <Plus size={20} />
              Birinchi mashinani qoshish
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle._id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{vehicle.plateNumber}</h3>
                      <p className="text-sm text-slate-500">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(vehicle._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{vehicle.year || '-'} yil</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Fuel size={14} className="text-slate-400" />
                    <span>{fuelTypes.find(f => f.value === vehicle.fuelType)?.label || vehicle.fuelType}</span>
                  </div>
                  {vehicle.fuelTankCapacity && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Gauge size={14} className="text-slate-400" />
                      <span>{vehicle.fuelTankCapacity} L</span>
                    </div>
                  )}
                  {vehicle.currentDriver && (
                    <div className="flex items-center gap-2 text-slate-600 col-span-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span>{vehicle.currentDriver.fullName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Yangi mashina</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Davlat raqami *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={formData.plateNumber} onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="01A123BC" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Marka *</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Chevrolet" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Model</label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Cobalt" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Yil</label>
                  <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="2024" min="1990" max="2030" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Yoqilgi turi</label>
                  <select value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    {fuelTypes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Bak hajmi (L)</label>
                  <input type="number" value={formData.fuelTankCapacity} onChange={(e) => setFormData({ ...formData, fuelTankCapacity: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Sarf (L/100km)</label>
                  <input type="number" step="0.1" value={formData.fuelConsumptionRate} onChange={(e) => setFormData({ ...formData, fuelConsumptionRate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="8.5" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
