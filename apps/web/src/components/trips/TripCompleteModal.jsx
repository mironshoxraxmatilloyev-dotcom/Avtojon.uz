import { createPortal } from 'react-dom'
import { X, CheckCircle, Wallet } from 'lucide-react'

const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

export default function TripCompleteModal({
  trip,
  submitting,
  onSubmit,
  onClose
}) {
  if (!trip) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <div 
          className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-md border border-white/10 shadow-2xl my-8" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-t-3xl"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Reysni tugatish</h2>
                  <p className="text-emerald-300 text-sm">Moliyaviy hisobot</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5">
            {/* Driver Info */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {trip.driver?.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{trip.driver?.fullName}</p>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                    {trip.startAddress} → {trip.endAddress}
                  </p>
                </div>
              </div>
            </div>

            {trip.tripBudget > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <span className="text-blue-300 flex items-center gap-2">
                    <Wallet size={18} /> Berilgan pul
                  </span>
                  <span className="font-bold text-blue-400 text-lg">{formatMoney(trip.tripBudget)} som</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <span className="text-amber-300">Sarflangan</span>
                  <span className="font-bold text-amber-400 text-lg">{formatMoney(trip.totalExpenses || 0)} som</span>
                </div>
                <div className={`flex justify-between items-center p-4 rounded-xl border ${
                  (trip.remainingBudget || trip.tripBudget) >= 0 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  <span className={`${
                    (trip.remainingBudget || trip.tripBudget) >= 0 ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    Qoldiq
                  </span>
                  <span className={`font-bold text-lg ${
                    (trip.remainingBudget || trip.tripBudget) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatMoney(trip.remainingBudget || trip.tripBudget)} som
                  </span>
                </div>
                <div className="text-center py-3">
                  <p className="text-sm text-slate-400">
                    {(trip.remainingBudget || trip.tripBudget) > 0 
                      ? '✅ Ortib qolgan pul bonus sifatida qoshiladi' 
                      : (trip.remainingBudget || trip.tripBudget) < 0 
                        ? '⚠️ Ortiqcha sarflangan pul jarima sifatida yoziladi'
                        : ''}
                  </p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                  Tugatilmoqda...
                </>
              ) : (
                <>
                  <CheckCircle size={20} /> Reysni tugatish
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
