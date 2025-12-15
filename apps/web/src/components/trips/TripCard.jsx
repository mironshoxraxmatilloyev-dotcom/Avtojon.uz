import { Play, CheckCircle, XCircle, ArrowRight, Wallet } from 'lucide-react'

const statusConfig = {
  pending: { label: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-700', gradient: 'from-yellow-500 to-yellow-600', dot: 'bg-yellow-500' },
  in_progress: { label: "Yo'lda", color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600', dot: 'bg-blue-500' },
  completed: { label: 'Tugatilgan', color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600', dot: 'bg-green-500' },
  cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600', dot: 'bg-red-500' }
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString('uz-UZ') : '-'
const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

export default function TripCard({ 
  trip, 
  onNavigate, 
  onStart, 
  onComplete, 
  onCancel,
  actionLoading 
}) {
  return (
    <div 
      onClick={() => onNavigate(trip._id)}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${statusConfig[trip.status]?.gradient} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-lg">
              {trip.driver?.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-semibold">{trip.driver?.fullName || 'Nomalum'}</p>
              <p className="text-white/80 text-sm">{trip.vehicle?.plateNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trip.tripType === 'international' && (
              <span className="px-2 py-1 bg-emerald-500/30 backdrop-blur rounded-full text-xs font-medium flex items-center gap-1">
                🌍 Xalqaro
              </span>
            )}
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
              {statusConfig[trip.status]?.label}
            </span>
          </div>
        </div>
        {/* Xalqaro reys - davlatlar */}
        {trip.tripType === 'international' && trip.countriesInRoute?.length > 0 && (
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/20">
            {trip.countriesInRoute.map((code, idx) => (
              <span key={code} className="flex items-center gap-1">
                <span className="text-lg">
                  {code?.toUpperCase() === 'UZB' ? '🇺🇿' : code?.toUpperCase() === 'KZ' ? '🇰🇿' : code?.toUpperCase() === 'RU' ? '🇷🇺' : '🏳️'}
                </span>
                {idx < trip.countriesInRoute.length - 1 && (
                  <ArrowRight size={14} className="text-white/60" />
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div className="w-0.5 h-8 bg-gray-200"></div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{trip.startAddress || 'Boshlanish'}</p>
            <p className="text-gray-400 text-sm my-1">↓</p>
            <p className="font-medium text-gray-900">{trip.endAddress || 'Tugash'}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Masofa</p>
            <p className="font-semibold text-gray-900">{trip.estimatedDistance || '-'} km</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Vaqt</p>
            <p className="font-semibold text-gray-900">{trip.estimatedDuration || '-'}</p>
          </div>
        </div>

        {/* Financial - Yangi tizim */}
        {(trip.income?.amountInUSD > 0 || trip.profitUSD !== undefined) && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl">
            <Wallet size={18} className="text-blue-600" />
            <div className="flex-1 flex items-center gap-3 text-sm">
              {trip.income?.amountInUSD > 0 && (
                <span className="text-blue-700">
                  <span className="text-gray-500">Daromad:</span> ${trip.income.amountInUSD}
                </span>
              )}
              {trip.profitUSD !== undefined && trip.profitUSD !== 0 && (
                <span className={trip.profitUSD >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                  <span className="text-gray-500">Foyda:</span> ${trip.profitUSD?.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Eski tizim uchun */}
        {!trip.income?.amountInUSD && (trip.tripBudget > 0 || trip.tripPayment > 0) && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-xl">
            <Wallet size={18} className="text-blue-600" />
            <div className="flex-1 flex items-center gap-3 text-sm">
              {trip.tripBudget > 0 && (
                <span className="text-blue-700">
                  <span className="text-gray-500">Berilgan:</span> {formatMoney(trip.tripBudget)}
                </span>
              )}
              {trip.tripPayment > 0 && (
                <span className="text-purple-700">
                  <span className="text-gray-500">Haqi:</span> {formatMoney(trip.tripPayment)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bonus/Penalty */}
        {(trip.bonusAmount > 0 || trip.penaltyAmount > 0) && (
          <div className="flex gap-2 mb-4">
            {trip.bonusAmount > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                +{formatMoney(trip.bonusAmount)} bonus
              </span>
            )}
            {trip.penaltyAmount > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                -{formatMoney(trip.penaltyAmount)} jarima
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-400">{formatDate(trip.createdAt)}</p>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {trip.status === 'pending' && (
              <button 
                onClick={(e) => onStart(e, trip._id)} 
                disabled={actionLoading === trip._id}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                title="Boshlash"
              >
                <Play size={18} />
              </button>
            )}
            {trip.status === 'in_progress' && (
              <button 
                onClick={(e) => onComplete(e, trip)} 
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Tugatish"
              >
                <CheckCircle size={18} />
              </button>
            )}
            {(trip.status === 'pending' || trip.status === 'in_progress') && (
              <button 
                onClick={(e) => onCancel(e, trip._id)} 
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Bekor qilish"
              >
                <XCircle size={18} />
              </button>
            )}
            <div className="p-2 text-gray-400 group-hover:text-blue-600 transition">
              <ArrowRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { statusConfig, formatDate, formatMoney }
