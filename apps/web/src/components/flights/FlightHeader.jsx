import { ArrowLeft, Route, TrendingUp, Wallet, DollarSign, TrendingDown, CheckCircle, Clock } from 'lucide-react'

export default function FlightHeader({ flight, onBack, formatMoney }) {
  const isActive = flight.status === 'active'

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 text-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl lg:rounded-3xl">
      <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-emerald-500/20 rounded-full blur-3xl -mr-24 sm:-mr-32 md:-mr-48 -mt-24 sm:-mt-32 md:-mt-48"></div>
      <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-teal-500/20 rounded-full blur-3xl -ml-16 sm:-ml-24 md:-ml-32 -mb-16 sm:-mb-24 md:-mb-32"></div>
      
      <div className="relative">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 text-emerald-300 hover:text-white mb-3 sm:mb-4 transition text-sm sm:text-base"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          <span>Orqaga</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl shadow-lg flex-shrink-0 ${
              isActive ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {flight.driver?.fullName?.charAt(0) || '?'}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">{flight.name || 'Yangi marshrut'}</h1>
              <p className="text-emerald-200 text-xs sm:text-sm truncate">{flight.driver?.fullName} • {flight.vehicle?.plateNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Haydovchi tasdiqlash holati */}
            {isActive && (
              <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 ${
                flight.driverConfirmed 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {flight.driverConfirmed ? (
                  <>
                    <CheckCircle size={14} />
                    Tasdiqlangan
                  </>
                ) : (
                  <>
                    <Clock size={14} />
                    Kutilmoqda
                  </>
                )}
              </span>
            )}
            <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm ${
              isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {isActive ? 'Faol marshrut' : 'Yopilgan'}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
          <StatCard 
            icon={Route} 
            value={flight.legs?.length || 0} 
            label="buyurtmalar" 
            color="from-blue-400 to-blue-600" 
          />
          <StatCard 
            icon={TrendingUp} 
            value={formatMoney(flight.totalPayment)} 
            label="Mijozdan" 
            color="from-green-400 to-green-600" 
          />
          <StatCard 
            icon={Wallet} 
            value={formatMoney(flight.totalGivenBudget)} 
            label="Yo'l uchun" 
            color="from-orange-400 to-orange-600" 
            textColor="text-orange-300"
          />
          <StatCard 
            icon={DollarSign} 
            value={formatMoney(Math.abs(flight.finalBalance || 0))} 
            label={(flight.finalBalance || 0) >= 0 ? 'Qoldiq' : 'Kamomad'} 
            color={(flight.finalBalance || 0) >= 0 ? 'from-cyan-400 to-cyan-600' : 'from-red-400 to-red-600'} 
            textColor={(flight.finalBalance || 0) >= 0 ? 'text-cyan-300' : 'text-red-300'}
          />
          <StatCard 
            icon={TrendingDown} 
            value={`-${formatMoney(flight.totalExpenses || 0)}`} 
            label="Sarflangan" 
            color="from-red-400 to-red-600" 
            textColor="text-red-300"
            className="col-span-2 sm:col-span-1"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color, textColor = '', className = '' }) {
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
        </div>
        <div className="min-w-0">
          <p className={`text-sm sm:text-lg md:text-xl font-bold truncate ${textColor}`}>{value}</p>
          <p className="text-emerald-200 text-[10px] sm:text-xs">{label}</p>
        </div>
      </div>
    </div>
  )
}
