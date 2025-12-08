import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, X, User, Truck, Phone, Search, Calendar, ArrowUpRight, Users, Activity } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { PhoneInputDark } from '../components/PhoneInput'

export default function Drivers() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    username: '', password: '', fullName: '', phone: '', baseSalary: 0,
    plateNumber: '', brand: '', year: ''
  })

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  const fetchData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/vehicles')
      ])
      setDrivers(driversRes.data.data || [])
      setVehicles(vehiclesRes.data.data || [])
    } catch (error) {
      showToast.error('Malumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Modal ochilganda background scroll ni bloklash
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  const getDriverVehicle = (driverId) => {
    return vehicles.find(v => v.currentDriver === driverId || v.currentDriver?._id === driverId)
  }

  const resetForm = () => setForm({
    username: '', password: '', fullName: '', phone: '', baseSalary: 0,
    plateNumber: '', brand: '', year: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Yangi shofyor uchun mashina majburiy
    if (!editingDriver && !form.plateNumber) {
      showToast.error('Mashina davlat raqamini kiriting!')
      return
    }
    if (!editingDriver && !form.brand) {
      showToast.error('Mashina markasini kiriting!')
      return
    }
    
    try {
      const driverPayload = { 
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        baseSalary: Number(form.baseSalary) || 0 
      }
      
      if (editingDriver) {
        await api.put(`/drivers/${editingDriver._id}`, driverPayload)
        showToast.success('Shofyor yangilandi')
      } else {
        const driverRes = await api.post('/drivers', driverPayload)
        const newDriver = driverRes.data.data
        
        // Mashina yaratish (majburiy)
        await api.post('/vehicles', {
          plateNumber: form.plateNumber,
          brand: form.brand,
          year: form.year ? Number(form.year) : undefined,
          currentDriver: newDriver._id
        })
        showToast.success('Shofyor va mashina qoshildi')
      }
      setShowModal(false)
      setEditingDriver(null)
      resetForm()
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik')
    }
  }

  const handleEdit = (e, driver) => {
    e.stopPropagation()
    setEditingDriver(driver)
    setForm({
      username: driver.username || '',
      password: '',
      fullName: driver.fullName || '',
      phone: driver.phone || '',
      baseSalary: driver.baseSalary || 0,
      plateNumber: '', brand: '', year: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Shofyorni ochirishni xohlaysizmi?')) return
    try {
      await api.delete(`/drivers/${id}`)
      showToast.success('Shofyor ochirildi')
      fetchData()
    } catch (error) {
      showToast.error('Ochirishda xatolik')
    }
  }

  const formatMoney = (num) => num ? new Intl.NumberFormat('uz-UZ').format(num) + ' som' : '-'

  // Filter va search
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         driver.phone?.includes(searchQuery)
    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  const busyDriversCount = drivers.filter(d => d.status === 'busy').length
  const freeDriversCount = drivers.filter(d => d.status === 'free').length
  const vehiclesCount = vehicles.length

  const quickStats = [
    { label: 'Jami shofyorlar', value: drivers.length, icon: Users, color: 'from-blue-400 to-blue-600' },
    { label: 'Reysda', value: busyDriversCount, icon: Activity, color: 'from-orange-400 to-orange-600' },
    { label: "Bo'sh", value: freeDriversCount, icon: User, color: 'from-green-400 to-green-600' },
    { label: 'Mashinalar', value: vehiclesCount, icon: Truck, color: 'from-purple-400 to-purple-600' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 max-w-full overflow-x-hidden">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-24 sm:-mr-48 -mt-24 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 sm:-ml-32 -mb-16 sm:-mb-32"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs sm:text-sm mb-1 sm:mb-2">
              <Calendar size={12} />
              <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold mb-1 sm:mb-2">
              {getGreeting()}, {user?.companyName || 'Admin'}! 👋
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm">Shofyorlarni boshqaring va kuzating</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => { setEditingDriver(null); resetForm(); setShowModal(true) }} 
              className="group px-3 sm:px-6 py-2 sm:py-3 bg-white text-slate-900 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
              <Plus size={16} /> 
              <span className="hidden sm:inline">Yangi shofyor</span>
              <span className="sm:hidden">Qo'shish</span>
              <ArrowUpRight size={14} className="hidden sm:block group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
          {quickStats.map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon size={14} className="text-white sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold">{item.value}</p>
                  <p className="text-blue-200 text-[10px] sm:text-xs">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {[
            { value: 'all', label: 'Barchasi' },
            { value: 'free', label: "Bo'sh" },
            { value: 'busy', label: 'Reysda' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition ${
                filterStatus === value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {filteredDrivers.map((driver) => {
          const vehicle = getDriverVehicle(driver._id)
          return (
            <div
              key={driver._id}
              onClick={() => navigate(`/dashboard/drivers/${driver._id}`)}
              className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-lg ${
                    driver.status === 'busy' 
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    {driver.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-sm sm:text-base">
                      {driver.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
                      <Phone size={12} />
                      <span>{driver.phone || 'Telefon yoq'}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                  driver.status === 'busy' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {driver.status === 'busy' ? 'Reysda' : "Bo'sh"}
                </span>
              </div>

              {/* Vehicle Info */}
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl mb-2 sm:mb-4 ${vehicle ? 'bg-blue-50' : 'bg-gray-50'}`}>
                {vehicle ? (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Truck size={14} className="text-blue-600 sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700 text-sm sm:text-base">{vehicle.plateNumber}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{vehicle.brand} {vehicle.year && `(${vehicle.year})`}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-400">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
                      <Truck size={14} />
                    </div>
                    <span className="text-xs sm:text-sm">Mashina yo'q</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400">Oylik maosh</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatMoney(driver.baseSalary)}</p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => handleEdit(e, driver)} 
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, driver._id)} 
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredDrivers.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Shofyorlar topilmadi</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Qidiruv natijasi bosh' : 'Hozircha shofyorlar yoq'}
          </p>
          <button
            onClick={() => { setEditingDriver(null); resetForm(); setShowModal(true) }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Birinchi shofyorni qoshing
          </button>
        </div>
      )}

      {/* Add/Edit Modal - Pro Design */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="relative p-6 border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-3xl"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingDriver ? 'Shofyorni tahrirlash' : 'Yangi shofyor'}
                    </h2>
                    <p className="text-blue-300 text-sm">
                      {editingDriver ? 'Malumotlarni yangilang' : 'Yangi shofyor qoshing'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Login */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Username *</label>
                  <input 
                    type="text" 
                    value={form.username} 
                    onChange={(e) => setForm({...form, username: e.target.value})} 
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition disabled:opacity-50" 
                    placeholder="username"
                    required 
                    disabled={!!editingDriver} 
                  />
                </div>
                {!editingDriver && (
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Parol *</label>
                    <input 
                      type="password" 
                      value={form.password} 
                      onChange={(e) => setForm({...form, password: e.target.value})} 
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="********"
                      required 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">Toliq ism *</label>
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={(e) => setForm({...form, fullName: e.target.value})} 
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                  placeholder="Ism Familiya"
                  required 
                />
              </div>

              <div className="dark-phone">
                <label className="block text-sm font-semibold text-blue-200 mb-2">Telefon</label>
                <PhoneInputDark
                  value={form.phone}
                  onChange={(phone) => setForm({...form, phone})}
                  placeholder="Telefon raqam"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">Oylik maosh</label>
                <input 
                  type="number" 
                  value={form.baseSalary} 
                  onChange={(e) => setForm({...form, baseSalary: e.target.value})} 
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                  placeholder="5000000" 
                />
              </div>

              {/* Mashina - MAJBURIY */}
              {!editingDriver && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Truck size={18} className="text-white" />
                    </div>
                    <span className="font-semibold text-white">Mashina *</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Davlat raqami *</label>
                      <input 
                        type="text" 
                        value={form.plateNumber} 
                        onChange={(e) => setForm({...form, plateNumber: e.target.value.toUpperCase()})} 
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                        placeholder="01 A 234 AB"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Marka *</label>
                      <input 
                        type="text" 
                        value={form.brand} 
                        onChange={(e) => setForm({...form, brand: e.target.value})} 
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                        required 
                        placeholder="MAN, Volvo..." 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Yil</label>
                    <input 
                      type="number" 
                      value={form.year} 
                      onChange={(e) => setForm({...form, year: e.target.value})} 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
                      placeholder="2020" 
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all"
              >
                <Plus size={20} /> {editingDriver ? 'Saqlash' : 'Shofyor qoshish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
