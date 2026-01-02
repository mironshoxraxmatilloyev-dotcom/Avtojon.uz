import { memo, useState, useEffect } from 'react'
import {
  Fuel, Droplets, Circle, Wrench, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Bell, PieChart
} from 'lucide-react'
import { fmt } from './constants'
import api from '../../../services/api'

export const SummaryTab = memo(({ vehicle, oilData, tires }) => {
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
  const expenseBreakdown = analytics?.expenseBreakdown || {}
  const alerts = analytics?.alerts || []

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Umumiy ko'rinish</h2>
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
          {[
            { value: '7', label: '7 kun' },
            { value: '30', label: '30 kun' },
            { value: '90', label: '3 oy' },
            { value: '365', label: '1 yil' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${period === p.value
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔔 Smart Alerts */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
          <h3 className="text-base font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Diqqat! ({alerts.length} ta ogohlantirish)
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl bg-white/80 ${alert.severity === 'danger' ? 'border-l-4 border-red-500' :
                    alert.severity === 'warning' ? 'border-l-4 border-amber-500' : 'border-l-4 border-blue-500'
                  }`}
              >
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${alert.severity === 'danger' ? 'text-red-500' :
                    alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                <span className="text-sm text-gray-700">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asosiy Moliyaviy Ko'rsatkichlar */}
      <div className={`rounded-2xl p-4 sm:p-6 border shadow-sm ${summary.isProfitable
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
        }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {summary.isProfitable ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs sm:text-sm">Sof foyda/zarar ({period} kun)</p>
              <p className={`text-xl sm:text-3xl font-bold ${summary.isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.isProfitable ? '+' : ''}{fmt(summary.netProfit || 0)} so'm
              </p>
            </div>
          </div>
          {summary.profitMargin !== undefined && (
            <div className="text-left sm:text-right pl-14 sm:pl-0">
              <p className="text-gray-500 text-xs sm:text-sm">Rentabellik</p>
              <p className={`text-xl sm:text-2xl font-bold ${summary.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.profitMargin}%
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            <div>
              <p className="text-gray-500 text-[10px] sm:text-xs">Daromad</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">{fmt(summary.totalIncome || 0)} so'm</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <div>
              <p className="text-gray-500 text-[10px] sm:text-xs">Xarajat</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900">{fmt(summary.totalExpenses || 0)} so'm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <PieChart className="w-6 h-6 text-blue-600" />
          </div>
          Xarajat taqsimoti
        </h3>
        <div className="space-y-5">
          <ExpenseBar label="Yoqilg'i" data={expenseBreakdown.fuel} color="blue" icon={Fuel} />
          <ExpenseBar label="Moy" data={expenseBreakdown.oil} color="amber" icon={Droplets} />
          <ExpenseBar label="Shinalar" data={expenseBreakdown.tires} color="purple" icon={Circle} />
          <ExpenseBar label="Xizmat" data={expenseBreakdown.service} color="emerald" icon={Wrench} />
          <ExpenseBar label="Boshqa" data={expenseBreakdown.other} color="gray" icon={DollarSign} />
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-600 text-lg">Jami xarajat</span>
          <span className="text-3xl font-bold text-gray-900">{fmt(summary.totalExpenses || 0)} so'm</span>
        </div>
      </div>

      {/* Oil & Tires Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oil Status */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Droplets className="w-5 h-5 text-amber-600" />
              </div>
              Moy holati
            </h3>
            <StatusBadge status={analytics?.oilStatus?.status || oilData.status} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-base">Qolgan masofa</span>
              <span className={`font-bold text-xl ${
                (analytics?.oilStatus?.remainingKm || oilData.remainingKm) <= 1000 ? 'text-red-600' :
                (analytics?.oilStatus?.remainingKm || oilData.remainingKm) <= 2000 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {fmt(analytics?.oilStatus?.remainingKm || oilData.remainingKm)} km
              </span>
            </div>
            {/* Progress bar */}
            <div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
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
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Circle className="w-5 h-5 text-purple-600" />
            </div>
            Shinalar holati
          </h3>
          {analytics?.tiresStatus ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-base">Jami</span>
                <span className="text-gray-900 font-bold text-xl">{analytics.tiresStatus.total} ta</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-base">Diqqat talab</span>
                <span className={`font-bold text-xl ${analytics.tiresStatus.needAttention > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {analytics.tiresStatus.needAttention} ta
                </span>
              </div>
            </div>
          ) : tires.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-base">Jami</span>
                <span className="text-gray-900 font-bold text-xl">{tires.length} ta</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-base">Eskirgan</span>
                <span className="text-red-600 font-bold text-xl">
                  {tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length} ta
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-base">Shina qo'shilmagan</p>
          )}
        </div>
      </div>

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
  const bgColors = {
    blue: 'bg-blue-50',
    amber: 'bg-amber-50',
    purple: 'bg-purple-50',
    emerald: 'bg-emerald-50',
    gray: 'bg-gray-50'
  }
  
  return (
    <div className={`p-4 ${bgColors[color]} rounded-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${barColors[color]} bg-opacity-20 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColors[color]}`} />
          </div>
          <span className="text-base font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg text-gray-900 font-bold">{fmt(amount)} so'm</span>
          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-lg">({percent}%)</span>
        </div>
      </div>
      <div className="h-3 bg-white rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColors[color]} rounded-full transition-all`}
          style={{ width: `${Math.max(percent, 2)}%` }}
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
