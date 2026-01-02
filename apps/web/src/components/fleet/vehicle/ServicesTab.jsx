import { memo, useState } from 'react'
import { Plus, Wrench, Edit2, Trash2, Mic } from 'lucide-react'
import { fmt, fmtDate } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

export const ServicesTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const { services = [], stats = {} } = data

  return (
    <div className="space-y-8">
      {/* Stats - Light Mode */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
          <p className="text-gray-500 text-sm mb-1">Jami xarajat</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalCost || 0)} so'm</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Xizmatlar soni</p>
          <p className="text-2xl font-bold text-gray-900">{services.length}</p>
        </div>
      </div>

      {/* Add Buttons */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-3">
        <button
          onClick={() => setShowVoiceRecorder(true)}
          className="px-4 sm:px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25"
        >
          <Mic size={18} />
          <span className="hidden sm:inline">Ovoz</span>
        </button>
        <button
          onClick={onAdd}
          className="px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Xizmat</span> qo'shish
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="service"
          onResult={(voiceData) => {
            setShowVoiceRecorder(false)
            if (onVoiceAdd) {
              onVoiceAdd(voiceData)
            }
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Services List - Light Mode */}
      {services.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {services.map(s => (
            <div key={s._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <Wrench className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{s.type}</p>
                    <p className="text-gray-500 text-sm">{fmtDate(s.date)} • {fmt(s.odometer)} km</p>
                    {s.description && <p className="text-gray-400 text-sm mt-1">{s.description}</p>}
                    {s.serviceName && <p className="text-gray-400 text-sm">{s.serviceName}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-600 font-bold">{fmt(s.cost)} so'm</p>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => onEdit(s)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(s._id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Xizmat tarixi yo'q</p>
        </div>
      )}
    </div>
  )
})
