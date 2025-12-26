import { Globe, Truck, MapPin, Fuel, DollarSign, TrendingUp } from 'lucide-react'
import { COUNTRIES, formatMoney } from './constants'

export default function InternationalSection({
  flight,
  isActive,
  onEditPlaton
}) {
  if (flight.flightType !== 'international') return null

  const hasPlaton = flight.countriesInRoute?.includes('RU')
  const hasCountryExpenses = flight.countryExpenses && Object.keys(flight.countryExpenses).length > 0
  const hasBorderExpenses = flight.borderCrossingsTotalUSD > 0 || flight.borderCrossingsTotalUZS > 0

  if (!hasPlaton && !hasCountryExpenses && !hasBorderExpenses) return null

  // Chegara xarajatlarini hisoblash
  const borderExpensesUSD = flight.borderCrossingsTotalUSD || 0
  const borderExpensesUZS = flight.borderCrossingsTotalUZS || (borderExpensesUSD * 12800)
  
  // Platon xarajatlarini hisoblash
  const platonUSD = flight.platon?.amountInUSD || 0
  const platonUZS = flight.platon?.amountInUZS || (platonUSD * 12800)

  // Jami xalqaro xarajatlar
  const totalInternationalUSD = borderExpensesUSD + platonUSD
  const totalInternationalUZS = borderExpensesUZS + platonUZS

  return (
    <div className="space-y-3">
      {/* Xalqaro xarajatlar umumiy */}
      {(totalInternationalUSD > 0 || totalInternationalUZS > 0) && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Globe className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Xalqaro xarajatlar</h3>
                <p className="text-xs text-white/70">Chegara + Platon</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-xl">${totalInternationalUSD.toFixed(2)}</p>
              <p className="text-white/70 text-xs">≈ {formatMoney(totalInternationalUZS)} so'm</p>
            </div>
          </div>
          
          {/* Tafsilotlar */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {borderExpensesUSD > 0 && (
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-white/70 text-[10px]">Chegara</p>
                <p className="text-white font-bold text-sm">${borderExpensesUSD.toFixed(2)}</p>
              </div>
            )}
            {platonUSD > 0 && (
              <div className="bg-white/10 rounded-lg p-2 text-center">
                <p className="text-white/70 text-[10px]">Platon</p>
                <p className="text-white font-bold text-sm">${platonUSD.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platon */}
      {hasPlaton && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-500 rounded-lg flex items-center justify-center text-lg">🚛</div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Platon</h3>
                <p className="text-xs text-slate-400">Rossiya yo'l to'lovi</p>
              </div>
            </div>
            {isActive && (
              <button 
                onClick={onEditPlaton} 
                className="px-3 py-2 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 active:scale-[0.98] transition-all"
              >
                {flight.platon?.amount ? 'Tahrirlash' : 'Qo\'shish'}
              </button>
            )}
          </div>

          {flight.platon?.amount > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-rose-50 p-3 rounded-lg text-center border border-rose-200">
                <p className="text-[10px] text-rose-500 font-medium">Summa</p>
                <p className="text-lg font-bold text-rose-600">{flight.platon.amount}</p>
                <p className="text-[10px] text-rose-400">{flight.platon.currency === 'RUB' ? '₽ Rubl' : '$ Dollar'}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-lg text-center border border-rose-200">
                <p className="text-[10px] text-rose-500 font-medium">USD da</p>
                <p className="text-lg font-bold text-rose-600">${(flight.platon.amountInUSD || 0).toFixed(2)}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-lg text-center border border-rose-200">
                <p className="text-[10px] text-rose-500 font-medium">Masofa</p>
                <p className="text-lg font-bold text-rose-600">{flight.platon.distanceKm || 0}</p>
                <p className="text-[10px] text-rose-400">km</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Truck size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Platon kiritilmagan</p>
            </div>
          )}
        </div>
      )}

      {/* Davlatlar bo'yicha */}
      {hasCountryExpenses && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-cyan-500 rounded-lg flex items-center justify-center">
              <Globe className="text-white w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Davlatlar bo'yicha</h3>
              <p className="text-xs text-slate-400">Har bir davlatdagi xarajatlar ($ da)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {['uzb', 'kz', 'ru'].map(code => {
              const country = COUNTRIES[code.toUpperCase()]
              const data = flight.countryExpenses[code] || {}
              const hasData = data.distanceKm > 0 || data.fuelLiters > 0 || data.totalUSD > 0

              return (
                <div 
                  key={code} 
                  className={`rounded-lg p-3 ${hasData ? 'bg-slate-50 border border-slate-200' : 'bg-slate-50/50 border border-slate-100'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{country?.flag}</span>
                    <span className="font-semibold text-slate-800 text-sm">{country?.name}</span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1"><MapPin size={10} /> Masofa</span>
                      <span className="font-medium text-slate-600">{data.distanceKm || 0} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1"><Fuel size={10} /> Yoqilg'i</span>
                      <span className="font-medium text-slate-600">{data.fuelLiters || 0} L</span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                      <span className="text-cyan-600 font-medium flex items-center gap-1"><DollarSign size={10} /> Jami</span>
                      <span className="font-bold text-cyan-600">${(data.totalUSD || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
