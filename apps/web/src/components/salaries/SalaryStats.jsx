import { Wallet, CheckCircle2, Clock, Award, AlertCircle } from 'lucide-react'

export function SalaryStats({ salaries }) {
  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  
  const totalNet = salaries.reduce((sum, s) => sum + (s.netSalary || 0), 0)
  const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + (s.netSalary || 0), 0)
  const totalPending = salaries.filter(s => s.status !== 'paid').reduce((sum, s) => sum + (s.netSalary || 0), 0)
  const totalBonus = salaries.reduce((sum, s) => sum + (s.totalBonus || 0), 0)
  const totalPenalty = salaries.reduce((sum, s) => sum + (s.totalPenalty || 0), 0)

  const stats = [
    { icon: Wallet, label: 'Jami maoshlar', value: formatMoney(totalNet), subtitle: 'som', gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', colSpan: 'col-span-2 lg:col-span-1' },
    { icon: CheckCircle2, label: 'Tolangan', value: formatMoney(totalPaid), subtitle: 'Yakunlangan', gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/30', subtitleColor: 'text-emerald-500' },
    { icon: Clock, label: 'Kutilmoqda', value: formatMoney(totalPending), subtitle: 'Jarayonda', gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30', subtitleColor: 'text-amber-500' },
    { icon: Award, label: 'Jami bonus', value: `+${formatMoney(totalBonus)}`, subtitle: 'som', gradient: 'from-green-500 to-teal-600', shadow: 'shadow-green-500/30', valueColor: 'text-green-600' },
    { icon: AlertCircle, label: 'Jami jarima', value: `-${formatMoney(totalPenalty)}`, subtitle: 'som', gradient: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30', valueColor: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className={`bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all ${stat.colSpan || ''}`}>
          <div className={`w-11 h-11 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${stat.shadow}`}>
            <stat.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase mb-1">{stat.label}</p>
          <p className={`text-2xl font-bold ${stat.valueColor || 'text-gray-900'}`}>{stat.value}</p>
          <p className={`text-xs mt-1 ${stat.subtitleColor || 'text-gray-400'}`}>{stat.subtitle}</p>
        </div>
      ))}
    </div>
  )
}
