import { ArrowLeft, Globe } from 'lucide-react'
import { formatMoney } from './constants'

export default function FlightHeader({ flight, navigate }) {
  const isActive = flight.status === 'active'
  const isInternational = flight?.flightType === 'international'
  
  // DEBUG - backenddan kelayotgan ma'lumotlarni ko'rish
  console.log('🔍 Flight data:', {
    driverProfitPercent: flight.driverProfitPercent,
    driverProfitAmount: flight.driverProfitAmount,
    businessProfit: flight.businessProfit,
    driverOwes: flight.driverOwes,
    totalPayment: flight.totalPayment,
    totalGivenBudget: flight.totalGivenBudget,
    totalExpenses: flight.totalExpenses
  })
  
  // USD formatlash
  const formatUSD = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  
  // Hisob-kitoblar
  const mijozPuli = flight.totalPayment || 0
  const yolPuli = flight.totalGivenBudget || 0
  const sarflangan = flight.totalExpenses || 0
  const qoldiq = yolPuli - sarflangan
  
  // Peritsena to'lovlar va firma xarajatlari
  const peritsenaPayment = flight.totalPeritsenaPayment || 0
  const peritsenaFee = flight.totalPeritsenaFee || 0
  const peritsenaFeeUSD = flight.totalPeritsenaFeeUSD || 0
  
  // Backend'dan kelayotgan qiymatlarni ishlatamiz
  // MUHIM: netProfit allaqachon Peritsena xarajatlari ayirilgan
  const netProfit = flight.netProfit || 0
  
  // Agar backend da Peritsena xarajatlari ayirilmagan bo'lsa, frontend da ayiramiz
  const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0)
  const totalExpenses = flight.totalExpenses || 0
  const calculatedNetProfit = totalIncome - totalExpenses - peritsenaFee
  
  // Sof foyda uchun to'g'ri qiymatni tanlash
  const actualNetProfit = calculatedNetProfit
  
  const businessProfit = flight.businessProfit || 0
  const driverProfitAmount = flight.driverProfitAmount || 0
  const driverOwes = flight.driverOwes || 0
  
  // DEBUG - Peritsena ma'lumotlarini ko'rish
  console.log('🔍 FlightHeader - Peritsena ma\'lumotlari:', {
    peritsenaPayment,
    peritsenaFee,
    totalIncome,
    totalExpenses,
    netProfit,
    calculatedNetProfit,
    actualNetProfit,
    businessProfit,
    'flight.status': flight.status,
    'flight.totalPayment': flight.totalPayment,
    'flight.totalPeritsenaPayment': flight.totalPeritsenaPayment,
    'flight.totalPeritsenaFee': flight.totalPeritsenaFee,
    'flight.netProfit': flight.netProfit,
    'flight.businessProfit': flight.businessProfit
  })
  
  // DEBUG
  console.log('🔍 Hisob-kitob:', {
    'flight.businessProfit': flight.businessProfit,
    'flight.driverProfitAmount': flight.driverProfitAmount,
    'flight.driverOwes': flight.driverOwes,
    netProfit,
    driverProfitAmount,
    businessProfit,
    driverOwes
  })

  // USD qiymatlari (xalqaro reyslar uchun)
  const sarflanganUSD = flight.totalExpensesUSD || 0
  const driverOwesUSD = flight.driverOwesUSD || 0
  const businessProfitUSD = flight.businessProfitUSD || (flight.netProfitUSD - (flight.driverProfitAmountUSD || 0)) || 0

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-4 sm:p-6 rounded-2xl">
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="relative">
        {/* Back button */}
        <button 
          onClick={() => navigate('/dashboard/drivers')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white mb-3 transition text-sm"
        >
          <ArrowLeft size={16} />
          <span>Orqaga</span>
        </button>

        {/* Header info */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0 ${
              isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {flight.driver?.fullName?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{flight.name || 'Yangi marshrut'}</h1>
                <span className={`px-2 py-0.5 rounded-full font-medium text-xs flex items-center gap-1 ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`}></span>
                  {isActive ? 'Faol' : 'Yopilgan'}
                </span>
                {isInternational && (
                  <span className="px-2 py-0.5 rounded-full font-medium text-xs flex items-center gap-1 bg-amber-500/20 text-amber-300">
                    <Globe size={12} />
                    Xalqaro
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm truncate">{flight.driver?.fullName} • {flight.vehicle?.plateNumber}</p>
            </div>
          </div>
        </div>

        {/* 6 ta muhim ko'rsatkich */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {/* 1. Mijozdan olingan pul */}
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-3 border border-emerald-500/30">
            <p className="text-emerald-400 text-lg sm:text-xl font-bold">+{formatMoney(mijozPuli)}</p>
            <p className="text-emerald-300/70 text-[10px] sm:text-xs">Mijozdan</p>
            {peritsenaPayment > 0 && (
              <p className="text-emerald-300/50 text-[9px]">Peritsena: {formatMoney(peritsenaPayment)}</p>
            )}
          </div>

          {/* 2. Yo'l uchun to'lov */}
          <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-3 border border-amber-500/30">
            <p className="text-amber-400 text-lg sm:text-xl font-bold">{formatMoney(yolPuli)}</p>
            <p className="text-amber-300/70 text-[10px] sm:text-xs">Yo'l puli</p>
          </div>

          {/* 3. Sarflangan */}
          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">
            {isInternational ? (
              <>
                <p className="text-red-400 text-lg sm:text-xl font-bold">-{formatUSD(sarflanganUSD)}</p>
                <p className="text-red-300/70 text-[10px] sm:text-xs">Sarflangan</p>
              </>
            ) : (
              <>
                <p className="text-red-400 text-lg sm:text-xl font-bold">-{formatMoney(sarflangan)}</p>
                <p className="text-red-300/70 text-[10px] sm:text-xs">Sarflangan</p>
              </>
            )}
          </div>

          {/* 4. Qoldiq (yo'l pulidan) */}
          <div className={`backdrop-blur-sm rounded-xl p-3 border ${qoldiq >= 0 ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
            <p className={`text-lg sm:text-xl font-bold ${qoldiq >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {qoldiq >= 0 ? '+' : ''}{formatMoney(qoldiq)}
            </p>
            <p className={`text-[10px] sm:text-xs ${qoldiq >= 0 ? 'text-cyan-300/70' : 'text-rose-300/70'}`}>Qoldiq</p>
          </div>

          {/* 5. Sof foyda (Peritsena xarajatlari ayirilgan) */}
          <div className={`backdrop-blur-sm rounded-xl p-3 border ${actualNetProfit >= 0 ? 'bg-blue-500/20 border-blue-500/30' : 'bg-rose-500/20 border-rose-500/30'}`}>
            {isInternational ? (
              <>
                <p className={`text-lg sm:text-xl font-bold ${flight.netProfitUSD >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {flight.netProfitUSD >= 0 ? '+' : ''}{formatUSD(flight.netProfitUSD || 0)}
                </p>
                <p className={`text-[10px] sm:text-xs ${flight.netProfitUSD >= 0 ? 'text-blue-300/70' : 'text-rose-300/70'}`}>
                  {flight.netProfitUSD >= 0 ? '📈 Sof foyda' : '📉 Zarar'}
                </p>
                {peritsenaFeeUSD > 0 && (
                  <p className="text-blue-300/50 text-[9px]">Firma: -{formatUSD(peritsenaFeeUSD)}</p>
                )}
              </>
            ) : (
              <>
                <p className={`text-lg sm:text-xl font-bold ${actualNetProfit >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {actualNetProfit >= 0 ? '+' : ''}{formatMoney(actualNetProfit)}
                </p>
                <p className={`text-[10px] sm:text-xs ${actualNetProfit >= 0 ? 'text-blue-300/70' : 'text-rose-300/70'}`}>
                  {actualNetProfit >= 0 ? '📈 Sof foyda' : '📉 Zarar'}
                </p>
                {peritsenaFee > 0 && (
                  <p className="text-blue-300/50 text-[9px]">Firma: -{formatMoney(peritsenaFee)}</p>
                )}
              </>
            )}
          </div>

          {/* 6. Haydovchi beradi */}
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 border border-purple-500/30">
            {isInternational ? (
              <>
                <p className="text-purple-400 text-lg sm:text-xl font-bold">{formatUSD(driverOwesUSD)}</p>
                <p className="text-purple-300/70 text-[10px] sm:text-xs">👤 Haydovchi beradi</p>
              </>
            ) : (
              <>
                <p className="text-purple-400 text-lg sm:text-xl font-bold">{formatMoney(driverOwes)}</p>
                <p className="text-purple-300/70 text-[10px] sm:text-xs">👤 Haydovchi beradi</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
