import { useState, useEffect } from 'react'
import { Users, Truck, Route, Car, ArrowLeft, BarChart3, TrendingUp, Activity, Zap } from 'lucide-react'

export default function StatsTab({ stats, setActiveTab }) {
  if (!stats) return <LoadingState />
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveTab('dashboard')} className="w-11 h-11 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl flex items-center justify-center transition-colors border border-white/5">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Statistika</h2>
            <p className="text-slate-400 text-xs">Tizim haqida batafsil ma'lumotlar</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedStatCard 
          icon={Users}
          value={stats.businessmen.total}
          label="Biznesmenlar"
          sub={`${stats.businessmen.active} faol`}
          gradient="from-violet-500 to-purple-600"
          delay={0}
        />
        <AnimatedStatCard 
          icon={Truck}
          value={stats.drivers.total}
          label="Haydovchilar"
          sub={`${stats.drivers.busy} band`}
          gradient="from-blue-500 to-cyan-600"
          delay={100}
        />
        <AnimatedStatCard 
          icon={Route}
          value={stats.flights.total}
          label="Reyslar"
          sub={`${stats.flights.active} faol`}
          gradient="from-emerald-500 to-teal-600"
          delay={200}
        />
        <AnimatedStatCard 
          icon={Car}
          value={stats.vehicles.total}
          label="Mashinalar"
          sub="Barcha faol"
          gradient="from-pink-500 to-rose-600"
          delay={300}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Biznesmenlar */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Biznesmenlar holati
          </h3>
          <div className="flex items-center justify-center py-4">
            <DonutChart 
              data={[
                { value: stats.businessmen.active, color: '#22c55e', label: 'Faol' },
                { value: stats.businessmen.inactive, color: '#ef4444', label: 'Faolsiz' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.businessmen.active}</p>
              <p className="text-xs text-slate-400">Faol</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{stats.businessmen.inactive}</p>
              <p className="text-xs text-slate-400">Faolsiz</p>
            </div>
          </div>
        </div>

        {/* Haydovchilar */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            Haydovchilar holati
          </h3>
          <div className="flex items-center justify-center py-4">
            <DonutChart 
              data={[
                { value: stats.drivers.busy, color: '#f59e0b', label: 'Band' },
                { value: stats.drivers.free, color: '#22c55e', label: 'Bosh' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.drivers.busy}</p>
              <p className="text-xs text-slate-400">Band</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{stats.drivers.free}</p>
              <p className="text-xs text-slate-400">Bosh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reyslar */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Route className="w-5 h-5 text-emerald-400" />
          Marshrutlar holati
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.flights.active}</p>
            <p className="text-xs text-slate-400">Faol</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.flights.completed}</p>
            <p className="text-xs text-slate-400">Yakunlangan</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.flights.cancelled || 0}</p>
            <p className="text-xs text-slate-400">Bekor qilingan</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-xl rounded-2xl p-6 border border-violet-500/20">
        <h3 className="text-base font-bold text-white mb-4">Umumiy ko'rsatkichlar</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryItem value={stats.businessmen.total + stats.drivers.total} label="Jami foydalanuvchilar" color="violet" />
          <SummaryItem value={stats.businessmen.active + stats.drivers.free} label="Faol foydalanuvchilar" color="emerald" />
          <SummaryItem value={stats.flights.active} label="Joriy marshrutlar" color="amber" />
          <SummaryItem value={stats.vehicles.total} label="Ro'yxatdagi mashinalar" color="blue" />
        </div>
      </div>
    </div>
  )
}

function AnimatedStatCard({ icon: Icon, value, label, sub, gradient, delay }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0
      const end = parseInt(value) || 0
      if (start === end) { setCount(end); return }
      const duration = 1000
      const incrementTime = duration / end
      const counter = setInterval(() => {
        start += 1
        setCount(start)
        if (start >= end) clearInterval(counter)
      }, Math.max(incrementTime, 10))
      return () => clearInterval(counter)
    }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{count}</p>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  )
}

function DonutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0
  
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        {data.map((item, i) => {
          const percent = total > 0 ? (item.value / total) * 100 : 0
          const radius = 40
          const circumference = 2 * Math.PI * radius
          const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`
          const strokeDashoffset = -(currentAngle / 360) * circumference
          currentAngle += (percent / 100) * 360
          
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-[10px] text-slate-400">Jami</span>
      </div>
    </div>
  )
}

function SummaryItem({ value, label, color }) {
  const colors = {
    violet: 'from-violet-400 to-purple-400',
    emerald: 'from-emerald-400 to-teal-400',
    amber: 'from-amber-400 to-orange-400',
    blue: 'from-blue-400 to-cyan-400',
  }
  
  return (
    <div className="text-center">
      <p className={`text-3xl font-bold bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Yuklanmoqda...</p>
      </div>
    </div>
  )
}
