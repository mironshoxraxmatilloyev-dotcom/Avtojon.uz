import { Route, Plus, ArrowRight, MapPin, Banknote } from 'lucide-react'
import { formatMoney } from './constants'

export default function LegsList({ 
  flight, 
  isActive, 
  onAddLeg, 
  onAddPayment 
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Route className="text-white w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Yo'nalishlar</h3>
            <p className="text-xs text-slate-500">{flight.legs?.length || 0} ta buyurtma</p>
          </div>
        </div>
        {isActive && (
          <button
            onClick={onAddLeg}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2.5} /> Bosqich
          </button>
        )}
      </div>

      {/* Legs Timeline */}
      <div className="space-y-3">
        {flight.legs?.map((leg, idx) => (
          <LegItem 
            key={leg._id || idx} 
            leg={leg} 
            index={idx} 
            isLast={idx === flight.legs.length - 1}
            isActive={isActive}
            onAddPayment={onAddPayment}
          />
        ))}

        {(!flight.legs || flight.legs.length === 0) && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Hali yo'nalishlar yo'q</p>
            <p className="text-slate-400 text-sm mt-1">Yangi bosqich qo'shish uchun tugmani bosing</p>
          </div>
        )}
      </div>
    </div>
  )
}

function LegItem({ leg, index, isLast, isActive, onAddPayment }) {
  const hasPayment = leg.payment > 0
  
  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-14 w-0.5 h-6 bg-gradient-to-b from-emerald-300 to-slate-200" />
      )}
      
      <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          {/* Index badge */}
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-lg shadow-emerald-500/20">
            {index + 1}
          </div>

          {/* Route info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm">
                {leg.fromCity?.split(',')[0]}
              </span>
              <ArrowRight size={14} className="text-emerald-500 flex-shrink-0" />
              <span className="font-semibold text-slate-900 text-sm">
                {leg.toCity?.split(',')[0]}
              </span>
            </div>
            
            {/* Yo'l puli */}
            {leg.givenBudget > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                Yo'l xarajati: <span className="text-amber-600 font-medium">{formatMoney(leg.givenBudget)}</span>
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="text-right flex-shrink-0">
            {hasPayment ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                <p className="font-bold text-emerald-600 text-sm">+{formatMoney(leg.payment)}</p>
                <p className="text-[10px] text-emerald-500">to'lov</p>
              </div>
            ) : isActive ? (
              <button
                onClick={() => onAddPayment(leg)}
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center gap-1.5"
              >
                <Banknote size={14} /> To'lov olish
              </button>
            ) : (
              <span className="text-slate-300 text-xs bg-slate-100 px-3 py-1.5 rounded-lg">to'lov yo'q</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
