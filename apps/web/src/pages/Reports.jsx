import { useEffect, useState } from 'react'
import { 
  BarChart3, TrendingUp, Users, Route, Fuel, Calendar, 
  ArrowUpRight, Activity, DollarSign, Clock, CheckCircle,
  X, ChevronLeft, ChevronRight, Filter
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

// Period types
const PERIODS = [
  { key: 'daily', label: 'Kunlik' },
  { key: 'weekly', label: 'Haftalik' },
  { key: 'monthly', label: 'Oylik' }
]

// Simple Bar Chart Component
const BarChart = ({ data, title, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-medium text-gray-600">{title}</h4>}
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-20 truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${
                  color === 'blue' ? 'from-blue-500 to-blue-600' :
                  color === 'green' ? 'from-emerald-500 to-emerald-600' :
                  color === 'orange' ? 'from-orange-500 to-orange-600' :
                  'from-purple-500 to-purple-600'
                } rounded-lg transition-all duration-500`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-16 text-right">
              {typeof item.value === 'number' && item.value > 1000 
                ? new Intl.NumberFormat('uz-UZ').format(item.value) 
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Donut Chart Component
const DonutChart = ({ data, title, total }) => {
  let cumulativePercent = 0
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((item, i) => {
            const percent = (item.value / (total || 1)) * 100
            const dashArray = `${percent} ${100 - percent}`
            const dashOffset = -cumulativePercent
            cumulativePercent += percent
            return (
              <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={item.color}
                strokeWidth="3" strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                className="transition-all duration-500" />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] sm:text-xs text-gray-500">{title}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-semibold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Line Chart Component
const LineChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-400">Ma'lumot yo'q</div>
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (d.value / maxValue) * 80
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  return (
    <div className="relative h-40">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        <path d={pathD} fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" />
        <path d={`${pathD} L 100 100 L 0 100 Z`} fill="url(#areaGradient)" opacity="0.3" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" />
        ))}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] sm:text-xs text-gray-400 -mb-5">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  )
}

// Detail Modal Component
const DetailModal = ({ isOpen, onClose, title, icon: Icon, color, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`sticky top-0 bg-gradient-to-r ${color} p-4 sm:p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon size={20} />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
            <X size={20} className="text-white" />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

// Stat Card with click
const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group ${onClick ? 'hover:border-blue-200' : ''}`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className={color} size={20} />
      </div>
      <span className="text-sm text-gray-500">{label}</span>
      {onClick && <ArrowUpRight size={14} className="ml-auto text-gray-300 group-hover:text-blue-500 transition" />}
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
  </div>
)

export default function Reports() {
  const { isDemo } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modal, setModal] = useState({ open: false, type: null })
  const [rawData, setRawData] = useState({ drivers: [], flights: [], expenses: [] })
  const [stats, setStats] = useState({
    drivers: { total: 0, busy: 0, free: 0 },
    flights: { total: 0, active: 0, completed: 0 },
    expenses: { total: 0, fuel: 0, other: 0 },
    chartData: []
  })

  // Get period range
  const getPeriodRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    
    if (period === 'daily') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'weekly') {
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
    }
    return { start, end }
  }

  // Navigate period
  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate)
    if (period === 'daily') newDate.setDate(newDate.getDate() + direction)
    else if (period === 'weekly') newDate.setDate(newDate.getDate() + (direction * 7))
    else newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  // Format period label
  const getPeriodLabel = () => {
    const { start, end } = getPeriodRange()
    if (period === 'daily') return start.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
    if (period === 'weekly') return `${start.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}`
    return start.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })
  }

  // Filter data by period
  const filterByPeriod = (items, dateField = 'createdAt') => {
    const { start, end } = getPeriodRange()
    return items.filter(item => {
      const date = new Date(item[dateField])
      return date >= start && date <= end
    })
  }

  // Generate chart data
  const generateChartData = (flights) => {
    const { start, end } = getPeriodRange()
    const data = []
    
    if (period === 'daily') {
      for (let h = 0; h < 24; h += 4) {
        const count = flights.filter(f => new Date(f.createdAt).getHours() >= h && new Date(f.createdAt).getHours() < h + 4).length
        data.push({ label: `${h}:00`, value: count })
      }
    } else if (period === 'weekly') {
      const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(start)
        dayDate.setDate(start.getDate() + d)
        const count = flights.filter(f => {
          const fDate = new Date(f.createdAt)
          return fDate.toDateString() === dayDate.toDateString()
        }).length
        data.push({ label: days[d], value: count })
      }
    } else {
      const daysInMonth = end.getDate()
      const step = daysInMonth > 15 ? 5 : 3
      for (let d = 1; d <= daysInMonth; d += step) {
        const count = flights.filter(f => {
          const fDate = new Date(f.createdAt)
          return fDate.getDate() >= d && fDate.getDate() < d + step && fDate.getMonth() === start.getMonth()
        }).length
        data.push({ label: `${d}`, value: count })
      }
    }
    return data
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (isDemo()) {
        const demoFlights = Array.from({ length: 50 }, (_, i) => ({
          _id: `demo${i}`,
          status: i < 3 ? 'active' : 'completed',
          createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          driver: { fullName: `Shofyor ${i + 1}` },
          totalDistance: Math.floor(Math.random() * 500) + 100
        }))
        const demoDrivers = Array.from({ length: 8 }, (_, i) => ({
          _id: `d${i}`,
          fullName: `Shofyor ${i + 1}`,
          status: i < 3 ? 'busy' : 'free'
        }))
        setRawData({ drivers: demoDrivers, flights: demoFlights, expenses: [] })
        setLoading(false)
        return
      }

      try {
        const [driversRes, flightsRes, expensesRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/flights'),
          api.get('/expenses/stats').catch(() => ({ data: { data: { totalAmount: 0 } } }))
        ])
        setRawData({
          drivers: driversRes.data.data || [],
          flights: flightsRes.data.data || [],
          expenses: expensesRes.data.data || {}
        })
      } catch (err) {
        console.error('Reports error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isDemo])

  // Calculate stats when period or data changes
  useEffect(() => {
    const { drivers, flights } = rawData
    const filteredFlights = filterByPeriod(flights)
    
    setStats({
      drivers: {
        total: drivers.length,
        busy: drivers.filter(d => d.status === 'busy').length,
        free: drivers.filter(d => d.status === 'free' || d.status === 'available').length
      },
      flights: {
        total: filteredFlights.length,
        active: filteredFlights.filter(f => f.status === 'active').length,
        completed: filteredFlights.filter(f => f.status === 'completed').length,
        list: filteredFlights
      },
      expenses: {
        total: rawData.expenses?.totalAmount || 0,
        fuel: Math.round((rawData.expenses?.totalAmount || 0) * 0.7),
        other: Math.round((rawData.expenses?.totalAmount || 0) * 0.3)
      },
      chartData: generateChartData(filteredFlights)
    })
  }, [rawData, period, currentDate])

  const formatMoney = (n) => new Intl.NumberFormat('uz-UZ').format(n)

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BarChart3 className="text-white" size={20} />
              </div>
              Hisobotlar
            </h1>
            <p className="text-gray-500 mt-1">Biznes statistikasi va tahlil</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    period === p.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => navigatePeriod(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg min-w-[180px] justify-center">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{getPeriodLabel()}</span>
            </div>
            <button onClick={() => navigatePeriod(1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Shofyorlar" value={stats.drivers.total}
          subtext={`${stats.drivers.free} bosh, ${stats.drivers.busy} band`}
          color="text-blue-600" bgColor="bg-blue-100"
          onClick={() => setModal({ open: true, type: 'drivers' })} />
        
        <StatCard icon={Route} label="Reyslar" value={stats.flights.total}
          subtext={`${stats.flights.completed} tugatilgan`}
          color="text-emerald-600" bgColor="bg-emerald-100"
          onClick={() => setModal({ open: true, type: 'flights' })} />
        
        <StatCard icon={Activity} label="Faol reyslar" value={stats.flights.active}
          subtext="Hozir yo'lda" color="text-orange-600" bgColor="bg-orange-100"
          onClick={() => setModal({ open: true, type: 'active' })} />
        
        <StatCard icon={DollarSign} label="Xarajatlar" value={formatMoney(stats.expenses.total)}
          subtext="so'm" color="text-red-600" bgColor="bg-red-100"
          onClick={() => setModal({ open: true, type: 'expenses' })} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Period Chart */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {period === 'daily' ? 'Soatlik' : period === 'weekly' ? 'Kunlik' : 'Oylik'} reyslar
              </h3>
              <p className="text-xs text-gray-500">{getPeriodLabel()}</p>
            </div>
          </div>
          <LineChart data={stats.chartData} />
        </div>

        {/* Drivers Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          onClick={() => setModal({ open: true, type: 'drivers' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Shofyorlar holati</h3>
              <p className="text-xs text-gray-500">Hozirgi vaqtda</p>
            </div>
            <ArrowUpRight size={16} className="text-gray-300" />
          </div>
          <DonutChart 
            data={[
              { label: 'Bosh', value: stats.drivers.free, color: '#10b981' },
              { label: 'Band', value: stats.drivers.busy, color: '#f97316' },
            ]}
            title="Jami"
            total={stats.drivers.total}
          />
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          onClick={() => setModal({ open: true, type: 'expenses' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Fuel className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Xarajatlar taqsimoti</h3>
              <p className="text-xs text-gray-500">Kategoriya bo'yicha</p>
            </div>
            <ArrowUpRight size={16} className="text-gray-300" />
          </div>
          <BarChart 
            data={[
              { label: 'Yoqilg\'i', value: stats.expenses.fuel },
              { label: 'Boshqa', value: stats.expenses.other },
            ]}
            color="orange"
          />
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Jami:</span>
            <span className="font-semibold text-gray-900">{formatMoney(stats.expenses.total)} so'm</span>
          </div>
        </div>

        {/* Flights Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
          onClick={() => setModal({ open: true, type: 'flights' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Route className="text-purple-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Reyslar holati</h3>
              <p className="text-xs text-gray-500">{getPeriodLabel()}</p>
            </div>
            <ArrowUpRight size={16} className="text-gray-300" />
          </div>
          <DonutChart 
            data={[
              { label: 'Tugatilgan', value: stats.flights.completed, color: '#10b981' },
              { label: 'Faol', value: stats.flights.active, color: '#f97316' },
            ]}
            title="Jami"
            total={stats.flights.total}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <span className="font-medium text-sm sm:text-base">O'rtacha reys/{period === 'daily' ? 'soat' : period === 'weekly' ? 'kun' : 'hafta'}</span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {stats.chartData.length > 0 
              ? Math.round(stats.chartData.reduce((a, b) => a + b.value, 0) / stats.chartData.length)
              : 0}
          </p>
          <p className="text-blue-200 text-sm mt-1">ta reys</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={22} />
            </div>
            <span className="font-medium text-sm sm:text-base">Muvaffaqiyat darajasi</span>
          </div>
          <p className="text-3xl sm:text-4xl font-bold">
            {stats.flights.total > 0 
              ? Math.round((stats.flights.completed / stats.flights.total) * 100)
              : 0}%
          </p>
          <p className="text-emerald-200 text-sm mt-1">tugatilgan reyslar</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Fuel size={22} />
            </div>
            <span className="font-medium text-sm sm:text-base">O'rtacha xarajat/reys</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">
            {stats.flights.total > 0 
              ? formatMoney(Math.round(stats.expenses.total / stats.flights.total))
              : 0}
          </p>
          <p className="text-orange-200 text-sm mt-1">so'm</p>
        </div>
      </div>

      {/* Modals */}
      <DetailModal isOpen={modal.open && modal.type === 'drivers'} onClose={() => setModal({ open: false })}
        title="Shofyorlar batafsil" icon={Users} color="from-blue-500 to-indigo-600">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.drivers.free}</p>
              <p className="text-sm text-emerald-700">Bosh shofyorlar</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.drivers.busy}</p>
              <p className="text-sm text-orange-700">Band shofyorlar</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Shofyorlar ro'yxati</h4>
            <div className="space-y-2 max-h-60 overflow-auto">
              {rawData.drivers.map(driver => (
                <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      driver.status === 'busy' ? 'bg-orange-500' : 'bg-emerald-500'
                    }`}>
                      {driver.fullName?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{driver.fullName}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    driver.status === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {driver.status === 'busy' ? 'Band' : 'Bosh'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailModal>

      <DetailModal isOpen={modal.open && modal.type === 'flights'} onClose={() => setModal({ open: false })}
        title={`Reyslar - ${getPeriodLabel()}`} icon={Route} color="from-emerald-500 to-teal-600">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.flights.completed}</p>
              <p className="text-sm text-emerald-700">Tugatilgan</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.flights.active}</p>
              <p className="text-sm text-orange-700">Faol</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Reyslar ro'yxati ({stats.flights.total} ta)</h4>
            <div className="space-y-2 max-h-60 overflow-auto">
              {(stats.flights.list || []).slice(0, 20).map(flight => (
                <div key={flight._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{flight.driver?.fullName || 'Noma\'lum'}</p>
                    <p className="text-xs text-gray-500">{new Date(flight.createdAt).toLocaleDateString('uz-UZ')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    flight.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {flight.status === 'completed' ? 'Tugatilgan' : 'Faol'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DetailModal>

      <DetailModal isOpen={modal.open && modal.type === 'active'} onClose={() => setModal({ open: false })}
        title="Faol reyslar" icon={Activity} color="from-orange-500 to-red-600">
        <div className="space-y-4">
          {stats.flights.active === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={40} className="mx-auto mb-3 text-gray-300" />
              <p>Hozirda faol reys yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(stats.flights.list || []).filter(f => f.status === 'active').map(flight => (
                <div key={flight._id} className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {flight.driver?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{flight.driver?.fullName}</p>
                      <p className="text-xs text-gray-500">{flight.totalDistance || 0} km</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DetailModal>

      <DetailModal isOpen={modal.open && modal.type === 'expenses'} onClose={() => setModal({ open: false })}
        title="Xarajatlar batafsil" icon={DollarSign} color="from-red-500 to-rose-600">
        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-red-600">{formatMoney(stats.expenses.total)}</p>
            <p className="text-sm text-red-700 mt-1">Jami xarajat (so'm)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Fuel size={18} className="text-orange-600" />
                <span className="text-sm text-orange-700">Yoqilg'i</span>
              </div>
              <p className="text-xl font-bold text-orange-600">{formatMoney(stats.expenses.fuel)}</p>
              <p className="text-xs text-orange-500">~70%</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-purple-600" />
                <span className="text-sm text-purple-700">Boshqa</span>
              </div>
              <p className="text-xl font-bold text-purple-600">{formatMoney(stats.expenses.other)}</p>
              <p className="text-xs text-purple-500">~30%</p>
            </div>
          </div>
        </div>
      </DetailModal>
    </div>
  )
}
