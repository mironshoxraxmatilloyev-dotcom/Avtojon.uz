import { memo, useState, useEffect } from 'react'
import {
  Fuel, Droplets, Circle, Wrench, TrendingUp, TrendingDown,
  DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Bell, PieChart
} from 'lucide-react'
import { fmt } from './constants'
import api from '../../../services/api'

export const SummaryTab = memo(({ vehicle }) => {
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
      {/* Period Selector - to'liq qatorda */}
      <div className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Umumiy ko'rinish</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: '7', label: '7 kun' },
            { value: '30', label: '30 kun' },
            { value: '90', label: '3 oy' },
            { value: '365', label: '1 yil' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`py-3 rounded-xl text-sm font-semibold transition-all ${period === p.value
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🔔 Smart Alerts - kattaroq */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Diqqat! ({alerts.length} ta ogohlantirish)
          </h3>
          <div className="space-y-3">
            {alerts.slice(0, 4).map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-xl bg-white/80 ${alert.severity === 'danger' ? 'border-l-4 border-red-500' :
                    alert.severity === 'warning' ? 'border-l-4 border-amber-500' : 'border-l-4 border-blue-500'
                  }`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.severity === 'danger' ? 'text-red-500' :
                    alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                  }`} />
                <span className="text-base text-gray-700">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asosiy Moliyaviy Ko'rsatkichlar - Yangilangan dizayn */}
      <div className={`rounded-2xl overflow-hidden border shadow-sm ${summary.isProfitable
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
        }`}>
        {/* Yuqori qism - Sof foyda */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {summary.isProfitable ? (
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <TrendingDown className="w-7 h-7 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Sof foyda/zarar ({period} kun)</p>
              <p className={`text-3xl sm:text-4xl font-bold ${summary.isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                {summary.isProfitable ? '+' : ''}{fmt(summary.netProfit || 0)} so'm
              </p>
            </div>
          </div>
        </div>

        {/* Pastki qism - Daromad va Xarajat */}
        <div className="bg-white/60 backdrop-blur-sm border-t border-gray-200/50">
          <div className="grid grid-cols-2 divide-x divide-gray-200/50">
            {/* Daromad */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-gray-500 text-sm">Daromad</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 pl-10">{fmt(summary.totalIncome || 0)} so'm</p>
            </div>
            {/* Xarajat */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-gray-500 text-sm">Xarajat</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-red-600 pl-10">{fmt(summary.totalExpenses || 0)} so'm</p>
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
