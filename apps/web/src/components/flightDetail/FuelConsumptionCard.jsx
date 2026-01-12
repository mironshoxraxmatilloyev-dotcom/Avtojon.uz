import { Fuel, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatMoney } from './constants'

export default function FuelConsumptionCard({ flight }) {
  const fuelExpenses = (flight.expenses || []).filter(e => e.type?.startsWith('fuel_'))
  const fuelWithOdometer = fuelExpenses
    .filter(e => e.odometer)
    .sort((a, b) => (a.odometer || 0) - (b.odometer || 0))

  // Agar yoqilg'i xarajatlari yo'q yoki spidometr kiritilmagan bo'lsa, ko'rsatmaymiz
  if (fuelWithOdometer.length === 0 || !flight.startOdometer || !flight.startFuel) {
    return null
  }

  // Yoqilg'i turi
  const fuelType = fuelExpenses[0]?.type
  const fuelUnit = (fuelType === 'fuel_metan' || fuelType === 'fuel_propan') ? 'kub' : 'litr'

  // Jami statistika
  const totalFuelAdded = fuelExpenses.reduce((sum, e) => sum + (e.quantity || 0), 0)
  const firstOdometer = flight.startOdometer
  const lastOdometer = fuelWithOdometer[fuelWithOdometer.length - 1]?.odometer || firstOdometer
  const totalDistance = lastOdometer - firstOdometer

  // Jami sarflangan yoqilg'i hisoblash
  // Har bir oraliqda oldingi to'ldirishdagi yoqilg'i sarflanadi
  let totalUsedFuel = flight.startFuel // Birinchi oraliq: boshlang'ich yoqilg'i
  
  // Keyingi oraliqlar: har bir to'ldirishdagi yoqilg'i (oxirgisidan tashqari)
  for (let i = 0; i < fuelWithOdometer.length - 1; i++) {
    totalUsedFuel += fuelWithOdometer[i].quantity || 0
  }

  // O'rtacha sarflanish
  const avgConsumption = totalUsedFuel > 0 && totalDistance > 0
    ? Math.round(totalDistance / totalUsedFuel * 10) / 10
    : 0

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
          <Fuel className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-emerald-800">Yoqilg'i sarflanishi</h3>
          <p className="text-sm text-emerald-600/70">Har bir to'ldirish orasidagi farq</p>
        </div>
      </div>

      {/* Umumiy statistika */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xl font-bold text-emerald-600">{totalDistance.toLocaleString()}</p>
          <p className="text-xs text-gray-500">km masofa</p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xl font-bold text-blue-600">{flight.startFuel + totalFuelAdded}</p>
          <p className="text-xs text-gray-500">{fuelUnit} jami</p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xl font-bold text-purple-600">{avgConsumption}</p>
          <p className="text-xs text-gray-500">km/{fuelUnit}</p>
        </div>
      </div>

      {/* Oraliq sarflanishlar */}
      <div className="space-y-2">
        <p className="text-xs text-emerald-700 font-semibold mb-2">Oraliq sarflanishlar:</p>
        {fuelWithOdometer.map((fuel, idx) => {
          let distance, consumption, prevOdometer, prevQuantity

          if (idx === 0) {
            // Birinchi yoqilg'i - mashrut boshidan hisoblash
            prevOdometer = flight.startOdometer
            prevQuantity = flight.startFuel
            distance = (fuel.odometer || 0) - prevOdometer
            consumption = prevQuantity && distance > 0
              ? Math.round(distance / prevQuantity * 10) / 10
              : 0
          } else {
            // Keyingi yoqilg'ilar - oldingi to'ldirishdan hisoblash
            const prevFuel = fuelWithOdometer[idx - 1]
            prevOdometer = prevFuel.odometer
            prevQuantity = prevFuel.quantity
            distance = (fuel.odometer || 0) - (prevFuel.odometer || 0)
            consumption = prevQuantity && distance > 0
              ? Math.round(distance / prevQuantity * 10) / 10
              : 0
          }

          // Oldingi sarflanish bilan solishtirish
          let prevConsumption = 0
          if (idx > 0) {
            if (idx === 1 && flight.startOdometer && flight.startFuel) {
              const firstDistance = fuelWithOdometer[0].odometer - flight.startOdometer
              prevConsumption = flight.startFuel && firstDistance > 0
                ? Math.round(firstDistance / flight.startFuel * 10) / 10
                : 0
            } else if (idx > 1) {
              const prevPrevFuel = fuelWithOdometer[idx - 2]
              const prevFuel = fuelWithOdometer[idx - 1]
              const prevDistance = (prevFuel.odometer || 0) - (prevPrevFuel.odometer || 0)
              prevConsumption = prevPrevFuel.quantity && prevDistance > 0
                ? Math.round(prevDistance / prevPrevFuel.quantity * 10) / 10
                : 0
            }
          }

          const diff = consumption - prevConsumption
          const isImproved = diff > 0
          const isWorse = diff < 0

          return (
            <div key={fuel._id} className="flex items-center justify-between bg-white/70 rounded-xl px-4 py-3 border border-emerald-100">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {prevOdometer?.toLocaleString()} → {fuel.odometer?.toLocaleString()} km
                  </p>
                  <p className="text-xs text-gray-500">
                    +{distance.toLocaleString()} km / {prevQuantity} {fuelUnit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg px-3 py-1 rounded-lg ${consumption >= avgConsumption ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {consumption} km/{fuelUnit}
                </span>
                {idx > 0 && prevConsumption > 0 && (
                  <span className={`flex items-center ${isImproved ? 'text-emerald-500' : isWorse ? 'text-red-500' : 'text-gray-400'}`}>
                    {isImproved ? <TrendingUp size={18} /> : isWorse ? <TrendingDown size={18} /> : <Minus size={18} />}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
