import { Route, CheckCircle, Wallet, Fuel } from 'lucide-react'
import { formatMoney, EXPENSE_LABELS } from './constants'

export default function ActiveFlightCard({ 
  flight, 
  onConfirm, 
  onCompleteLeg,
  actionLoading 
}) {
  const currentLeg = flight.legs?.find(leg => leg.status === 'in_progress')

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-emerald-900/40">
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/20 rounded-full -ml-16 -mb-16 blur-xl"></div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-xl sm:rounded-2xl blur-md"></div>
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/20">
                <Route size={22} className="sm:w-7 sm:h-7 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg sm:text-xl">{flight.name || 'Faol reys'}</h3>
              <p className="text-emerald-100 text-sm flex items-center gap-1.5">
                {flight.flightType === 'international' ? '🌍 Xalqaro reys' : '🇺🇿 Mahalliy reys'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></span>
            <span className="text-white text-xs sm:text-sm font-bold tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Yol puli */}
        {(flight.roadMoney > 0 || flight.totalGivenBudget > 0) && (
          <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center">
                  <Wallet size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-200 text-xs font-medium">Yol puli</p>
                  <p className="text-white font-bold text-lg">{formatMoney(flight.roadMoney || flight.totalGivenBudget)} som</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-xs font-semibold">Berilgan</span>
            </div>
          </div>
        )}

        {/* Buyurtmalar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 border border-white/20">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-500/30 rounded-lg flex items-center justify-center">
                <Route size={16} className="text-violet-400" />
              </div>
              <p className="text-white font-semibold text-sm">Buyurtmalar</p>
            </div>
            <span className="px-3 py-1.5 bg-gradient-to-r from-violet-500/30 to-indigo-500/30 rounded-full text-white text-xs font-bold border border-violet-500/30">
              {flight.legs?.length || 0} ta
            </span>
          </div>
          <div className="space-y-2.5">
            {flight.legs?.map((leg, idx) => (
              <LegItem key={leg._id || idx} leg={leg} index={idx} />
            ))}
          </div>
        </div>

        {/* Statistika */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <StatBox label="Masofa" value={flight.totalDistance || 0} unit="km" />
          <StatBox label="Tolov" value={formatMoney(flight.totalPayment)} unit="som" />
          <StatBox label="Xarajat" value={formatMoney(flight.totalExpenses)} unit="som" amber />
        </div>

        {/* Xarajatlar */}
        {flight.expenses && flight.expenses.length > 0 && (
          <ExpensesList expenses={flight.expenses} totalExpenses={flight.totalExpenses} />
        )}

        {/* Qoldiq */}
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/20 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 text-sm">Qoldiq (yol xarajati):</span>
            <span className={`font-bold text-lg ${(flight.finalBalance || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {formatMoney(Math.abs(flight.finalBalance || 0))} som
              {(flight.finalBalance || 0) < 0 && ' (kamomad)'}
            </span>
          </div>
        </div>

        {/* Tasdiqlash tugmasi */}
        {!flight.driverConfirmed ? (
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="w-full bg-white text-emerald-600 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50 text-sm sm:text-base hover:bg-emerald-50 transition-colors"
          >
            {actionLoading ? (
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle size={20} />
            )}
            {actionLoading ? 'Kutilmoqda...' : 'Reysni tasdiqlash'}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-white/10 rounded-xl border border-white/20">
            <CheckCircle size={18} className="text-emerald-300" />
            <span className="text-emerald-200 text-sm font-medium">Tasdiqlangan</span>
          </div>
        )}
      </div>
    </div>
  )
}

function LegItem({ leg, index }) {
  const statusStyles = {
    in_progress: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 shadow-lg shadow-amber-500/10',
    completed: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20',
    default: 'bg-white/5 border border-white/10'
  }
  const badgeStyles = {
    completed: 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white',
    in_progress: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white animate-pulse',
    default: 'bg-white/20 text-white/60'
  }

  return (
    <div className={`relative flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all ${statusStyles[leg.status] || statusStyles.default}`}>
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg flex-shrink-0 ${badgeStyles[leg.status] || badgeStyles.default}`}>
        {leg.status === 'completed' ? '✓' : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm sm:text-base font-semibold truncate">{leg.fromCity} → {leg.toCity}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-emerald-300 text-xs sm:text-sm font-medium">{leg.distance || 0} km</span>
          <span className="text-white/30">•</span>
          <span className="text-emerald-400 text-xs sm:text-sm font-bold">{formatMoney(leg.payment)} som</span>
        </div>
      </div>
      {leg.status === 'in_progress' && (
        <span className="px-2.5 py-1.5 bg-amber-500/30 rounded-lg text-amber-200 text-[10px] sm:text-xs font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
          Yolda
        </span>
      )}
      {leg.status === 'completed' && (
        <span className="px-2.5 py-1.5 bg-emerald-500/30 rounded-lg text-emerald-300 text-[10px] sm:text-xs font-semibold">✓ Bajarildi</span>
      )}
    </div>
  )
}

function StatBox({ label, value, unit, amber }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-white/20">
      <p className="text-emerald-100 text-[10px] sm:text-xs font-medium mb-1">{label}</p>
      <p className={`font-bold text-base sm:text-lg ${amber ? 'text-amber-300' : 'text-white'}`}>{value}</p>
      <p className="text-emerald-200 text-[10px] sm:text-xs">{unit}</p>
    </div>
  )
}

function ExpensesList({ expenses, totalExpenses }) {
  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-amber-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500/30 rounded-lg flex items-center justify-center">
            <Fuel size={16} className="text-amber-400" />
          </div>
          <p className="text-white font-semibold text-sm">Xarajatlar</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-500/20 rounded-full text-amber-300 text-xs font-bold">{expenses.length} ta</span>
          <span className="px-3 py-1.5 bg-red-500/20 rounded-full text-red-300 text-xs font-bold">-{formatMoney(totalExpenses)} som</span>
        </div>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {expenses.slice(-5).reverse().map((exp, idx) => {
          const expInfo = EXPENSE_LABELS[exp.type] || EXPENSE_LABELS.other
          const isFuel = exp.type?.startsWith('fuel_')
          return (
            <div key={exp._id || idx} className={`flex items-center justify-between p-3 bg-gradient-to-r ${expInfo.color} rounded-xl border border-white/10`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{expInfo.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{expInfo.label}</p>
                  {isFuel && exp.quantity && <p className="text-emerald-300 text-[10px]">{exp.quantity} {exp.quantityUnit || 'L'}</p>}
                </div>
              </div>
              <p className="text-amber-300 font-bold text-sm">-{formatMoney(exp.amount)}</p>
            </div>
          )
        })}
      </div>
      {expenses.length > 5 && (
        <p className="text-center text-amber-200 text-xs mt-3 py-2 bg-white/5 rounded-lg">+{expenses.length - 5} ta boshqa xarajat</p>
      )}
    </div>
  )
}
