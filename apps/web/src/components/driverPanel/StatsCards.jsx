import { CheckCircle, Wallet } from 'lucide-react'
import { formatMoney } from './constants'

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Tugatilgan reyslar */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-emerald-600 font-bold text-2xl">{stats.totalCompletedTrips}</p>
        <p className="text-slate-500 text-sm">Tugatilgan</p>
      </div>

      {/* Daromad */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>
        <p className="text-blue-600 font-bold text-2xl">+{formatMoney(stats.totalBonusAmount)}</p>
        <p className="text-slate-500 text-sm">Daromad</p>
      </div>
    </div>
  )
}
