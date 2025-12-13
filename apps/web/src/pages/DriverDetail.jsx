import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, User, Phone, CreditCard, FileText, Truck, Route, MapPin, 
  Calendar, Wallet, TrendingUp, TrendingDown, CheckCircle, Clock, 
  Activity, Star, Award, ChevronRight, Sparkles, Shield
} from 'lucide-react'
import api from '../services/api'
import { showToast } from '../components/Toast'

export default function DriverDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [driver, setDriver] = useState(null)
  const [trips, setTrips] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [driverRes, tripsRes, vehiclesRes] = await Promise.all([
          api.get(`/drivers/${id}`),
          api.get('/trips', { params: { driverId: id } }),
          api.get('/vehicles')
        ])
        setDriver(driverRes.data.data)
        setTrips(tripsRes.data.data || [])
        const assignedVehicle = (vehiclesRes.data.data || []).find(v => 
          v.currentDriver === id || v.currentDriver?._id === id
        )
        setVehicle(assignedVehicle)
      } catch (error) {
        showToast.error('Shofyor topilmadi')
        navigate('/dashboard/drivers')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, navigate])

  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'

  const statusConfig = {
    pending: { label: 'Kutilmoqda', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', gradient: 'from-amber-500 to-orange-600', dot: 'bg-amber-400' },
    in_progress: { label: "Yo'lda", color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', gradient: 'from-blue-500 to-indigo-600', dot: 'bg-blue-400' },
    completed: { label: 'Tugatilgan', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', gradient: 'from-emerald-500 to-teal-600', dot: 'bg-emerald-400' },
    cancelled: { label: 'Bekor', color: 'bg-red-500/20 text-red-400 border-red-500/30', gradient: 'from-red-500 to-rose-600', dot: 'bg-red-400' }
  }

  const driverStatusConfig = {
    busy: { label: 'Reysda', color: 'from-orange-500 to-amber-600', icon: Activity },
    offline: { label: 'Offline', color: 'from-slate-500 to-slate-600', icon: Clock },
    available: { label: "Bo'sh", color: 'from-emerald-500 to-teal-600', icon: CheckCircle }
  }

  // Statistika
  const completedTrips = trips.filter(t => t.status === 'completed')
  const activeTrips = trips.filter(t => t.status === 'in_progress')
  const totalBonus = completedTrips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0)
  const totalPenalty = completedTrips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0)
  const totalPayment = completedTrips.reduce((sum, t) => sum + (t.tripPayment || 0), 0)
  const totalEarnings = (driver?.baseSalary || 0) + totalPayment + totalBonus - totalPenalty

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

  if (!driver) return null

  const currentStatus = driverStatusConfig[driver.status] || driverStatusConfig.available
  const StatusIcon = currentStatus.icon

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/20 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
        
        <div className="relative">
          {/* Back button */}
          <button 
            onClick={() => navigate('/dashboard/drivers')} 
            className="mb-4 sm:mb-6 flex items-center gap-2 text-blue-300 hover:text-white transition group text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Shofyorlarga qaytish</span>
          </button>

          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Avatar and Info Row */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold shadow-2xl shadow-blue-500/30">
                  {driver.fullName?.charAt(0) || 'S'}
                </div>
                <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br ${currentStatus.color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg`}>
                  <StatusIcon size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-4xl font-bold truncate">{driver.fullName}</h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500/20 rounded-full">
                    <Star size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-300 text-xs sm:text-sm font-medium">Pro</span>
                  </div>
                </div>
                <p className="text-blue-300 text-sm sm:text-lg">@{driver.username}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-3">
                  <span className={`px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r ${currentStatus.color} rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1.5 sm:gap-2`}>
                    <StatusIcon size={14} className="sm:w-4 sm:h-4" />
                    {currentStatus.label}
                  </span>
                  <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 rounded-lg sm:rounded-xl text-xs sm:text-sm text-blue-200 flex items-center gap-1.5">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                    {formatDate(driver.createdAt)} dan beri
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl border border-white/10">
                <p className="text-2xl sm:text-3xl font-bold">{completedTrips.length}</p>
                <p className="text-blue-300 text-xs sm:text-sm">Reyslar</p>
              </div>
              <div className="text-center px-4 py-3 sm:px-6 sm:py-4 bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl border border-white/10">
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400">{formatMoney(totalEarnings)}</p>
                <p className="text-blue-300 text-xs sm:text-sm">Jami daromad</p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Stats */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Moliyaviy statistika</h2>
                <p className="text-gray-500 text-xs sm:text-sm">Oylik hisobot</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="group p-3 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Wallet size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatMoney(driver.baseSalary)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Oylik maosh</p>
              </div>

              <div className="group p-3 sm:p-5 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl border border-purple-100 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <Route size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatMoney(totalPayment)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Reys haqlari</p>
              </div>

              <div className="group p-3 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl border border-emerald-100 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">+{formatMoney(totalBonus)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Bonuslar</p>
              </div>

              <div className="group p-3 sm:p-5 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl sm:rounded-2xl border border-red-100 hover:shadow-lg hover:shadow-red-500/10 transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                  <TrendingDown size={16} className="sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-red-600">-{formatMoney(totalPenalty)}</p>
                <p className="text-xs sm:text-sm text-gray-500">Jarimalar</p>
              </div>
            </div>

            {/* Total Earnings Bar */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Award size={20} className="sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">Jami daromad</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">{formatMoney(totalEarnings)} <span className="text-sm sm:text-lg text-slate-400">so'm</span></p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Trips History */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reyslar tarixi</h2>
                  <p className="text-gray-500 text-sm">{trips.length} ta reys</p>
                </div>
              </div>
              {activeTrips.length > 0 && (
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium animate-pulse">
                  {activeTrips.length} ta faol reys
                </span>
              )}
            </div>

            {trips.length > 0 ? (
              <div className="space-y-3">
                {trips.slice(0, 10).map((trip) => (
                  <div 
                    key={trip._id} 
                    onClick={() => navigate(`/dashboard/trips/${trip._id}`)}
                    className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-blue-200"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${statusConfig[trip.status]?.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                      <MapPin size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{trip.startAddress} → {trip.endAddress}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">{formatDate(trip.createdAt)}</span>
                        {trip.estimatedDistance && (
                          <span className="text-sm text-gray-400">• {trip.estimatedDistance} km</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusConfig[trip.status]?.color}`}>
                        {statusConfig[trip.status]?.label}
                      </span>
                      {trip.tripPayment > 0 && (
                        <p className="text-sm font-bold text-gray-900 mt-2">{formatMoney(trip.tripPayment)} so'm</p>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Route size={40} className="text-gray-300" />
                </div>
                <p className="text-gray-500">Hali reyslar yo'q</p>
              </div>
            )}
          </div>
        </div>


        {/* Right Column */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Shaxsiy ma'lumotlar</h2>
                <p className="text-gray-500 text-sm">Hujjatlar</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <Phone size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Telefon</p>
                    <p className="font-semibold text-gray-900">{driver.phone || 'Kiritilmagan'}</p>
                  </div>
                </div>
              </div>

              <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                    <CreditCard size={20} className="text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Passport</p>
                    <p className="font-semibold text-gray-900">{driver.passport || 'Kiritilmagan'}</p>
                  </div>
                </div>
              </div>

              <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <Shield size={20} className="text-emerald-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Guvohnoma</p>
                    <p className="font-semibold text-gray-900">{driver.licenseNumber || 'Kiritilmagan'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicle */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Biriktirilgan mashina</h2>
                <p className="text-gray-500 text-sm">Transport vositasi</p>
              </div>
            </div>

            {vehicle ? (
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <Truck size={32} className="text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{vehicle.plateNumber}</p>
                      <p className="text-blue-200">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Yil</p>
                    <p className="text-xl font-bold text-gray-900">{vehicle.year || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rang</p>
                    <p className="text-xl font-bold text-gray-900">{vehicle.color || '-'}</p>
                  </div>
                </div>

                {vehicle.capacity && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Yuk sig'imi</p>
                    <p className="text-xl font-bold text-amber-700">{vehicle.capacity} tonna</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Truck size={40} className="text-gray-300" />
                </div>
                <p className="text-gray-500 mb-4">Mashina biriktirilmagan</p>
                <button 
                  onClick={() => navigate('/dashboard/vehicles')}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Mashina biriktirish
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Tezkor amallar
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/dashboard/trips')}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left transition flex items-center gap-3"
              >
                <Route size={20} className="text-blue-400" />
                <span>Yangi reys yaratish</span>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
              <button 
                onClick={() => navigate('/dashboard/salaries')}
                className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl text-left transition flex items-center gap-3"
              >
                <Wallet size={20} className="text-emerald-400" />
                <span>Maosh hisoblash</span>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
