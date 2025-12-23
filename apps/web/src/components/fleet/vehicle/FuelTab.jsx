import { memo } from 'react'
import { Plus, Fuel, Edit2, Trash2, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt, fmtDate } from './constants'

export const FuelTab = memo(({ data, onAdd, onEdit, onDelete }) => {
  const { refills = [], stats = {} } = data

  const chartData = [...refills]
    .reverse()
    .slice(-10)
    .map(r => ({
      date: new Date(r.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' }),
      liters: r.liters,
      cost: r.cost
    }))

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jami yoqilg'i" value={`${fmt(stats.totalLiters || 0)} L`} color="blue" />
        <StatCard label="Jami xarajat" value={`${fmt(stats.totalCost || 0)}`} color="emerald" />
        <StatCard label="O'rtacha narx" value={`${fmt(stats.avgPricePerLiter || 0)}/L`} color="amber" />
        <StatCard label="Quyilishlar" value={refills.length} color="purple" />
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Yoqilg'i dinamikasi
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="liters" stroke="#3b82f6" fill="url(#fuelGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Yoqilg'i qo'shish
        </button>
      </div>

      {/* List */}
      {refills.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Tarix</h3>
          {refills.map(r => (
            <div key={r._id} className="bg-slate-800/30 rounded-xl p-5 border border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Fuel className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{r.liters} litr</p>
                    <p className="text-slate-400 text-sm">{fmtDate(r.date)} • {fmt(r.odometer)} km</p>
                    {r.station && <p className="text-slate-500 text-sm">{r.station}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{fmt(r.cost)} so'm</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(r)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(r._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Fuel} text="Yoqilg'i ma'lumotlari yo'q" />
      )}
    </div>
  )
})

const StatCard = memo(({ label, value, color }) => (
  <div className={`bg-${color}-500/5 rounded-xl p-4 border border-${color}-500/10`}>
    <p className="text-slate-400 text-sm mb-1">{label}</p>
    <p className="text-xl font-bold text-white">{value}</p>
  </div>
))

const EmptyState = memo(({ icon: Icon, text }) => (
  <div className="bg-slate-800/20 rounded-2xl p-12 text-center border border-white/5">
    <Icon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
    <p className="text-slate-400">{text}</p>
  </div>
))

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white font-semibold">{payload[0].value} L</p>
      <p className="text-slate-400 text-sm">{fmt(payload[0].payload.cost)} so'm</p>
    </div>
  )
}
