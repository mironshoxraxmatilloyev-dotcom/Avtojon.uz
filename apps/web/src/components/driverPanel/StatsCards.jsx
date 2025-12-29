import { CheckCircle, Banknote, Wallet } from 'lucide-react'
import { formatMoney } from './constants'
import { useTranslation } from '../../store/langStore'

export default function StatsCards({ stats, currentBalance }) {
  const { t } = useTranslation()

  return (
    <>
      {/* Joriy balans - haydovchidagi pul */}
      {currentBalance > 0 && (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 shadow-lg shadow-amber-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-2xl truncate">{formatMoney(currentBalance)}</p>
              <p className="text-amber-100 text-sm font-medium">{t('currentBalance')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tugatilgan marshrutlar */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-3xl">{stats.totalCompletedTrips}</p>
            <p className="text-emerald-100 text-sm font-medium">{t('completedTrips')}</p>
          </div>
        </div>
      </div>

      {/* Daromad */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-2xl truncate">
              +{formatMoney(stats.totalBonusAmount)}
            </p>
            <p className="text-blue-100 text-sm font-medium">{t('totalEarnings')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
