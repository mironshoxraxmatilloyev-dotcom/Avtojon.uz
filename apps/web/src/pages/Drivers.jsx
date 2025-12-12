import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, X, User, Truck, Phone, Search, Calendar, ArrowUpRight, Users, Activity, Play, Route, Fuel, Gauge } from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'
import { useAuthStore } from '../store/authStore'
import { PhoneInputDark } from '../components/PhoneInput'
import { useAlert } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'

// Demo rejim uchun fake shofyorlar
const DEMO_DRIVERS = [
  { _id: 'd1', fullName: 'Akmal Karimov', username: 'akmal', phone: '+998901234567', status: 'busy', paymentType: 'per_trip', perTripRate: 500000, baseSalary: 0 },
  { _id: 'd2', fullName: 'Bobur Aliyev', username: 'bobur', phone: '+998901234568', status: 'busy', paymentType: 'monthly', perTripRate: 0, baseSalary: 5000000 },
  { _id: 'd3', fullName: 'Sardor Rahimov', username: 'sardor', phone: '+998901234569', status: 'busy', paymentType: 'per_trip', perTripRate: 450000, baseSalary: 0 },
  { _id: 'd4', fullName: 'Jasur Toshmatov', username: 'jasur', phone: '+998901234570', status: 'free', paymentType: 'monthly', perTripRate: 0, baseSalary: 4500000 },
  { _id: 'd5', fullName: 'Dilshod Umarov', username: 'dilshod', phone: '+998901234571', status: 'free', paymentType: 'per_trip', perTripRate: 550000, baseSalary: 0 },
  { _id: 'd6', fullName: 'Nodir Qodirov', username: 'nodir', phone: '+998901234572', status: 'free', paymentType: 'monthly', perTripRate: 0, baseSalary: 5500000 },
  { _id: 'd7', fullName: 'Sherzod Yusupov', username: 'sherzod', phone: '+998901234573', status: 'free', paymentType: 'per_trip', perTripRate: 480000, baseSalary: 0 },
  { _id: 'd8', fullName: 'Otabek Nazarov', username: 'otabek', phone: '+998901234574', status: 'free', paymentType: 'monthly', perTripRate: 0, baseSalary: 4800000 }
]

const DEMO_VEHICLES = [
  { _id: 'v1', plateNumber: '01 A 123 AB', brand: 'MAN', year: 2020, currentDriver: 'd1' },
  { _id: 'v2', plateNumber: '01 B 456 CD', brand: 'Volvo', year: 2019, currentDriver: 'd2' },
  { _id: 'v3', plateNumber: '01 C 789 EF', brand: 'Mercedes', year: 2021, currentDriver: 'd3' },
  { _id: 'v4', plateNumber: '01 D 012 GH', brand: 'Scania', year: 2018, currentDriver: 'd4' },
  { _id: 'v5', plateNumber: '01 E 345 IJ', brand: 'DAF', year: 2020, currentDriver: 'd5' },
  { _id: 'v6', plateNumber: '01 F 678 KL', brand: 'Iveco', year: 2019, currentDriver: 'd6' },
  { _id: 'v7', plateNumber: '01 G 901 MN', brand: 'MAN', year: 2022, currentDriver: 'd7' },
  { _id: 'v8', plateNumber: '01 H 234 OP', brand: 'Volvo', year: 2021, currentDriver: 'd8' }
]

export default function Drivers() {
  const { user, isDemo } = useAuthStore()
  const navigate = useNavigate()
  const alert = useAlert()
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    username: '', password: '', fullName: '', phone: '',
    paymentType: 'monthly', baseSalary: 0, perTripRate: 0,
    plateNumber: '', brand: '', year: ''
  })
  const isDemoMode = isDemo()
  
  // Reys ochish modal
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [flightForm, setFlightForm] = useState({
    startOdometer: '',
    startFuel: '',
    fromCity: '',
    toCity: '',
    payment: '',
    distance: '',
    fromCoords: null,
    toCoords: null
  })
  const [activeFlights, setActiveFlights] = useState({}) // driverId -> flight

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Xayrli tong'
    if (hour < 18) return 'Xayrli kun'
    return 'Xayrli kech'
  }

  const fetchData = async () => {
    // Demo rejimda fake data
    if (isDemoMode) {
      setDrivers(DEMO_DRIVERS)
      setVehicles(DEMO_VEHICLES)
      setLoading(false)
      return
    }

    try {
      const [driversRes, vehiclesRes, flightsRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/vehicles'),
        api.get('/flights', { params: { status: 'active' } })
      ])
      setDrivers(driversRes.data.data || [])
      setVehicles(vehiclesRes.data.data || [])
      
      // Faol reyslarni driver bo'yicha map qilish
      const flights = flightsRes.data.data || []
      const flightMap = {}
      flights.forEach(f => {
        if (f.driver?._id) flightMap[f.driver._id] = f
        else if (f.driver) flightMap[f.driver] = f
      })
      setActiveFlights(flightMap)
    } catch (error) {
      showToast.error('Malumotlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [isDemoMode])

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
    username: '', password: '', fullName: '', phone: '',
    paymentType: 'monthly', baseSalary: 0, perTripRate: 0,
    plateNumber: '', brand: '', year: ''
  })

  const resetFlightForm = () => setFlightForm({
    startOdometer: '',
    startFuel: '',
    fromCity: '',
    toCity: '',
    payment: '',
    distance: '',
    fromCoords: null,
    toCoords: null
  })

  // Masofa hisoblash (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return Math.round(R * c)
  }

  // Reys ochish
  const handleStartFlight = async (e) => {
    e.preventDefault()
    
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      setShowFlightModal(false)
      return
    }

    if (!flightForm.fromCity || !flightForm.toCity) {
      showToast.error('Qayerdan va qayerga shaharlarini kiriting!')
      return
    }

    try {
      const payload = {
        driverId: selectedDriver._id,
        startOdometer: Number(flightForm.startOdometer) || 0,
        startFuel: Number(flightForm.startFuel) || 0,
        firstLeg: {
          fromCity: flightForm.fromCity,
          toCity: flightForm.toCity,
          fromCoords: flightForm.fromCoords,
          toCoords: flightForm.toCoords,
          payment: Number(flightForm.payment) || 0,
          distance: Number(flightForm.distance) || 0
        }
      }

      console.log('🚀 Reys ochish payload:', payload)
      await api.post('/flights', payload)
      showToast.success('Reys ochildi!')
      setShowFlightModal(false)
      resetFlightForm()
      setSelectedDriver(null)
      fetchData()
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Xatolik yuz berdi')
    }
  }

  // Shofyorni bosganda
  const handleDriverClick = (driver) => {
    if (driver.status === 'busy') {
      // Reysda bo'lsa, reys sahifasiga o'tish
      navigate(`/dashboard/drivers/${driver._id}`)
    } else {
      // Bo'sh bo'lsa, reys ochish modalni ochish
      setSelectedDriver(driver)
      setShowFlightModal(true)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Demo rejimda bloklash
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      setShowModal(false)
      return
    }

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
        paymentType: form.paymentType,
        baseSalary: form.paymentType === 'monthly' ? Number(form.baseSalary) || 0 : 0,
        perTripRate: form.paymentType === 'per_trip' ? Number(form.perTripRate) || 0 : 0
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
      paymentType: driver.paymentType || 'monthly',
      baseSalary: driver.baseSalary || 0,
      perTripRate: driver.perTripRate || 0,
      plateNumber: '', brand: '', year: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()

    // Demo rejimda bloklash
    if (isDemoMode) {
      alert.info('Demo rejim', 'Bu demo versiya. To\'liq funksiyadan foydalanish uchun ro\'yxatdan o\'ting.')
      return
    }

    const driver = drivers.find(d => d._id === id)
    const confirmed = await alert.confirm({
      title: "Shofyorni o'chirish",
      message: `${driver?.fullName || 'Shofyor'}ni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.`,
      confirmText: "Ha, o'chirish",
      cancelText: "Bekor qilish",
      type: "danger"
    })

    if (!confirmed) return

    try {
      await api.delete(`/drivers/${id}`)
      alert.success("Muvaffaqiyatli", "Shofyor o'chirildi")
      fetchData()
    } catch (error) {
      alert.error("Xatolik", error.response?.data?.message || "O'chirishda xatolik yuz berdi")
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
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, {user?.companyName || 'Admin'}! 👋
            </h1>
            <p className="text-blue-200">Shofyorlarni boshqaring va kuzating</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setEditingDriver(null); resetForm(); setShowModal(true) }}
              className="group px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-white/10">
              <Plus size={18} />
              Yangi shofyor
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Stats in Header */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {quickStats.map((item, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                  <item.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="text-blue-200 text-xs">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Ism yoki telefon orqali qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Barchasi' },
            { value: 'free', label: "Bo'sh" },
            { value: 'busy', label: 'Reysda' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-3 rounded-xl font-medium transition ${filterStatus === value
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((driver) => {
          const vehicle = getDriverVehicle(driver._id)
          return (
            <div
              key={driver._id}
              onClick={() => handleDriverClick(driver)}
              className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${driver.status === 'busy'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                    {driver.fullName?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                      {driver.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Phone size={14} />
                      <span>{driver.phone || 'Telefon yoq'}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${driver.status === 'busy'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-green-100 text-green-700'
                  }`}>
                  {driver.status === 'busy' ? 'Reysda' : "Bo'sh"}
                </span>
              </div>

              {/* Vehicle Info */}
              <div className={`p-3 rounded-xl mb-4 ${vehicle ? 'bg-blue-50' : 'bg-gray-50'}`}>
                {vehicle ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Truck size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">{vehicle.plateNumber}</p>
                      <p className="text-xs text-gray-500">{vehicle.brand} {vehicle.year && `(${vehicle.year})`}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Truck size={18} />
                    </div>
                    <span className="text-sm">Mashina biriktirilmagan</span>
                  </div>
                )}
              </div>

              {/* Active Flight Info */}
              {driver.status === 'busy' && activeFlights[driver._id] && (
                <div 
                  className="p-3 rounded-xl mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 cursor-pointer hover:shadow-md transition"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/dashboard/flights/${activeFlights[driver._id]._id}`)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Route size={16} className="text-orange-600" />
                      <span className="font-medium text-orange-700">{activeFlights[driver._id].name || 'Faol reys'}</span>
                    </div>
                    <span className="text-xs text-orange-500">{activeFlights[driver._id].legs?.length || 0} bosqich →</span>
                  </div>
                </div>
              )}


              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">
                    {driver.paymentType === 'per_trip' ? '💰 Reys uchun' : '💵 Oylik maosh'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {driver.paymentType === 'per_trip'
                      ? formatMoney(driver.perTripRate) + '/reys'
                      : formatMoney(driver.baseSalary)
                    }
                  </p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {driver.status === 'free' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDriver(driver)
                        setShowFlightModal(true)
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Reys ochish"
                    >
                      <Play size={18} />
                    </button>
                  )}
                  {driver.status === 'busy' && activeFlights[driver._id] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/dashboard/flights/${activeFlights[driver._id]._id}`)
                      }}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                      title="Reysni davom ettirish"
                    >
                      <Route size={18} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleEdit(e, driver)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, driver._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
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
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowModal(false)} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-3xl"></div>
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
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
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
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                        placeholder="********"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">To'liq ism *</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                    placeholder="Ism Familiya"
                    required
                  />
                </div>


                <div className="dark-phone">
                  <label className="block text-sm font-semibold text-blue-200 mb-2">Telefon</label>
                  <PhoneInputDark
                    value={form.phone}
                    onChange={(phone) => setForm({ ...form, phone })}
                    placeholder="Telefon raqam"
                  />
                </div>

                {/* To'lov turi */}
                <div>
                  <label className="block text-sm font-semibold text-blue-200 mb-2">To'lov turi *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentType: 'monthly' })}
                      className={`p-4 rounded-xl border-2 transition-all ${form.paymentType === 'monthly'
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                    >
                      <div className="text-2xl mb-1">💰</div>
                      <div className="font-semibold text-sm">Oylik maosh</div>
                      <div className="text-xs opacity-70">Har oyda belgilangan summa</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentType: 'per_trip' })}
                      className={`p-4 rounded-xl border-2 transition-all ${form.paymentType === 'per_trip'
                        ? 'border-green-500 bg-green-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                    >
                      <div className="text-2xl mb-1">🚛</div>
                      <div className="font-semibold text-sm">Reys uchun</div>
                      <div className="text-xs opacity-70">Har bir reys uchun to'lov</div>
                    </button>
                  </div>
                </div>

                {/* To'lov summasi */}
                {form.paymentType === 'monthly' ? (
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Oylik maosh (so'm)</label>
                    <input
                      type="number"
                      value={form.baseSalary}
                      onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition"
                      placeholder="5000000"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">Har reys uchun to'lov (so'm)</label>
                    <input
                      type="number"
                      value={form.perTripRate}
                      onChange={(e) => setForm({ ...form, perTripRate: e.target.value })}
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                      placeholder="500000"
                    />
                    <p className="text-xs text-slate-400 mt-2">* Har bir tugatilgan reys uchun shofyorga to'lanadigan summa</p>
                  </div>
                )}


                {/* Mashina */}
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
                          onChange={(e) => setForm({ ...form, plateNumber: e.target.value.toUpperCase() })}
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
                          onChange={(e) => setForm({ ...form, brand: e.target.value })}
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
                        onChange={(e) => setForm({ ...form, year: e.target.value })}
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
                  <Plus size={20} /> {editingDriver ? 'Saqlash' : "Shofyor qo'shish"}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reys ochish Modal */}
      {showFlightModal && selectedDriver && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => { setShowFlightModal(false); resetFlightForm(); setSelectedDriver(null) }} />
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-t-3xl"></div>
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Route className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Reys ochish</h2>
                      <p className="text-green-300 text-sm">{selectedDriver.fullName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowFlightModal(false); resetFlightForm(); setSelectedDriver(null) }}
                    className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleStartFlight} className="p-6 space-y-5">
                {/* Mashina info */}
                {(() => {
                  const vehicle = getDriverVehicle(selectedDriver._id)
                  return vehicle ? (
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="flex items-center gap-3">
                        <Truck size={20} className="text-blue-400" />
                        <div>
                          <p className="text-white font-semibold">{vehicle.plateNumber}</p>
                          <p className="text-blue-300 text-sm">{vehicle.brand}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                      <p className="text-red-400 text-sm">⚠️ Shofyorga mashina biriktirilmagan</p>
                    </div>
                  )
                })()}

                {/* Boshlang'ich ma'lumotlar */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">
                      <Gauge size={14} className="inline mr-1" />
                      Odometr (km)
                    </label>
                    <input
                      type="number"
                      value={flightForm.startOdometer}
                      onChange={(e) => setFlightForm({ ...flightForm, startOdometer: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                      placeholder="123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-200 mb-2">
                      <Fuel size={14} className="inline mr-1" />
                      Bakda yoqilg'i (L)
                    </label>
                    <input
                      type="number"
                      value={flightForm.startFuel}
                      onChange={(e) => setFlightForm({ ...flightForm, startFuel: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                      placeholder="100"
                    />
                  </div>
                </div>

                {/* Birinchi bosqich */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <p className="text-white font-semibold flex items-center gap-2">
                    <Route size={16} className="text-green-400" />
                    Birinchi bosqich
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Qayerdan *</label>
                      <AddressAutocomplete
                        value={flightForm.fromCity}
                        onChange={(val) => setFlightForm({ ...flightForm, fromCity: val })}
                        onSelect={(s) => {
                          const newFromCoords = { lat: s.lat, lng: s.lng }
                          setFlightForm(prev => ({ 
                            ...prev, 
                            fromCity: s.name, 
                            fromCoords: newFromCoords,
                            distance: prev.toCoords ? calculateDistance(newFromCoords.lat, newFromCoords.lng, prev.toCoords.lat, prev.toCoords.lng) : prev.distance
                          }))
                        }}
                        placeholder="Toshkent"
                        focusColor="green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Qayerga *</label>
                      <AddressAutocomplete
                        value={flightForm.toCity}
                        onChange={(val) => setFlightForm({ ...flightForm, toCity: val })}
                        onSelect={(s) => {
                          const newToCoords = { lat: s.lat, lng: s.lng }
                          setFlightForm(prev => ({ 
                            ...prev, 
                            toCity: s.name, 
                            toCoords: newToCoords,
                            distance: prev.fromCoords ? calculateDistance(prev.fromCoords.lat, prev.fromCoords.lng, newToCoords.lat, newToCoords.lng) : prev.distance
                          }))
                        }}
                        placeholder="Samarqand"
                        focusColor="green"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">To'lov (so'm)</label>
                      <input
                        type="number"
                        value={flightForm.payment}
                        onChange={(e) => setFlightForm({ ...flightForm, payment: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                        placeholder="500000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Masofa (km)</label>
                      <input
                        type="number"
                        value={flightForm.distance}
                        onChange={(e) => setFlightForm({ ...flightForm, distance: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                        placeholder="300"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 text-center">
                  💡 Reys ochilgandan keyin yangi bosqichlar qo'shishingiz mumkin
                </p>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all"
                >
                  <Play size={20} /> Reysni boshlash
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
