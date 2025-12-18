import { createPortal } from 'react-dom'
import { X, Route, Gauge, Fuel, Map } from 'lucide-react'
import AddressAutocomplete from '../AddressAutocomplete'

export default function FlightModal({ 
  show, 
  onClose, 
  onSubmit, 
  form, 
  setForm, 
  selectedDriver,
  onOpenLocationPicker 
}) {
  if (!show || !selectedDriver) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div 
        className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-t-3xl" />
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Reys ochish</h2>
                <p className="text-green-300 text-sm">{selectedDriver.fullName}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Odometer */}
          <div>
            <label className="block text-sm font-semibold text-green-200 mb-2">
              <Gauge size={14} className="inline mr-1" /> Odometr (km)
            </label>
            <input 
              type="number" 
              value={form.startOdometer} 
              onChange={(e) => setForm({ ...form, startOdometer: e.target.value })} 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" 
              placeholder="0" 
            />
          </div>

          {/* Yoqilg'i turi */}
          <div>
            <label className="block text-sm font-semibold text-green-200 mb-2">
              <Fuel size={14} className="inline mr-1" /> Yoqilg'i turi
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: 'benzin', label: 'Benzin', icon: '⛽', unit: 'litr' },
                { value: 'diesel', label: 'Dizel', icon: '🛢️', unit: 'litr' },
                { value: 'gas', label: 'Gaz', icon: '🔵', unit: 'kub' },
                { value: 'metan', label: 'Metan', icon: '🟢', unit: 'kub' },
                { value: 'propan', label: 'Propan', icon: '🟡', unit: 'litr' }
              ].map(fuel => (
                <button
                  key={fuel.value}
                  type="button"
                  onClick={() => setForm({ ...form, fuelType: fuel.value, fuelUnit: fuel.unit })}
                  className={`p-2 rounded-xl border text-center transition ${
                    form.fuelType === fuel.value
                      ? 'border-green-500 bg-green-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-lg">{fuel.icon}</span>
                  <p className="text-[10px] mt-0.5">{fuel.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Yoqilg'i miqdori */}
          <div>
            <label className="block text-sm font-semibold text-green-200 mb-2">
              Yoqilg'i miqdori ({form.fuelUnit || 'litr'})
            </label>
            <input 
              type="number" 
              value={form.startFuel} 
              onChange={(e) => setForm({ ...form, startFuel: e.target.value })} 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" 
              placeholder="0" 
            />
          </div>

          {/* Flight Type */}
          <div>
            <label className="block text-sm font-semibold text-green-200 mb-2">Reys turi</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setForm({ ...form, flightType: 'domestic' })} 
                className={`p-3 rounded-xl border-2 transition-all ${
                  form.flightType === 'domestic' 
                    ? 'border-green-500 bg-green-500/20 text-white' 
                    : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                🇺🇿 Ichki
              </button>
              <button 
                type="button" 
                onClick={() => setForm({ ...form, flightType: 'international' })} 
                className={`p-3 rounded-xl border-2 transition-all ${
                  form.flightType === 'international' 
                    ? 'border-green-500 bg-green-500/20 text-white' 
                    : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                🌍 Xalqaro
              </button>
            </div>
          </div>

          {/* Route */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">📍 Birinchi bosqich</h3>
              <button 
                type="button" 
                onClick={onOpenLocationPicker}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition"
              >
                <Map size={14} /> Xaritadan
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-green-200 mb-2">Qayerdan</label>
                <AddressAutocomplete
                  value={form.fromCity}
                  onChange={(val) => setForm({ ...form, fromCity: val })}
                  onSelect={(suggestion) => setForm({ 
                    ...form, 
                    fromCity: suggestion.name,
                    fromCoords: { lat: suggestion.lat, lng: suggestion.lng }
                  })}
                  placeholder="Shahar nomi..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-200 mb-2">Qayerga</label>
                <AddressAutocomplete
                  value={form.toCity}
                  onChange={(val) => setForm({ ...form, toCity: val })}
                  onSelect={(suggestion) => setForm({ 
                    ...form, 
                    toCity: suggestion.name,
                    toCoords: { lat: suggestion.lat, lng: suggestion.lng }
                  })}
                  placeholder="Shahar nomi..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-green-200 mb-2">Yo'l puli (so'm)</label>
                <input 
                  type="number" 
                  value={form.givenBudget} 
                  onChange={(e) => setForm({ ...form, givenBudget: e.target.value })} 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition" 
                  placeholder="0" 
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25"
          >
            🚀 Reysni boshlash
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
