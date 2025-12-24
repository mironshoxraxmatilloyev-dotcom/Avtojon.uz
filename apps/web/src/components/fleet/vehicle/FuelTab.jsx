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
      {/* Stats - Light Mode */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jami yoqilg'i" value={`${fmt(stats.totalLiters || 0)} L`} color="blue" />
        <StatCard label="Jami xarajat" value={`${fmt(stats.totalCost || 0)}`} color="emerald" />
        <StatCard label="O'rtacha narx" value={`${fmt(stats.avgPricePerLiter || 0)}/L`} color="amber" />
        <StatCard label="Quyilishlar" value={refills.length} color="purple" />
      </div>

      {/* Chart - Light Mode */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Yoqilg'i dinamikasi
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fuelGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="liters" stroke="#3b82f6" fill="url(#fuelGradientLight)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus size={18} />
          Yoqilg'i qo'shish
        </button>
      </div>

      {/* List - Light Mode */}
      {refills.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {refills.map(r => (
            <div key={r._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <Fuel className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{r.liters} litr</p>
                    <p className="text-gray-500 text-sm">{fmtDate(r.date)} • {fmt(r.odometer)} km</p>
                    {r.station && <p className="text-gray-400 text-sm">{r.station}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-bold">{fmt(r.cost)} so'm</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(r)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(r._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
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

const StatCard = memo(({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    purple: 'bg-purple-50 border-purple-100'
  }
  return (
    <div className={`${colors[color]} rounded-xl p-4 border`}>
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
})

const EmptyState = memo(({ icon: Icon, text }) => (
  <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
    <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500">{text}</p>
  </div>
))

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-gray-900 font-semibold">{payload[0].value} L</p>
      <p className="text-gray-500 text-sm">{fmt(payload[0].payload.cost)} so'm</p>
    </div>
  )
}
