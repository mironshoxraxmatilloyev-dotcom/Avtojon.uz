import { memo } from 'react'
import { Plus, Wrench, Edit2, Trash2 } from 'lucide-react'
import { fmt, fmtDate } from './constants'

export const ServicesTab = memo(({ data, onAdd, onEdit, onDelete }) => {
  const { services = [], stats = {} } = data

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 rounded-xl p-5 border border-emerald-500/10">
          <p className="text-slate-400 text-sm mb-1">Jami xarajat</p>
          <p className="text-2xl font-bold text-white">{fmt(stats.totalCost || 0)} so'm</p>
        </div>
        <div className="bg-slate-800/30 rounded-xl p-5 border border-white/5">
          <p className="text-slate-400 text-sm mb-1">Xizmatlar soni</p>
          <p className="text-2xl font-bold text-white">{services.length}</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          Xizmat qo'shish
        </button>
      </div>

      {/* Services List */}
      {services.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Tarix</h3>
          {services.map(s => (
            <div key={s._id} className="bg-slate-800/30 rounded-xl p-5 border border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{s.type}</p>
                    <p className="text-slate-400 text-sm">{fmtDate(s.date)} • {fmt(s.odometer)} km</p>
                    {s.description && <p className="text-slate-500 text-sm mt-1">{s.description}</p>}
                    {s.serviceName && <p className="text-slate-500 text-sm">{s.serviceName}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{fmt(s.cost)} so'm</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(s)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(s._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400">
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
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Xizmat tarixi yo'q</p>
        </div>
      )}
    </div>
  )
})
