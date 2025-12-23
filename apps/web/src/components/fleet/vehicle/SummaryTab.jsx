import { memo } from 'react'
import { Fuel, Droplets, Circle, Wrench, TrendingUp, Calendar, Gauge } from 'lucide-react'
import { fmt, fmtDate, OIL_STATUS } from './constants'

export const SummaryTab = memo(({ vehicle, stats, fuelData, oilData, tires, services }) => {
  const oilStatus = OIL_STATUS[oilData.status] || OIL_STATUS.ok

  return (
    <div className="space-y-8">
      {/* Vehicle Info */}
      <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Mashina ma'lumotlari</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={Gauge} label="Odometr" value={`${fmt(vehicle.currentOdometer)} km`} />
          <InfoCard icon={Fuel} label="Yoqilg'i" value={vehicle.fuelType === 'diesel' ? 'Dizel' : vehicle.fuelType === 'petrol' ? 'Benzin' : vehicle.fuelType} />
          <InfoCard icon={Calendar} label="Yil" value={vehicle.year || '-'} />
          <InfoCard icon={TrendingUp} label="Bak hajmi" value={vehicle.fuelTankCapacity ? `${vehicle.fuelTankCapacity} L` : '-'} />
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
        <h3 className="text-lg font-bold text-white mb-6">Xarajatlar</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CostCard icon={Fuel} label="Yoqilg'i" value={stats.totalFuelCost} color="blue" />
          <CostCard icon={Droplets} label="Moy" value={stats.totalOilCost} color="amber" />
          <CostCard icon={Circle} label="Shinalar" value={stats.totalTireCost} color="purple" />
          <CostCard icon={Wrench} label="Xizmatlar" value={stats.totalServiceCost} color="emerald" />
        </div>
        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
          <span className="text-slate-400">Jami xarajat</span>
          <span className="text-2xl font-bold text-white">{fmt(stats.totalCost)} so'm</span>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oil Status */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Droplets className="w-5 h-5 text-amber-400" />
              Moy holati
            </h3>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-${oilStatus.color}-500/15 text-${oilStatus.color}-400`}>
              {oilStatus.label}
            </span>
          </div>
          {oilData.lastChange ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Oxirgi almashtirish</span>
                <span className="text-white">{fmtDate(oilData.lastChange.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Qolgan masofa</span>
                <span className={`font-semibold text-${oilStatus.color}-400`}>{fmt(oilData.remainingKm)} km</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Ma'lumot yo'q</p>
          )}
        </div>

        {/* Tires Status */}
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Circle className="w-5 h-5 text-purple-400" />
            Shinalar
          </h3>
          {tires.length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Jami shinalar</span>
                <span className="text-white">{tires.length} ta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Eskirgan</span>
                <span className="text-red-400 font-semibold">
                  {tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length} ta
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Shina qo'shilmagan</p>
          )}
        </div>
      </div>

      {/* Recent Services */}
      {services.services?.length > 0 && (
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-emerald-400" />
            Oxirgi xizmatlar
          </h3>
          <div className="space-y-3">
            {services.services.slice(0, 3).map(s => (
              <div key={s._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-white font-medium">{s.type}</p>
                  <p className="text-sm text-slate-500">{fmtDate(s.date)}</p>
                </div>
                <span className="text-emerald-400 font-semibold">{fmt(s.cost)} so'm</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

const InfoCard = memo(({ icon: Icon, label, value }) => (
  <div className="p-4 bg-slate-800/50 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-slate-500" />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
    <p className="text-lg font-semibold text-white">{value}</p>
  </div>
))

const CostCard = memo(({ icon: Icon, label, value, color }) => (
  <div className={`p-4 bg-${color}-500/5 rounded-xl border border-${color}-500/10`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 text-${color}-400`} />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
    <p className="text-lg font-semibold text-white">{fmt(value)} so'm</p>
  </div>
))
