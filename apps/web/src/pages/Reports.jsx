import { useEffect, useState } from 'react'
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Truck, Route, 
  Fuel, Calendar, ArrowUpRight, ArrowDownRight, Activity,
  DollarSign, Clock, CheckCircle, AlertCircle
} from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

// Simple Bar Chart Component
const BarChart = ({ data, title, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 truncate">{item.label}</span>
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
            <span className="text-xs font-semibold text-gray-700 w-12 text-right">{item.value}</span>
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
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((item, i) => {
            const percent = (item.value / total) * 100
            const dashArray = `${percent} ${100 - percent}`
            const dashOffset = -cumulativePercent
            cumulativePercent += percent
            
            return (
              <circle
                key={i}
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">{title}</span>
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

// Line Chart Component (simplified)
const LineChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.value / maxValue) * 80
  }))
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <div className="relative h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
          ))}
          {/* Line */}
          <path d={pathD} fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" />
          {/* Area */}
          <path d={`${pathD} L 100 100 L 0 100 Z`} fill="url(#areaGradient)" opacity="0.3" />
          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3b82f6" />
          ))}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 -mb-5">
          {data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { isDemo } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    drivers: { total: 0, busy: 0, free: 0 },
    flights: { total: 0, active: 0, completed: 0 },
    expenses: { total: 0, fuel: 0, other: 0 },
    monthly: []
  })

  useEffect(() => {
    const fetchReports = async () => {
      if (isDemo()) {
        // Demo data
        setStats({
          drivers: { total: 8, busy: 3, free: 5 },
          flights: { total: 159, active: 3, completed: 156 },
          expenses: { total: 45000000, fuel: 32000000, other: 13000000 },
          monthly: [
            { label: 'Yan', value: 12 },
            { label: 'Fev', value: 18 },
            { label: 'Mar', value: 25 },
            { label: 'Apr', value: 22 },
            { label: 'May', value: 30 },
            { label: 'Iyn', value: 28 },
          ]
        })
        setLoading(false)
        return
      }

      try {
        const [driversRes, flightsRes, expensesRes] = await Promise.all([
          api.get('/drivers'),
          api.get('/flights'),
          api.get('/expenses/stats').catch(() => ({ data: { data: { totalAmount: 0 } } }))
        ])

        const drivers = driversRes.data.data || []
        const flights = flightsRes.data.data || []
        
        // Monthly data calculation
        const monthlyData = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthFlights = flights.filter(f => {
            const fDate = new Date(f.createdAt)
            return fDate.getMonth() === date.getMonth() && fDate.getFullYear() === date.getFullYear()
          })
          monthlyData.push({
            label: date.toLocaleDateString('uz-UZ', { month: 'short' }),
            value: monthFlights.length
          })
        }

        setStats({
          drivers: {
            total: drivers.length,
            busy: drivers.filter(d => d.status === 'busy').length,
            free: drivers.filter(d => d.status === 'free' || d.status === 'available').length
          },
          flights: {
            total: flights.length,
            active: flights.filter(f => f.status === 'active').length,
            completed: flights.filter(f => f.status === 'completed').length
          },
          expenses: {
            total: expensesRes.data.data?.totalAmount || 0,
            fuel: Math.round((expensesRes.data.data?.totalAmount || 0) * 0.7),
            other: Math.round((expensesRes.data.data?.totalAmount || 0) * 0.3)
          },
          monthly: monthlyData
        })
      } catch (err) {
        console.error('Reports error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [isDemo])

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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Shofyorlar</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.drivers.total}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-600 flex items-center gap-1">
              <ArrowUpRight size={12} /> {stats.drivers.free} bosh
            </span>
            <span className="text-orange-600 flex items-center gap-1">
              <Activity size={12} /> {stats.drivers.busy} band
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Route className="text-emerald-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Reyslar</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.flights.total}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle size={12} /> {stats.flights.completed} tugatilgan
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="text-orange-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Faol reyslar</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.flights.active}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
            <Clock size={12} /> Hozir yo'lda
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-red-600" size={20} />
            </div>
            <span className="text-sm text-gray-500">Xarajatlar</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(stats.expenses.total)}</p>
          <p className="text-xs text-gray-500 mt-1">so'm</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oylik reyslar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Oylik reyslar</h3>
              <p className="text-xs text-gray-500">Oxirgi 6 oy statistikasi</p>
            </div>
          </div>
          <LineChart data={stats.monthly} title="" />
        </div>

        {/* Shofyorlar holati */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Shofyorlar holati</h3>
              <p className="text-xs text-gray-500">Hozirgi vaqtda</p>
            </div>
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

        {/* Xarajatlar taqsimoti */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Fuel className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Xarajatlar taqsimoti</h3>
              <p className="text-xs text-gray-500">Kategoriya bo'yicha</p>
            </div>
          </div>
          <BarChart 
            data={[
              { label: 'Yoqilg\'i', value: stats.expenses.fuel },
              { label: 'Boshqa', value: stats.expenses.other },
            ]}
            title=""
            color="orange"
          />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jami xarajat:</span>
              <span className="font-semibold text-gray-900">{formatMoney(stats.expenses.total)} so'm</span>
            </div>
          </div>
        </div>

        {/* Reyslar holati */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Route className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reyslar holati</h3>
              <p className="text-xs text-gray-500">Umumiy statistika</p>
            </div>
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
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <span className="font-medium">O'rtacha reys/oy</span>
          </div>
          <p className="text-4xl font-bold">
            {stats.monthly.length > 0 
              ? Math.round(stats.monthly.reduce((a, b) => a + b.value, 0) / stats.monthly.length)
              : 0}
          </p>
          <p className="text-blue-200 text-sm mt-1">ta reys</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <span className="font-medium">Muvaffaqiyat darajasi</span>
          </div>
          <p className="text-4xl font-bold">
            {stats.flights.total > 0 
              ? Math.round((stats.flights.completed / stats.flights.total) * 100)
              : 0}%
          </p>
          <p className="text-emerald-200 text-sm mt-1">tugatilgan reyslar</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Fuel size={24} />
            </div>
            <span className="font-medium">O'rtacha xarajat/reys</span>
          </div>
          <p className="text-3xl font-bold">
            {stats.flights.total > 0 
              ? formatMoney(Math.round(stats.expenses.total / stats.flights.total))
              : 0}
          </p>
          <p className="text-orange-200 text-sm mt-1">so'm</p>
        </div>
      </div>
    </div>
  )
}
