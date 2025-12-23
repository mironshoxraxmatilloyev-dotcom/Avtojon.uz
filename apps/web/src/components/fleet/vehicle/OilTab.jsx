import { memo } from 'react'
import { Plus, Droplets, Edit2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { fmt, fmtDate, OIL_STATUS } from './constants'

export const OilTab = memo(({ data, onAdd, onEdit, onDelete }) => {
  const { changes = [], status = 'ok', remainingKm = 0, lastChange } = data
  const statusConfig = OIL_STATUS[status] || OIL_STATUS.ok

  return (
    <div className="space-y-8">
      {/* Status Card */}
      <div className={`bg-${statusConfig.color}-500/5 rounded-2xl p-6 border border-${statusConfig.color}-500/20`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {status === 'ok' ? (
              <CheckCircle className={`w-8 h-8 text-${statusConfig.color}-400`} />
            ) : (
              <AlertTriangle className={`w-8 h-8 text-${statusConfig.color}-400`} />
            )}
            <div>
              <h3 className={`text-xl font-bold text-${statusConfig.color}-400`}>{statusConfig.label}</h3>
              <p className="text-slate-400">Moy holati</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold text-${statusConfig.color}-400`}>{fmt(remainingKm)}</p>
            <p className="text-slate-400">km qoldi</p>
          </div>
        </div>

        {lastChange && (
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Oxirgi almashtirish</p>
              <p className="text-white font-medium">{fmtDate(lastChange.date)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Moy turi</p>
              <p className="text-white font-medium">{lastChange.oilType || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} />
          Moy almashtirish
        </button>
      </div>

      {/* History */}
      {changes.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Tarix</h3>
          {changes.map(c => (
            <div key={c._id} className="bg-slate-800/30 rounded-xl p-5 border border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{c.oilType || 'Moy'}</p>
                    <p className="text-slate-400 text-sm">{fmtDate(c.date)} • {fmt(c.odometer)} km</p>
                    {c.oilBrand && <p className="text-slate-500 text-sm">{c.oilBrand}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-amber-400 font-bold">{fmt(c.cost)} so'm</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(c)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(c._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/20 rounded-2xl p-12 text-center border border-white/5">
          <Droplets className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Moy almashtirish tarixi yo'q</p>
        </div>
      )}
    </div>
  )
})
