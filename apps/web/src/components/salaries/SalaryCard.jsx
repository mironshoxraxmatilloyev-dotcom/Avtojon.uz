import { 
  Check, CreditCard, TrendingUp, TrendingDown, Wallet, Calendar, 
  ArrowRight, Clock, Banknote, FileText, Eye, CheckCircle2, Trash2, Calculator 
} from 'lucide-react'

const statusConfig = {
  pending: { label: 'Kutilmoqda', color: 'bg-slate-100 text-slate-700', gradient: 'from-slate-500 to-slate-600', icon: Clock },
  calculated: { label: 'Hisoblangan', color: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-indigo-600', icon: Calculator },
  approved: { label: 'Tasdiqlangan', color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-600', icon: CheckCircle2 },
  paid: { label: "Tolangan", color: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-green-600', icon: Check }
}

export { statusConfig }

export function SalaryCard({ salary, onApprove, onPay, onDelete, onView }) {
  const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
  
  const StatusIcon = statusConfig[salary.status]?.icon || Clock

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-2xl transition-all overflow-hidden">
      {/* Header */}
      <div className={`relative bg-gradient-to-r ${statusConfig[salary.status]?.gradient} p-5 text-white`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-xl border border-white/30">
              {salary.driver?.fullName?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-bold text-lg">{salary.driver?.fullName || 'Noma\'lum'}</p>
              <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
                <Calendar size={14} />
                <span>{formatDate(salary.periodStart)} - {formatDate(salary.periodEnd)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
            <StatusIcon size={14} />
            <span className="text-sm font-medium">{statusConfig[salary.status]?.label}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatBox icon={Banknote} label="Bazaviy oylik" value={formatMoney(salary.baseSalary)} bgColor="bg-gray-50" borderColor="border-gray-100" iconBg="bg-gray-200" iconColor="text-gray-600" />
          <StatBox icon={FileText} label={`Foydadan ulush (${salary.tripsCount || 0} reys)`} value={formatMoney(salary.tripsPayment)} bgColor="bg-purple-50" borderColor="border-purple-100" iconBg="bg-purple-200" iconColor="text-purple-600" valueColor="text-purple-700" />
          <StatBox icon={TrendingUp} label="Bonus" value={`+${formatMoney(salary.totalBonus)}`} bgColor="bg-emerald-50" borderColor="border-emerald-100" iconBg="bg-emerald-200" iconColor="text-emerald-600" valueColor="text-emerald-600" />
          <StatBox icon={TrendingDown} label="Jarima" value={`-${formatMoney(salary.totalPenalty)}`} bgColor="bg-red-50" borderColor="border-red-100" iconBg="bg-red-200" iconColor="text-red-600" valueColor="text-red-600" />
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm mb-1">Jami maosh</p>
              <p className="text-3xl font-bold text-white">{formatMoney(salary.netSalary)} <span className="text-lg text-blue-200">som</span></p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {salary.status === 'calculated' && (
            <button onClick={() => onApprove(salary._id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold">
              <Check size={18} /> Tasdiqlash
            </button>
          )}
          {salary.status === 'approved' && (
            <button onClick={() => onPay(salary._id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold">
              <CreditCard size={18} /> Tolandi
            </button>
          )}
          <button onClick={() => onView(salary)} className="px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center gap-2">
            <Eye size={18} /> Batafsil <ArrowRight size={16} />
          </button>
          {salary.status !== 'paid' && (
            <button onClick={() => onDelete(salary._id)} className="px-4 py-3.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 flex items-center gap-2" title="Bekor qilish">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, bgColor, borderColor, iconBg, iconColor, valueColor = 'text-gray-900' }) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={14} className={iconColor} />
        </div>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
      <p className={`font-bold ${valueColor} text-lg`}>{value}</p>
    </div>
  )
}

export function EmptySalaries({ onOpenModal, hasFilters }) {
  return (
    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Calculator size={40} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {hasFilters ? 'Natija topilmadi' : 'Maoshlar hali hisoblanmagan'}
      </h3>
      <p className="text-gray-500 mb-8">Shofyorlar maoshini hisoblash uchun tugmani bosing</p>
      {!hasFilters && (
        <button onClick={onOpenModal} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold inline-flex items-center gap-2">
          <Calculator size={20} /> Maosh hisoblash
        </button>
      )}
    </div>
  )
}
