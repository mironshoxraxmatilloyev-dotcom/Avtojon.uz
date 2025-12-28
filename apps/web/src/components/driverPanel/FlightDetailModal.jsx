import { X, Route, Package, Wallet, MapPin, Clock, CheckCircle } from 'lucide-react'
import { formatMoney, formatDate, EXPENSE_LABELS } from './constants'

// Reys nomini legs dan olish
const getFlightRoute = (flight) => {
  if (!flight?.legs?.length) return 'Reys'
  const firstLeg = flight.legs[0]
  const lastLeg = flight.legs[flight.legs.length - 1]
  const from = firstLeg?.fromCity || ''
  const to = lastLeg?.toCity || ''
  if (from && to) return `${from} → ${to}`
  return 'Reys'
}

export default function FlightDetailModal({ flight, onClose }) {
  if (!flight) return null

  const totalIncome = (flight.totalPayment || 0) + (flight.roadMoney || flight.totalGivenBudget || 0)
  const totalExpenses = flight.totalExpenses || 0
  const netProfit = flight.netProfit || flight.profit || (totalIncome - totalExpenses)
  const driverOwes = flight.driverOwes || flight.businessProfit || 0
  const routeName = getFlightRoute(flight)

  const statusColors = {
    completed: 'bg-emerald-500',
    active: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 ${statusColors[flight.status] || 'bg-slate-500'} flex-shrink-0`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Route className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-base truncate">{routeName}</h3>
                <p className="text-white/70 text-xs">{formatDate(flight.createdAt)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Asosiy ma'lumotlar */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox icon={MapPin} label="Masofa" value={`${flight.totalDistance || 0} km`} />
            <StatBox icon={Package} label="Buyurtmalar" value={`${flight.legs?.length || 0} ta`} />
            <StatBox icon={Wallet} label="Mijozdan olingan" value={formatMoney(flight.totalPayment)} color="emerald" hint="Buyurtmalar uchun to'lov" />
            <StatBox icon={Wallet} label="Yo'l xarajati" value={formatMoney(flight.roadMoney || flight.totalGivenBudget || 0)} color="blue" hint="Yo'lda sarflash uchun" />
          </div>

          {/* Buyurtmalar */}
          {flight.legs?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <h4 className="text-slate-700 font-semibold text-sm mb-2">📦 Buyurtmalar</h4>
              <div className="space-y-1.5">
                {flight.legs.map((leg, idx) => (
                  <div key={leg._id || idx} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${leg.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {leg.status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium text-sm truncate">{leg.fromCity || '?'} → {leg.toCity || '?'}</p>
                      <p className="text-slate-400 text-xs">{leg.distance || 0} km</p>
                    </div>
                    <span className="text-emerald-600 font-semibold text-sm">{formatMoney(leg.payment)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Xarajatlar */}
          {flight.expenses?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <h4 className="text-slate-700 font-semibold text-sm mb-2">💸 Xarajatlar ({flight.expenses.length})</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {flight.expenses.map((exp, idx) => {
                  const info = EXPENSE_LABELS[exp.type] || EXPENSE_LABELS.other
                  return (
                    <div key={exp._id || idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-slate-700 flex items-center gap-1.5 text-sm">
                        <span>{info.icon}</span>
                        <span className="font-medium">{info.label}</span>
                      </span>
                      <span className="text-red-500 font-bold text-sm">-{formatMoney(exp.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Hisob-kitob */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
            <h4 className="text-indigo-800 font-semibold text-sm mb-2">📊 Hisob-kitob</h4>
            <div className="space-y-1.5 text-sm">
              <SummaryRow label="Jami kirim" value={`${formatMoney(totalIncome)} so'm`} />
              <SummaryRow label="Jami xarajat" value={`-${formatMoney(totalExpenses)} so'm`} valueClass="text-red-500" />
              <div className="border-t border-indigo-200 pt-1.5 mt-1.5">
                <SummaryRow label="Sof foyda" value={`${formatMoney(netProfit)} so'm`} valueClass={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} bold />
              </div>
              {(flight.driverProfitPercent > 0 || flight.driverProfitAmount > 0) && (
                <SummaryRow label={`🎁 Ulushingiz (${flight.driverProfitPercent || 0}%)`} value={`+${formatMoney(flight.driverProfitAmount || 0)} so'm`} valueClass="text-amber-600" bold />
              )}
            </div>

            {driverOwes > 0 && (
              <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-purple-800 font-medium text-sm">💰 Berish kerak:</span>
                  <span className="text-purple-800 font-bold">{formatMoney(driverOwes)} so'm</span>
                </div>
                {flight.status === 'completed' && (
                  <div className="mt-1.5 flex items-center gap-1">
                    {flight.driverPaymentStatus === 'paid' ? (
                      <span className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle size={12} /> To'langan</span>
                    ) : (
                      <span className="text-amber-600 text-xs flex items-center gap-1"><Clock size={12} /> Kutilmoqda</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {driverOwes < 0 && (
              <div className="mt-3 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-medium text-sm">💵 Sizga qaytariladi:</span>
                  <span className="text-emerald-800 font-bold">{formatMoney(Math.abs(driverOwes))} so'm</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color = 'slate', hint }) {
  const colors = { slate: 'bg-slate-50 text-slate-700', emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700' }
  return (
    <div className={`rounded-lg p-2.5 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={12} className="opacity-60" />
        <span className="text-xs opacity-80">{label}</span>
      </div>
      <p className="font-bold">{value}</p>
      {hint && <p className="text-[10px] opacity-50">{hint}</p>}
    </div>
  )
}

function SummaryRow({ label, value, valueClass = 'text-slate-700', bold = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-600">{label}</span>
      <span className={`${valueClass} ${bold ? 'font-bold' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
