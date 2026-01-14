import { formatMoney } from './constants'
import { Wallet, CheckCircle, Clock, AlertCircle, ArrowRight, Building2 } from 'lucide-react'

export default function FinancialSummary({ flight, onCollectPayment }) {
  const isInternational = flight?.flightType === 'international'
  const isCompleted = flight?.status === 'completed'
  
  // Avvalgi marshrutdan qolgan pul
  const previousBalance = flight.previousBalance || 0
  
  // Jami kirim (avvalgi qoldiq bilan)
  const totalIncome = flight.totalIncome || (previousBalance + flight.totalPayment + flight.totalGivenBudget)
  const driverOwes = flight.driverOwes || flight.businessProfit || 0

  // Peritsena ma'lumotlari
  const totalPeritsenaPayment = flight.totalPeritsenaPayment || 0
  const totalPeritsenaFee = flight.totalPeritsenaFee || 0
  const totalCashPayment = flight.totalCashPayment || 0

  // To'lov holati
  const driverPaidAmount = flight.driverPaidAmount || 0
  const driverRemainingDebt = flight.driverRemainingDebt ?? (driverOwes - driverPaidAmount)
  const paymentStatus = flight.driverPaymentStatus || 'pending'

  // USD qiymatlari (xalqaro reyslar uchun)
  const totalIncomeUSD = flight.totalIncomeUSD || 0
  const driverOwesUSD = flight.driverOwesUSD || 0
  const totalExpensesUSD = flight.totalExpensesUSD || 0
  const driverProfitAmountUSD = flight.driverProfitAmountUSD || 0

  // USD formatlash
  const formatUSD = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // To'lov status badge
  const getPaymentStatusBadge = () => {
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
          <CheckCircle size={12} />
          To'langan
        </span>
      )
    }
    if (paymentStatus === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">
          <Clock size={12} />
          Qisman
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
        <AlertCircle size={12} />
        Kutilmoqda
      </span>
    )
  }

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
           
          Moliyaviy xulosa
          {isInternational && <span className="text-amber-400 text-sm">(USD)</span>}
        </h3>
        {isCompleted && driverOwes > 0 && getPaymentStatusBadge()}
      </div>
      
      {isInternational && flight.exchangeRateAtClose && (
        <p className="text-slate-400 text-xs mb-3">
          💱 Kurs: 1 USD = {formatMoney(flight.exchangeRateAtClose)} so'm
        </p>
      )}

      {/* Peritsena ma'lumotlari - agar bor bo'lsa */}
      {totalPeritsenaPayment > 0 && (
        <div className="bg-purple-500/10 rounded-lg p-3 mb-3 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-purple-400" />
            <span className="text-purple-300 text-sm font-semibold">Peritsena to'lovlari</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Jami peritsena</p>
              <p className="text-purple-400 font-bold">
                {isInternational ? `$${formatUSD(flight.totalPeritsenaPaymentUSD || 0)}` : formatMoney(totalPeritsenaPayment)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Firma xarajati</p>
              <p className="text-red-400 font-bold">
                -{isInternational ? `$${formatUSD(flight.totalPeritsenaFeeUSD || 0)}` : formatMoney(totalPeritsenaFee)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Sof summa</p>
              <p className="text-emerald-400 font-bold">
                {isInternational 
                  ? `$${formatUSD((flight.totalPeritsenaPaymentUSD || 0) - (flight.totalPeritsenaFeeUSD || 0))}`
                  : formatMoney(totalPeritsenaPayment - totalPeritsenaFee)
                }
              </p>
            </div>
          </div>
          <p className="text-xs text-amber-400/70 mt-2">
            ⚠️ Peritsena puli haydovchi qo'lida deb hisoblanmaydi, firma xarajatlari ayiriladi
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Mijozdan to'lov */}
        <SummaryBox 
          label="Mijozdan to'lov" 
          value={isInternational ? formatUSD(flight.totalPaymentUSD || 0) : formatMoney(flight.totalPayment || 0)} 
          subValue={isInternational ? `≈ ${formatMoney(flight.totalPayment || 0)}` : null}
          color="blue" 
        />
        {/* Yo'l uchun */}
        <SummaryBox 
          label="Yo'l uchun berilgan" 
          value={formatMoney(flight.totalGivenBudget || 0)} 
          color="cyan" 
        />
        {/* Avvalgi qoldiq - faqat bor bo'lsa ko'rsatish */}
        {previousBalance > 0 && (
          <SummaryBox 
            label="Avvalgi qoldiq" 
            value={formatMoney(previousBalance)} 
            color="amber" 
          />
        )}
        <SummaryBox 
          label={previousBalance > 0 ? "Jami kirim (qoldiq bilan)" : "Jami kirim"} 
          value={isInternational ? formatUSD(totalIncomeUSD) : formatMoney(totalIncome)} 
          subValue={isInternational ? `≈ ${formatMoney(totalIncome)}` : null}
          color="emerald" 
        />
        <SummaryBox 
          label="Xarajatlar (yengil)" 
          value={isInternational ? `-${formatUSD(flight.lightExpensesUSD || 0)}` : `-${formatMoney(flight.lightExpenses || 0)}`} 
          subValue={isInternational ? `≈ ${formatMoney(flight.lightExpenses || 0)}` : null}
          color="red" 
        />
        {/* Katta xarajatlar - alohida ko'rsatish */}
        {(flight.heavyExpenses > 0 || flight.heavyExpensesUSD > 0) && (
          <SummaryBox 
            label="Katta xarajatlar (biznesmen)" 
            value={isInternational ? `-${formatUSD(flight.heavyExpensesUSD || 0)}` : `-${formatMoney(flight.heavyExpenses || 0)}`} 
            subValue={isInternational ? `≈ ${formatMoney(flight.heavyExpenses || 0)}` : null}
            color="orange" 
            tooltip="Ta'mir, shina, sug'urta - biznesmen hisobidan"
          />
        )}
        <SummaryBox 
          label="Sof foyda" 
          value={isInternational ? `+${formatUSD(flight.netProfitUSD || 0)}` : `+${formatMoney(flight.netProfit || 0)}`} 
          subValue={isInternational ? `≈ ${formatMoney(flight.netProfit || 0)}` : null}
          color="emerald" 
          highlight={true}
        />
        <SummaryBox 
          label={`Haydovchi ulushi (${flight.driverProfitPercent || 0}%)`} 
          value={isInternational ? formatUSD(driverProfitAmountUSD) : formatMoney(flight.driverProfitAmount || 0)} 
          subValue={isInternational ? `≈ ${formatMoney(flight.driverProfitAmount || 0)}` : null}
          color="purple" 
        />
        <SummaryBox 
          label={paymentStatus === 'paid' ? 'Haydovchi berdi' : paymentStatus === 'partial' ? 'Qolgan qarz' : 'Haydovchi beradi'} 
          value={isInternational ? formatUSD(driverOwesUSD) : formatMoney(paymentStatus === 'partial' ? driverRemainingDebt : driverOwes)} 
          subValue={isInternational ? `≈ ${formatMoney(driverOwes)}` : null}
          color="emerald" 
          highlight={paymentStatus !== 'paid'}
        />
      </div>

      {/* To'lov qismi - faqat yopilgan reyslar uchun */}
      {isCompleted && driverOwes > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          {/* To'lov progressi */}
          {driverPaidAmount > 0 && paymentStatus !== 'paid' && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">To'langan: {formatMoney(driverPaidAmount)}</span>
                <span className="text-amber-400">Qoldi: {formatMoney(driverRemainingDebt)}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${Math.min((driverPaidAmount / driverOwes) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* To'lov tarixi */}
          {flight.driverPayments?.length > 0 && (
            <div className="mb-3">
              <p className="text-slate-400 text-xs mb-2">To'lov tarixi:</p>
              <div className="flex flex-wrap gap-2">
                {flight.driverPayments.slice(-3).map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">
                    <CheckCircle size={10} />
                    {formatMoney(p.amount)}
                    <span className="text-slate-500">({new Date(p.date).toLocaleDateString('uz-UZ')})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pul olish tugmasi */}
          {paymentStatus !== 'paid' && onCollectPayment && (
            <button
              onClick={onCollectPayment}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              <Wallet size={18} />
              Haydovchidan pul olish
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryBox({ label, value, subValue, color, highlight, tooltip }) {
  const colors = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400'
  }

  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5'}`} title={tooltip}>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
      <p className={`text-xs mt-1 ${highlight ? 'text-emerald-300' : 'text-slate-400'}`}>{label}</p>
      {tooltip && <p className="text-xs text-slate-500 mt-1">ℹ️</p>}
    </div>
  )
}
