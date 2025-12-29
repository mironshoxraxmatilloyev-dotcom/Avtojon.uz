import { createPortal } from 'react-dom'
import { X, Route, Gauge, Fuel, Truck } from 'lucide-react'
import AddressAutocomplete from '../AddressAutocomplete'

const formatNumber = (value) => {
  if (!value) return ''
  const num = value.toString().replace(/\s/g, '')
  if (isNaN(num)) return value
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export default function FlightModal({ show, onClose, onSubmit, form, setForm, selectedDriver, selectedVehicle }) {
  if (!show || !selectedDriver) return null
  const isDomestic = form.flightType === 'domestic'

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Route className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Yangi marshrut</h2>
                <p className="text-green-300 text-sm">{selectedDriver.fullName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white"><X size={22} /></button>
          </div>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-4">
          {selectedVehicle && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><Truck size={20} className="text-blue-400" /></div>
              <div><p className="text-white font-semibold">{selectedVehicle.plateNumber}</p><p className="text-slate-400 text-xs">{selectedVehicle.brand}</p></div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Marshrut turi</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, flightType: 'domestic' })} className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${isDomestic ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}><span>🇺🇿</span><span className="font-medium text-sm">Mahalliy</span></button>
              <button type="button" onClick={() => setForm({ ...form, flightType: 'international' })} className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 ${!isDomestic ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}><span>🌍</span><span className="font-medium text-sm">Xalqaro</span></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-400 mb-2"><Gauge size={14} className="inline mr-1" />Spidometr</label><input type="text" inputMode="numeric" value={formatNumber(form.startOdometer)} onChange={(e) => setForm({ ...form, startOdometer: e.target.value.replace(/\s/g, '') })} className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none" placeholder="123456" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-2"><Fuel size={14} className="inline mr-1" />Yoqilgi</label><input type="number" value={form.startFuel} onChange={(e) => setForm({ ...form, startFuel: e.target.value })} className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none" placeholder="100" /></div>
          </div>
          <div className="pt-3 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white mb-3">Birinchi buyurtma</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Qayerdan *</label><AddressAutocomplete value={form.fromCity} onChange={(val) => setForm({ ...form, fromCity: val })} onSelect={(s) => setForm({ ...form, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } })} placeholder="Toshkent" focusColor="green" domesticOnly={isDomestic} /></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Qayerga *</label><AddressAutocomplete value={form.toCity} onChange={(val) => setForm({ ...form, toCity: val })} onSelect={(s) => setForm({ ...form, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } })} placeholder="Samarqand" focusColor="green" domesticOnly={isDomestic} /></div>
              <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Berilgan pul</label><input type="text" inputMode="numeric" value={formatNumber(form.givenBudget)} onChange={(e) => setForm({ ...form, givenBudget: e.target.value.replace(/\s/g, '') })} className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:outline-none" placeholder="200 000" /></div>
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25">🚀 Marshrutni boshlash</button>
        </form>
      </div>
    </div>,
    document.body
  )
}
