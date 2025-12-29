import { memo, useState } from 'react'
import { Plus, Circle, Edit2, Trash2, Mic } from 'lucide-react'
import { fmt, fmtDate, TIRE_STATUS } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

export const TiresTab = memo(({ tires, onAdd, onAddBulk, onEdit, onDelete, onVoiceAdd }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const wornCount = tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length
  const newCount = tires.filter(t => (t.calculatedStatus || t.status) === 'new').length

  return (
    <div className="space-y-8">
      {/* Stats - Light Mode */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
          <p className="text-3xl font-bold text-gray-900">{tires.length}</p>
          <p className="text-gray-500 text-sm">Jami</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
          <p className="text-3xl font-bold text-emerald-600">{newCount}</p>
          <p className="text-gray-500 text-sm">Yangi</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
          <p className="text-3xl font-bold text-red-600">{wornCount}</p>
          <p className="text-gray-500 text-sm">Eskirgan</p>
        </div>
      </div>

      {/* Add Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={() => setShowVoiceRecorder(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25"
        >
          <Mic size={18} />
          🎤 Ovoz bilan
        </button>
        <button
          onClick={onAddBulk}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium flex items-center gap-2 transition-all border border-gray-200"
        >
          <Plus size={18} />
          To'liq almashtirish
        </button>
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/25"
        >
          <Plus size={18} />
          Bitta shina
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="tire"
          onResult={(voiceData) => {
            setShowVoiceRecorder(false)
            if (onVoiceAdd) {
              onVoiceAdd(voiceData)
            }
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Tires Grid - Light Mode */}
      {tires.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tires.map(t => {
            const tireStatus = t.calculatedStatus || t.status || 'used'
            const statusColors = {
              new: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', bar: 'bg-emerald-500' },
              used: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', bar: 'bg-blue-500' },
              worn: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', bar: 'bg-red-500' }
            }
            const colors = statusColors[tireStatus] || statusColors.used
            const status = TIRE_STATUS[tireStatus] || TIRE_STATUS.used

            return (
              <div key={t._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center border ${colors.border}`}>
                      <Circle className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">{t.position}</p>
                      <p className="text-gray-500 text-sm">{t.brand} {t.size}</p>
                      {t.serialNumber && <p className="text-gray-400 text-xs">{t.serialNumber}</p>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Qolgan masofa</span>
                    <span className={`font-medium ${colors.text}`}>{fmt(t.remainingKm || 0)} km</span>
                  </div>
                  {t.installDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">O'rnatilgan</span>
                      <span className="text-gray-900">{fmtDate(t.installDate)}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all`}
                    style={{ width: `${Math.max(0, Math.min(100, (t.remainingKm / (t.expectedLifeKm || 50000)) * 100))}%` }}
                  />
                </div>

                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(t)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(t._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Shinalar qo'shilmagan</p>
        </div>
      )}
    </div>
  )
})
