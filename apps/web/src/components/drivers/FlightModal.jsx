import { createPortal } from 'react-dom'
import { X, Route, Gauge, Fuel, Truck, MapPin, Globe, Circle, Droplet, Play } from 'lucide-react'
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
                {/* Header */}
                <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                <Route className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-white">Yangi mashrut</h2>
                                <p className="text-green-300 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">{selectedDriver.fullName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white">
                            <X size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </button>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-6 sm:pb-4">
                    {selectedVehicle && (
                        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <Truck size={18} className="sm:w-5 sm:h-5 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-semibold text-sm sm:text-base truncate">{selectedVehicle.plateNumber}</p>
                                <p className="text-slate-400 text-xs truncate">{selectedVehicle.brand}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">Mashrut turi</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setForm({ ...form, flightType: 'domestic' })}
                                className={`p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center gap-1.5 sm:gap-2 ${isDomestic ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                <MapPin size={18} className="sm:w-5 sm:h-5" /><span className="font-medium text-xs sm:text-sm">Mahalliy</span>
                            </button>
                            <button type="button" onClick={() => setForm({ ...form, flightType: 'international' })}
                                className={`p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center gap-1.5 sm:gap-2 ${!isDomestic ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                <Globe size={18} className="sm:w-5 sm:h-5" /><span className="font-medium text-xs sm:text-sm">Xalqaro</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">
                                <Gauge size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1" />Spidometr
                            </label>
                            <input type="text" inputMode="numeric" value={formatNumber(form.startOdometer)}
                                onChange={(e) => setForm({ ...form, startOdometer: e.target.value.replace(/\s/g, '') })}
                                className="w-full px-3 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:border-green-500 focus:outline-none"
                                placeholder="123456" />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">
                                <Fuel size={12} className="sm:w-3.5 sm:h-3.5 inline mr-1" />Yoqilgi
                            </label>
                            <input type="number" value={form.startFuel}
                                onChange={(e) => setForm({ ...form, startFuel: e.target.value })}
                                className="w-full px-3 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:border-green-500 focus:outline-none"
                                placeholder="100" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">Yoqilgi turi</label>
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                            {[
                                { value: 'metan', label: 'Metan', color: 'text-green-400', unit: 'kub' },
                                { value: 'propan', label: 'Propan', color: 'text-yellow-400', unit: 'kub' },
                                { value: 'benzin', label: 'Benzin', color: 'text-red-400', unit: 'litr' },
                                { value: 'diesel', label: 'Dizel', color: 'text-orange-400', unit: 'litr' }
                            ].map(fuel => (
                                <button key={fuel.value} type="button"
                                    onClick={() => setForm({ ...form, fuelType: fuel.value, fuelUnit: fuel.unit })}
                                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-center ${form.fuelType === fuel.value ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                    {fuel.value === 'benzin' || fuel.value === 'diesel' ? (
                                        <Droplet size={20} className={`sm:w-6 sm:h-6 mx-auto ${fuel.color}`} />
                                    ) : (
                                        <Circle size={20} className={`sm:w-6 sm:h-6 mx-auto ${fuel.color}`} fill="currentColor" />
                                    )}
                                    <p className="text-[9px] sm:text-[10px] mt-0.5">{fuel.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-white/10">
                        <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Birinchi buyurtma</h3>
                        <div className="space-y-2 sm:space-y-3">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-1.5">Qayerdan *</label>
                                <AddressAutocomplete value={form.fromCity} onChange={(val) => setForm({ ...form, fromCity: val })}
                                    onSelect={(s) => setForm({ ...form, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } })}
                                    placeholder="Toshkent" focusColor="green" domesticOnly={isDomestic} />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-1.5">Qayerga *</label>
                                <AddressAutocomplete value={form.toCity} onChange={(val) => setForm({ ...form, toCity: val })}
                                    onSelect={(s) => setForm({ ...form, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } })}
                                    placeholder="Samarqand" focusColor="green" domesticOnly={isDomestic} />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-1.5">Berilgan pul (som)</label>
                                <input type="text" inputMode="numeric" value={formatNumber(form.givenBudget)}
                                    onChange={(e) => setForm({ ...form, givenBudget: e.target.value.replace(/\s/g, '') })}
                                    className="w-full px-3 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:border-green-500 focus:outline-none"
                                    placeholder="200 000" />
                            </div>
                            
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-1.5">Mijozdan to'lov (som)</label>
                                <input type="text" inputMode="numeric" value={formatNumber(form.payment)}
                                    onChange={(e) => setForm({ ...form, payment: e.target.value.replace(/\s/g, '') })}
                                    className="w-full px-3 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:border-green-500 focus:outline-none"
                                    placeholder="500 000" />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1.5 sm:mb-2">To'lov turi</label>
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                    <button type="button" onClick={() => setForm({ ...form, paymentType: 'cash' })}
                                        className={`p-2 sm:p-2.5 rounded-lg border text-center ${form.paymentType === 'cash' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                        <span className="text-xs sm:text-sm font-medium">💵 Naqd</span>
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, paymentType: 'transfer' })}
                                        className={`p-2 sm:p-2.5 rounded-lg border text-center ${form.paymentType === 'transfer' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                        <span className="text-xs sm:text-sm font-medium">💳 Karta</span>
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, paymentType: 'peritsena' })}
                                        className={`p-2 sm:p-2.5 rounded-lg border text-center ${form.paymentType === 'peritsena' ? 'border-green-500 bg-green-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                        <span className="text-xs sm:text-sm font-medium">🏦 Peritsena</span>
                                    </button>
                                </div>
                            </div>

                            {(form.paymentType === 'transfer' || form.paymentType === 'peritsena') && (
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-1.5">
                                        Firma xarajatlari (%)
                                        {form.paymentType === 'peritsena' && <span className="text-amber-400 ml-1">- Peritsena</span>}
                                    </label>
                                    <input type="number" value={form.transferFeePercent || ''}
                                        onChange={(e) => setForm({ ...form, transferFeePercent: e.target.value })}
                                        className="w-full px-3 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:border-green-500 focus:outline-none"
                                        placeholder="10" min="0" max="100" />
                                    {form.payment && form.transferFeePercent && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            Firma xarajati: {formatNumber(Math.round((form.payment.replace(/\s/g, '') || 0) * (form.transferFeePercent || 0) / 100))} som
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-sm sm:text-base hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                        <Play size={18} className="sm:w-5 sm:h-5" />
                        Mashrutni boshlash
                    </button>
                </form>
            </div>
        </div>,
        document.body
    )
}
