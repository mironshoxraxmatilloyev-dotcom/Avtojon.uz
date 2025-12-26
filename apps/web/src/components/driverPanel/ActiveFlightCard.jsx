import { Route, Wallet, Package, Receipt } from 'lucide-react'
import { formatMoney, EXPENSE_LABELS } from './constants'

export default function ActiveFlightCard({ flight, onConfirm, actionLoading }) {
  const balance = flight.finalBalance || 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
              <Route size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">{flight.name || 'Faol reys'}</h3>
              <p className="text-white/80 text-sm">{flight.flightType === 'international' ? '🌍 Xalqaro' : '🇺🇿 Mahalliy'}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500 rounded-full text-white text-xs font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> FAOL
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Road Money */}
        {(flight.roadMoney > 0 || flight.totalGivenBudget > 0) && (
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <p className="text-blue-600 text-xs font-medium">YO'L UCHUN BERILGAN PUL</p>
                <p className="text-slate-800 font-bold text-lg">{formatMoney(flight.roadMoney || flight.totalGivenBudget)} so'm</p>
              </div>
            </div>
          </div>
        )}

        {/* Legs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-700 text-sm font-semibold flex items-center gap-2">
              <Package size={16} className="text-blue-500" /> BUYURTMALAR
            </p>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold">{flight.legs?.length || 0} ta</span>
          </div>
          <div className="space-y-2">
            {flight.legs?.map((leg, idx) => (
              <div key={leg._id || idx} className={`flex items-center gap-3 p-3 rounded-xl ${
                leg.status === 'in_progress' ? 'bg-amber-50 border-2 border-amber-400' : 
                leg.status === 'completed' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  leg.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  leg.status === 'in_progress' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600'
                }`}>
                  {leg.status === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate">{leg.fromCity} → {leg.toCity}</p>
                  <p className="text-slate-500 text-xs">{formatMoney(leg.payment || 0)} so'm</p>
                </div>
                {leg.status === 'in_progress' && <span className="px-2 py-0.5 bg-amber-500 rounded text-white text-xs font-bold">Yo'lda</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Balance - Qoldiq */}
        <div className={`rounded-xl p-4 ${balance >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Qoldiq:</span>
            <span className={`font-bold text-xl ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatMoney(Math.abs(balance))} so'm
            </span>
          </div>
        </div>

        {/* Expenses - Xarajatlar */}
        {flight.expenses?.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-700 text-sm font-semibold flex items-center gap-2">
                <Receipt size={16} className="text-amber-500" /> XARAJATLAR
              </p>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-lg text-xs font-bold">{flight.expenses.length} ta</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {flight.expenses.map((exp, idx) => {
                const info = EXPENSE_LABELS[exp.type] || EXPENSE_LABELS.other
                return (
                  <div key={exp._id || idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <div>
                        <span className="text-slate-700 text-sm font-medium">{info.label}</span>
                        {exp.description && <p className="text-slate-400 text-xs">{exp.description}</p>}
                      </div>
                    </div>
                    <span className="text-red-500 font-bold">-{formatMoney(exp.amount)}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
              <span className="text-slate-600 font-medium">Jami xarajat:</span>
              <span className="text-red-600 font-bold">{formatMoney(flight.totalExpenses || 0)} so'm</span>
            </div>
          </div>
        )}

        {/* Reys holati */}
        <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 rounded-xl border border-blue-200">
          <Route size={18} className="text-blue-600" />
          <span className="text-blue-600 font-medium">Reys faol</span>
        </div>
      </div>
    </div>
  )
}
