import { Route, CheckCircle } from 'lucide-react'
import { formatMoney } from './constants'

export default function ActiveTripCard({ trip, onComplete, actionLoading }) {
  const remaining = trip.remainingBudget || trip.tripBudget
  const isNegative = (remaining || 0) < 0

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Route size={20} className="sm:w-[22px] sm:h-[22px] text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-base">Faol marshrut</h3>
              <p className="text-white/80 text-xs sm:text-sm">Yo'ldasiz</p>
            </div>
          </div>
          <span className="px-2 sm:px-3 py-1 bg-emerald-500 rounded-full text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> FAOL
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex flex-col items-center py-1">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full" />
              <div className="w-0.5 h-8 sm:h-10 bg-gradient-to-b from-emerald-500 to-amber-500 my-1" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-amber-500 rounded-full" />
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div>
                <p className="text-slate-500 text-[10px] sm:text-xs font-medium">BOSHLANISH</p>
                <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate">{trip.startAddress || 'Belgilanmagan'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] sm:text-xs font-medium">TUGASH</p>
                <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate">{trip.endAddress || 'Belgilanmagan'}</p>
              </div>
            </div>
          </div>
        </div>

        {trip.tripBudget > 0 && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="bg-slate-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
              <p className="text-slate-500 text-[10px] sm:text-xs">Berilgan</p>
              <p className="text-slate-800 font-bold text-xs sm:text-sm truncate">{formatMoney(trip.tripBudget)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
              <p className="text-amber-600 text-[10px] sm:text-xs">Sarflangan</p>
              <p className="text-amber-700 font-bold text-xs sm:text-sm truncate">{formatMoney(trip.totalExpenses || 0)}</p>
            </div>
            <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 text-center ${isNegative ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <p className={`text-[10px] sm:text-xs ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>Qoldiq</p>
              <p className={`font-bold text-xs sm:text-sm truncate ${isNegative ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(remaining)}</p>
            </div>
          </div>
        )}

        <button
          onClick={onComplete}
          disabled={actionLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-colors active:scale-[0.98]"
        >
          {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={18} className="sm:w-5 sm:h-5" />}
          {actionLoading ? 'Kutilmoqda...' : 'Tugatish'}
        </button>
      </div>
    </div>
  )
}
