import { memo, useState, useEffect } from 'react'
import { 
  Fuel, Droplets, Circle, Wrench, TrendingUp, TrendingDown, Calendar, Gauge, 
  DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight,
  PieChart
} from 'lucide-react'
import { fmt, fmtDate } from './constants'
import api from '../../../services/api'

export const SummaryTab = memo(({ vehicle, stats, fuelData, oilData, tires, services }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    if (!vehicle?._id) return
    setLoading(true)
    api.get(`/maintenance/vehicles/${vehicle._id}/analytics?period=${period}`)
      .then(res => setAnalytics(res.data.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false))
  }, [vehicle?._id, period])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-2xl border border-gray-200" />
        <div className="h-48 bg-white rounded-2xl border border-gray-200" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-white rounded-2xl border border-gray-200" />
          <div className="h-32 bg-white rounded-2xl border border-gray-200" />
        </div>
      </div>
    )
  }

  const summary = analytics?.summary || {}
  const fuelEfficiency = analytics?.fuelEfficiency || {}
  const expenseBreakdown = analytics?.expenseBreakdown || {}
  const alerts = analytics?.alerts || []

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Umumiy ko'rinish</h2>
        <div className="flex gap-2">
          {[
            { value: '7', label: '7 kun' },
            { value: '30', label: '30 kun' },
            { value: '90', label: '3 oy' },
            { value: '365', label: '1 yil' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.value 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profit/Loss Card */}
      <div className={`rounded-2xl p-6 border shadow-sm ${
        summary.isProfitable 
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' 
          : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {summary.isProfitable ? (
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div>
              <p className="text-gray-500 text-sm">Sof foyda/zarar</p>
              <p className={`text-3xl font-bold ${summary.isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.isProfitable ? '+' : ''}{fmt(summary.netProfit || 0)} so'm
              </p>
            </div>
          </div>
          {summary.profitMargin !== undefined && (
            <div className="text-right">
              <p className="text-gray-500 text-sm">Foyda foizi</p>
              <p className={`text-2xl font-bold ${summary.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.profitMargin}%
              </p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-gray-500 text-xs">Daromad</p>
              <p className="text-lg font-semibold text-gray-900">{fmt(summary.totalIncome || 0)} so'm</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ArrowDownRight className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-gray-500 text-xs">Xarajat</p>
              <p className="text-lg font-semibold text-gray-900">{fmt(summary.totalExpenses || 0)} so'm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Ogohlantirishlar ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  alert.severity === 'danger' ? 'bg-red-50 border border-red-200' :
                  alert.severity === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${
                  alert.severity === 'danger' ? 'text-red-500' :
                  alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                }`} />
                <span className="text-sm text-gray-700">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat 
          icon={ArrowUpRight} 
          label="Oylik daromad" 
          value={`${fmt(summary.totalIncome || 0)}`}
          subLabel="so'm"
          color="emerald"
        />
        <QuickStat 
          icon={ArrowDownRight} 
          label="Oylik xarajat" 
          value={`${fmt(summary.totalExpenses || 0)}`}
          subLabel="so'm"
          color="red"
        />
        <QuickStat 
          icon={summary.isProfitable ? TrendingUp : TrendingDown} 
          label="Sof foyda" 
          value={`${fmt(Math.abs(summary.netProfit || 0))}`}
          subLabel={summary.isProfitable ? "so'm" : "so'm (zarar)"}
          color={summary.isProfitable ? "emerald" : "red"}
        />
        <QuickStat 
          icon={Fuel} 
          label="1 kub metanda" 
          value={fuelEfficiency.kmPerCubicMeter ? `${fuelEfficiency.kmPerCubicMeter}` : (fuelEfficiency.avgConsumption ? `${Math.round(100 / fuelEfficiency.avgConsumption)}` : '-')}
          subLabel="km yuradi"
          color="blue"
        />
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-500" />
          Xarajat taqsimoti
        </h3>
        <div className="space-y-3">
          <ExpenseBar label="Yoqilg'i" data={expenseBreakdown.fuel} color="blue" icon={Fuel} />
          <ExpenseBar label="Moy" data={expenseBreakdown.oil} color="amber" icon={Droplets} />
          <ExpenseBar label="Shinalar" data={expenseBreakdown.tires} color="purple" icon={Circle} />
          <ExpenseBar label="Xizmat" data={expenseBreakdown.service} color="emerald" icon={Wrench} />
          <ExpenseBar label="Boshqa" data={expenseBreakdown.other} color="gray" icon={DollarSign} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-500">Jami xarajat</span>
          <span className="text-xl font-bold text-gray-900">{fmt(summary.totalExpenses || 0)} so'm</span>
        </div>
      </div>

      {/* Oil & Tires Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oil Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-amber-500" />
              Moy holati
            </h3>
            <StatusBadge status={analytics?.oilStatus?.status || oilData.status} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Qolgan masofa</span>
              <span className={`font-semibold ${
                (analytics?.oilStatus?.remainingKm || oilData.remainingKm) <= 1000 ? 'text-red-600' :
                (analytics?.oilStatus?.remainingKm || oilData.remainingKm) <= 2000 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {fmt(analytics?.oilStatus?.remainingKm || oilData.remainingKm)} km
              </span>
            </div>
            {oilData.lastChange && (
              <div className="flex justify-between">
                <span className="text-gray-500">Oxirgi almashtirish</span>
                <span className="text-gray-900">{fmtDate(oilData.lastChange.date)}</span>
              </div>
            )}
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (analytics?.oilStatus?.remainingKm || oilData.remainingKm) <= 1000 ? 'bg-red-500' :
                    (analytics?.oilStatus?.remainingKm || oilData.remainingKm) <= 2000 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ 
                    width: `${Math.max(5, Math.min(100, ((analytics?.oilStatus?.remainingKm || oilData.remainingKm) / (vehicle.oilChangeIntervalKm || 15000)) * 100))}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tires Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Circle className="w-5 h-5 text-purple-500" />
            Shinalar holati
          </h3>
          {analytics?.tiresStatus ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Jami</span>
                <span className="text-gray-900">{analytics.tiresStatus.total} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Diqqat talab</span>
                <span className={analytics.tiresStatus.needAttention > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
                  {analytics.tiresStatus.needAttention} ta
                </span>
              </div>
              {analytics.tiresStatus.worstTire && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Eng eskirgan shina</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{analytics.tiresStatus.worstTire.position}</span>
                    <span className={`font-semibold ${
                      analytics.tiresStatus.worstTire.wearPercent >= 90 ? 'text-red-600' :
                      analytics.tiresStatus.worstTire.wearPercent >= 75 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {analytics.tiresStatus.worstTire.wearPercent}% eskirgan
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : tires.length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Jami</span>
                <span className="text-gray-900">{tires.length} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Eskirgan</span>
                <span className="text-red-600 font-semibold">
                  {tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length} ta
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Shina qo'shilmagan</p>
          )}
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mashina ma'lumotlari</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={Calendar} label="Yil" value={vehicle.year || '-'} />
          <InfoCard icon={Fuel} label="Yoqilg'i turi" value={
            vehicle.fuelType === 'diesel' ? 'Dizel' : 
            vehicle.fuelType === 'petrol' ? 'Benzin' : 
            vehicle.fuelType === 'gas' ? 'Gaz' : vehicle.fuelType || '-'
          } />
          <InfoCard icon={Gauge} label="Bak hajmi" value={vehicle.fuelTankCapacity ? `${vehicle.fuelTankCapacity} L` : '-'} />
          <InfoCard icon={DollarSign} label="Sotib olish narxi" value={vehicle.purchasePrice ? `${fmt(vehicle.purchasePrice)} so'm` : '-'} />
        </div>
      </div>
    </div>
  )
})

const QuickStat = memo(({ icon: Icon, label, value, subLabel, trend, color }) => {
  const bgColors = {
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-purple-50 border-purple-100',
    red: 'bg-red-50 border-red-100'
  }
  const iconColors = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    purple: 'text-purple-500',
    red: 'text-red-500'
  }
  
  return (
    <div className={`p-4 ${bgColors[color]} rounded-xl border`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            trend === 'increasing' ? 'bg-red-100 text-red-600' :
            trend === 'decreasing' ? 'bg-emerald-100 text-emerald-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {trend === 'increasing' ? '↑' : trend === 'decreasing' ? '↓' : '→'}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
    </div>
  )
})

const ExpenseBar = memo(({ label, data, color, icon: Icon }) => {
  const amount = data?.amount || 0
  const percent = data?.percent || 0
  const barColors = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    gray: 'bg-gray-400'
  }
  const iconColors = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    purple: 'text-purple-500',
    emerald: 'text-emerald-500',
    gray: 'text-gray-400'
  }
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColors[color]}`} />
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 font-medium">{fmt(amount)} so'm</span>
          <span className="text-xs text-gray-400">({percent}%)</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColors[color]} rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
})

const StatusBadge = memo(({ status }) => {
  const config = {
    ok: { label: 'Yaxshi', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    warning: { label: 'Yaqinlashmoqda', bg: 'bg-amber-100', text: 'text-amber-700' },
    critical: { label: 'Kritik', bg: 'bg-red-100', text: 'text-red-700' },
    overdue: { label: 'Muddati o\'tgan', bg: 'bg-red-100', text: 'text-red-700' },
    approaching: { label: 'Yaqinlashmoqda', bg: 'bg-amber-100', text: 'text-amber-700' }
  }
  const { label, bg, text } = config[status] || config.ok
  
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
})

const InfoCard = memo(({ icon: Icon, label, value }) => (
  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
  </div>
))
