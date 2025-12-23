import { memo } from 'react'
import { X } from 'lucide-react'
import { FUEL_TYPES, TIRE_POSITIONS, SERVICE_TYPES } from './constants'

export const Modal = memo(({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
          <X size={20} />
        </button>
      </div>
      <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
        {children}
      </div>
    </div>
  </div>
))

export const FuelForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <Input label="Litr" type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} error={errors.liters} required />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} required />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
      <Input label="Odometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} />
    </div>
    <Select label="Yoqilg'i turi" value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={FUEL_TYPES} />
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const OilForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input label="Moy turi" value={form.oilType} onChange={v => setForm(f => ({ ...f, oilType: v }))} error={errors.oilType} placeholder="5W-40" required />
    <Input label="Moy brendi" value={form.oilBrand} onChange={v => setForm(f => ({ ...f, oilBrand: v }))} placeholder="Mobil, Shell..." />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Litr" type="number" value={form.liters} onChange={v => setForm(f => ({ ...f, liters: v }))} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} required />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
      <Input label="Odometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} />
    </div>
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const TireForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Select label="Pozitsiya" value={form.position} onChange={v => setForm(f => ({ ...f, position: v }))}
      options={TIRE_POSITIONS.map(p => ({ value: p, label: p }))} />
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin, Bridgestone..." required />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Model" value={form.model} onChange={v => setForm(f => ({ ...f, model: v }))} />
      <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="O'rnatish sanasi" type="date" value={form.installDate} onChange={v => setForm(f => ({ ...f, installDate: v }))} />
      <Input label="O'rnatish km" type="number" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Input label="Kutilgan umr (km)" type="number" value={form.expectedLifeKm} onChange={v => setForm(f => ({ ...f, expectedLifeKm: v }))} />
      <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} />
    </div>
    <SubmitButton isEdit={isEdit} />
  </form>
))

export const BulkTireForm = memo(({ form, setForm, errors, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input label="Brend" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} error={errors.brand} placeholder="Michelin, Bridgestone..." required />
    <Input label="O'lcham" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} placeholder="315/80 R22.5" />
    <div className="grid grid-cols-2 gap-4">
      <Select label="Shinalar soni" value={form.count} onChange={v => setForm(f => ({ ...f, count: v }))}
        options={[{ value: '4', label: '4 ta' }, { value: '6', label: '6 ta' }]} />
      <Input label="Jami narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} />
    </div>
    <Input label="O'rnatish km" type="number" value={form.installOdometer} onChange={v => setForm(f => ({ ...f, installOdometer: v }))} />
    <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-all">
      Barchasini qo'shish
    </button>
  </form>
))

export const ServiceForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Select label="Xizmat turi" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))}
      options={SERVICE_TYPES.map(t => ({ value: t, label: t }))} />
    <Input label="Narx (so'm)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: v }))} error={errors.cost} required />
    <div className="grid grid-cols-2 gap-4">
      <Input label="Sana" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
      <Input label="Odometr" type="number" value={form.odometer} onChange={v => setForm(f => ({ ...f, odometer: v }))} />
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
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={isNumber ? 'text' : type}
        inputMode={isNumber ? 'numeric' : undefined}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all ${error ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/50'}`}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
})

const Select = memo(({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white focus:outline-none focus:border-blue-500/50 transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
))

const Textarea = memo(({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
    />
  </div>
))

const SubmitButton = memo(({ isEdit }) => (
  <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-all">
    {isEdit ? 'Yangilash' : 'Saqlash'}
  </button>
))

export const VehicleForms = { Modal, FuelForm, OilForm, TireForm, BulkTireForm, ServiceForm }
