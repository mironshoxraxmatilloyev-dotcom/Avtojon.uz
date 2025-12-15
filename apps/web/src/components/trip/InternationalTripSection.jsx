import { useState } from 'react'
import { Globe, MapPin, ArrowRight, Plus, Trash2, Edit3, Flag, DollarSign, Truck } from 'lucide-react'
import api from '../../services/api'
import { showToast } from '../Toast'
import { COUNTRIES, CURRENCIES } from './TripDetailSections'

const BORDERS = [
  { from: 'UZB', to: 'KZ', name: 'Yallama / Gisht-Kuprik' },
  { from: 'UZB', to: 'KZ', name: 'Oybek / Chernyaevka' },
  { from: 'KZ', to: 'RU', name: 'Troitsk' },
  { from: 'KZ', to: 'RU', name: 'Orenburg' },
  { from: 'KZ', to: 'RU', name: 'Petropavlovsk' }
]

export default function InternationalTripSection({ trip, flight, rates, onUpdate }) {
  // trip yoki flight qabul qiladi (orqaga moslik uchun)
  const data = flight || trip;
  const [showBorderModal, setShowBorderModal] = useState(false)
  const [showPlatonModal, setShowPlatonModal] = useState(false)

  // flightType yoki tripType tekshirish
  const isInternational = data.flightType === 'international' || data.tripType === 'international'
  if (!isInternational) return null

  // API endpoint - flight yoki trip
  const apiEndpoint = flight ? 'flights' : 'trips'

  return (
    <div className="space-y-6">
      {/* Yo'nalish nuqtalari */}
      <WaypointsSection trip={data} onUpdate={onUpdate} />

      {/* Chegara o'tish xarajatlari */}
      <BorderCrossingsSection 
        trip={data} 
        apiEndpoint={apiEndpoint}
        onAdd={() => setShowBorderModal(true)}
        onUpdate={onUpdate}
      />

      {/* Platon (Rossiya) */}
      {data.countriesInRoute?.includes('RU') && (
        <PlatonSection 
          trip={data}
          onEdit={() => setShowPlatonModal(true)}
          onUpdate={onUpdate}
        />
      )}

      {/* Davlatlar bo'yicha xulosa */}
      <CountryExpensesSummary trip={data} />

      {/* Modallar */}
      {showBorderModal && (
        <BorderCrossingModal
          tripId={data._id}
          apiEndpoint={apiEndpoint}
          rates={rates}
          onClose={() => setShowBorderModal(false)}
          onSuccess={() => { setShowBorderModal(false); onUpdate() }}
        />
      )}

      {showPlatonModal && (
        <PlatonModal
          tripId={data._id}
          apiEndpoint={apiEndpoint}
          currentData={data.platon}
          rates={rates}
          onClose={() => setShowPlatonModal(false)}
          onSuccess={() => { setShowPlatonModal(false); onUpdate() }}
        />
      )}
    </div>
  )
}

// ============ WAYPOINTS SECTION ============
function WaypointsSection({ trip, onUpdate }) {
  if (!trip.waypoints || trip.waypoints.length === 0) return null

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Xalqaro yo'nalish</h2>
          <p className="text-gray-500 text-sm">{trip.waypoints.length} ta nuqta</p>
        </div>
      </div>

      {/* Yo'nalish vizualizatsiyasi */}
      <div className="relative">
        {trip.waypoints.map((wp, idx) => (
          <div key={wp._id || idx} className="flex items-start gap-4 mb-4 last:mb-0">
            {/* Chiziq */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${
                wp.type === 'start' ? 'bg-green-500' : 
                wp.type === 'end' ? 'bg-red-500' : 'bg-blue-500'
              } shadow-lg`}></div>
              {idx < trip.waypoints.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200"></div>
              )}
            </div>

            {/* Ma'lumot */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{COUNTRIES[wp.country?.toLowerCase()]?.flag}</span>
                <span className="font-bold text-gray-900">{wp.city}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  wp.type === 'start' ? 'bg-green-100 text-green-700' :
                  wp.type === 'end' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {wp.type === 'start' ? 'Boshlash' : wp.type === 'end' ? 'Tugash' : 'Tranzit'}
                </span>
              </div>
              {wp.address && <p className="text-sm text-gray-500">{wp.address}</p>}
              <div className="flex gap-4 text-xs text-gray-400 mt-1">
                {wp.arrivedAt && <span>Keldi: {new Date(wp.arrivedAt).toLocaleString('uz-UZ')}</span>}
                {wp.departedAt && <span>Ketdi: {new Date(wp.departedAt).toLocaleString('uz-UZ')}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Davlatlar */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">Yo'nalish:</span>
        {trip.countriesInRoute?.map((code, idx) => (
          <span key={code} className="flex items-center gap-1">
            <span className="text-xl">{COUNTRIES[code?.toLowerCase()]?.flag}</span>
            {idx < trip.countriesInRoute.length - 1 && (
              <ArrowRight size={16} className="text-gray-400" />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============ BORDER CROSSINGS SECTION ============
function BorderCrossingsSection({ trip, apiEndpoint = 'trips', onAdd, onUpdate }) {
  const handleDelete = async (crossingId) => {
    if (!confirm("Chegara xarajatini o'chirishni xohlaysizmi?")) return
    try {
      await api.delete(`/${apiEndpoint}/${trip._id}/border-crossing/${crossingId}`)
      showToast.success("O'chirildi")
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Flag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chegara xarajatlari</h2>
            <p className="text-gray-500 text-sm">Bojxona, tranzit, sug'urta</p>
          </div>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition"
        >
          <Plus size={18} />
          Qo'shish
        </button>
      </div>

      {trip.borderCrossings && trip.borderCrossings.length > 0 ? (
        <div className="space-y-3">
          {trip.borderCrossings.map((bc) => (
            <div key={bc._id} className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{COUNTRIES[bc.fromCountry?.toLowerCase()]?.flag}</span>
                  <ArrowRight size={16} className="text-gray-400" />
                  <span className="text-xl">{COUNTRIES[bc.toCountry?.toLowerCase()]?.flag}</span>
                  {bc.borderName && (
                    <span className="text-sm text-gray-500 ml-2">({bc.borderName})</span>
                  )}
                </div>
                <button 
                  onClick={() => handleDelete(bc._id)}
                  className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-xs text-gray-400">Bojxona</p>
                  <p className="font-semibold">${bc.customsFee || 0}</p>
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-xs text-gray-400">Tranzit</p>
                  <p className="font-semibold">${bc.transitFee || 0}</p>
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-xs text-gray-400">Sug'urta</p>
                  <p className="font-semibold">${bc.insuranceFee || 0}</p>
                </div>
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-xs text-gray-400">Boshqa</p>
                  <p className="font-semibold">${bc.otherFees || 0}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {bc.crossedAt && new Date(bc.crossedAt).toLocaleDateString('uz-UZ')}
                </span>
                <span className="font-bold text-indigo-600">${(bc.totalInUSD || 0).toFixed(2)}</span>
              </div>
              {bc.note && <p className="text-xs text-gray-400 mt-2">{bc.note}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Flag size={40} className="mx-auto mb-2 opacity-30" />
          <p>Chegara xarajatlari kiritilmagan</p>
        </div>
      )}

      {/* Jami */}
      {trip.borderCrossingsTotalUSD > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white">
          <div className="flex justify-between items-center">
            <span className="font-medium">Jami chegara xarajatlari:</span>
            <span className="text-2xl font-bold">${trip.borderCrossingsTotalUSD.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}


// ============ PLATON SECTION ============
function PlatonSection({ trip, onEdit, onUpdate }) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Platon</h2>
            <p className="text-gray-500 text-sm">Rossiya yo'l to'lovi (12+ tonna)</p>
          </div>
        </div>
        <button 
          onClick={onEdit}
          className="p-2 hover:bg-gray-100 rounded-xl transition"
        >
          <Edit3 size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">Summa</p>
          <p className="text-xl font-bold text-rose-600">
            {trip.platon?.amount || 0} {CURRENCIES[trip.platon?.currency]?.symbol || '₽'}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">USD da</p>
          <p className="text-xl font-bold text-rose-600">${(trip.platon?.amountInUSD || 0).toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl text-center">
          <p className="text-xs text-gray-500 mb-1">Masofa (RU)</p>
          <p className="text-xl font-bold text-rose-600">{trip.platon?.distanceKm || 0} km</p>
        </div>
      </div>

      {trip.platon?.note && (
        <p className="text-sm text-gray-500 mt-3">{trip.platon.note}</p>
      )}
    </div>
  )
}

// ============ COUNTRY EXPENSES SUMMARY ============
function CountryExpensesSummary({ trip }) {
  if (!trip.countryExpenses) return null

  const countries = ['uzb', 'kz', 'ru']
  const hasData = countries.some(c => 
    trip.countryExpenses[c]?.totalUSD > 0 || 
    trip.countryExpenses[c]?.fuelLiters > 0
  )

  if (!hasData) return null

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Davlatlar bo'yicha xulosa</h2>
          <p className="text-gray-500 text-sm">Har bir davlatdagi xarajatlar</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {countries.map(code => {
          const country = COUNTRIES[code.toLowerCase()]
          const data = trip.countryExpenses[code] || {}
          
          return (
            <div key={code} className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{country?.flag}</span>
                <span className="font-bold text-gray-900">{country?.name}</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Masofa:</span>
                  <span className="font-medium">{data.distanceKm || 0} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Yoqilg'i:</span>
                  <span className="font-medium">{data.fuelLiters || 0} L (${(data.fuelCostUSD || 0).toFixed(2)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Yo'l xarajati:</span>
                  <span className="font-medium">${(data.roadExpensesUSD || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Jami:</span>
                  <span className="font-bold text-blue-600">${(data.totalUSD || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============ BORDER CROSSING MODAL ============
function BorderCrossingModal({ tripId, apiEndpoint = 'trips', rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fromCountry: 'UZB',
    toCountry: 'KZ',
    borderName: '',
    customsFee: '',
    transitFee: '',
    insuranceFee: '',
    otherFees: '',
    currency: 'USD',
    note: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const exchangeRate = rates[form.currency] || 1
      await api.post(`/${apiEndpoint}/${tripId}/border-crossing`, {
        ...form,
        customsFee: Number(form.customsFee) || 0,
        transitFee: Number(form.transitFee) || 0,
        insuranceFee: Number(form.insuranceFee) || 0,
        otherFees: Number(form.otherFees) || 0,
        exchangeRate
      })
      showToast.success('Chegara xarajati qo\'shildi')
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik yuz berdi')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Chegara xarajati qo'shish</h3>
          <p className="text-gray-500 text-sm">Bojxona va tranzit to'lovlari</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Davlatlar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qayerdan</label>
              <select
                value={form.fromCountry}
                onChange={(e) => setForm({ ...form, fromCountry: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(COUNTRIES).map(([code, c]) => (
                  <option key={code} value={code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qayerga</label>
              <select
                value={form.toCountry}
                onChange={(e) => setForm({ ...form, toCountry: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(COUNTRIES).map(([code, c]) => (
                  <option key={code} value={code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chegara nomi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chegara nomi</label>
            <input
              type="text"
              value={form.borderName}
              onChange={(e) => setForm({ ...form, borderName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="Masalan: Yallama, Troitsk"
            />
          </div>

          {/* Valyuta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valyuta</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <option key={code} value={code}>{c.symbol} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Xarajatlar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">🛂 Bojxona</label>
              <input
                type="number"
                value={form.customsFee}
                onChange={(e) => setForm({ ...form, customsFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">🚛 Tranzit</label>
              <input
                type="number"
                value={form.transitFee}
                onChange={(e) => setForm({ ...form, transitFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">🛡️ Sug'urta</label>
              <input
                type="number"
                value={form.insuranceFee}
                onChange={(e) => setForm({ ...form, insuranceFee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">📦 Boshqa</label>
              <input
                type="number"
                value={form.otherFees}
                onChange={(e) => setForm({ ...form, otherFees: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Izoh</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              placeholder="Qo'shimcha ma'lumot"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ PLATON MODAL ============
function PlatonModal({ tripId, apiEndpoint = 'trips', currentData, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount: currentData?.amount || '',
    currency: currentData?.currency || 'RUB',
    distanceKm: currentData?.distanceKm || '',
    note: currentData?.note || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const exchangeRate = rates[form.currency] || 90
      await api.put(`/${apiEndpoint}/${tripId}/platon`, {
        ...form,
        amount: Number(form.amount) || 0,
        distanceKm: Number(form.distanceKm) || 0,
        exchangeRate
      })
      showToast.success('Platon saqlandi')
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik yuz berdi')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Platon to'lovi</h3>
          <p className="text-gray-500 text-sm">Rossiya yo'l to'lovi (12+ tonna yuk mashinalari)</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Summa</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valyuta</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
              >
                <option value="RUB">₽ Rubl</option>
                <option value="USD">$ Dollar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rossiyada yurgan masofa (km)</label>
            <input
              type="number"
              value={form.distanceKm}
              onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
              placeholder="2500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Izoh</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500"
              placeholder="Qo'shimcha ma'lumot"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
