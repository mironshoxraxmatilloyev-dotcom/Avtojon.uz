import { memo, useMemo, useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Trophy, DollarSign, ArrowUpRight, ArrowDownRight, SortAsc, SortDesc } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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
    return sortedVehicles.slice(0, 8).map(v => ({
      name: v.plateNumber,
      foyda: v.profit,
      fill: v.profit >= 0 ? '#10b981' : '#ef4444'
    }))
  }, [sortedVehicles])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!analytics || vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Statistika mavjud emas</h3>
        <p className="text-slate-500 text-sm">Mashinalar va ma'lumotlar qo'shing</p>
      </div>
    )
  }

  const { summary } = analytics

  return (
    <div className="space-y-4">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-bold text-slate-900">Moliyaviy tahlil</h2>
        <div className="flex items-center gap-1">
          {[{ value: '7', label: '7 kun' }, { value: '30', label: '30 kun' }, { value: '90', label: '3 oy' }].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p.value ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        <SummaryCard icon={DollarSign} label="Daromad" value={summary.totalIncome} color="emerald" />
        <SummaryCard icon={TrendingDown} label="Xarajat" value={summary.totalExpenses} color="red" />
        <SummaryCard icon={summary.netProfit >= 0 ? TrendingUp : TrendingDown} label="Sof foyda" value={summary.netProfit} color={summary.netProfit >= 0 ? 'emerald' : 'red'} />
        <SummaryCard icon={Trophy} label="Foydali" value={`${summary.profitableCount}/${summary.totalVehicles}`} color="amber" isText />
      </div>

      {/* Chart - Hidden on small mobile */}
      {chartData.length > 0 && (
        <div className="hidden sm:block bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Mashinalar taqqoslash</h3>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="profit">Foyda</option>
                <option value="income">Daromad</option>
                <option value="expenses">Xarajat</option>
              </select>
              <button
                onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                {sortDir === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />}
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={75} tickLine={false} axisLine={false} tick={{ fill: '#334155', fontWeight: 500 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="foyda" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vehicles Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Mashinalar reytingi</h3>
        </div>
        
        {/* Mobile List */}
        <div className="sm:hidden divide-y divide-slate-100">
          {sortedVehicles.map((v, i) => (
            <div key={v._id} className="p-3 flex items-center gap-3">
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{v.plateNumber}</p>
                <p className="text-[10px] text-slate-500">{v.brand}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${v.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {v.profit >= 0 ? '+' : ''}{fmt(v.profit)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase">Mashina</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Daromad</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Xarajat</th>
                <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase">Foyda</th>
                <th className="px-3 py-2 text-center text-[10px] font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedVehicles.map((v, i) => (
                <tr key={v._id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-bold text-slate-900 text-xs">{v.plateNumber}</p>
                    <p className="text-[10px] text-slate-500">{v.brand}</p>
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-600 font-semibold text-xs">{fmt(v.income)}</td>
                  <td className="px-3 py-2 text-right text-red-500 font-semibold text-xs">{fmt(v.expenses)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-bold text-xs ${v.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {v.profit >= 0 ? '+' : ''}{fmt(v.profit)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {v.isProfitable ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                        <ArrowUpRight size={10} /> Foydali
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">
                        <ArrowDownRight size={10} /> Zarar
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

const SummaryCard = memo(({ icon: Icon, label, value, color, isText }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' }
  }
  const c = colors[color]

  return (
    <div className={`${c.bg} rounded-xl p-4 lg:p-5`}>
      <div className={`w-9 h-9 ${c.icon} rounded-lg flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className={`text-xl lg:text-2xl font-bold ${c.text}`}>{isText ? value : fmt(value)}</p>
      <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">{label}</p>
    </div>
  )
})

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-slate-900 font-bold text-sm mb-1">{d.name}</p>
      <p className={`text-sm font-semibold ${d.foyda >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {d.foyda >= 0 ? '+' : ''}{fmt(d.foyda)} so'm
      </p>
    </div>
  )
}
