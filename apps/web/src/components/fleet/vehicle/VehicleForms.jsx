import { memo } from 'react'
import { X } from 'lucide-react'
import { FUEL_TYPES, TIRE_POSITIONS, SERVICE_TYPES } from './constants'

export const Modal = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
        {children}
      </div>
    </div>
  </div>
))

export const FuelForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <div className="grid grid-cols-2 gap-5">
      <Input label="Litr" type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} error={errors.liters} required />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} required />
    </div>
    <div className="grid grid-cols-2 gap-5">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
      <Input label="Spidometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} />
    </div>
    <Select label="Yoqilg'i turi" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={FUEL_TYPES} />
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const OilForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <Input label="Moy turi" value={form.oilType} onChange={v => setForm(f => ({ ...f, oilType: v }))} error={errors.oilType} placeholder="5W-40" required />
    <Input label="Moy brendi" value={form.oilBrand} onChange={v => setForm(f => ({ ...f, oilBrand: v }))} placeholder="Mobil, Shell..." />
    <div className="grid grid-cols-2 gap-5">
      <Input label="Litr" type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} required />
    </div>
    <div className="grid grid-cols-2 gap-5">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
      <Input label="Spidometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} />
    </div>
    <Input 
      label="Keyingi almashtirish (km)" 
      type="number" 
      value={form.nextChangeKm} 
      onChange={v => setForm(f => ({ ...f, nextChangeKm: v }))} 
      placeholder="10000"
    />
    <p className="text-sm text-gray-500 -mt-2">Necha km dan keyin moy almashtiriladi (default: 10,000 km)</p>
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const TireForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <Select label="Pozitsiya" value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))}
      options={TIRE_POSITIONS.map(p => ({ value: p, label: p }))} />
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin, Bridgestone..." required />
    <div className="grid grid-cols-2 gap-5">
      <Input label="Model" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} />
      <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    </div>
    <div className="grid grid-cols-2 gap-5">
      <Input label="O'rnatish sanasi" type="date" value={form.installDate} onChange={v => setForm(f => ({ ...f, installDate: v }))} />
      <Input label="O'rnatish km" type="number" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} />
    </div>
    <div className="grid grid-cols-2 gap-5">
      <Input label="Kutilgan umr (km)" type="number" value={form.expectedLifeKm} onChange={v => setForm(f => ({ ...f, expectedLifeKm: v }))} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} />
    </div>
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const BulkTireForm = memo(({ form, setForm, errors, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin, Bridgestone..." required />
    <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    <div className="grid grid-cols-2 gap-5">
      <Select label="Shinalar soni" value={form.count} onChange={v => setForm(f => ({ ...f, count: v }))}
        options={[{ value: '4', label: '4 ta' }, { value: '6', label: '6 ta' }]} />
      <Input label="Jami narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} />
    </div>
    <Input label="O'rnatish km" type="number" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} />
    <button type="submit" className="w-full py-5 text-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25">
      Barchasini qo'shish
    </button>
  </form>
))

export const ServiceForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <Select label="Xizmat turi" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
      options={SERVICE_TYPES.map(t => ({ value: t, label: t }))} />
    <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} required />
    <div className="grid grid-cols-2 gap-5">
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

const Input = memo(({ label, type = 'text', value, onChange, placeholder, error, required }) => {
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
      <label className="block text-base font-medium text-gray-700 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={isNumber ? 'text' : type}
        inputMode={isNumber ? 'numeric' : undefined}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-5 py-4 text-lg bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
})

const Select = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-base font-medium text-gray-700 mb-3">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-5 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))

const Textarea = memo(({ label, value, onChange }) => (
  <div>
    <label className="block text-base font-medium text-gray-700 mb-3">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-5 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
    />
  </div>
))

const SubmitButton = memo(({ isEdit }) => (
  <button type="submit" className="w-full py-5 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl text-white font-semibold transition-all shadow-lg shadow-blue-500/25">
    {isEdit ? 'Yangilash' : 'Saqlash'}
  </button>
))

export const VehicleForms = { Modal, FuelForm, OilForm, TireForm, BulkTireForm, ServiceForm }
