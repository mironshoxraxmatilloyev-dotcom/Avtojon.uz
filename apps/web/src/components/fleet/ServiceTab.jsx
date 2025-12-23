import { memo } from 'react'
import { AlertTriangle, CheckCircle, ChevronRight, Truck, Wrench } from 'lucide-react'
import { FUEL } from './constants'

export const ServiceTab = memo(({ vehicles, navigate }) => {
  const attentionVehicles = vehicles.filter(v => v.status === 'attention' || v.status === 'critical')
  const criticalVehicles = vehicles.filter(v => v.status === 'critical')
  const warningVehicles = vehicles.filter(v => v.status === 'attention')

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-slate-400">Kritik</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{criticalVehicles.length}</p>
        </div>
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400">Diqqat</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{warningVehicles.length}</p>
        </div>
        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400">Yaxshi</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{vehicles.length - attentionVehicles.length}</p>
        </div>
      </div>

      {/* Attention Required */}
      {attentionVehicles.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            Xizmat ko'rsatish kerak
          </h3>
          <div className="space-y-4">
            {attentionVehicles.map(v => (
              <div
                key={v._id}
                onClick={() => navigate(`/fleet/vehicle/${v._id}`)}
                className={`flex items-center gap-5 p-5 rounded-2xl border cursor-pointer transition-all ${
                  v.status === 'critical'
                    ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                    : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  v.status === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'
                }`}>
                  <Truck className={`w-7 h-7 ${v.status === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-lg font-bold text-white">{v.plateNumber}</h4>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      v.status === 'critical' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {v.status === 'critical' ? 'Kritik' : 'Diqqat'}
                    </span>
                  </div>
                  <p className="text-slate-400">{v.brand} {v.model}</p>
                  <p className="text-slate-500 text-sm mt-1">{FUEL[v.fuelType]} • {v.currentOdometer?.toLocaleString()} km</p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-500" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/20 rounded-3xl p-12 text-center border border-white/5">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Hammasi yaxshi!</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            Barcha mashinalar yaxshi holatda. Xizmat ko'rsatish talab qilinmaydi.
          </p>
        </div>
      )}
    </div>
  )
})
