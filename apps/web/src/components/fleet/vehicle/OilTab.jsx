import { memo, useState } from 'react'
import { Plus, Droplets, Edit2, Trash2, AlertTriangle, CheckCircle, Mic, X } from 'lucide-react'
import { fmt, fmtDate, OIL_STATUS } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

export const OilTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedOil, setSelectedOil] = useState(null)
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
      {/* Status Card */}
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
        <button onClick={() => setShowVoiceRecorder(true)} className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25">
          <Mic size={18} /> Ovoz bilan
        </button>
        <button onClick={onAdd} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-500/25">
          <Plus size={18} /> Moy almashtirish
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="oil"
          onResult={(voiceData) => { setShowVoiceRecorder(false); if (onVoiceAdd) onVoiceAdd(voiceData) }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* History - faqat litr va narx */}
      {changes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {changes.map(c => {
            const totalCost = (c.cost || 0) + (c.oilFilterCost || 0) + (c.airFilterCost || 0) + (c.cabinFilterCost || 0) + (c.gasFilterCost || 0)
            return (
              <div
                key={c._id}
                onClick={() => setSelectedOil(c)}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{c.liters || '-'} litr</p>
                  </div>
                  <p className="text-xl font-bold text-red-500">-{fmt(totalCost)}</p>
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

      {/* Oil Detail Modal */}
      {selectedOil && (
        <OilDetailModal
          oil={selectedOil}
          onClose={() => setSelectedOil(null)}
          onEdit={() => { setSelectedOil(null); onEdit(selectedOil) }}
          onDelete={() => { setSelectedOil(null); onDelete(selectedOil._id) }}
        />
      )}
    </div>
  )
})

// Oil Detail Modal
const OilDetailModal = memo(({ oil, onClose, onEdit, onDelete }) => {
  const totalCost = (oil.cost || 0) + (oil.oilFilterCost || 0) + (oil.airFilterCost || 0) + (oil.cabinFilterCost || 0) + (oil.gasFilterCost || 0)
  const hasFilters = oil.oilFilterCost || oil.airFilterCost || oil.cabinFilterCost || oil.gasFilterCost

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Moy almashtirish</h3>
              <p className="text-xs text-gray-500">{fmtDate(oil.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summa */}
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Jami xarajat</p>
            <p className="text-3xl font-bold text-red-500">-{fmt(totalCost)}</p>
            <p className="text-sm text-gray-400">so'm</p>
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-3">
            {oil.liters > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Miqdor</span>
                <span className="font-bold text-gray-900">{oil.liters} litr</span>
              </div>
            )}
            {oil.oilType && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Moy turi</span>
                <span className="font-bold text-gray-900">{oil.oilType}</span>
              </div>
            )}
            {oil.oilBrand && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Brend</span>
                <span className="font-bold text-gray-900">{oil.oilBrand}</span>
              </div>
            )}
            {oil.odometer > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Spidometr</span>
                <span className="font-bold text-gray-900">{fmt(oil.odometer)} km</span>
              </div>
            )}
            {oil.cost > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Moy narxi</span>
                <span className="font-bold text-gray-900">{fmt(oil.cost)} so'm</span>
              </div>
            )}

            {/* Filtrlar */}
            {hasFilters && (
              <div className="py-2">
                <p className="text-gray-500 text-sm mb-2">Almashtirilgan filtrlar</p>
                <div className="flex flex-wrap gap-2">
                  {oil.oilFilterCost && (
                    <div className="px-3 py-1.5 bg-blue-50 rounded-lg">
                      <span className="text-blue-700 text-sm font-medium">Moy filtri</span>
                      {oil.oilFilterCost > 0 && <span className="text-blue-500 text-xs ml-2">{fmt(oil.oilFilterCost)} so'm</span>}
                    </div>
                  )}
                  {oil.airFilterCost && (
                    <div className="px-3 py-1.5 bg-cyan-50 rounded-lg">
                      <span className="text-cyan-700 text-sm font-medium">Havo filtri</span>
                      {oil.airFilterCost > 0 && <span className="text-cyan-500 text-xs ml-2">{fmt(oil.airFilterCost)} so'm</span>}
                    </div>
                  )}
                  {oil.cabinFilterCost && (
                    <div className="px-3 py-1.5 bg-purple-50 rounded-lg">
                      <span className="text-purple-700 text-sm font-medium">Salarka filtri</span>
                      {oil.cabinFilterCost > 0 && <span className="text-purple-500 text-xs ml-2">{fmt(oil.cabinFilterCost)} so'm</span>}
                    </div>
                  )}
                  {oil.gasFilterCost && (
                    <div className="px-3 py-1.5 bg-green-50 rounded-lg">
                      <span className="text-green-700 text-sm font-medium">Gaz filtri</span>
                      {oil.gasFilterCost > 0 && <span className="text-green-500 text-xs ml-2">{fmt(oil.gasFilterCost)} so'm</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {oil.nextChangeOdometer > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Keyingi almashtirish</span>
                <span className="font-bold text-gray-900">{fmt(oil.nextChangeOdometer)} km da</span>
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
