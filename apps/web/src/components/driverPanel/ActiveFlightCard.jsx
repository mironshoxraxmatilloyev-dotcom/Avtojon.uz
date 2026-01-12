import { Route, Wallet, Package, Receipt, Globe, Flag, Fuel, Utensils, Wrench, Car } from 'lucide-react'
import { formatMoney, EXPENSE_LABELS } from './constants'
import api from '../../services/api'
import { useState, useEffect } from 'react'

// Icon mapping for expense types
const EXPENSE_ICONS = {
  fuel: { Icon: Fuel, color: 'text-amber-500' },
  food: { Icon: Utensils, color: 'text-green-500' },
  repair: { Icon: Wrench, color: 'text-red-500' },
  toll: { Icon: Car, color: 'text-blue-500' },
  parking: { Icon: Car, color: 'text-purple-500' },
  wash: { Icon: Wallet, color: 'text-cyan-500' },
  other: { Icon: Package, color: 'text-gray-500' },
}

export default function ActiveFlightCard({ flight: initialFlight, onFlightUpdate }) {
  const [flight, setFlight] = useState(initialFlight)

  // Flight prop o'zgarganda yangilash
  useEffect(() => {
    if (initialFlight?._id !== flight?._id || initialFlight?.updatedAt !== flight?.updatedAt) {
      setFlight(initialFlight)
    }
  }, [initialFlight])
  
  // Agar flight yo'q bo'lsa
  if (!flight) return null
  
  const balance = flight.finalBalance || 0

  // Xarajatni tasdiqlash - OPTIMISTIC UPDATE
  const handleConfirmExpense = async (expenseId) => {
    // 🚀 Darhol UI ni yangilash (optimistic)
    const updatedFlight = {
      ...flight,
      expenses: flight.expenses.map(e =>
        e._id === expenseId ? { ...e, confirmedByDriver: true, confirmedAt: new Date().toISOString() } : e
      )
    }
    setFlight(updatedFlight)
    if (onFlightUpdate) onFlightUpdate(updatedFlight)

    // Background da serverga yuborish
    try {
      const res = await api.put(`/driver/me/flights/${flight._id}/expenses/${expenseId}/confirm`)
      if (res.data.success && res.data.data) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(res.data.data))
        setFlight(newFlight)
        if (onFlightUpdate) onFlightUpdate(newFlight)
      }
    } catch (err) {
      // Xatolik bo'lsa, qaytarish
      console.error('Xarajatni tasdiqlashda xatolik:', err)
      setFlight(flight) // Eski holatga qaytarish
    }
  }

  // Tasdiqlanmagan xarajatlar soni
  const unconfirmedCount = flight?.expenses?.filter(e => !e.confirmedByDriver).length || 0

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Route size={20} className="sm:w-[22px] sm:h-[22px] text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm sm:text-base truncate">{flight.name || 'Faol marshrut'}</h3>
              <p className="text-white/80 text-xs sm:text-sm flex items-center gap-1">
                {flight.flightType === 'international' ? <Globe size={12} /> : <Flag size={12} />}
                {flight.flightType === 'international' ? 'Xalqaro' : 'Mahalliy'}
              </p>
            </div>
          </div>
          <span className="px-2 sm:px-3 py-1 bg-emerald-500 rounded-full text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> FAOL
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Road Money */}
        {(flight.roadMoney > 0 || flight.totalGivenBudget > 0) && (
          <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet size={18} className="sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-blue-600 text-[10px] sm:text-xs font-medium">YO'L UCHUN BERILGAN PUL</p>
                <p className="text-slate-800 font-bold text-base sm:text-lg truncate">{formatMoney(flight.roadMoney || flight.totalGivenBudget)} so'm</p>
              </div>
            </div>
          </div>
        )}

        {/* Legs */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
              <Package size={14} className="sm:w-4 sm:h-4 text-blue-500" /> BUYURTMALAR
            </p>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg text-[10px] sm:text-xs font-bold">{flight.legs?.length || 0} ta</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {flight.legs?.map((leg, idx) => (
              <div key={leg._id || idx} className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${
                leg.status === 'in_progress' ? 'bg-amber-50 border-2 border-amber-400' : 
                leg.status === 'completed' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'
              }`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                  leg.status === 'completed' ? 'bg-emerald-500 text-white' : 
                  leg.status === 'in_progress' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600'
                }`}>
                  {leg.status === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 text-xs sm:text-sm font-medium truncate">{leg.fromCity} → {leg.toCity}</p>
                  <p className="text-slate-500 text-[10px] sm:text-xs">{formatMoney(leg.payment || 0)} so'm</p>
                </div>
                {leg.status === 'in_progress' && <span className="px-1.5 sm:px-2 py-0.5 bg-amber-500 rounded text-white text-[10px] sm:text-xs font-bold flex-shrink-0">Yo'lda</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Balance - Qoldiq */}
        <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 ${balance >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium text-sm sm:text-base">Qoldiq:</span>
            <span className={`font-bold text-lg sm:text-xl ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatMoney(Math.abs(balance))} so'm
            </span>
          </div>
        </div>

        {/* Expenses - Xarajatlar */}
        {flight.expenses?.length > 0 && (
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
                <Receipt size={14} className="sm:w-4 sm:h-4 text-amber-500" /> XARAJATLAR
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {unconfirmedCount > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-amber-100 text-amber-600 rounded-lg text-[10px] sm:text-xs font-bold">
                    {unconfirmedCount} ta tasdiqlanmagan
                  </span>
                )}
                <span className="px-1.5 sm:px-2 py-0.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] sm:text-xs font-bold">{flight.expenses.length} ta</span>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
              {flight.expenses.map((exp, idx) => {
                const info = EXPENSE_LABELS[exp.type] || EXPENSE_LABELS.other
                const iconInfo = EXPENSE_ICONS[exp.type] || EXPENSE_ICONS.other
                const IconComponent = iconInfo.Icon
                const isConfirmed = exp.confirmedByDriver
                return (
                  <div 
                    key={exp._id || idx} 
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-colors ${isConfirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <IconComponent size={18} className={iconInfo.color} />
                      <div className="min-w-0">
                        <span className="text-slate-700 text-xs sm:text-sm font-medium block truncate">{info.label}</span>
                        {exp.description && <p className="text-slate-400 text-[10px] sm:text-xs truncate">{exp.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="text-red-500 font-bold text-xs sm:text-sm">-{formatMoney(exp.amount)}</span>
                      <button
                        type="button"
                        disabled={isConfirmed}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isConfirmed) handleConfirmExpense(exp._id)
                        }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          isConfirmed 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                        }`}
                      >
                        {isConfirmed && (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 flex justify-between">
              <span className="text-slate-600 font-medium text-xs sm:text-sm">Jami xarajat:</span>
              <span className="text-red-600 font-bold text-sm sm:text-base">{formatMoney(flight.totalExpenses || 0)} so'm</span>
            </div>
          </div>
        )}

        {/* Mashrut holati */}
        <div className="flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-blue-50 rounded-lg sm:rounded-xl border border-blue-200">
          <Route size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600" />
          <span className="text-blue-600 font-medium text-sm sm:text-base">Marshrut faol</span>
        </div>
      </div>
    </div>
  )
}
