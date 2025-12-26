import { Route, CheckCircle } from 'lucide-react'
import { formatMoney } from './constants'

export default function ActiveTripCard({ trip, onComplete, actionLoading }) {
  const remaining = trip.remainingBudget || trip.tripBudget
  const isNegative = (remaining || 0) < 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Route size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">Faol reys</h3>
              <p className="text-white/80 text-sm">Yo'ldasiz</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500 rounded-full text-white text-xs font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> FAOL
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center py-1">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <div className="w-0.5 h-10 bg-gradient-to-b from-emerald-500 to-amber-500 my-1" />
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-slate-500 text-xs font-medium">BOSHLANISH</p>
                <p className="text-slate-800 font-semibold text-sm">{trip.startAddress || 'Belgilanmagan'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium">TUGASH</p>
                <p className="text-slate-800 font-semibold text-sm">{trip.endAddress || 'Belgilanmagan'}</p>
              </div>
            </div>
          </div>
        </div>

        {trip.tripBudget > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-slate-500 text-xs">Berilgan</p>
              <p className="text-slate-800 font-bold text-sm">{formatMoney(trip.tripBudget)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-amber-600 text-xs">Sarflangan</p>
              <p className="text-amber-700 font-bold text-sm">{formatMoney(trip.totalExpenses || 0)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${isNegative ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <p className={`text-xs ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>Qoldiq</p>
              <p className={`font-bold text-sm ${isNegative ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(remaining)}</p>
            </div>
          </div>
        )}

        <button
          onClick={onComplete}
          disabled={actionLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={20} />}
          {actionLoading ? 'Kutilmoqda...' : 'Tugatish'}
        </button>
      </div>
    </div>
  )
}
