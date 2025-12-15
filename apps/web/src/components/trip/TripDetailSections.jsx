import { useState } from 'react'
import { Gauge, Fuel, Car, AlertTriangle, Calculator, Edit3, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import api from '../../services/api'
import { showToast } from '../Toast'

// Konfiguratsiyalar - kichik harfda (backend bilan mos)
const COUNTRIES = {
  uzb: { name: "O'zbekiston", flag: '🇺🇿', currency: 'UZS' },
  kz: { name: "Qozog'iston", flag: '🇰🇿', currency: 'KZT' },
  ru: { name: 'Rossiya', flag: '🇷🇺', currency: 'RUB' }
}

const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar' },
  UZS: { symbol: "so'm", name: "So'm" },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

const UNEXPECTED_TYPES = {
  tire: { label: "G'ildirak", icon: '🛞' },
  repair: { label: 'Remont', icon: '🔧' },
  fine: { label: 'Jarima', icon: '📋' },
  other: { label: 'Boshqa', icon: '📦' }
}

export { COUNTRIES, CURRENCIES, UNEXPECTED_TYPES }

// ============ ODOMETR SECTION ============
export function OdometerSection({ trip, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    start: trip.odometer?.start || 0,
    end: trip.odometer?.end || 0,
    traveled: trip.odometer?.traveled || 0
  })
  const [saving, setSaving] = useState(false)

  const calculatedTraveled = form.start > 0 && form.end > form.start 
    ? form.end - form.start 
    : form.traveled

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/trips/${trip._id}`, { 
        odometerStart: form.start,
        odometerEnd: form.end,
        traveledKm: calculatedTraveled
      })
      showToast.success('Masofa saqlandi')
      setEditing(false)
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik yuz berdi')
    }
    setSaving(false)
  }


  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900">Odometr (Kilometr)</h2>
            <p className="text-gray-500 text-xs sm:text-sm">Chiqish, kelish va yurgan masofa</p>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <Edit3 size={18} className="sm:w-5 sm:h-5 text-gray-500" />
        </button>
      </div>

      {editing ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">🚀 Chiqishdagi KM</label>
              <input type="number" value={form.start} onChange={(e) => setForm({ ...form, start: Number(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 text-lg sm:text-xl font-bold text-center" placeholder="150000" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">🏁 Kelgandagi KM</label>
              <input type="number" value={form.end} onChange={(e) => setForm({ ...form, end: Number(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 text-lg sm:text-xl font-bold text-center" placeholder="156500" />
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg sm:rounded-xl border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="text-emerald-700 font-medium text-sm sm:text-base">📍 Yurgan masofa:</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">{calculatedTraveled.toLocaleString()} km</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm sm:text-base">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button onClick={() => setEditing(false)} className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-200 text-sm sm:text-base">Bekor</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-2.5 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl text-center border border-blue-200">
            <p className="text-[10px] sm:text-xs text-blue-500 mb-0.5 sm:mb-1">🚀 Chiqishdagi</p>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{(trip.odometer?.start || 0).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-blue-400">km</p>
          </div>
          <div className="p-2.5 sm:p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl text-center border border-purple-200">
            <p className="text-[10px] sm:text-xs text-purple-500 mb-0.5 sm:mb-1">🏁 Kelgandagi</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">{(trip.odometer?.end || 0).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-purple-400">km</p>
          </div>
          <div className="p-2.5 sm:p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl text-center border border-emerald-200">
            <p className="text-[10px] sm:text-xs text-emerald-500 mb-0.5 sm:mb-1">📍 Yurgan</p>
            <p className="text-lg sm:text-2xl font-bold text-emerald-600">{(trip.odometer?.traveled || 0).toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-emerald-400">km</p>
          </div>
        </div>
      )}
    </div>
  )
}


// ============ FUEL SECTION ============
export function FuelSection({ trip, rates, onAddFuel, onUpdate }) {
  const handleDelete = async (fuelId) => {
    if (!confirm("Yoqilg'i yozuvini o'chirishni xohlaysizmi?")) return
    try {
      await api.delete(`/trips/${trip._id}/fuel/${fuelId}`)
      showToast.success("O'chirildi")
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  const [editingRemaining, setEditingRemaining] = useState(false)
  const [remaining, setRemaining] = useState(trip.fuelSummary?.remaining || 0)

  const saveRemaining = async () => {
    try {
      await api.put(`/trips/${trip._id}`, { fuelRemaining: remaining })
      showToast.success('Saqlandi')
      setEditingRemaining(false)
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  // Mahalliy reysda faqat UZB, xalqaro reysda barcha davlatlar
  const isInternational = trip.tripType === 'international'
  const countriesToShow = isInternational 
    ? Object.entries(COUNTRIES) 
    : Object.entries(COUNTRIES).filter(([code]) => code === 'uzb')

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Fuel className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-gray-900">Yoqilg'i (Salarka)</h2>
            <p className="text-gray-500 text-xs sm:text-sm">
              {isInternational ? 'Davlatlar bo\'yicha' : 'O\'zbekiston'}
            </p>
          </div>
        </div>
        <button onClick={onAddFuel} className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition">
          <Plus size={18} /> Qo'shish
        </button>
      </div>

      {/* Davlatlar bo'yicha summary */}
      <div className={`grid ${isInternational ? 'grid-cols-3' : 'grid-cols-1'} gap-2 sm:gap-4 mb-4 sm:mb-6`}>
        {countriesToShow.map(([code, country]) => {
          const data = trip.fuelSummary?.[code.toLowerCase()] || { liters: 0, totalUSD: 0 }
          return (
            <div key={code} className="p-2.5 sm:p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <span className="text-lg sm:text-2xl">{country.flag}</span>
                <span className="font-medium text-gray-700 text-xs sm:text-base">{country.name}</span>
              </div>
              <p className="text-base sm:text-xl font-bold text-gray-900">{data.liters || 0} L</p>
              <p className="text-xs sm:text-sm text-gray-500">${(data.totalUSD || 0).toFixed(2)}</p>
            </div>
          )
        })}
      </div>

      {/* Astatka va jami */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl">
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">Jami quyilgan</p>
          <p className="text-base sm:text-xl font-bold text-gray-900">{trip.fuelSummary?.totalLiters || 0} L</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">Astatka (qoldiq)</p>
          {editingRemaining ? (
            <div className="flex items-center justify-center gap-1">
              <input type="number" value={remaining} onChange={(e) => setRemaining(Number(e.target.value))} className="w-16 sm:w-20 px-2 py-1 border rounded text-center text-sm" />
              <button onClick={saveRemaining} className="text-green-600">✓</button>
              <button onClick={() => setEditingRemaining(false)} className="text-red-600">✕</button>
            </div>
          ) : (
            <p className="text-base sm:text-xl font-bold text-orange-600 cursor-pointer hover:underline" onClick={() => setEditingRemaining(true)}>
              {trip.fuelSummary?.remaining || 0} L
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">Yegan</p>
          <p className="text-base sm:text-xl font-bold text-red-600">{trip.fuelSummary?.totalUsed || 0} L</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">Rashod</p>
          <p className="text-base sm:text-xl font-bold text-blue-600">{trip.fuelSummary?.consumption || 0} L/km</p>
        </div>
      </div>

      {/* Yoqilg'i yozuvlari */}
      {trip.fuelEntries && trip.fuelEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Barcha yozuvlar</h3>
          {trip.fuelEntries.map((entry) => (
            <div key={entry._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl group">
              <span className="text-2xl">{COUNTRIES[entry.country]?.flag}</span>
              <div className="flex-1">
                <p className="font-medium">{entry.liters} litr × {entry.pricePerLiter} {CURRENCIES[entry.currency]?.symbol}</p>
                {entry.note && <p className="text-sm text-gray-500">{entry.note}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold">${entry.totalInUSD?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(entry._id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Jami */}
      <div className="mt-4 p-4 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl text-white">
        <div className="flex justify-between items-center">
          <span className="font-medium">Jami yoqilg'i xarajati:</span>
          <span className="text-2xl font-bold">${(trip.fuelSummary?.totalUSD || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}


// ============ ROAD EXPENSES SECTION ============
export function RoadExpensesSection({ trip, onEdit }) {
  // Mahalliy reysda faqat UZB, xalqaro reysda barcha davlatlar
  const isInternational = trip.tripType === 'international'
  const countries = isInternational ? ['uzb', 'kz', 'ru'] : ['uzb']
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Yo'l xarajatlari</h2>
          <p className="text-gray-500 text-sm">
            {isInternational ? 'Chegara, GAI, yo\'l puli, stoyanka' : 'GAI, yo\'l puli, stoyanka'}
          </p>
        </div>
      </div>

      <div className={`grid ${isInternational ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
        {countries.map((code) => {
          const country = COUNTRIES[code]
          const data = trip.roadExpenses?.[code.toLowerCase()] || {}
          const total = data.totalInUSD || 0
          
          return (
            <div key={code} className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{country.flag}</span>
                  <span className="font-bold text-gray-900 text-sm">{country.name}</span>
                </div>
                <button onClick={() => onEdit(code)} className="p-1.5 hover:bg-white rounded-lg transition">
                  <Edit3 size={14} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs"><span className="text-gray-500">🛂 Chegara:</span><span className="font-medium">${data.border || 0}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">👮 GAI:</span><span className="font-medium">${data.gai || 0}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">🛣️ Yo'l puli:</span><span className="font-medium">${data.toll || 0}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">🅿️ Stoyanka:</span><span className="font-medium">${data.parking || 0}</span></div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-medium text-gray-700 text-sm">Jami:</span>
                  <span className="font-bold text-purple-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl text-white">
        <div className="flex justify-between items-center">
          <span className="font-medium">Jami yo'l xarajatlari:</span>
          <span className="text-2xl font-bold">${(trip.roadExpenses?.totalUSD || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

// ============ UNEXPECTED EXPENSES SECTION ============
export function UnexpectedSection({ trip, onAdd, onUpdate }) {
  const handleDelete = async (expenseId) => {
    if (!confirm("O'chirishni xohlaysizmi?")) return
    try {
      await api.delete(`/trips/${trip._id}/unexpected/${expenseId}`)
      showToast.success("O'chirildi")
      onUpdate()
    } catch (e) {
      showToast.error('Xatolik')
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kutilmagan xarajatlar</h2>
            <p className="text-gray-500 text-sm">G'ildirak, remont, jarima va boshqa</p>
          </div>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition">
          <Plus size={18} /> Qo'shish
        </button>
      </div>

      {trip.unexpectedExpenses && trip.unexpectedExpenses.length > 0 ? (
        <div className="space-y-2">
          {trip.unexpectedExpenses.map((exp) => (
            <div key={exp._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl group">
              <span className="text-2xl">{UNEXPECTED_TYPES[exp.type]?.icon || '📦'}</span>
              <div className="flex-1">
                <p className="font-medium">{UNEXPECTED_TYPES[exp.type]?.label || exp.type}</p>
                {exp.description && <p className="text-sm text-gray-500">{exp.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">${exp.amountInUSD?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <button onClick={() => handleDelete(exp._id)} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <AlertTriangle size={40} className="mx-auto mb-2 opacity-30" />
          <p>Kutilmagan xarajat yo'q</p>
        </div>
      )}

      {trip.unexpectedTotalUSD > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white">
          <div className="flex justify-between items-center">
            <span className="font-medium">Jami kutilmagan:</span>
            <span className="text-2xl font-bold">${trip.unexpectedTotalUSD.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}


// ============ PROFIT SECTION ============
export function ProfitSection({ trip }) {
  const expenses = [
    { label: "Yoqilg'i", value: trip.fuelSummary?.totalUSD || 0, icon: '⛽' },
    { label: "Yo'l xarajatlari", value: trip.roadExpenses?.totalUSD || 0, icon: '🛣️' },
    { label: 'Ovqat (Pitanya)', value: trip.food?.amountInUSD || 0, icon: '🍲' },
    { label: 'Kutilmagan', value: trip.unexpectedTotalUSD || 0, icon: '⚠️' },
    { label: 'Shofyor oyligi', value: trip.driverSalary?.amountInUSD || 0, icon: '👨‍✈️' },
  ]

  // Xalqaro reys xarajatlari
  if (trip.tripType === 'international') {
    if (trip.borderCrossingsTotalUSD > 0) {
      expenses.push({ label: 'Chegara xarajatlari', value: trip.borderCrossingsTotalUSD, icon: '🛂' })
    }
    if (trip.platon?.amountInUSD > 0) {
      expenses.push({ label: 'Platon (Rossiya)', value: trip.platon.amountInUSD, icon: '🚛' })
    }
  }

  const totalExpenses = trip.totalExpensesUSD || 0
  const income = trip.income?.amountInUSD || 0
  const profit = trip.profitUSD || 0

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Itog hisob</h2>
          <p className="text-gray-500 text-sm">Daromad va xarajatlar</p>
        </div>
      </div>

      {/* Daromad */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-medium text-gray-700">Daromad (Reys haqi)</span>
          </div>
          <span className="text-2xl font-bold text-blue-600">${income.toFixed(2)}</span>
        </div>
      </div>

      {/* Xarajatlar */}
      <div className="space-y-2 mb-4">
        {expenses.map((exp, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span>{exp.icon}</span>
              <span className="text-gray-600">{exp.label}</span>
            </div>
            <span className="font-medium text-red-500">-${exp.value.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Jami xarajat */}
      <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl mb-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Jami xarajatlar:</span>
          <span className="text-xl font-bold text-red-600">-${totalExpenses.toFixed(2)}</span>
        </div>
      </div>

      {/* SOF FOYDA / ZARAR */}
      <div className={`p-6 rounded-2xl ${profit >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 text-sm">{profit >= 0 ? 'Sof foyda' : 'Zarar'}</p>
            <p className="text-3xl font-bold">${Math.abs(profit).toFixed(2)}</p>
          </div>
          {profit >= 0 ? <TrendingUp size={48} className="text-white/30" /> : <TrendingDown size={48} className="text-white/30" />}
        </div>
        <div className="mt-2 text-sm text-white/70">
          Formula: ${income.toFixed(2)} - ${totalExpenses.toFixed(2)} = {profit >= 0 ? '' : '-'}${Math.abs(profit).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
