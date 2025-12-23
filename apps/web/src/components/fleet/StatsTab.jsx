import { memo, useMemo } from 'react'
import {
  Car,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Fuel,
  Truck,
  Calendar,
  Gauge,
  Activity,
  Zap
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { FUEL, STATUS_CONFIG, CHART_COLORS, fmt } from './constants'

const FUEL_COLORS = {
  diesel: '#3b82f6',
  petrol: '#10b981',
  gas: '#f59e0b',
  metan: '#8b5cf6'
}

const STATUS_COLORS = {
  excellent: '#10b981',
  normal: '#3b82f6',
  attention: '#f59e0b',
  critical: '#ef4444'
}

// Premium Glassmorphism Tooltip
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-2xl shadow-black/50">
      {label && <p className="text-slate-400 text-sm mb-2">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-white font-bold text-lg">
            {typeof entry.value === 'number' ? fmt(entry.value) : entry.value}
          </span>
          <span className="text-slate-400 text-sm">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}

export const StatsTab = memo(({ vehicles, stats }) => {
  // Yoqilg'i turlari
  const fuelData = useMemo(() => {
    const counts = { diesel: 0, petrol: 0, gas: 0, metan: 0 }
    vehicles.forEach(v => {
      if (counts[v.fuelType] !== undefined) counts[v.fuelType]++
    })
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        name: FUEL[key],
        value: count,
        fill: FUEL_COLORS[key]
      }))
  }, [vehicles])

  // Holat bo'yicha
  const statusData = useMemo(() => {
    const counts = { excellent: 0, normal: 0, attention: 0, critical: 0 }
    vehicles.forEach(v => {
      if (counts[v.status] !== undefined) counts[v.status]++
    })
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        name: STATUS_CONFIG[key]?.label || key,
        value: count,
        fill: STATUS_COLORS[key]
      }))
  }, [vehicles])

  // Marka bo'yicha
  const brandData = useMemo(() => {
    const brands = {}
    vehicles.forEach(v => {
      if (v.brand) brands[v.brand] = (brands[v.brand] || 0) + 1
    })
    return Object.entries(brands)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([brand, count], i) => ({
        brand,
        count,
        fill: Object.values(CHART_COLORS)[i % 8]
      }))
  }, [vehicles])

  // Yil bo'yicha
  const yearData = useMemo(() => {
    const years = {}
    vehicles.forEach(v => {
      if (v.year) years[v.year] = (years[v.year] || 0) + 1
    })
    return Object.entries(years)
      .sort(([a], [b]) => a - b)
      .slice(-8)
      .map(([year, count]) => ({ year, count }))
  }, [vehicles])

  // Top odometr
  const topOdometerData = useMemo(() => {
    return [...vehicles]
      .sort((a, b) => (b.currentOdometer || 0) - (a.currentOdometer || 0))
      .slice(0, 5)
      .map((v, i) => ({
        name: v.plateNumber,
        km: v.currentOdometer || 0,
        brand: `${v.brand} ${v.model}`,
        fill: Object.values(CHART_COLORS)[i]
      }))
  }, [vehicles])

  // Radial progress data
  const healthData = useMemo(() => {
    const total = vehicles.length || 1
    return [
      { name: 'Yaxshi', value: Math.round((stats.excellent / total) * 100), fill: '#10b981' },
      { name: 'Diqqat', value: Math.round((stats.attention / total) * 100), fill: '#f59e0b' }
    ]
  }, [vehicles.length, stats.excellent, stats.attention])

  if (vehicles.length === 0) {
    return (
      <div className="bg-slate-800/20 rounded-3xl p-16 text-center border border-white/5">
        <div className="w-20 h-20 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Activity className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Statistika mavjud emas</h3>
        <p className="text-slate-400">Statistika uchun mashinalar qo'shing</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <GlowCard color="blue" icon={Car} value={stats.total} label="Jami transport" />
        <GlowCard color="emerald" icon={CheckCircle} value={stats.excellent} label="Yaxshi holat" />
        <GlowCard color="amber" icon={AlertTriangle} value={stats.attention} label="Diqqat talab" pulse />
        <GlowCard color="purple" icon={TrendingUp} value={`${(stats.totalKm / 1000).toFixed(0)}k`} label="Jami km" />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Donut Chart */}
        <ChartCard title="Yoqilg'i turlari" icon={Fuel} iconColor="blue">
          {fuelData.length > 0 ? (
            <div>
              <div className="relative mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <defs>
                      {fuelData.map((entry, i) => (
                        <linearGradient key={i} id={`fuelGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                          <stop offset="100%" stopColor={entry.fill} stopOpacity={0.6} />
                        </linearGradient>
                      ))}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={fuelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={fuelData.length > 1 ? 4 : 0}
                      dataKey="value"
                      stroke="none"
                      filter="url(#glow)"
                    >
                      {fuelData.map((entry, i) => (
                        <Cell key={i} fill={`url(#fuelGrad${i})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-3xl font-bold text-white">{vehicles.length}</p>
                  <p className="text-slate-500 text-xs">mashina</p>
                </div>
              </div>
              
              {/* Custom Legend with counts */}
              <div className="space-y-2">
                {fuelData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-white font-bold">{item.value} ta</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <NoData />
          )}
        </ChartCard>

        {/* Status Summary Card */}
        <ChartCard title="Avtopark salomatligi" icon={Activity} iconColor="emerald">
          <div className="space-y-6">
            {/* Health Score */}
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#1e293b" strokeWidth="12" fill="none" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#healthGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(healthData[0]?.value || 0) * 3.52} 352`}
                  />
                  <defs>
                    <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center">
                  <p className="text-3xl font-bold text-emerald-400">{healthData[0]?.value || 0}%</p>
                  <p className="text-slate-500 text-xs">Sog'lom</p>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-slate-300">Yaxshi holat</span>
                </div>
                <span className="text-emerald-400 font-bold">{stats.excellent}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-slate-300">Diqqat talab</span>
                </div>
                <span className="text-amber-400 font-bold">{stats.attention}</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Brand Bar Chart */}
      {brandData.length > 0 && (
        <ChartCard title="Marka bo'yicha taqsimot" icon={Truck} iconColor="indigo" fullWidth>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={brandData} layout="vertical" barGap={8}>
              <defs>
                {brandData.map((entry, i) => (
                  <linearGradient key={i} id={`brandGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={entry.fill} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={entry.fill} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis type="number" stroke="#475569" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="brand"
                stroke="#94a3b8"
                fontSize={13}
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name="Soni" radius={[0, 12, 12, 0]} barSize={32}>
                {brandData.map((entry, i) => (
                  <Cell key={i} fill={`url(#brandGrad${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Year Area Chart */}
      {yearData.length > 1 && (
        <ChartCard title="Ishlab chiqarilgan yil" icon={Calendar} iconColor="cyan" fullWidth>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={yearData}>
              <defs>
                <linearGradient id="yearGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="yearStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Soni"
                stroke="url(#yearStroke)"
                fill="url(#yearGradient)"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#22d3ee', strokeWidth: 0, r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Top Odometer */}
      {topOdometerData.length > 0 && (
        <ChartCard title="Eng ko'p yurgan mashinalar" icon={Gauge} iconColor="pink" fullWidth>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topOdometerData} layout="vertical" barGap={8}>
              <defs>
                {topOdometerData.map((entry, i) => (
                  <linearGradient key={i} id={`odoGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={entry.fill} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={entry.fill} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                type="number"
                stroke="#475569"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                width={95}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
                      <p className="text-white font-bold text-lg">{d.name}</p>
                      <p className="text-slate-400 text-sm mb-2">{d.brand}</p>
                      <p className="text-pink-400 font-bold text-xl">{fmt(d.km)} km</p>
                    </div>
                  )
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="km" name="Masofa" radius={[0, 12, 12, 0]} barSize={32}>
                {topOdometerData.map((entry, i) => (
                  <Cell key={i} fill={`url(#odoGrad${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
})

// Glow Effect Card
const GlowCard = memo(({ color, icon: Icon, value, label, pulse }) => (
  <div className={`relative overflow-hidden bg-gradient-to-br from-${color}-500/10 to-${color}-600/5 rounded-2xl p-6 border border-${color}-500/20 group hover:border-${color}-500/40 transition-all duration-300`}>
    {/* Glow Effect */}
    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}-500/20 rounded-full blur-3xl group-hover:bg-${color}-500/30 transition-all`} />
    
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center shadow-lg shadow-${color}-500/30`}>
          <Icon size={24} className="text-white" />
        </div>
        {pulse && (
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 bg-${color}-500`} />
          </span>
        )}
      </div>
      <p className="text-4xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-400">{label}</p>
    </div>
  </div>
))

// Chart Card Container
const ChartCard = memo(({ title, icon: Icon, iconColor, children, fullWidth }) => (
  <div className={`bg-slate-800/30 backdrop-blur rounded-2xl p-6 border border-white/5 ${fullWidth ? '' : ''}`}>
    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
      <div className={`w-10 h-10 bg-${iconColor}-500/10 rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 text-${iconColor}-400`} />
      </div>
      {title}
    </h3>
    {children}
  </div>
))

const NoData = () => (
  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
    <Zap className="w-10 h-10 mb-2 opacity-50" />
    <p>Ma'lumot yo'q</p>
  </div>
)
