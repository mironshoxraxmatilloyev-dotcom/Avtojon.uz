import { memo, useMemo, useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Trophy, AlertTriangle, Fuel, DollarSign, 
  ArrowUpRight, ArrowDownRight, Bell, Calendar, Droplets, Settings,
  ChevronDown, ChevronUp, Filter, SortAsc, SortDesc
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts'
import api from '../../services/api'

const fmt = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0))

export const StatsTab = memo(({ vehicles }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('profit')
  const [sortDir, setSortDir] = useState('desc')
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/maintenance/fleet/analytics?period=${period}`)
        setAnalytics(data.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [period])

  const sortedVehicles = useMemo(() => {
    if (!analytics?.vehicleStats) return []
    return [...analytics.vehicleStats].sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1
      if (sortBy === 'profit') return mult * (a.profit - b.profit)
      if (sortBy === 'income') return mult * (a.income - b.income)
      if (sortBy === 'expenses') return mult * (a.expenses - b.expenses)
      return 0
    })
  }, [analytics?.vehicleStats, sortBy, sortDir])

  const chartData = useMemo(() => {
    if (!sortedVehicles.length) return []
    return sortedVehicles.slice(0, 10).map(v => ({
      name: v.plateNumber,
      foyda: v.profit,
      daromad: v.income,
      xarajat: v.expenses,
      fill: v.profit >= 0 ? '#10b981' : '#ef4444'
    }))
  }, [sortedVehicles])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white rounded-2xl border-2 border-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!analytics || vehicles.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border-2 border-slate-200">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Statistika mavjud emas</h3>
        <p className="text-slate-500">Statistika uchun mashinalar va ma'lumotlar qo'shing</p>
      </div>
    )
  }

  const { summary } = analytics

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Moliyaviy tahlil</h2>
        <div className="flex items-center gap-2">
          {[
            { value: '7', label: '7 kun' },
            { value: '30', label: '30 kun' },
            { value: '90', label: '3 oy' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Umumiy daromad"
          value={summary.totalIncome}
          color="emerald"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Umumiy xarajat"
          value={summary.totalExpenses}
          color="red"
        />
        <SummaryCard
          icon={summary.netProfit >= 0 ? TrendingUp : TrendingDown}
          label="Sof foyda"
          value={summary.netProfit}
          color={summary.netProfit >= 0 ? 'emerald' : 'red'}
          highlight
        />
        <SummaryCard
          icon={Trophy}
          label="Foydali mashinalar"
          value={`${summary.profitableCount}/${summary.totalVehicles}`}
          color="amber"
          isText
        />
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-2xl p-6 border-2 border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Mashinalar taqqoslash</h3>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="profit">Foyda bo'yicha</option>
              <option value="income">Daromad bo'yicha</option>
              <option value="expenses">Xarajat bo'yicha</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {sortDir === 'desc' ? <SortDesc size={18} className="text-slate-600" /> : <SortAsc size={18} className="text-slate-600" />}
            </button>
          </div>
        </div>

        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" barGap={4}>
              <XAxis 
                type="number" 
                stroke="#94a3b8" 
                fontSize={12} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={12} 
                width={90} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip content={<CompareTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="foyda" name="Foyda" radius={[0, 8, 8, 0]} barSize={28}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* All Vehicles Table */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Barcha mashinalar reytingi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mashina</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Daromad</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Xarajat</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Foyda</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedVehicles.map((v, i) => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-200 text-slate-700' :
                      i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{v.plateNumber}</p>
                      <p className="text-xs text-slate-500">{v.brand} {v.model}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-emerald-600 font-semibold">{fmt(v.income)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-red-500 font-semibold">{fmt(v.expenses)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${v.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {v.profit >= 0 ? '+' : ''}{fmt(v.profit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.isProfitable ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                        <ArrowUpRight size={12} /> Foydali
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                        <ArrowDownRight size={12} /> Zarar
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})

// Summary Card
const SummaryCard = memo(({ icon: Icon, label, value, color, highlight, isText }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-500', text: 'text-red-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-600' }
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-2xl p-5 border-2 ${c.border} ${highlight ? 'ring-2 ring-offset-2 ring-emerald-500/20' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>
        {isText ? value : `${fmt(value)} so'm`}
      </p>
      <p className="text-slate-600 text-sm font-medium mt-1">{label}</p>
    </div>
  )
})

// Compare Tooltip
const CompareTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-900 font-bold text-lg mb-2">{d.name}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Daromad:</span>
          <span className="text-emerald-600 font-semibold">{fmt(d.daromad)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Xarajat:</span>
          <span className="text-red-500 font-semibold">{fmt(d.xarajat)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-slate-100">
          <span className="text-slate-700 font-medium">Foyda:</span>
          <span className={`font-bold ${d.foyda >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {d.foyda >= 0 ? '+' : ''}{fmt(d.foyda)}
          </span>
        </div>
      </div>
    </div>
  )
}
