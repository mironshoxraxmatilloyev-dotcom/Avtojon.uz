import { memo } from 'react'
import { Plus, Circle, Edit2, Trash2 } from 'lucide-react'
import { fmt, fmtDate, TIRE_STATUS } from './constants'

export const TiresTab = memo(({ tires, onAdd, onAddBulk, onEdit, onDelete }) => {
  const wornCount = tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length
  const newCount = tires.filter(t => (t.calculatedStatus || t.status) === 'new').length

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5 text-center">
          <p className="text-3xl font-bold text-white">{tires.length}</p>
          <p className="text-slate-400 text-sm">Jami</p>
        </div>
        <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10 text-center">
          <p className="text-3xl font-bold text-emerald-400">{newCount}</p>
          <p className="text-slate-400 text-sm">Yangi</p>
        </div>
        <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10 text-center">
          <p className="text-3xl font-bold text-red-400">{wornCount}</p>
          <p className="text-slate-400 text-sm">Eskirgan</p>
        </div>
      </div>

      {/* Add Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={onAddBulk}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium flex items-center gap-2 transition-all"
        >
          <Plus size={18} />
          To'liq almashtirish
        </button>
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus size={18} />
          Bitta shina
        </button>
      </div>

      {/* Tires Grid */}
      {tires.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tires.map(t => {
            const status = TIRE_STATUS[t.calculatedStatus || t.status] || TIRE_STATUS.used
            return (
              <div key={t._id} className="bg-slate-800/30 rounded-xl p-5 border border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${status.color}-500/10 rounded-lg flex items-center justify-center`}>
                      <Circle className={`w-5 h-5 text-${status.color}-400`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{t.position}</p>
                      <p className="text-slate-400 text-sm">{t.brand} {t.size}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-${status.color}-500/15 text-${status.color}-400`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Qolgan masofa</span>
                    <span className={`font-medium text-${status.color}-400`}>{fmt(t.remainingKm || 0)} km</span>
                  </div>
                  {t.installDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">O'rnatilgan</span>
                      <span className="text-white">{fmtDate(t.installDate)}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full bg-${status.color}-500 rounded-full transition-all`}
                    style={{ width: `${Math.max(0, Math.min(100, (t.remainingKm / (t.expectedLifeKm || 50000)) * 100))}%` }}
                  />
                </div>

                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(t)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(t._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-slate-800/20 rounded-2xl p-12 text-center border border-white/5">
          <Circle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Shinalar qo'shilmagan</p>
        </div>
      )}
    </div>
  )
})
