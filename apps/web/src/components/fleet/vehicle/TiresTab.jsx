import { memo, useState } from 'react'
import { Plus, Circle, Edit2, Trash2, Mic, X } from 'lucide-react'
import { fmt, fmtDate, TIRE_STATUS } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

export const TiresTab = memo(({ tires, onAdd, onAddBulk, onEdit, onDelete, onVoiceAdd }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedTire, setSelectedTire] = useState(null)
  const wornCount = tires.filter(t => (t.calculatedStatus || t.status) === 'worn').length
  const newCount = tires.filter(t => (t.calculatedStatus || t.status) === 'new').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
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
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button onClick={() => setShowVoiceRecorder(true)} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25">
          <Mic size={18} /> Ovoz
        </button>
        <button onClick={onAddBulk} className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 transition-all border border-gray-200">
          <Plus size={18} /> To'liq almashtirish
        </button>
        <button onClick={onAdd} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25">
          <Plus size={18} /> Bitta shina
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="tire"
          onResult={(voiceData) => { setShowVoiceRecorder(false); if (onVoiceAdd) onVoiceAdd(voiceData) }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Tires List - faqat pozitsiya va holat */}
      {tires.length > 0 ? (
        <div className="space-y-3">
          {tires.map(t => {
            const tireStatus = t.calculatedStatus || t.status || 'used'
            const statusColors = {
              new: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
              used: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
              worn: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' }
            }
            const colors = statusColors[tireStatus] || statusColors.used
            const status = TIRE_STATUS[tireStatus] || TIRE_STATUS.used

            return (
              <div
                key={t._id}
                onClick={() => setSelectedTire(t)}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
                      <Circle className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{t.position}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${colors.badge}`}>
                    {status.label}
                  </span>
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

      {/* Tire Detail Modal */}
      {selectedTire && (
        <TireDetailModal
          tire={selectedTire}
          onClose={() => setSelectedTire(null)}
          onEdit={() => { setSelectedTire(null); onEdit(selectedTire) }}
          onDelete={() => { setSelectedTire(null); onDelete(selectedTire._id) }}
        />
      )}
    </div>
  )
})

// Tire Detail Modal
const TireDetailModal = memo(({ tire, onClose, onEdit, onDelete }) => {
  const tireStatus = tire.calculatedStatus || tire.status || 'used'
  const statusColors = {
    new: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    used: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    worn: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' }
  }
  const colors = statusColors[tireStatus] || statusColors.used
  const status = TIRE_STATUS[tireStatus] || TIRE_STATUS.used

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
              <Circle className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{tire.position}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors.badge}`}>{status.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Progress */}
          <div className={`${colors.bg} rounded-xl p-4`}>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Qolgan masofa</span>
              <span className={`font-bold ${colors.text}`}>{fmt(tire.remainingKm || 0)} km</span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <div
                className={`h-full ${tireStatus === 'new' ? 'bg-emerald-500' : tireStatus === 'worn' ? 'bg-red-500' : 'bg-blue-500'} rounded-full`}
                style={{ width: `${Math.max(5, Math.min(100, (tire.remainingKm / (tire.expectedLifeKm || 50000)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-3">
            {tire.brand && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Brend</span>
                <span className="font-bold text-gray-900">{tire.brand}</span>
              </div>
            )}
            {tire.model && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Model</span>
                <span className="font-bold text-gray-900">{tire.model}</span>
              </div>
            )}
            {tire.size && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Shina raqami</span>
                <span className="font-bold text-gray-900 font-mono text-lg">{tire.size}</span>
              </div>
            )}
            {tire.dotNumber && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">DOT raqami</span>
                <span className="font-bold text-gray-900 font-mono">{tire.dotNumber}</span>
              </div>
            )}
            {tire.serialNumber && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Seriya raqami</span>
                <span className="font-bold text-gray-900 font-mono">{tire.serialNumber}</span>
              </div>
            )}
            {tire.installDate && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">O'rnatilgan sana</span>
                <span className="font-bold text-gray-900">{fmtDate(tire.installDate)}</span>
              </div>
            )}
            {tire.installOdometer > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">O'rnatilgan km</span>
                <span className="font-bold text-gray-900">{fmt(tire.installOdometer)} km</span>
              </div>
            )}
            {tire.expectedLifeKm > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kutilgan umr</span>
                <span className="font-bold text-gray-900">{fmt(tire.expectedLifeKm)} km</span>
              </div>
            )}
            {tire.cost > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Narxi</span>
                <span className="font-bold text-red-500">{fmt(tire.cost)} so'm</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button onClick={onEdit} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
            <Edit2 size={16} /> Tahrirlash
          </button>
          <button onClick={onDelete} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
            <Trash2 size={16} /> O'chirish
          </button>
        </div>
      </div>
    </div>
  )
})
