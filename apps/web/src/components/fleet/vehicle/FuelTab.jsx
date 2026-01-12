import { memo, useState } from 'react'
import { Plus, Fuel, Edit2, Trash2, Mic, Gauge, DollarSign, X, Calendar, MapPin } from 'lucide-react'
import { fmt, fmtDate } from './constants'
import VoiceRecorder from '../../VoiceRecorder'

export const FuelTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd, vehicle }) => {
  const { refills = [], stats = {} } = data
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedFuel, setSelectedFuel] = useState(null)

  // Yoqilg'i turi - metan, gas, propan = kub, boshqalar = litr
  const fuelType = vehicle?.fuelType?.toLowerCase() || ''
  const isGas = fuelType === 'metan' || fuelType === 'gas' || fuelType === 'propan' || fuelType.includes('metan') || fuelType.includes('gaz')
  const unit = isGas ? 'kub' : 'litr'

  // Yoqilg'i sarfini hisoblash - har bir ketma-ket juftlik uchun
  const fuelEfficiency = (() => {
    if (refills.length < 2) return null
    // Odometr bo'yicha tartiblash (kichikdan kattaga)
    const sorted = [...refills].filter(r => r.odometer && r.odometer > 0).sort((a, b) => (a.odometer || 0) - (b.odometer || 0))
    if (sorted.length < 2) return null
    
    // Har bir ketma-ket juftlik uchun sarfni hisoblash
    let totalKm = 0
    let totalFuel = 0
    
    for (let i = 1; i < sorted.length; i++) {
      const prevOdo = sorted[i - 1].odometer
      const currOdo = sorted[i].odometer
      const currLiters = sorted[i].liters || 0
      
      const kmDiff = currOdo - prevOdo
      if (kmDiff > 0 && currLiters > 0) {
        totalKm += kmDiff
        totalFuel += currLiters
      }
    }
    
    if (totalKm <= 0 || totalFuel <= 0) return null
    const per100km = (totalFuel / totalKm) * 100
    const kmPerUnit = totalKm / totalFuel
    return { per100km: Math.round(per100km * 10) / 10, kmPerUnit: Math.round(kmPerUnit * 10) / 10, totalKm, totalFuel: Math.round(totalFuel) }
  })()

  const totalCost = stats.totalCost || refills.reduce((sum, r) => sum + (r.cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <p className="text-emerald-700 font-medium">Jami xarajat</p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{fmt(totalCost)} <span className="text-lg font-medium">so'm</span></p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-700 font-medium">1 km ga sarf</p>
          </div>
          {fuelEfficiency ? (
            <div>
              <p className="text-3xl font-bold text-blue-700">{(fuelEfficiency.per100km / 100).toFixed(2)} <span className="text-lg font-medium">{unit}/km</span></p>
            </div>
          ) : (
            <p className="text-blue-600 text-lg">Kamida 2 ta yoqilg'i yozuvi kerak</p>
          )}
        </div>
      </div>

      {/* Add Buttons */}
      <div className="flex justify-end gap-3">
        <button onClick={() => setShowVoiceRecorder(true)} className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25">
          <Mic size={18} /> Ovoz
        </button>
        <button onClick={onAdd} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25">
          <Fuel size={18} /> Yoqilg'i qo'shish
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onResult={(voiceData) => { setShowVoiceRecorder(false); if (onVoiceAdd) onVoiceAdd(voiceData) }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* List - faqat miqdor va narx */}
      {refills.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {refills.map(r => {
            const itemFuelType = (r.fuelType || vehicle?.fuelType || '').toLowerCase()
            const itemIsGas = itemFuelType === 'metan' || itemFuelType === 'gas' || itemFuelType === 'propan'
            const itemUnit = itemIsGas ? 'kub' : 'litr'
            
            return (
              <div
                key={r._id}
                onClick={() => setSelectedFuel(r)}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-gray-900 font-bold text-lg">{r.liters} {itemUnit}</p>
                  </div>
                  <p className="text-xl font-bold text-red-500">-{fmt(r.cost)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Fuel} text="Yoqilg'i ma'lumotlari yo'q" />
      )}

      {/* Fuel Detail Modal */}
      {selectedFuel && (
        <FuelDetailModal
          fuel={selectedFuel}
          vehicle={vehicle}
          onClose={() => setSelectedFuel(null)}
          onEdit={() => { setSelectedFuel(null); onEdit(selectedFuel) }}
          onDelete={() => { setSelectedFuel(null); onDelete(selectedFuel._id) }}
        />
      )}
    </div>
  )
})

// Fuel Detail Modal
const FuelDetailModal = memo(({ fuel, vehicle, onClose, onEdit, onDelete }) => {
  const itemFuelType = (fuel.fuelType || vehicle?.fuelType || '').toLowerCase()
  const itemIsGas = itemFuelType === 'metan' || itemFuelType === 'gas' || itemFuelType === 'propan'
  const itemUnit = itemIsGas ? 'kub' : 'litr'

  const FUEL_LABELS = { diesel: 'Dizel', petrol: 'Benzin', benzin: 'Benzin', gas: 'Gaz', metan: 'Metan', propan: 'Propan' }
  const fuelLabel = FUEL_LABELS[itemFuelType] || itemFuelType || 'Yoqilg\'i'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Fuel className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{fuelLabel}</h3>
              <p className="text-xs text-gray-500">{fmtDate(fuel.date)}</p>
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
            <p className="text-sm text-gray-500 mb-1">Xarajat summasi</p>
            <p className="text-3xl font-bold text-red-500">-{fmt(fuel.cost)}</p>
            <p className="text-sm text-gray-400">so'm</p>
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Miqdor</span>
              <span className="font-bold text-gray-900">{fuel.liters} {itemUnit}</span>
            </div>
            {fuel.odometer > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Spidometr</span>
                <span className="font-bold text-gray-900">{fmt(fuel.odometer)} km</span>
              </div>
            )}
            {fuel.station && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Zapravka</span>
                <span className="font-bold text-gray-900">{fuel.station}</span>
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

const EmptyState = memo(({ icon: Icon, text }) => (
  <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
    <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500">{text}</p>
  </div>
))
