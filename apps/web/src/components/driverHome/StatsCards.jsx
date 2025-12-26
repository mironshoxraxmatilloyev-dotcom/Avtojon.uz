import { CheckCircle, Award } from 'lucide-react'
import { formatMoney } from './constants'

export default function StatsCards({ totalCompletedTrips, totalBonusAmount }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <StatCard 
        icon={CheckCircle}
        value={totalCompletedTrips}
        label="Tugatilgan reyslar"
        gradient="from-violet-500 to-indigo-600"
        shadowColor="violet"
      />
      <StatCard 
        icon={Award}
        value={`+${formatMoney(totalBonusAmount)}`}
        label="Oylik"
        gradient="from-emerald-500 to-teal-600"
        shadowColor="emerald"
        valueColor="text-emerald-400"
      />
    </div>
  )
}

function StatCard({ icon: Icon, value, label, gradient, shadowColor, valueColor = 'text-white' }) {
  return (
    <div className="relative overflow-hidden bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 group">
      <div className={`absolute top-0 right-0 w-20 h-20 bg-${shadowColor}-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="relative">
        <div className={`w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br ${gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-xl shadow-${shadowColor}-500/30 group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        <p className={`text-4xl sm:text-5xl font-bold ${valueColor} mb-1`}>{value}</p>
        <p className="text-slate-400 text-xs sm:text-sm font-medium">{label}</p>
      </div>
    </div>
  )
}
