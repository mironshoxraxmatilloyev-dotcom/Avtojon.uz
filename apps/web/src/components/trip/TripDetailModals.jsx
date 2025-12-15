import { useState, useEffect } from 'react'
import { Fuel, Wallet, AlertTriangle, Edit3 } from 'lucide-react'
import api from '../../services/api'
import { showToast } from '../Toast'
import { COUNTRIES, CURRENCIES, UNEXPECTED_TYPES } from './TripDetailSections'

// ============ FUEL MODAL ============
export function FuelModal({ tripId, tripType, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    country: 'uzb',
    liters: '',
    pricePerLiter: '',
    currency: 'UZS',
    note: ''
  })
  const [saving, setSaving] = useState(false)

  // Mahalliy reysda faqat UZB, xalqaro reysda barcha davlatlar
  const isInternational = tripType === 'international'
  const availableCountries = isInternational 
    ? Object.entries(COUNTRIES) 
    : Object.entries(COUNTRIES).filter(([code]) => code === 'uzb')

  useEffect(() => {
    const defaultCurrency = COUNTRIES[form.country]?.currency || 'USD'
    setForm(f => ({ ...f, currency: defaultCurrency }))
  }, [form.country])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.liters || !form.pricePerLiter) {
      showToast.error("Litr va narxni kiriting")
      return
    }
    setSaving(true)
    try {
      await api.post(`/trips/${tripId}/fuel`, {
        country: form.country,
        liters: Number(form.liters),
        pricePerLiter: Number(form.pricePerLiter),
        currency: form.currency,
        exchangeRate: rates[form.currency] || 1,
        note: form.note
      })
      showToast.success("Yoqilg'i qo'shildi")
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik yuz berdi')
    }
    setSaving(false)
  }

  const total = (Number(form.liters) || 0) * (Number(form.pricePerLiter) || 0)
  const totalUSD = form.currency === 'USD' ? total : total / (rates[form.currency] || 1)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Fuel className="text-orange-500" /> Yoqilg'i qo'shish
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Davlat tanlash - faqat xalqaro reysda ko'rsatiladi */}
          {isInternational ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Davlat</label>
              <div className="grid grid-cols-3 gap-2">
                {availableCountries.map(([code, country]) => (
                  <button key={code} type="button" onClick={() => setForm({ ...form, country: code })}
                    className={`p-3 rounded-xl border-2 transition ${form.country === code ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-2xl">{country.flag}</span>
                    <p className="text-xs mt-1">{country.name}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-2">
              <span className="text-2xl">🇺🇿</span>
              <span className="font-medium text-blue-700">O'zbekiston (Mahalliy reys)</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Litr</label>
              <input type="number" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Litr narxi</label>
              <input type="number" value={form.pricePerLiter} onChange={(e) => setForm({ ...form, pricePerLiter: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="12500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500">
              {Object.entries(CURRENCIES).map(([code, curr]) => (
                <option key={code} value={code}>{curr.name} ({curr.symbol})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
            <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" placeholder="Qo'shimcha ma'lumot" />
          </div>

          <div className="p-4 bg-orange-50 rounded-xl">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Jami:</span>
              <span className="font-bold">{total.toLocaleString()} {CURRENCIES[form.currency]?.symbol}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>USD da:</span>
              <span className="font-medium text-orange-600">${totalUSD.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">Bekor</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ============ ROAD EXPENSE MODAL ============
export function RoadExpenseModal({ tripId, country, currentData, rates, onClose, onSuccess }) {
  const countryInfo = COUNTRIES[country]
  const [form, setForm] = useState({
    border: currentData?.border || 0,
    gai: currentData?.gai || 0,
    toll: currentData?.toll || 0,
    parking: currentData?.parking || 0,
    currency: 'USD'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/trips/${tripId}/road-expenses/${country.toLowerCase()}`, {
        ...form,
        exchangeRate: rates[form.currency] || 1
      })
      showToast.success('Saqlandi')
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik')
    }
    setSaving(false)
  }

  const total = Number(form.border) + Number(form.gai) + Number(form.toll) + Number(form.parking)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="text-2xl">{countryInfo?.flag}</span>
          {countryInfo?.name} yo'l xarajatlari
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🛂 Chegara</label>
            <input type="number" value={form.border} onChange={(e) => setForm({ ...form, border: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">👮 GAI</label>
            <input type="number" value={form.gai} onChange={(e) => setForm({ ...form, gai: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🛣️ Yo'l puli</label>
            <input type="number" value={form.toll} onChange={(e) => setForm({ ...form, toll: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🅿️ Stoyanka</label>
            <input type="number" value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="0" />
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex justify-between">
              <span className="text-gray-600">Jami:</span>
              <span className="font-bold text-purple-600">${total}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">Bekor</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ UNEXPECTED EXPENSE MODAL ============
export function UnexpectedModal({ tripId, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: 'other',
    amount: '',
    currency: 'USD',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount) {
      showToast.error('Summani kiriting')
      return
    }
    setSaving(true)
    try {
      await api.post(`/trips/${tripId}/unexpected`, {
        ...form,
        amount: Number(form.amount),
        exchangeRate: rates[form.currency] || 1
      })
      showToast.success("Xarajat qo'shildi")
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Kutilmagan xarajat
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(UNEXPECTED_TYPES).map(([key, val]) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                  className={`p-3 rounded-xl border-2 transition ${form.type === key ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                  <span className="text-2xl">{val.icon}</span>
                  <p className="text-xs mt-1">{val.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summa</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valyuta</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl">
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="Nima uchun sarflandi" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">Bekor</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ============ EDIT TRIP MODAL ============
export function EditTripModal({ trip, rates, onClose, onSuccess }) {
  const [form, setForm] = useState({
    income: trip.income?.amount || '',
    incomeCurrency: trip.income?.currency || 'USD',
    driverSalary: trip.driverSalary?.amount || '',
    driverSalaryCurrency: trip.driverSalary?.currency || 'USD',
    food: trip.food?.amount || '',
    foodCurrency: trip.food?.currency || 'USD',
    tripBudget: trip.tripBudget || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/trips/${trip._id}`, {
        income: Number(form.income) || 0,
        incomeCurrency: form.incomeCurrency,
        incomeExchangeRate: rates[form.incomeCurrency] || 1,
        driverSalary: Number(form.driverSalary) || 0,
        driverSalaryCurrency: form.driverSalaryCurrency,
        driverSalaryExchangeRate: rates[form.driverSalaryCurrency] || 1,
        food: Number(form.food) || 0,
        foodCurrency: form.foodCurrency,
        foodExchangeRate: rates[form.foodCurrency] || 1,
        tripBudget: Number(form.tripBudget) || 0
      })
      showToast.success('Saqlandi')
      onSuccess()
    } catch (e) {
      showToast.error('Xatolik')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Edit3 className="text-blue-500" /> Reysni tahrirlash
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Daromad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">💰 Daromad (Reys haqi)</label>
            <div className="flex gap-2">
              <input type="number" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl" placeholder="1000" />
              <select value={form.incomeCurrency} onChange={(e) => setForm({ ...form, incomeCurrency: e.target.value })}
                className="w-24 px-2 py-3 border border-gray-200 rounded-xl">
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Shofyor oyligi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">👨‍✈️ Shofyor oyligi</label>
            <div className="flex gap-2">
              <input type="number" value={form.driverSalary} onChange={(e) => setForm({ ...form, driverSalary: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl" placeholder="200" />
              <select value={form.driverSalaryCurrency} onChange={(e) => setForm({ ...form, driverSalaryCurrency: e.target.value })}
                className="w-24 px-2 py-3 border border-gray-200 rounded-xl">
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ovqat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🍲 Ovqat (Pitanya)</label>
            <div className="flex gap-2">
              <input type="number" value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl" placeholder="50" />
              <select value={form.foodCurrency} onChange={(e) => setForm({ ...form, foodCurrency: e.target.value })}
                className="w-24 px-2 py-3 border border-gray-200 rounded-xl">
                {Object.entries(CURRENCIES).map(([code, curr]) => (
                  <option key={code} value={code}>{curr.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Berilgan pul */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">💵 Berilgan pul (UZS)</label>
            <input type="number" value={form.tripBudget} onChange={(e) => setForm({ ...form, tripBudget: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl" placeholder="5000000" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200">Bekor</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
