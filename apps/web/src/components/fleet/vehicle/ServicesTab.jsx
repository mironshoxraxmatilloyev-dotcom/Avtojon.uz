import { memo, useState } from 'react'
import { Plus, Wrench, Edit2, Trash2, Mic, X, Calendar, MapPin } from 'lucide-react'
import { fmt, fmtDate } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

export const ServicesTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const { services = [], stats = {} } = data

  return (
    <div className="space-y-6">
      {/* Stats */}
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
            if (onVoiceAdd) onVoiceAdd(voiceData)
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Services List - Compact */}
      {services.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {services.map(s => (
            <div
              key={s._id}
              onClick={() => setSelectedService(s)}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center border border-cyan-100">
                    <Wrench className="w-5 h-5 text-cyan-600" />
                  </div>
                  <p className="text-gray-900 font-bold">{s.type}</p>
                </div>
                <span className="text-emerald-600 font-bold whitespace-nowrap">{fmt(s.cost)} so'm</span>
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

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onEdit={() => { setSelectedService(null); onEdit(selectedService) }}
          onDelete={() => { setSelectedService(null); onDelete(selectedService._id) }}
        />
      )}
    </div>
  )
})

// Service Detail Modal
const ServiceDetailModal = memo(({ service, onClose, onEdit, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-100">
              <Wrench className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{service.type}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Narx */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Xarajat</span>
              <span className="font-bold text-emerald-600 text-xl">{fmt(service.cost)} so'm</span>
            </div>
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-3">
            {service.date && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Sana</span>
                <span className="font-bold text-gray-900">{fmtDate(service.date)}</span>
              </div>
            )}
            {service.odometer > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Spidometr</span>
                <span className="font-bold text-gray-900">{fmt(service.odometer)} km</span>
              </div>
            )}
            {service.serviceName && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Xizmat markazi</span>
                <span className="font-bold text-gray-900">{service.serviceName}</span>
              </div>
            )}
            {service.description && (
              <div className="py-2 border-b border-gray-100">
                <span className="text-gray-500 block mb-1">Izoh</span>
                <p className="text-gray-900">{service.description}</p>
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
