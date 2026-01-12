import { Plus, MapPin, ChevronRight, CheckCircle } from 'lucide-react'

export default function LegsList({ legs, isActive, onAddLeg, formatMoney }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <MapPin className="text-emerald-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">buyurtmalar</h3>
        </div>
        {isActive && (
          <button 
            onClick={onAddLeg}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-200 transition"
          >
            <Plus size={14} /> Qo'shish
          </button>
        )}
      </div>

      {legs?.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {legs.map((leg, index) => (
            <LegItem key={leg._id || index} leg={leg} index={index} formatMoney={formatMoney} />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-400">
          <MapPin size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">buyurtmalar yo'q</p>
        </div>
      )}
    </div>
  )
}

function LegItem({ leg, index, formatMoney }) {
  const isCompleted = leg.status === 'completed'
  
  return (
    <div className={`p-3 sm:p-4 rounded-xl border ${
      isCompleted 
        ? 'bg-gray-50 border-gray-200' 
        : 'bg-emerald-50 border-emerald-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            isCompleted 
              ? 'bg-gray-200 text-gray-600' 
              : 'bg-emerald-500 text-white'
          }`}>
            {isCompleted ? <CheckCircle size={14} /> : index + 1}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm sm:text-base font-medium text-gray-900">
              <span className="truncate">{leg.fromCity}</span>
              <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{leg.toCity}</span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-500">
              {leg.distance > 0 && <span>📏 {leg.distance} km</span>}
              {leg.payment > 0 && <span>{formatMoney(leg.payment)}</span>}
              {leg.givenBudget > 0 && <span>{formatMoney(leg.givenBudget)}</span>}
            </div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium flex-shrink-0 ${
          isCompleted 
            ? 'bg-gray-200 text-gray-600' 
            : 'bg-emerald-200 text-emerald-700'
        }`}>
          {isCompleted ? 'Tugadi' : 'Faol'}
        </span>
      </div>

      {/* Balance info */}
      {(leg.totalBudget > 0 || leg.spentAmount > 0) && (
        <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
          <div>
            <span className="text-gray-400">Budget:</span>
            <span className="ml-1 font-medium">{formatMoney(leg.totalBudget)}</span>
          </div>
          <div>
            <span className="text-gray-400">Sarflangan:</span>
            <span className="ml-1 font-medium text-red-600">-{formatMoney(leg.spentAmount)}</span>
          </div>
          <div>
            <span className="text-gray-400">Qoldiq:</span>
            <span className={`ml-1 font-medium ${leg.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMoney(leg.balance)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
