import { Gauge, Fuel, Zap, Edit3 } from 'lucide-react'
import { formatMoney } from './constants'

export default function OdometerFuelCard({ flight, onEdit }) {
  // Yoqilg'i ma'lumotlarini hisoblash
  const fuelData = { litr: 0, kub: 0, types: [] }
  flight.expenses?.forEach(exp => {
    if (exp.type?.startsWith('fuel_') && exp.quantity) {
      const isKub = exp.type === 'fuel_metan' || exp.type === 'fuel_propan'
      const unit = exp.quantityUnit || (isKub ? 'kub' : 'litr')
      if (unit === 'kub') fuelData.kub += Number(exp.quantity)
      else fuelData.litr += Number(exp.quantity)
      if (!fuelData.types.includes(exp.type)) fuelData.types.push(exp.type)
    }
  })

  const mainType = fuelData.types[0] || flight.fuelType || 'benzin'
  const isKubType = mainType === 'fuel_metan' || mainType === 'fuel_propan' || mainType === 'metan' || mainType === 'propan'
  const fuelLabel = mainType === 'fuel_metan' || mainType === 'metan' ? 'Metan' :
                   mainType === 'fuel_propan' || mainType === 'propan' ? 'Propan' :
                   mainType === 'fuel_diesel' || mainType === 'diesel' ? 'Dizel' : 'Benzin'
  const mainUnit = isKubType ? 'kub' : 'litr'

  const totalDistance = flight.endOdometer && flight.startOdometer
    ? flight.endOdometer - flight.startOdometer
    : flight.legs?.reduce((sum, leg) => sum + (leg.distance || 0), 0) || flight.totalDistance || 0

  // Olingan yoqilg'i (to'ldirishlar)
  const totalFuelAdded = isKubType ? fuelData.kub : fuelData.litr
  const fuelUsedText = totalFuelAdded > 0 ? `${totalFuelAdded} ${mainUnit}` : '-'
  
  // Sarflanish hisoblash - boshlang'ich yoqilg'i + olinganlar - qoldiq
  // Agar qoldiq yo'q bo'lsa, boshlang'ich yoqilg'i bilan hisoblash
  let fuelEfficiency = null
  if (totalDistance > 0) {
    if (flight.startFuel && flight.endFuel !== undefined && flight.endFuel !== null) {
      // To'liq ma'lumot bor - aniq hisoblash
      const actualUsed = (flight.startFuel || 0) + totalFuelAdded - (flight.endFuel || 0)
      if (actualUsed > 0) {
        fuelEfficiency = (totalDistance / actualUsed).toFixed(1)
      }
    } else if (flight.startFuel && flight.startFuel > 0) {
      // Faqat boshlang'ich yoqilg'i bor - taxminiy hisoblash
      // Sarflangan = boshlang'ich yoqilg'i (chunki oxirgi to'ldirishgacha yetib keldi)
      fuelEfficiency = (totalDistance / flight.startFuel).toFixed(1)
    }
  }

  const isActive = flight.status === 'active'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Spidometr */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Gauge className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Spidometr</h3>
              <p className="text-sm text-slate-400">Kilometraj ma'lumotlari</p>
            </div>
          </div>
          {isActive && onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-2 flex items-center gap-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 hover:text-blue-700 transition-colors border border-blue-200"
              title="Tahrirlash"
            >
              <Edit3 size={16} />
              <span className="text-sm font-medium">Tahrirlash</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase">Boshlang'ich</p>
            <p className="text-lg font-bold text-slate-700 mt-1">{formatMoney(flight.startOdometer || 0)}</p>
            <p className="text-xs text-slate-400">km</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase">Tugash</p>
            <p className="text-lg font-bold text-slate-700 mt-1">{flight.endOdometer ? formatMoney(flight.endOdometer) : '-'}</p>
            <p className="text-xs text-slate-400">km</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
            <p className="text-xs text-emerald-600 font-semibold uppercase">Jami</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">{formatMoney(totalDistance)}</p>
            <p className="text-xs text-emerald-500">km</p>
          </div>
        </div>
      </div>

      {/* Yoqilg'i */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Fuel className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Yoqilg'i</h3>
              <p className="text-sm text-slate-400">{fuelLabel} ({mainUnit})</p>
            </div>
          </div>
          {fuelEfficiency && (
            <div className="bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-cyan-500" />
                <span className="text-sm font-bold text-cyan-600">{fuelEfficiency} km/{mainUnit}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase">Boshlang'ich</p>
            <p className="text-lg font-bold text-slate-700 mt-1">{flight.startFuel || 0}</p>
            <p className="text-xs text-slate-400">{mainUnit}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium uppercase">Qoldiq</p>
            <p className="text-lg font-bold text-slate-700 mt-1">{flight.endFuel || '-'}</p>
            <p className="text-xs text-slate-400">{mainUnit}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
            <p className="text-xs text-rose-600 font-semibold uppercase">Sarflangan</p>
            <p className="text-lg font-bold text-rose-600 mt-1">{fuelUsedText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
