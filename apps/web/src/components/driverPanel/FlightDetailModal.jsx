import { X, Route, Package, Wallet, MapPin, Clock, CheckCircle } from 'lucide-react'
import { formatMoney, formatDate, EXPENSE_LABELS } from './constants'

export default function FlightDetailModal({ flight, onClose }) {
  if (!flight) return null

  const totalIncome = (flight.totalPayment || 0) + (flight.roadMoney || flight.totalGivenBudget || 0)
  const totalExpenses = flight.totalExpenses || 0
  const netProfit = flight.netProfit || flight.profit || (totalIncome - totalExpenses)
  const driverOwes = flight.driverOwes || flight.businessProfit || 0

  const statusColors = {
    completed: 'bg-emerald-500',
    active: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-start justify-center pt-4 sm:pt-8" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-2xl max-h-[85vh] overflow-hidden shadow-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 ${statusColors[flight.status] || 'bg-slate-500'}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Route className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{flight.name || 'Reys'}</h3>
                <p className="text-white/70 text-sm">{formatDate(flight.createdAt)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
          {/* Asosiy ma'lumotlar */}
          <div className="grid grid-cols-2 gap-3">
            <StatBox icon={MapPin} label="Masofa" value={`${flight.totalDistance || 0} km`} />
            <StatBox icon={Package} label="Buyurtmalar" value={`${flight.legs?.length || 0} ta`} />
            <StatBox
              icon={Wallet}
              label="Mijozdan olingan"
              value={formatMoney(flight.totalPayment)}
              color="emerald"
              hint="Buyurtmalar uchun to'lov"
            />
            <StatBox
              icon={Wallet}
              label="Yo'l xarajati"
              value={formatMoney(flight.roadMoney || flight.totalGivenBudget || 0)}
              color="blue"
              hint="Yo'lda sarflash uchun"
            />
          </div>

          {/* Buyurtmalar */}
          {flight.legs?.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-slate-700 font-semibold mb-3">📦 Buyurtmalar</h4>
              <div className="space-y-2">
                {flight.legs.map((leg, idx) => (
                  <div key={leg._id || idx} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      leg.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {leg.status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium truncate">{leg.fromCity} → {leg.toCity}</p>
                      <p className="text-slate-400 text-sm">{leg.distance || 0} km</p>
                    </div>
                    <span className="text-emerald-600 font-semibold">{formatMoney(leg.payment)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Xarajatlar */}
          {flight.expenses?.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <h4 className="text-slate-700 font-semibold mb-3">💸 Xarajatlar ({flight.expenses.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {flight.expenses.map((exp, idx) => {
                  const info = EXPENSE_LABELS[exp.type] || EXPENSE_LABELS.other
                  return (
                    <div key={exp._id || idx} className="flex items-center justify-between p-3 bg-white rounded-xl">
                      <span className="text-slate-700 flex items-center gap-2">
                        <span className="text-lg">{info.icon}</span>
                        <span className="font-medium">{info.label}</span>
                      </span>
                      <span className="text-red-500 font-bold">-{formatMoney(exp.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Hisob-kitob */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
            <h4 className="text-indigo-800 font-semibold mb-3">📊 Hisob-kitob</h4>

            <div className="space-y-2">
              <SummaryRow label="Jami kirim" value={`${formatMoney(totalIncome)} so'm`} />
              <SummaryRow label="Jami xarajat" value={`-${formatMoney(totalExpenses)} so'm`} valueClass="text-red-500" />
              <div className="border-t border-indigo-200 pt-2 mt-2">
                <SummaryRow
                  label="Sof foyda"
                  value={`${formatMoney(netProfit)} so'm`}
                  valueClass={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  bold
                />
              </div>

              {(flight.driverProfitPercent > 0 || flight.driverProfitAmount > 0) && (
                <SummaryRow
                  label={`🎁 Sizning ulushingiz (${flight.driverProfitPercent || 0}%)`}
                  value={`+${formatMoney(flight.driverProfitAmount || 0)} so'm`}
                  valueClass="text-amber-600"
                  bold
                />
              )}
            </div>

            {/* Biznesmenga berish kerak */}
            {driverOwes > 0 && (
              <div className="mt-4 p-4 bg-purple-100 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-purple-800 font-medium">💰 Biznesmenga berish kerak:</span>
                  <span className="text-purple-800 font-bold text-xl">{formatMoney(driverOwes)} so'm</span>
                </div>
                {flight.status === 'completed' && (
                  <div className="mt-2 flex items-center gap-1.5">
                    {flight.driverPaymentStatus === 'paid' ? (
                      <span className="text-emerald-600 text-sm flex items-center gap-1">
                        <CheckCircle size={14} /> To'langan
                      </span>
                    ) : (
                      <span className="text-amber-600 text-sm flex items-center gap-1">
                        <Clock size={14} /> Kutilmoqda
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sizga qaytariladi */}
            {driverOwes < 0 && (
              <div className="mt-4 p-4 bg-emerald-100 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-medium">💵 Sizga qaytariladi:</span>
                  <span className="text-emerald-800 font-bold text-xl">{formatMoney(Math.abs(driverOwes))} so'm</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color = 'slate', hint }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700'
  }
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="opacity-60" />
        <span className="text-sm opacity-80">{label}</span>
      </div>
      <p className="font-bold text-lg">{value}</p>
      {hint && <p className="text-xs opacity-50 mt-0.5">{hint}</p>}
    </div>
  )
}

function SummaryRow({ label, value, valueClass = 'text-slate-700', bold = false }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-slate-600">{label}</span>
      <span className={`${valueClass} ${bold ? 'font-bold text-lg' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
