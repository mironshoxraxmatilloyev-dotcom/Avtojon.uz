import { memo } from 'react'
import { X } from 'lucide-react'
import { FUEL_TYPES, TIRE_POSITIONS, SERVICE_TYPES } from './constants'

export const Modal = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
    <div 
      className="bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-2xl overflow-hidden"
      style={{
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div 
        className="p-4 sm:p-5 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 180px)' }}
      >
        {children}
      </div>
    </div>
  </div>
))

export const FuelForm = memo(({ form, setForm, errors, onSubmit, isEdit, vehicle, oilData, tires }) => {
  // Yoqilg'i turiga qarab birlik
  const unit = form.fuelType === 'metan' ? 'kub' : 'litr'

  // Real-time ogohlantirish tekshirish
  const getMaintenanceWarnings = () => {
    const warnings = []
    const currentOdo = Number(form.odometer) || 0
    if (currentOdo <= 0) return warnings

    // Moy almashtirish tekshirish
    if (oilData?.lastChange) {
      const lastOilOdo = oilData.lastChange.odometer || 0
      const nextOilOdo = oilData.lastChange.nextChangeOdometer || (lastOilOdo + (vehicle?.oilChangeIntervalKm || 10000))
      const remainingKm = nextOilOdo - currentOdo
      
      if (remainingKm <= 0) {
        warnings.push({ type: 'danger', icon: '🛢️', message: `Moy almashtirish vaqti o'tdi! ${Math.abs(remainingKm)} km ortiqcha yurildi` })
      } else if (remainingKm <= 1000) {
        warnings.push({ type: 'warning', icon: '🛢️', message: `Moy almashtirishga ${remainingKm} km qoldi` })
      } else if (remainingKm <= 2000) {
        warnings.push({ type: 'info', icon: '🛢️', message: `Moy almashtirishga ${remainingKm} km qoldi` })
      }
    }

    // Shina tekshirish
    if (tires && tires.length > 0) {
      const activeTires = tires.filter(t => t.status !== 'replaced')
      for (const tire of activeTires) {
        const usedKm = currentOdo - (tire.installOdometer || 0)
        const expectedLife = tire.expectedLifeKm || 80000
        const remainingKm = expectedLife - usedKm
        
        if (remainingKm <= 0) {
          warnings.push({ type: 'danger', icon: '🔴', message: `${tire.position} shina almashtirish kerak!` })
        } else if (remainingKm <= 5000) {
          warnings.push({ type: 'warning', icon: '🟡', message: `${tire.position} shinaga ${remainingKm} km qoldi` })
        }
      }
    }

    return warnings
  }

  const warnings = getMaintenanceWarnings()

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label={unit === 'kub' ? 'Kub' : 'Litr'} type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} error={errors.liters} placeholder="50" />
        <Input label="Jami summa (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} placeholder="500 000" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Input label="Spidometr (km)" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} placeholder={vehicle?.currentOdometer ? formatNumber(vehicle.currentOdometer) : '100 000'} />
      </div>

      {/* Real-time ogohlantirishlar */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                w.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700' :
                w.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <span>{w.icon}</span>
              <span className="text-sm font-medium">{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <Select label="Yoqilg'i turi" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={FUEL_TYPES} />
      <SubmitButton isEdit={isEdit} />
    </form>
  )
})

export const OilForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => {
  // Jami xarajatni hisoblash (moy + filtrlar)
  const totalCost = (Number(form.cost) || 0) + 
    (form.filterChanged ? (Number(form.filterCost) || 0) : 0) +
    (form.airFilterChanged ? (Number(form.airFilterCost) || 0) : 0) +
    (form.fuelFilterChanged ? (Number(form.fuelFilterCost) || 0) : 0)

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input label="Moy turi" value={form.oilType} onChange={v => setForm(f => ({ ...f, oilType: v }))} error={errors.oilType} placeholder="5W-40, 10W-40..." />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Litr" type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} placeholder="8" />
        <Input label="Jami summa (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} placeholder="400 000" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        <Input label="Spidometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} placeholder="100 000" />
      </div>

      {/* Filtrlar bo'limi */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Filtrlar</p>
        
        {/* Moy filtri */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.filterChanged || false}
              onChange={e => setForm(f => ({ ...f, filterChanged: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-700 text-sm">Moy filtri</span>
          </label>
          {form.filterChanged && (
            <Input label="Moy filtri narxi" type="number" value={form.filterCost} onChange={v => setForm(f => ({ ...f, filterCost: v }))} placeholder="50 000" />
          )}
        </div>

        {/* Havo filtri */}
        <div className="space-y-2 mt-2">
          <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.airFilterChanged || false}
              onChange={e => setForm(f => ({ ...f, airFilterChanged: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-700 text-sm">Havo filtri</span>
          </label>
          {form.airFilterChanged && (
            <Input label="Havo filtri narxi" type="number" value={form.airFilterCost} onChange={v => setForm(f => ({ ...f, airFilterCost: v }))} placeholder="30 000" />
          )}
        </div>

        {/* Yoqilg'i filtri */}
        <div className="space-y-2 mt-2">
          <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.fuelFilterChanged || false}
              onChange={e => setForm(f => ({ ...f, fuelFilterChanged: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-700 text-sm">Yoqilg'i filtri</span>
          </label>
          {form.fuelFilterChanged && (
            <Input label="Yoqilg'i filtri narxi" type="number" value={form.fuelFilterCost} onChange={v => setForm(f => ({ ...f, fuelFilterCost: v }))} placeholder="40 000" />
          )}
        </div>
      </div>

      {/* Jami xarajat (moy + filtrlar) */}
      {totalCost > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-amber-700 text-sm font-medium">Jami (moy + filtrlar):</span>
            <span className="text-amber-700 font-bold">{formatNumber(totalCost)} so'm</span>
          </div>
        </div>
      )}

      <Input 
        label="Necha km dan keyin almashtirish" 
        type="number" 
        value={form.nextChangeKm} 
        onChange={v => setForm(f => ({ ...f, nextChangeKm: v }))} 
        placeholder="10000 (default)"
      />
      <p className="text-xs text-gray-500 -mt-1">Masalan: 10000 km dan keyin moy almashtiriladi</p>
      <SubmitButton isEdit={isEdit} />
    </form>
  )
})

export const TireForm = memo(({ form, setForm, errors, onSubmit, isEdit, vehicleOdometer }) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Select label="Pozitsiya" value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))}
      options={TIRE_POSITIONS.map(p => ({ value: p, label: p }))} />
    <div className="grid grid-cols-2 gap-3">
      <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin..." />
      <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    </div>
    <Input label="DOT raqami (seriya)" value={form.serialNumber} onChange={v => setForm(f => ({ ...f, serialNumber: v }))} placeholder="DOT XXXX XXXX 2024" />
    <div className="grid grid-cols-2 gap-3">
      <Input label="O'rnatish sanasi" type="date" value={form.installDate} onChange={v => setForm(f => ({ ...f, installDate: v }))} />
      <Input 
        label="O'rnatish km" 
        type="number" 
        value={form.installOdometer} 
        onChange={v => setForm(f => ({ ...f, installOdometer: v }))} 
        placeholder={vehicleOdometer ? formatNumber(vehicleOdometer) : '100 000'}
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Input label="Kutilgan umr (km)" type="number" value={form.expectedLifeKm} onChange={v => setForm(f => ({ ...f, expectedLifeKm: v }))} placeholder="80 000" />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} placeholder="500 000" />
    </div>
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const BulkTireForm = memo(({ form, setForm, errors, onSubmit, vehicleOdometer }) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin, Bridgestone..." />
    <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    <Input label="DOT raqami (seriya)" value={form.serialNumber} onChange={v => setForm(f => ({ ...f, serialNumber: v }))} placeholder="DOT XXXX XXXX 2024" />
    <div className="grid grid-cols-2 gap-3">
      <Select label="Shinalar soni" value={form.count} onChange={v => setForm(f => ({ ...f, count: v }))}
        options={[{ value: '4', label: '4 ta' }, { value: '6', label: '6 ta' }, { value: '8', label: '8 ta' }, { value: '10', label: '10 ta' }]} />
      <Input label="Jami narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} placeholder="2 000 000" />
    </div>
    <Input 
      label="O'rnatish km" 
      type="number" 
      value={form.installOdometer} 
      onChange={v => setForm(f => ({ ...f, installOdometer: v }))} 
      placeholder={vehicleOdometer ? formatNumber(vehicleOdometer) : '100 000'}
    />
    <button type="submit" className="w-full py-3 text-base bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-lg text-white font-semibold transition-all shadow-lg shadow-purple-500/25">
      Barchasini qo'shish
    </button>
  </form>
))

export const ServiceForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Select label="Xizmat turi" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
      options={SERVICE_TYPES.map(t => ({ value: t, label: t }))} />
    <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} />
    <div className="grid grid-cols-2 gap-3">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
      <Input label="Spidometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} />
    </div>
    <Textarea label="Izoh" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
    <SubmitButton isEdit={isEdit} />
  </form>
))

// Raqamni formatlash (1000000 -> 1 000 000)
const formatNumber = (value) => {
  if (!value) return ''
  const num = value.toString().replace(/\s/g, '')
  if (isNaN(num)) return value
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Formatdan tozalash
const unformatNumber = (value) => {
  return value.toString().replace(/\s/g, '')
}

const Input = memo(({ label, type = 'text', value, onChange, placeholder, error }) => {
  const isNumber = type === 'number'

  const handleChange = (e) => {
    if (isNumber) {
      const raw = unformatNumber(e.target.value)
      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
        onChange(raw)
      }
    } else {
      onChange(e.target.value)
    }
  }

  const displayValue = isNumber ? formatNumber(value) : value

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        type={isNumber ? 'text' : type}
        inputMode={isNumber ? 'numeric' : undefined}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 text-base bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
})

const Select = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))

const Textarea = memo(({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      className="w-full px-3 py-2.5 text-base bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
    />
  </div>
))

const SubmitButton = memo(({ isEdit }) => (
  <button type="submit" className="w-full py-3 text-base bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg text-white font-semibold transition-all shadow-lg shadow-blue-500/25">
    {isEdit ? 'Yangilash' : 'Saqlash'}
  </button>
))

export const VehicleForms = { Modal, FuelForm, OilForm, TireForm, BulkTireForm, ServiceForm }
