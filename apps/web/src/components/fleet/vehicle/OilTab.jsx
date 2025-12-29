import { memo, useState } from 'react'
import { Plus, Droplets, Edit2, Trash2, AlertTriangle, CheckCircle, Mic } from 'lucide-react'
import { fmt, fmtDate, OIL_STATUS } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

export const OilTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const { changes = [], status = 'ok', remainingKm = 0, lastChange } = data

  const statusColors = {
    ok: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', icon: 'text-emerald-500' },
    approaching: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', icon: 'text-amber-500' },
    overdue: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: 'text-red-500' }
  }
  const colors = statusColors[status] || statusColors.ok
  const statusConfig = OIL_STATUS[status] || OIL_STATUS.ok

  return (
    <div className="space-y-8">
      {/* Status Card - Light Mode */}
      <div className={`${colors.bg} rounded-2xl p-6 border ${colors.border}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {status === 'ok' ? (
              <CheckCircle className={`w-8 h-8 ${colors.icon}`} />
            ) : (
              <AlertTriangle className={`w-8 h-8 ${colors.icon}`} />
            )}
            <div>
              <h3 className={`text-xl font-bold ${colors.text}`}>{statusConfig.label}</h3>
              <p className="text-gray-500">Moy holati</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${colors.text}`}>{fmt(remainingKm)}</p>
            <p className="text-gray-500">km qoldi</p>
          </div>
        </div>

        {lastChange && (
          <div className="pt-4 border-t border-gray-200/50 grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Oxirgi almashtirish</p>
              <p className="text-gray-900 font-medium">{fmtDate(lastChange.date)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Moy turi</p>
              <p className="text-gray-900 font-medium">{lastChange.oilType || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowVoiceRecorder(true)}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25"
        >
          <Mic size={18} />
          🎤 Ovoz bilan
        </button>
        <button
          onClick={onAdd}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25"
        >
          <Plus size={18} />
          Moy almashtirish
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="oil"
          onResult={(voiceData) => {
            setShowVoiceRecorder(false)
            if (onVoiceAdd) {
              onVoiceAdd(voiceData)
            }
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* History - Light Mode */}
      {changes.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {changes.map(c => {
            const totalCost = (c.cost || 0) + (c.filterCost || 0) + (c.airFilterCost || 0) + (c.fuelFilterCost || 0)
            const hasFilters = c.filterChanged || c.airFilterChanged || c.fuelFilterChanged
            
            return (
            <div key={c._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                    <Droplets className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{c.oilType || 'Moy'}</p>
                    <p className="text-gray-500 text-sm">{fmtDate(c.date)} • {fmt(c.odometer)} km</p>
                    {c.oilBrand && <p className="text-gray-400 text-sm">{c.oilBrand}</p>}
                    {/* Filtrlar */}
                    {hasFilters && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.filterChanged && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">
                            Moy filtri
                          </span>
                        )}
                        {c.airFilterChanged && (
                          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-md font-medium">
                            Havo filtri
                          </span>
                        )}
                        {c.fuelFilterChanged && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                            Yoqilg'i filtri
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-amber-600 font-bold">{fmt(totalCost)} so'm</p>
                  {hasFilters && <p className="text-gray-400 text-xs">moy: {fmt(c.cost)}</p>}
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(c)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(c._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Moy almashtirish tarixi yo'q</p>
        </div>
      )}
    </div>
  )
})
