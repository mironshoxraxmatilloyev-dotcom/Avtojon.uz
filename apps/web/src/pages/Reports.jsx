import { useEffect, useState } from 'react'
import { 
  BarChart3, TrendingUp, Users, Route, Fuel, Calendar, 
  ArrowUpRight, Activity, DollarSign, Clock, CheckCircle,
  X, ChevronLeft, ChevronRight, Filter, Sparkles
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const PERIODS = [
  { key: 'daily', label: 'Kunlik' },
  { key: 'weekly', label: 'Haftalik' },
  { key: 'monthly', label: 'Oylik' }
]

// Pro Bar Chart with animations and gradients
const ProBarChart = ({ data, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const colors = {
    blue: { from: '#3b82f6', to: '#6366f1', bg: 'bg-blue-500/10' },
    green: { from: '#10b981', to: '#14b8a6', bg: 'bg-emerald-500/10' },
    orange: { from: '#f97316', to: '#ef4444', bg: 'bg-orange-500/10' },
    purple: { from: '#8b5cf6', to: '#a855f7', bg: 'bg-purple-500/10' }
  }
  const c = colors[color] || colors.blue

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="text-sm font-bold text-gray-900">
              {typeof item.value === 'number' && item.value > 1000 
                ? new Intl.NumberFormat('uz-UZ').format(item.value) 
                : item.value}
            </span>
          </div>
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out group-hover:opacity-90"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                boxShadow: `0 0 20px ${c.from}40`
              }}
            />
            <div 
              className="absolute inset-y-0 left-0 rounded-full animate-pulse opacity-50"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                background: `linear-gradient(90deg, ${c.from}, ${c.to})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Pro Donut Chart with glow effects
const ProDonutChart = ({ data, title, total }) => {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])
  
  let cumulativePercent = 0
  const radius = 15.9
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl" />
        
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 relative z-10">
          {/* Background circle */}
          <circle cx="18" cy="18" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
          
          {/* Data segments */}
          {data.map((item, i) => {
            const percent = (item.value / (total || 1)) * 100
            const strokeDasharray = animated ? `${(percent / 100) * circumference} ${circumference}` : `0 ${circumference}`
            const strokeDashoffset = -(cumulativePercent / 100) * circumference
            cumulativePercent += percent
            
            return (
              <circle
                key={i}
                cx="18" cy="18" r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="3.5"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${item.color}60)` }}
              />
            )
          })}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {total}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 font-medium">{title}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex sm:flex-col gap-4 sm:gap-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3 group cursor-default">
            <div 
              className="w-4 h-4 rounded-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}50` }}
            />
            <div>
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Pro Line/Area Chart with smooth curves
const ProLineChart = ({ data }) => {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])
  
  if (!data || data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
          <p>Ma'lumot yo'q</p>
        </div>
      </div>
    )
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const padding = { top: 20, right: 10, bottom: 30, left: 10 }
  const width = 100
  const height = 60
  
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right),
    y: padding.top + (1 - d.value / maxValue) * (height - padding.top - padding.bottom),
    value: d.value,
    label: d.label
  }))

  // Smooth curve using bezier
  const getPath = () => {
    if (points.length < 2) return ''
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      path += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
    }
    return path
  }

  const linePath = getPath()
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`

  return (
    <div className="relative h-52">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + ratio * (height - padding.top - padding.bottom)}
            x2={width - padding.right}
            y2={padding.top + ratio * (height - padding.top - padding.bottom)}
            stroke="#e5e7eb"
            strokeWidth="0.3"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          className={`transition-opacity duration-1000 ${animated ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="0.8"
          strokeLinecap="round"
          filter="url(#glow)"
          className={`transition-all duration-1000 ${animated ? 'opacity-100' : 'opacity-0'}`}
          style={{ strokeDasharray: animated ? 'none' : '200', strokeDashoffset: animated ? 0 : 200 }}
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i} className={`transition-all duration-500 ${animated ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${i * 50}ms` }}>
            <circle cx={p.x} cy={p.y} r="1.5" fill="white" stroke="url(#lineGradient)" strokeWidth="0.5" />
            <circle cx={p.x} cy={p.y} r="0.8" fill="#3b82f6" />
          </g>
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        {data.map((d, i) => (
          <div key={i} className="text-center">
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{d.label}</span>
            {d.range && <span className="block text-[8px] text-gray-400">({d.range}-kun)</span>}
          </div>
        ))}
      </div>
      
      {/* Hover tooltip area */}
      <div className="absolute inset-0 flex">
        {data.map((d, i) => (
          <div key={i} className="flex-1 group relative cursor-pointer">
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gray-900 text-white text-xs px-3 py-2 rounded-xl whitespace-nowrap z-10 shadow-lg">
              <p className="font-semibold">{d.fullLabel || d.label}</p>
              <p className="text-blue-300">{d.value} ta reys</p>
              {d.date && <p className="text-gray-400 text-[10px]">{d.date}-kun</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Detail Modal Component
const DetailModal = ({ isOpen, onClose, title, icon: Icon, color, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className={`sticky top-0 bg-gradient-to-r ${color} p-5 sm:p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-white/70 text-sm">Batafsil ma'lumot</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors">
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 overflow-auto max-h-[calc(90vh-100px)]">{children}</div>
      </div>
    </div>
  )
}

// Pro Stat Card
const StatCard = ({ icon: Icon, label, value, subtext, color, bgColor, gradient, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 cursor-pointer group`}
  >
    {/* Background decoration */}
    <div className={`absolute -right-8 -top-8 w-24 h-24 ${bgColor} rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`} />
    
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={color} size={22} />
        </div>
        <ArrowUpRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <Sparkles size={12} className={color} />
          {subtext}
        </p>
      )}
    </div>
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

  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate)
    if (period === 'daily') newDate.setDate(newDate.getDate() + direction)
    else if (period === 'weekly') newDate.setDate(newDate.getDate() + (direction * 7))
    else newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const getPeriodLabel = () => {
    const { start, end } = getPeriodRange()
    if (period === 'daily') return start.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
    if (period === 'weekly') return `${start.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}`
    return start.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })
  }

  const filterByPeriod = (items, dateField = 'createdAt') => {
    const { start, end } = getPeriodRange()
    return items.filter(item => {
      const date = new Date(item[dateField])
      return date >= start && date <= end
    })
  }

  const generateChartData = (flights) => {
    const { start, end } = getPeriodRange()
    const data = []
    if (period === 'daily') {
      // Soatlik: 6 ta interval (4 soatlik)
      const intervals = ['00:00-04:00', '04:00-08:00', '08:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00']
      for (let h = 0; h < 24; h += 4) {
        const count = flights.filter(f => {
          const hour = new Date(f.createdAt).getHours()
          return hour >= h && hour < h + 4
        }).length
        data.push({ label: `${String(h).padStart(2, '0')}:00`, value: count })
      }
    } else if (period === 'weekly') {
      // Haftalik: har bir kun
      const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
      const shortDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(start)
        dayDate.setDate(start.getDate() + d)
        const count = flights.filter(f => new Date(f.createdAt).toDateString() === dayDate.toDateString()).length
        data.push({ label: shortDays[d], fullLabel: days[d], value: count, date: dayDate.getDate() })
      }
    } else {
      // Oylik: 4 hafta (1-hafta, 2-hafta, 3-hafta, 4-hafta)
      const weeks = [
        { label: '1-hafta', start: 1, end: 7 },
        { label: '2-hafta', start: 8, end: 14 },
        { label: '3-hafta', start: 15, end: 21 },
        { label: '4-hafta', start: 22, end: 31 }
      ]
      weeks.forEach(week => {
        const count = flights.filter(f => {
          const fDate = new Date(f.createdAt)
          const day = fDate.getDate()
          return day >= week.start && day <= week.end && fDate.getMonth() === start.getMonth()
        }).length
        data.push({ label: week.label, value: count, range: `${week.start}-${week.end}` })
      })
    }
    return data
  }

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
          _id: `d${i}`, fullName: `Shofyor ${i + 1}`, status: i < 3 ? 'busy' : 'free'
        }))
        setRawData({ drivers: demoDrivers, flights: demoFlights, expenses: { totalAmount: 45000000 } })
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
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BarChart3 size={20} className="text-blue-600" />
          </div>
        </div>
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Hisobotlar
                </span>
                <p className="text-sm font-normal text-gray-500 mt-0.5">Biznes statistikasi va tahlil</p>
              </div>
            </h1>
          </div>
        </div>

        {/* Period Selector - Pro Style */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Filter size={18} className="text-white" />
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1.5">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    period === p.key 
                      ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigatePeriod(-1)} 
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl min-w-[200px] justify-center border border-gray-200">
              <Calendar size={16} className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-700">{getPeriodLabel()}</span>
            </div>
            <button 
              onClick={() => navigatePeriod(1)} 
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <TrendingUp className="text-white" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {period === 'daily' ? 'Soatlik' : period === 'weekly' ? 'Kunlik' : 'Oylik'} reyslar
              </h3>
              <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
            </div>
          </div>
          <ProLineChart data={stats.chartData} />
        </div>

        {/* Drivers Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => setModal({ open: true, type: 'drivers' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Users className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Shofyorlar holati</h3>
              <p className="text-sm text-gray-500">Hozirgi vaqtda</p>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <ProDonutChart 
            data={[
              { label: 'Bosh', value: stats.drivers.free, color: '#10b981' },
              { label: 'Band', value: stats.drivers.busy, color: '#f97316' },
            ]}
            title="Jami"
            total={stats.drivers.total}
          />
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => setModal({ open: true, type: 'expenses' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <Fuel className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Xarajatlar taqsimoti</h3>
              <p className="text-sm text-gray-500">Kategoriya bo'yicha</p>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
          </div>
          <ProBarChart 
            data={[
              { label: 'Yoqilg\'i', value: stats.expenses.fuel },
              { label: 'Boshqa xarajatlar', value: stats.expenses.other },
            ]}
            color="orange"
          />
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-gray-500">Jami xarajat:</span>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {formatMoney(stats.expenses.total)} so'm
            </span>
          </div>
        </div>

        {/* Flights Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 group"
          onClick={() => setModal({ open: true, type: 'flights' })}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Route className="text-white" size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Reyslar holati</h3>
              <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
            </div>
            <ArrowUpRight size={20} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <ProDonutChart 
            data={[
              { label: 'Tugatilgan', value: stats.flights.completed, color: '#10b981' },
              { label: 'Faol', value: stats.flights.active, color: '#f97316' },
            ]}
            title="Jami"
            total={stats.flights.total}
          />
        </div>
      </div>

      {/* Summary Cards - Pro Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <span className="font-medium">O'rtacha reys/{period === 'daily' ? 'soat' : period === 'weekly' ? 'kun' : 'hafta'}</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold">
              {stats.chartData.length > 0 ? Math.round(stats.chartData.reduce((a, b) => a + b.value, 0) / stats.chartData.length) : 0}
            </p>
            <p className="text-blue-200 mt-2">ta reys</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <span className="font-medium">Muvaffaqiyat darajasi</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold">
              {stats.flights.total > 0 ? Math.round((stats.flights.completed / stats.flights.total) * 100) : 0}%
            </p>
            <p className="text-emerald-200 mt-2">tugatilgan reyslar</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-3xl p-6 text-white group hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Fuel size={24} />
              </div>
              <span className="font-medium">O'rtacha xarajat/reys</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">
              {stats.flights.total > 0 ? formatMoney(Math.round(stats.expenses.total / stats.flights.total)) : 0}
            </p>
            <p className="text-orange-200 mt-2">so'm</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DetailModal isOpen={modal.open && modal.type === 'drivers'} onClose={() => setModal({ open: false })}
        title="Shofyorlar batafsil" icon={Users} color="from-blue-500 to-indigo-600">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 text-center border border-emerald-100">
              <p className="text-4xl font-bold text-emerald-600">{stats.drivers.free}</p>
              <p className="text-sm text-emerald-700 mt-1">Bosh shofyorlar</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 text-center border border-orange-100">
              <p className="text-4xl font-bold text-orange-600">{stats.drivers.busy}</p>
              <p className="text-sm text-orange-700 mt-1">Band shofyorlar</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Shofyorlar ro'yxati</h4>
            <div className="space-y-2 max-h-64 overflow-auto pr-2">
              {rawData.drivers.map(driver => (
                <div key={driver._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${
                      driver.status === 'busy' ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    }`}>
                      {driver.fullName?.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{driver.fullName}</span>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
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
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 text-center border border-emerald-100">
              <p className="text-4xl font-bold text-emerald-600">{stats.flights.completed}</p>
              <p className="text-sm text-emerald-700 mt-1">Tugatilgan</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 text-center border border-orange-100">
              <p className="text-4xl font-bold text-orange-600">{stats.flights.active}</p>
              <p className="text-sm text-orange-700 mt-1">Faol</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Reyslar ro'yxati ({stats.flights.total} ta)</h4>
            <div className="space-y-2 max-h-64 overflow-auto pr-2">
              {(stats.flights.list || []).slice(0, 20).map(flight => (
                <div key={flight._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{flight.driver?.fullName || 'Noma\'lum'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(flight.createdAt).toLocaleDateString('uz-UZ')}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
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
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium">Hozirda faol reys yo'q</p>
              <p className="text-sm text-gray-400 mt-1">Yangi reys boshlanganida bu yerda ko'rinadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(stats.flights.list || []).filter(f => f.status === 'active').map(flight => (
                <div key={flight._id} className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {flight.driver?.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{flight.driver?.fullName}</p>
                      <p className="text-sm text-gray-500">{flight.totalDistance || 0} km</p>
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
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 text-center border border-red-100">
            <p className="text-5xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              {formatMoney(stats.expenses.total)}
            </p>
            <p className="text-sm text-red-700 mt-2">Jami xarajat (so'm)</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Fuel size={16} className="text-orange-600" />
                </div>
                <span className="text-sm font-medium text-orange-700">Yoqilg'i</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{formatMoney(stats.expenses.fuel)}</p>
              <p className="text-xs text-orange-500 mt-1">~70% ulush</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-700">Boshqa</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatMoney(stats.expenses.other)}</p>
              <p className="text-xs text-purple-500 mt-1">~30% ulush</p>
            </div>
          </div>
        </div>
      </DetailModal>
    </div>
  )
}
