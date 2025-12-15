import { createPortal } from 'react-dom'
import { X, Route, Truck, MapPin, PenLine, Map, Wallet, Plus, ArrowRight } from 'lucide-react'
import AddressAutocomplete from '../AddressAutocomplete'
import { showToast } from '../Toast'
import { COUNTRIES, CITIES } from './constants'

export default function TripModal({
  form,
  setForm,
  drivers,
  vehicles,
  submitting,
  onSubmit,
  onClose,
  onOpenLocationPicker,
  routeMode,
  updateDistanceFromCoords,
  addWaypoint,
  removeWaypoint
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick={onClose} />
        <div 
          className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl my-8" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-t-3xl pointer-events-none"></div>
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Route className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Yangi reys</h2>
                  <p className="text-blue-300 text-sm">Reys malumotlarini kiriting</p>
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

          <form onSubmit={onSubmit} className="p-6 space-y-5">
            {/* Reys turi */}
            <TripTypeSelector form={form} setForm={setForm} />

            {/* Xalqaro reys - Yo'nalish nuqtalari */}
            {form.tripType === 'international' && (
              <InternationalWaypoints 
                form={form}
                addWaypoint={addWaypoint}
                removeWaypoint={removeWaypoint}
              />
            )}

            {/* Shofyor */}
            <DriverSelector form={form} setForm={setForm} drivers={drivers} vehicles={vehicles} updateDistanceFromCoords={updateDistanceFromCoords} />

            {/* Mashina */}
            <VehicleSelector form={form} setForm={setForm} vehicles={vehicles} />

            {/* Marshrut */}
            <RouteSection 
              form={form} 
              setForm={setForm} 
              routeMode={routeMode}
              onOpenLocationPicker={onOpenLocationPicker}
              updateDistanceFromCoords={updateDistanceFromCoords}
            />

            {/* Moliyaviy */}
            <FinancialSection form={form} setForm={setForm} />

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                  Yaratilmoqda...
                </>
              ) : (
                <>
                  <Plus size={20} /> Reys yaratish
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Reys turi tanlash
function TripTypeSelector({ form, setForm }) {
  const handleLocalClick = () => {
    console.log('Mahalliy tanlandi')
    setForm(prev => ({ ...prev, tripType: 'local', waypoints: [], countriesInRoute: [] }))
  }
  
  const handleInternationalClick = () => {
    console.log('Xalqaro tanlandi')
    setForm(prev => ({ ...prev, tripType: 'international' }))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-blue-200">Reys turi</label>
      <p className="text-xs text-yellow-400">Hozirgi: {form.tripType}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleLocalClick}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
            form.tripType === 'local'
              ? 'border-blue-500 bg-blue-500/20 text-white'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
          }`}
        >
          <span className="text-2xl">🇺🇿</span>
          <span className="font-medium">Mahalliy</span>
          <span className="text-xs opacity-70">O'zbekiston ichida</span>
        </button>
        <button
          type="button"
          onClick={handleInternationalClick}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
            form.tripType === 'international'
              ? 'border-emerald-500 bg-emerald-500/20 text-white'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
          }`}
        >
          <span className="text-2xl">🌍</span>
          <span className="font-medium">Xalqaro</span>
          <span className="text-xs opacity-70">UZB → KZ → RU</span>
        </button>
      </div>
    </div>
  )
}

// Xalqaro yo'nalish nuqtalari
function InternationalWaypoints({ form, addWaypoint, removeWaypoint }) {
  console.log('InternationalWaypoints rendered!')
  return (
    <div className="space-y-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
          🗺️ Yo'nalish nuqtalari
        </label>
        <span className="text-xs text-emerald-400/70">
          {form.waypoints.length} ta nuqta
        </span>
      </div>

      {/* Qo'shilgan nuqtalar */}
      {form.waypoints.length > 0 && (
        <div className="space-y-2">
          {form.waypoints.map((wp, idx) => (
            <div key={wp.id} className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
              <span className="text-lg">{COUNTRIES.find(c => c.code === wp.country)?.flag}</span>
              <div className="flex-1">
                <span className="text-white font-medium">{wp.city}</span>
                <span className="text-slate-400 text-xs ml-2">
                  {wp.type === 'start' ? '(Boshlash)' : wp.type === 'end' ? '(Tugash)' : '(Tranzit)'}
                </span>
              </div>
              <span className="text-xs text-slate-500">#{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeWaypoint(wp.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Nuqta qo'shish */}
      <div className="grid grid-cols-3 gap-2">
        {COUNTRIES.map(country => (
          <div key={country.code} className="space-y-1">
            <div className="text-xs text-slate-400 flex items-center gap-1 px-1">
              <span>{country.flag}</span> {country.name}
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  const type = form.waypoints.length === 0 ? 'start' : 'transit'
                  addWaypoint(country.code, e.target.value, type)
                  e.target.value = ''
                }
              }}
              className="w-full px-2 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="">+ Shahar</option>
              {CITIES[country.code]?.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Davlatlar ko'rsatkichi */}
      {form.countriesInRoute.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <span className="text-xs text-slate-400">Yo'nalish:</span>
          <div className="flex items-center gap-1">
            {form.countriesInRoute.map((code, idx) => (
              <span key={code} className="flex items-center gap-1">
                <span className="text-lg">{COUNTRIES.find(c => c.code === code)?.flag}</span>
                {idx < form.countriesInRoute.length - 1 && (
                  <ArrowRight size={14} className="text-emerald-400" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Shofyor tanlash
function DriverSelector({ form, setForm, drivers, vehicles, updateDistanceFromCoords }) {
  const selectedDriver = drivers.find(d => d._id === form.driverId)

  return (
    <div>
      <label className="block text-sm font-semibold text-blue-200 mb-2">Shofyor *</label>
      <select 
        value={form.driverId} 
        onChange={(e) => {
          const driverId = e.target.value
          const assignedVehicle = vehicles.find(v => 
            v.currentDriver === driverId || 
            v.currentDriver?._id === driverId ||
            String(v.currentDriver) === driverId
          )
          setForm(prev => ({...prev, driverId, vehicleId: assignedVehicle?._id || ''}))
        }} 
        className="w-full px-4 py-4 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
        required
      >
        <option value="">Shofyorni tanlang</option>
        {drivers.map(d => {
          const vehicle = vehicles.find(v => 
            v.currentDriver === d._id || 
            v.currentDriver?._id === d._id ||
            String(v.currentDriver) === d._id
          )
          return (
            <option key={d._id} value={d._id}>
              {d.fullName} {vehicle ? `→ ${vehicle.plateNumber}` : ''} {d.status === 'busy' ? '(Reysda)' : ''} {d.lastLocation ? '📍' : ''}
            </option>
          )
        })}
      </select>
      {drivers.length === 0 && (
        <p className="text-xs text-amber-400 mt-2">⚠️ Shofyorlar topilmadi. Avval shofyor qo'shing.</p>
      )}

      {/* Shofyor joylashuvi */}
      {selectedDriver?.lastLocation && (
        <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <MapPin size={16} />
              <span>Shofyor hozir: {selectedDriver.lastLocation.lat?.toFixed(4)}, {selectedDriver.lastLocation.lng?.toFixed(4)}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                const loc = selectedDriver.lastLocation
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=14`)
                  const data = await res.json()
                  const address = data.display_name?.split(',').slice(0, 3).join(', ') || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
                  setForm(prev => ({
                    ...prev,
                    startAddress: address,
                    startCoords: { lat: loc.lat, lng: loc.lng }
                  }))
                  if (form.endCoords) {
                    updateDistanceFromCoords({ lat: loc.lat, lng: loc.lng }, form.endCoords)
                  }
                  showToast.success('Shofyor joylashuvi boshlanish nuqtasi sifatida belgilandi')
                } catch {
                  setForm(prev => ({
                    ...prev,
                    startAddress: `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
                    startCoords: { lat: loc.lat, lng: loc.lng }
                  }))
                }
              }}
              className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition"
            >
              Shu joydan boshlash
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mashina tanlash
function VehicleSelector({ form, setForm, vehicles }) {
  const selectedVehicle = vehicles.find(v => v._id === form.vehicleId)

  return (
    <div>
      <label className="block text-sm font-semibold text-blue-200 mb-2">Mashina *</label>
      {form.vehicleId ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-3">
            <Truck size={20} />
            <span className="font-medium">{selectedVehicle?.plateNumber} - {selectedVehicle?.brand}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setForm(prev => ({...prev, vehicleId: ''}))} 
            className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <select 
          value={form.vehicleId} 
          onChange={(e) => setForm(prev => ({...prev, vehicleId: e.target.value}))} 
          className="w-full px-4 py-4 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none transition cursor-pointer appearance-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
          required
        >
          <option value="">Mashinani tanlang</option>
          {vehicles.map(v => (
            <option key={v._id} value={v._id}>{v.plateNumber} - {v.brand}</option>
          ))}
        </select>
      )}
    </div>
  )
}

// Marshrut bo'limi
function RouteSection({ form, setForm, routeMode, onOpenLocationPicker, updateDistanceFromCoords }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-blue-200">Marshrut *</label>
      
      {/* Tab buttons */}
      <div className="flex bg-white/5 rounded-xl p-1 gap-1">
        <button
          type="button"
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
            routeMode === 'manual' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PenLine size={16} /> Qo'lda yozish
        </button>
        <button
          type="button"
          onClick={onOpenLocationPicker}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
            routeMode === 'map' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Map size={16} /> Xaritadan
        </button>
      </div>

      {/* Manzil inputlari */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Qayerdan *
          </label>
          <AddressAutocomplete
            value={form.startAddress}
            onChange={(val) => setForm(prev => ({...prev, startAddress: val}))}
            onSelect={(suggestion) => {
              const newCoords = { lat: suggestion.lat, lng: suggestion.lng }
              setForm(prev => ({...prev, startAddress: suggestion.name, startCoords: newCoords}))
              if (form.endCoords) updateDistanceFromCoords(newCoords, form.endCoords)
            }}
            placeholder="Toshkent"
            focusColor="green"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span> Qayerga *
          </label>
          <AddressAutocomplete
            value={form.endAddress}
            onChange={(val) => setForm(prev => ({...prev, endAddress: val}))}
            onSelect={(suggestion) => {
              const newCoords = { lat: suggestion.lat, lng: suggestion.lng }
              setForm(prev => ({...prev, endAddress: suggestion.name, endCoords: newCoords}))
              if (form.startCoords) updateDistanceFromCoords(form.startCoords, newCoords)
            }}
            placeholder="Samarqand"
            focusColor="red"
          />
        </div>
      </div>

      {/* Masofa va vaqt */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Masofa (km) *</label>
          <input 
            type="number" 
            value={form.estimatedDistance}
            required 
            onChange={(e) => setForm(prev => ({...prev, estimatedDistance: e.target.value}))} 
            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition text-sm" 
            placeholder="300" 
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Taxminiy vaqt *</label>
          <input 
            type="text" 
            value={form.estimatedDuration} 
            onChange={(e) => setForm(prev => ({...prev, estimatedDuration: e.target.value}))} 
            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition text-sm" 
            placeholder="5 soat"
            required
          />
        </div>
      </div>

      {/* Koordinatalar ko'rsatkichi */}
      {form.startCoords && form.endCoords && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">
          <MapPin size={14} />
          <span>Koordinatalar aniqlangan - masofa avtomatik hisoblandi</span>
        </div>
      )}
    </div>
  )
}

// Moliyaviy bo'lim
function FinancialSection({ form, setForm }) {
  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
      <div className="flex items-center gap-2 text-blue-300 mb-2">
        <Wallet size={18} />
        <span className="font-semibold">Moliyaviy malumotlar</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Berilgan pul *</label>
          <input 
            type="number" 
            value={form.tripBudget} 
            onChange={(e) => setForm(prev => ({...prev, tripBudget: e.target.value}))} 
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
            placeholder="500000"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Reys haqi *</label>
          <input 
            type="number" 
            value={form.tripPayment} 
            onChange={(e) => setForm(prev => ({...prev, tripPayment: e.target.value}))} 
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition" 
            placeholder="200000"
            required
          />
        </div>
      </div>
    </div>
  )
}
