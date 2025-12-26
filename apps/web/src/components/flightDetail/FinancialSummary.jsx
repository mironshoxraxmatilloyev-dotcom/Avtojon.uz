import { formatMoney } from './constants'

export default function FinancialSummary({ flight }) {
  const isInternational = flight?.flightType === 'international'
  
  const totalIncome = flight.totalIncome || (flight.totalPayment + flight.totalGivenBudget)
  const netProfit = flight.netProfit || (totalIncome - (flight.totalExpenses || 0))
  const driverOwes = flight.driverOwes || flight.businessProfit || 0

  // USD qiymatlari (xalqaro reyslar uchun)
  const totalIncomeUSD = flight.totalIncomeUSD || 0
  const netProfitUSD = flight.netProfitUSD || 0
  const driverOwesUSD = flight.driverOwesUSD || 0
  const totalExpensesUSD = flight.totalExpensesUSD || 0
  const driverProfitAmountUSD = flight.driverProfitAmountUSD || 0

  // USD formatlash
  const formatUSD = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-lg">📊</span> 
        Moliyaviy xulosa
        {isInternational && <span className="text-amber-400 text-sm">(USD)</span>}
      </h3>
      
      {isInternational && flight.exchangeRateAtClose && (
        <p className="text-slate-400 text-xs mb-3">
          💱 Kurs: 1 USD = {formatMoney(flight.exchangeRateAtClose)} so'm
        </p>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryBox 
          label="Jami kirim" 
          value={isInternational ? formatUSD(totalIncomeUSD) : formatMoney(totalIncome)} 
          subValue={isInternational ? `≈ ${formatMoney(totalIncome)}` : null}
          color="emerald" 
        />
        <SummaryBox 
          label="Xarajatlar" 
          value={isInternational ? `-${formatUSD(totalExpensesUSD)}` : `-${formatMoney(flight.totalExpenses || 0)}`} 
          subValue={isInternational ? `≈ ${formatMoney(flight.totalExpenses || 0)}` : null}
          color="red" 
        />
        <SummaryBox 
          label={`Shofyor ulushi (${flight.driverProfitPercent || 0}%)`} 
          value={isInternational ? formatUSD(driverProfitAmountUSD) : formatMoney(flight.driverProfitAmount || 0)} 
          subValue={isInternational ? `≈ ${formatMoney(flight.driverProfitAmount || 0)}` : null}
          color="purple" 
        />
        <SummaryBox 
          label="Shofyor berdi" 
          value={isInternational ? formatUSD(driverOwesUSD) : formatMoney(driverOwes)} 
          subValue={isInternational ? `≈ ${formatMoney(driverOwes)}` : null}
          color="emerald" 
          highlight 
        />
      </div>
    </div>
  )
}

function SummaryBox({ label, value, subValue, color, highlight }) {
  const colors = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    purple: 'text-purple-400'
  }

  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5'}`}>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
      <p className={`text-xs mt-1 ${highlight ? 'text-emerald-300' : 'text-slate-400'}`}>{label}</p>
    </div>
  )
}
