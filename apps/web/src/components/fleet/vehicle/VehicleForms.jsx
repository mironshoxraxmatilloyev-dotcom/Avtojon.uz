import { memo, useState } from 'react'
import { X, Droplet, AlertCircle } from 'lucide-react'
import { FUEL_TYPES, TIRE_POSITIONS, SERVICE_TYPES } from './constants'

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

export const Modal = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
    <div
      className="bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-2xl overflow-hidden flex flex-col"
      style={{
        maxHeight: 'calc(100vh - 100px)'
      }}
    >
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div
        className="p-4 sm:p-5 overflow-y-auto flex-1"
      >
        {children}
      </div>
    </div>
  </div>
))

export const FuelForm = memo(({ form, setForm, errors, onSubmit, isEdit, vehicle, oilData, tires }) => {
  // Yoqilg'i turiga qarab birlik - metan, gas, propan = kub, boshqalar = litr
  const fuelType = form.fuelType?.toLowerCase() || ''
  const isGas = fuelType === 'metan' || fuelType === 'gas' || fuelType === 'propan' || fuelType.includes('metan') || fuelType.includes('gaz')
  const unit = isGas ? 'kub' : 'litr'

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
        warnings.push({ type: 'danger', iconType: 'oil', message: `⚠️ Moy almashtirish vaqti o'tdi! ${Math.abs(remainingKm).toLocaleString()} km ortiqcha yurildi` })
      } else if (remainingKm <= 1000) {
        warnings.push({ type: 'danger', iconType: 'oil', message: `🔴 Moy almashtirishga ${remainingKm.toLocaleString()} km qoldi!` })
      } else if (remainingKm <= 3000) {
        warnings.push({ type: 'warning', iconType: 'oil', message: `🟠 Moy almashtirishga ${remainingKm.toLocaleString()} km qoldi` })
      } else if (remainingKm <= 5000) {
        warnings.push({ type: 'info', iconType: 'oil', message: `🟡 Moy almashtirishga ${remainingKm.toLocaleString()} km qoldi` })
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
          warnings.push({ type: 'danger', iconType: 'tire', message: `${tire.position} shina almashtirish kerak!` })
        } else if (remainingKm <= 5000) {
          warnings.push({ type: 'warning', iconType: 'tire', message: `${tire.position} shinaga ${remainingKm.toLocaleString()} km qoldi` })
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
              className={`flex items-center gap-2 p-3 rounded-lg border ${w.type === 'danger' ? 'bg-red-50 border-red-200 text-red-700' :
                w.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  'bg-blue-50 border-blue-200 text-blue-700'
                }`}
            >
              {w.iconType === 'oil' ? <Droplet size={16} /> : <AlertCircle size={16} />}
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

export const OilForm = ({ form, setForm, errors, onSubmit, isEdit }) => {
  // Jami xarajatni hisoblash (moy + filtrlar)
  const totalCost = (Number(form.cost) || 0) +
    (form.oilFilterCost ? (Number(form.oilFilterCost) || 0) : 0) +
    (form.airFilterCost ? (Number(form.airFilterCost) || 0) : 0) +
    (form.cabinFilterCost ? (Number(form.cabinFilterCost) || 0) : 0) +
    (form.gasFilterCost ? (Number(form.gasFilterCost) || 0) : 0)

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input label="Moy turi" value={form.oilType} onChange={v => setForm(f => ({ ...f, oilType: v }))} error={errors.oilType} placeholder="5W-40, 10W-40..." />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Litr" type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} error={errors.liters} placeholder="8" />
        <Input label="Moy narxi (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} placeholder="400 000" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} error={errors.date} />
        <Input label="Spidometr (km)" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} placeholder="100 000" />
      </div>

      {/* Filtrlar bo'limi - 4 ta filtr */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
        <h3 className="text-sm font-semibold text-blue-900">Filtrlar (ixtiyoriy)</h3>

        {/* Moy filtri */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={!!form.oilFilterCost}
              onChange={e => setForm(f => ({ ...f, oilFilterCost: e.target.checked ? '' : undefined }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500"
            />
            <span className="text-gray-700 text-sm font-medium">Moy filtri</span>
          </label>
          {form.oilFilterCost !== undefined && (
            <Input label="Narxi (so'm)" type="number" value={form.oilFilterCost} onChange={v => setForm(f => ({ ...f, oilFilterCost: v }))} placeholder="50 000" />
          )}
        </div>

        {/* Havo filtri */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={!!form.airFilterCost}
              onChange={e => setForm(f => ({ ...f, airFilterCost: e.target.checked ? '' : undefined }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500"
            />
            <span className="text-gray-700 text-sm font-medium">Havo filtri</span>
          </label>
          {form.airFilterCost !== undefined && (
            <Input label="Narxi (so'm)" type="number" value={form.airFilterCost} onChange={v => setForm(f => ({ ...f, airFilterCost: v }))} placeholder="30 000" />
          )}
        </div>

        {/* Salarka filtri */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={!!form.cabinFilterCost}
              onChange={e => setForm(f => ({ ...f, cabinFilterCost: e.target.checked ? '' : undefined }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500"
            />
            <span className="text-gray-700 text-sm font-medium">Salarka filtri</span>
          </label>
          {form.cabinFilterCost !== undefined && (
            <Input label="Narxi (so'm)" type="number" value={form.cabinFilterCost} onChange={v => setForm(f => ({ ...f, cabinFilterCost: v }))} placeholder="25 000" />
          )}
        </div>

        {/* Gaz filtri */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={!!form.gasFilterCost}
              onChange={e => setForm(f => ({ ...f, gasFilterCost: e.target.checked ? '' : undefined }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-500"
            />
            <span className="text-gray-700 text-sm font-medium">Gaz filtri</span>
          </label>
          {form.gasFilterCost !== undefined && (
            <Input label="Narxi (so'm)" type="number" value={form.gasFilterCost} onChange={v => setForm(f => ({ ...f, gasFilterCost: v }))} placeholder="35 000" />
          )}
        </div>
      </div>

      {/* Jami xarajat */}
      {totalCost > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-amber-700 text-sm font-medium">Jami xarajat:</span>
            <span className="text-amber-700 font-bold text-lg">{formatNumber(totalCost)} so'm</span>
          </div>
        </div>
      )}

      <Input
        label="Necha km dan keyin almashtirish"
        type="number"
        value={form.nextChangeKm}
        onChange={v => setForm(f => ({ ...f, nextChangeKm: v }))}
        placeholder="10000"
      />
      <p className="text-xs text-gray-500 -mt-1">Masalan: 10000 km dan keyin moy almashtiriladi</p>
      <SubmitButton isEdit={isEdit} />
    </form>
  );
};

export const TireForm = ({ form, setForm, errors, onSubmit, isEdit, vehicleOdometer }) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Select label="Pozitsiya" value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))}
      options={TIRE_POSITIONS.map(p => ({ value: p, label: p }))} />
    <div className="grid grid-cols-2 gap-3">
      <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin..." />
      <Input label="Model" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="Defender T/H..." />
    </div>
    <Input label="Shina raqami (o'lcham)" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} error={errors.size} placeholder="315/80 R22.5" />
    <div className="grid grid-cols-2 gap-3">
      <Input label="DOT raqami" value={form.dotNumber} onChange={v => setForm(f => ({ ...f, dotNumber: v }))} placeholder="DOT XXXX XXXX 2024" />
      <Input label="Seriya raqami" value={form.serialNumber} onChange={v => setForm(f => ({ ...f, serialNumber: v }))} placeholder="Shina seriya raqami" />
    </div>
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
);

export const BulkTireForm = memo(({ form, setForm, errors, onSubmit, vehicleOdometer }) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin, Bridgestone..." />
    <Input label="Model" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} placeholder="Defender T/H..." />
    <Input label="Shina raqami (o'lcham)" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} error={errors.size} placeholder="315/80 R22.5" />
    <div className="grid grid-cols-2 gap-3">
      <Input label="DOT raqami" value={form.dotNumber} onChange={v => setForm(f => ({ ...f, dotNumber: v }))} placeholder="DOT XXXX XXXX 2024" />
      <Input label="Seriya raqami" value={form.serialNumber} onChange={v => setForm(f => ({ ...f, serialNumber: v }))} placeholder="Shina seriya raqami" />
    </div>
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
));

export const ServiceForm = ({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-3">
    <Select label="Xizmat turi" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
      options={SERVICE_TYPES.map(t => ({ value: t, label: t }))} />
    <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} placeholder="500 000" />
    <div className="grid grid-cols-2 gap-3">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} error={errors.date} />
      <Input label="Spidometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} error={errors.odometer} placeholder="100 000" />
    </div>
    <Textarea label="Izoh" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
    <SubmitButton isEdit={isEdit} />
  </form>
);

export const VehicleForms = { Modal, FuelForm, OilForm, TireForm, BulkTireForm, ServiceForm }
