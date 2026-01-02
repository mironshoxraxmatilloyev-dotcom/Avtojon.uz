import { memo, useState } from 'react'
import { Plus, Fuel, Edit2, Trash2, Mic, Gauge, DollarSign } from 'lucide-react'
import { fmt, fmtDate } from './constants'
import VoiceRecorder from '../../VoiceRecorder'

export const FuelTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd, vehicle }) => {
  const { refills = [], stats = {} } = data
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  // Yoqilg'i turi - metan, gas, propan = kub, boshqalar = litr
  const fuelType = vehicle?.fuelType?.toLowerCase() || ''
  const isGas = fuelType === 'metan' || fuelType === 'gas' || fuelType === 'propan' || fuelType.includes('metan') || fuelType.includes('gaz')
  const unit = isGas ? 'kub' : 'litr'

  // Yoqilg'i sarfini hisoblash (1 km ga qancha sarf)
  const fuelEfficiency = (() => {
    if (refills.length < 2) return null
    
    // Spidometr bo'yicha tartiblash
    const sorted = [...refills]
      .filter(r => r.odometer && r.odometer > 0)
      .sort((a, b) => (a.odometer || 0) - (b.odometer || 0))
    
    if (sorted.length < 2) return null
    
    const firstOdo = sorted[0]?.odometer || 0
    const lastOdo = sorted[sorted.length - 1]?.odometer || 0
    const totalKm = lastOdo - firstOdo
    
    // Birinchi quyilishdan keyingi barcha quyilishlar yig'indisi
    const totalFuel = sorted.slice(1).reduce((sum, r) => sum + (r.liters || 0), 0)
    
    if (totalKm <= 0 || totalFuel <= 0) return null
    
    // 100 km ga sarf = (jami yoqilg'i / jami km) * 100
    const per100km = (totalFuel / totalKm) * 100
    // 1 yoqilg'i birligiga qancha km
    const kmPerUnit = totalKm / totalFuel
    
    return {
      per100km: Math.round(per100km * 10) / 10,
      kmPerUnit: Math.round(kmPerUnit * 10) / 10,
      totalKm,
      totalFuel: Math.round(totalFuel)
    }
  })()

  // Jami xarajat
  const totalCost = stats.totalCost || refills.reduce((sum, r) => sum + (r.cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Asosiy ko'rsatkichlar - 2 ta karta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Jami xarajat */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border-2 border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <p className="text-emerald-700 font-medium">Jami xarajat</p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{fmt(totalCost)} <span className="text-lg font-medium">so'm</span></p>
        </div>

        {/* O'rtacha sarf */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-700 font-medium">O'rtacha sarf</p>
          </div>
          {fuelEfficiency ? (
            <div>
              <p className="text-3xl font-bold text-blue-700">
                {fuelEfficiency.kmPerUnit} <span className="text-lg font-medium">km/{unit}</span>
              </p>
              <p className="text-blue-600 text-sm mt-1">
                yoki {fuelEfficiency.per100km} {unit}/100km
              </p>
              <p className="text-blue-500 text-xs mt-1">
                {fmt(fuelEfficiency.totalKm)} km asosida hisoblandi
              </p>
            </div>
          ) : (
            <p className="text-blue-600 text-lg">
              Kamida 2 ta yoqilg'i yozuvi kerak
            </p>
          )}
        </div>
      </div>

      {/* Add Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowVoiceRecorder(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-500/25"
        >
          <Mic size={18} />
          Ovoz
        </button>
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onResult={(voiceData) => {
            setShowVoiceRecorder(false)
            if (onVoiceAdd) {
              onVoiceAdd(voiceData)
            }
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* List */}
      {refills.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">Tarix</h3>
          {refills.map(r => {
            // Har bir yozuv uchun o'z birligini aniqlash
            const itemFuelType = (r.fuelType || vehicle?.fuelType || '').toLowerCase()
            const itemIsGas = itemFuelType === 'metan' || itemFuelType === 'gas' || itemFuelType === 'propan' || itemFuelType.includes('metan') || itemFuelType.includes('gaz')
            const itemUnit = itemIsGas ? 'kub' : 'litr'
            
            return (
              <div key={r._id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <Fuel className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">{r.liters} {itemUnit}</p>
                      <p className="text-gray-500 text-sm">{fmtDate(r.date)} {r.odometer ? `• ${fmt(r.odometer)} km` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-emerald-600 font-bold">{fmt(r.cost)}</p>
                    <button onClick={() => onEdit(r)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(r._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Fuel} text="Yoqilg'i ma'lumotlari yo'q" />
      )}
    </div>
  )
})

const EmptyState = memo(({ icon: Icon, text }) => (
  <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
    <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500">{text}</p>
  </div>
))
