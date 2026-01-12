import { useState, useCallback, memo, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Route, Map, DollarSign, CheckCircle, Wallet, TrendingUp, TrendingDown,
  Calculator, Percent, ArrowRight, Sparkles, Fuel, Utensils, Wrench, Car,
  Navigation, FileText, Package, Building2, Truck, Shield, CircleDot, Circle, Droplet,
  Mic, Globe, Flag, Gauge, Calendar, ArrowUpDown, Banknote, CreditCard
} from 'lucide-react'
import AddressAutocomplete from '../AddressAutocomplete'
import { EXPENSE_CATEGORIES, FUEL_TYPES, BORDER_TYPES, FILTER_TYPES, formatMoney } from './constants'
import VoiceRecorder from '../VoiceRecorder'

// Sana input uchun format (timezone muammosini hal qilish)
const formatDateForInput = (date) => {
  if (!date) return new Date().toISOString().split('T')[0]
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]
  
  // Local timezone da sana olish (UTC offset muammosini hal qilish)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// Icon mapping
const ICONS = {
  Fuel, Utensils, Wrench, Car, Navigation, FileText, Package,
  Building2, Truck, Shield, CircleDot, Circle, Droplet
}

const QUICK_AMOUNTS = {
  fuel: [100000, 200000, 300000, 500000, 1000000],
  food: [30000, 50000, 80000, 100000, 150000],
  toll: [10000, 20000, 50000, 100000, 200000],
  border: [50, 100, 200, 300, 500],
  repair: [50000, 100000, 200000, 500000, 1000000],
  fine: [50000, 100000, 200000, 300000, 500000],
  other: [10000, 50000, 100000, 200000, 500000]
}

// PRO Modal Wrapper
const ModalWrapper = memo(({ children, onClose, size = 'lg' }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl'
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} animate-slide-up sm:animate-scale-in`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
})

// ============================================
// LEG MODAL - Yangi bosqich qo'shish
// ============================================
export const LegModal = memo(function LegModal({ flight, editingLeg, onClose, onSubmit, onOpenLocationPicker }) {
  const lastLeg = flight.legs?.[flight.legs.length - 1]
  const isLocal = flight?.flightType !== 'international' // Mahalliy mashrut
  const [form, setForm] = useState({
    fromCity: editingLeg?.fromCity || lastLeg?.toCity || '',
    toCity: editingLeg?.toCity || '',
    givenBudget: editingLeg?.givenBudget?.toString() || '',
    distance: editingLeg?.distance?.toString() || '',
    fromCoords: editingLeg?.fromCoords || lastLeg?.toCoords || null,
    toCoords: editingLeg?.toCoords || null,
    note: editingLeg?.note || ''
  })

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!form.toCity?.trim()) return
    onSubmit({
      ...editingLeg,
      fromCity: form.fromCity || lastLeg?.toCity || '',
      toCity: form.toCity.trim(),
      fromCoords: form.fromCoords,
      toCoords: form.toCoords,
      givenBudget: Number(form.givenBudget) || 0,
      distance: Number(form.distance) || 0,
      note: form.note
    })
  }, [form, lastLeg, onSubmit, editingLeg])

  return createPortal(
    <ModalWrapper onClose={onClose} size="lg">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl max-h-[95vh] overflow-hidden">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{editingLeg ? 'Bosqichni tahrirlash' : 'Yangi bosqich'}</h2>
                <p className="text-emerald-400/80 text-sm mt-0.5 flex items-center gap-1">
                  {isLocal ? <><Flag size={14} /> Mahalliy yo'nalish</> : <><Globe size={14} /> Xalqaro yo'nalish</>}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(95vh-100px)]">
          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="group w-full py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3"
          >
            <Map size={24} className="group-hover:scale-110 transition-transform" />
            Xaritadan tanlash
            <Sparkles size={18} className="text-amber-300" />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-slate-500 text-sm font-medium px-3">yoki qo'lda kiriting</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-400 mb-2">Qayerdan</label>
              <AddressAutocomplete
                value={form.fromCity}
                onChange={v => setForm(f => ({ ...f, fromCity: v }))}
                onSelect={s => setForm(f => ({ ...f, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } }))}
                placeholder="Boshlang'ich manzil"
                focusColor="green"
                domesticOnly={isLocal}
                className="!py-4 !text-lg !rounded-xl"
              />
            </div>

            <div className="flex justify-center">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                <ArrowRight size={18} className="text-slate-500 rotate-90" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-400 mb-2">Qayerga *</label>
              <AddressAutocomplete
                value={form.toCity}
                onChange={v => setForm(f => ({ ...f, toCity: v }))}
                onSelect={s => setForm(f => ({ ...f, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } }))}
                placeholder="Boradigan manzil"
                focusColor="green"
                domesticOnly={isLocal}
                className="!py-4 !text-lg !rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Yo'l xarajati (so'm)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={form.givenBudget ? formatMoney(form.givenBudget) : ''}
                onChange={e => setForm(f => ({ ...f, givenBudget: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">so'm</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Izoh (ixtiyoriy)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors min-h-[80px] resize-none"
              placeholder="Bosqich bo'yicha qo'shimcha izohlar..."
            />
          </div>

          <button
            type="submit"
            disabled={!form.toCity?.trim()}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            {editingLeg ? 'Saqlash' : 'Bosqich qo\'shish'}
          </button>
        </form>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// ============================================
// EXPENSE MODAL - Xarajat qo'shish (PRO + Valyuta)
// ============================================
export const ExpenseModal = memo(function ExpenseModal({ flight, selectedLeg, editingExpense, onClose, onSubmit, hideInternationalFeatures = false }) {
  const isInternational = flight?.flightType === 'international' && !hideInternationalFeatures
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  const [form, setForm] = useState(() => ({
    category: editingExpense?.type?.startsWith('fuel_') ? 'fuel' : editingExpense?.type?.startsWith('border_') ? 'border' : editingExpense?.type?.startsWith('filter_') ? 'filter' : (editingExpense?.type || 'fuel'),
    type: editingExpense?.type || 'fuel_metan',
    amount: editingExpense?.amount?.toString() || '',
    currency: editingExpense?.currency || 'UZS',
    description: editingExpense?.description || '',
    quantity: editingExpense?.quantity?.toString() || '',
    odometer: editingExpense?.odometer?.toString() || '',
    tireNumber: editingExpense?.tireNumber?.toString() || '',
    timing: editingExpense?.timing || 'during', // 'before', 'during', 'after'
    date: editingExpense?.date ? formatDateForInput(editingExpense.date) : formatDateForInput(new Date())
  }))

  const [rates, setRates] = useState(null)

  // Valyuta kurslarini olish
  useEffect(() => {
    if (isInternational) {
      fetch('/api/currency/rates')
        .then(r => r.json())
        .then(d => { if (d.data?.rates) setRates(d.data.rates) })
        .catch(() => { })
    }
  }, [isInternational])

  const isBorder = form.category === 'border'
  const isFuel = form.category === 'fuel'
  const isOil = form.category === 'oil'
  const isFilter = form.category === 'filter'
  const quickAmounts = useMemo(() => {
    if (form.currency === 'USD') return [10, 20, 50, 100, 200]
    if (form.currency === 'RUB') return [1000, 2000, 5000, 10000, 20000]
    if (form.currency === 'KZT') return [5000, 10000, 20000, 50000, 100000]
    if (form.category === 'oil') return [100000, 200000, 300000, 500000, 800000]
    if (form.category === 'filter') return [50000, 100000, 150000, 200000, 300000]
    return QUICK_AMOUNTS[form.category] || QUICK_AMOUNTS.other
  }, [form.category, form.currency])

  // So'mga konvertatsiya
  const convertedToUZS = useMemo(() => {
    if (!form.amount || form.currency === 'UZS' || !rates) return null
    const rate = rates[form.currency] || 1
    const uzsRate = rates.UZS || 12800
    return Math.round((Number(form.amount) / rate) * uzsRate)
  }, [form.amount, form.currency, rates])

  const handleSubmit = useCallback(() => {
    if (!form.amount) return

    // USD ga konvertatsiya
    let amountInUSD = 0
    let amountInUZS = Number(form.amount)

    if (isBorder) {
      // Chegara xarajatlari USD da
      amountInUSD = Number(form.amount)
      amountInUZS = rates ? Math.round(amountInUSD * (rates.UZS || 12800)) : Math.round(amountInUSD * 12800)
    } else if (form.currency === 'USD') {
      amountInUSD = Number(form.amount)
      amountInUZS = rates ? Math.round(amountInUSD * (rates.UZS || 12800)) : Math.round(amountInUSD * 12800)
    } else if (form.currency === 'UZS') {
      amountInUZS = Number(form.amount)
      amountInUSD = rates ? Math.round(amountInUZS / (rates.UZS || 12800) * 100) / 100 : Math.round(amountInUZS / 12800 * 100) / 100
    } else if (rates) {
      // Boshqa valyutalar (RUB, KZT, EUR, TRY)
      const rate = rates[form.currency] || 1
      amountInUSD = Math.round(Number(form.amount) / rate * 100) / 100
      amountInUZS = Math.round(amountInUSD * (rates.UZS || 12800))
    } else {
      amountInUZS = convertedToUZS || Number(form.amount)
    }

    // Katta xarajat turlarini aniqlash (shofyor oyligiga ta'sir qilmaydi)
    const HEAVY_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil']
    const expenseType = isFuel ? form.type : isBorder ? form.type : form.category
    const expenseClass = HEAVY_TYPES.includes(expenseType) ? 'heavy' : 'light'

    onSubmit({
      type: expenseType,
      expenseClass,
      amount: Number(form.amount),
      currency: isBorder ? 'USD' : form.currency,
      amountInUSD,
      amountInUZS,
      description: form.description,
      quantity: isFuel && form.quantity ? Number(form.quantity) : (isOil && form.quantity ? Number(form.quantity) : null),
      odometer: (isFuel || isOil || form.category === 'repair' || form.category === 'tire' || form.category === 'accident') && form.odometer ? Number(form.odometer) : null,
      tireNumber: form.category === 'tire' && form.tireNumber ? form.tireNumber : null,
      date: form.date ? new Date(form.date) : new Date(),
      legId: selectedLeg?.leg?._id || null,
      legIndex: selectedLeg?.index ?? null,
      timing: form.timing, // 'before', 'during', 'after'
      exchangeRate: rates?.[form.currency] || 1
    })
  }, [form, selectedLeg, onSubmit, isFuel, isOil, isBorder, convertedToUZS, rates])

  // Valyutalar ro'yxati
  const currencies = isInternational ? [
    { code: 'UZS', symbol: "so'm", label: 'UZ' },
    { code: 'USD', symbol: '$', label: 'US' },
    { code: 'RUB', symbol: '₽', label: 'RU' },
    { code: 'KZT', symbol: '₸', label: 'KZ' },
    { code: 'EUR', symbol: '€', label: 'EU' },
    { code: 'TRY', symbol: '₺', label: 'TR' }
  ] : [{ code: 'UZS', symbol: "so'm", label: 'UZ' }]

  // Icon render helper
  const renderIcon = (iconName, className = "w-6 h-6") => {
    const IconComponent = ICONS[iconName]
    return IconComponent ? <IconComponent className={className} /> : null
  }

  return createPortal(
    <ModalWrapper onClose={onClose} size="xl">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden">
        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{editingExpense ? 'Xarajatni tahrirlash' : 'Xarajat qo\'shish'}</h2>
              {selectedLeg?.leg && (
                <p className="text-slate-500 text-sm mt-0.5">{selectedLeg.leg.fromCity?.split(',')[0]} → {selectedLeg.leg.toCity?.split(',')[0]}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(95vh-100px)]">
          {/* Ovozli kiritish tugmasi */}
          {!editingExpense && (
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(true)}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <Mic size={22} />
              Ovoz bilan kiritish
              <Sparkles size={16} className="text-amber-300" />
            </button>
          )}

          {/* Kategoriyalar */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Kategoriya tanlang</label>
            <div className={`grid gap-2 ${isInternational ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-3 sm:grid-cols-6'}`}>
              {EXPENSE_CATEGORIES
                .filter(c => c.value !== 'border' || isInternational) // Chegara faqat xalqaro reyslar uchun
                .map(c => {
                  const IconComp = ICONS[c.iconName]
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, category: c.value, type: c.value === 'fuel' ? 'fuel_metan' : c.value === 'border' ? 'border_customs' : c.value, amount: '' }))}
                      className={`flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all ${form.category === c.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${form.category === c.value ? c.bgColor : 'bg-slate-100'}`}>
                        {IconComp && <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${form.category === c.value ? 'text-white' : 'text-slate-500'}`} />}
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold mt-1.5">{c.label}</span>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* Yoqilg'i turlari - Select */}
          {isFuel && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">Yoqilg'i turi</label>
              <select
                value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg font-medium focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
              >
                {FUEL_TYPES.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label} ({f.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtr turlari - Select */}
          {isFilter && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">Filtr turi</label>
              <select
                value={form.type}
                onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5rem' }}
              >
                {FILTER_TYPES.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chegara turlari */}
          {isBorder && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">Chegara xarajati turi</label>
              <div className="grid grid-cols-4 gap-2">
                {BORDER_TYPES.map(b => {
                  const IconComp = ICONS[b.iconName]
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, type: b.value }))}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${form.type === b.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-lg shadow-purple-500/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex justify-center mb-2">
                        {IconComp && <IconComp className={`w-8 h-8 ${form.type === b.value ? 'text-purple-600' : 'text-slate-400'}`} />}
                      </div>
                      <p className="text-xs font-bold">{b.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Valyuta tanlash - faqat xalqaro reyslar uchun */}
          {isInternational && !isBorder && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">Valyuta tanlang</label>
              <div className="grid grid-cols-6 gap-2">
                {currencies.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, currency: c.code, amount: '' }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${form.currency === c.code
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <p className="text-xs font-bold mt-1">{c.code}</p>
                  </button>
                ))}
              </div>
              {rates && form.currency !== 'UZS' && (
                <p className="text-xs text-slate-500 mt-2">
                  Joriy kurs: 1 {form.currency} = {formatMoney(Math.round(rates.UZS / rates[form.currency]))} so'm
                </p>
              )}
            </div>
          )}

          {/* Tez summa tanlash */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Tez tanlash</label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, amount: amt.toString() }))}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${Number(form.amount) === amt
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  {form.currency === 'UZS' ? formatMoney(amt) : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Summa kiritish */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">
              Summa
              {isBorder && <span className="text-purple-500 ml-1">(USD)</span>}
              {!isBorder && form.currency !== 'UZS' && <span className="text-blue-500 ml-1">({form.currency})</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={form.amount ? (form.currency === 'UZS' && !isBorder ? formatMoney(form.amount) : form.amount) : ''}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-2xl font-bold placeholder-slate-400 text-center focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                placeholder={isBorder ? '$ summa' : `${currencies.find(c => c.code === form.currency)?.symbol || ''} summa`}
                autoFocus
              />
              {form.amount && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, amount: '' }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {/* So'mga konvertatsiya ko'rsatish */}
            {convertedToUZS && (
              <p className="text-center text-emerald-600 font-semibold mt-2">
                ≈ {formatMoney(convertedToUZS)} so'm
              </p>
            )}
          </div>

          {/* Yoqilg'i miqdori */}
          {isFuel && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">
                Miqdori ({FUEL_TYPES.find(f => f.value === form.type)?.unit || 'litr'})
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                placeholder="Miqdorini kiriting"
              />
            </div>
          )}

          {/* Moy miqdori */}
          {isOil && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">
                Moy miqdori (litr)
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                placeholder="Litr miqdorini kiriting"
              />
            </div>
          )}

          {/* Spidometr - yoqilg'i, moy va katta xarajatlar uchun */}
          {(isFuel || isOil || form.category === 'repair' || form.category === 'tire' || form.category === 'accident') && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">
                Spidometr (km)
              </label>
              <input
                type="number"
                value={form.odometer}
                onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                placeholder={flight?.startOdometer ? `Boshlang'ich: ${flight.startOdometer} km` : 'Spidometr ko\'rsatkichi'}
              />
              {flight?.startOdometer && form.odometer && Number(form.odometer) > flight.startOdometer && (
                <p className="text-blue-600 text-sm mt-2">
                  Boshlang'ichdan: +{(Number(form.odometer) - flight.startOdometer).toLocaleString()} km
                </p>
              )}
            </div>
          )}

          {/* Shina raqamlari - shina xarajati uchun */}
          {form.category === 'tire' && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-3">
                Shinaning maxsus raqamlari
              </label>
              <input
                type="text"
                value={form.tireNumber}
                onChange={e => setForm(f => ({ ...f, tireNumber: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all"
                placeholder="205/55R16, 195/65R15 (shinaning o'lchami)"
              />
              <p className="text-xs text-slate-500 mt-2">
                💡 Format: Kenglik/Balandlik R Diametr (masalan: 205/55R16)
              </p>
            </div>
          )}

          {/* Sana */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Sana</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Xarajat vaqti - Reys boshlanishidan oldin/davomida/tugagandan keyin */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Xarajat qo'shilgan vaqti</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'before', label: '📍 Oldin', desc: 'Reys boshlanishidan oldin' },
                { value: 'during', label: '🚗 Davomida', desc: 'Reys davomida' },
                { value: 'after', label: '🏁 Keyin', desc: 'Reys tugagandan keyin' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, timing: option.value }))}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${form.timing === option.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/20'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <p className="text-sm font-bold">{option.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-lg placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="Qo'shimcha ma'lumot..."
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.amount}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl shadow-indigo-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            {editingExpense ? 'Saqlash' : 'Xarajat qo\'shish'}
          </button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceRecorder
          flightId={flight?._id}
          selectedLeg={selectedLeg}
          onResult={(data) => {
            setShowVoiceRecorder(false)
            onSubmit(data)
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </ModalWrapper>,
    document.body
  )
})


// ============================================
// COMPLETE MODAL - Marshrutni yopish (PRO)
// ============================================
export const CompleteModal = memo(function CompleteModal({ flight, onClose, onSubmit }) {
  const [form, setForm] = useState({
    endOdometer: '',
    endFuel: '',
    driverProfitPercent: '0'
  })

  const [rates, setRates] = useState(null)
  const isInternational = flight?.flightType === 'international'

  // Valyuta kurslarini olish
  useEffect(() => {
    if (isInternational) {
      fetch('/api/currency/rates')
        .then(r => r.json())
        .then(d => { if (d.data?.rates) setRates(d.data.rates) })
        .catch(() => { })
    }
  }, [isInternational])

  const uzsToUsdRate = rates?.UZS || 12800

  // Avvalgi marshrutdan qolgan pul
  const previousBalance = flight.previousBalance || 0

  // MUHIM: Faqat naqd to'lovlar va yo'l uchun berilgan pul shofyor qo'liga tushadi
  const cashPayments = (flight.legs || []).reduce((sum, leg) => {
    return sum + (leg.paymentType === 'cash' ? (leg.payment || 0) : 0)
  }, 0)
  
  // Peritsena to'lovlar firma hisobida qoladi
  const peritsenaPayments = (flight.legs || []).reduce((sum, leg) => {
    return sum + (leg.paymentType === 'peritsena' ? (leg.payment || 0) : 0)
  }, 0)

  // Jami kirim (avvalgi qoldiq bilan)
  const totalIncome = previousBalance + cashPayments + peritsenaPayments + (flight.totalGivenBudget || 0)
  
  // Shofyor qo'liga tushadigan pul (faqat naqd + yo'l uchun berilgan + avvalgi qoldiq)
  const driverAccessibleIncome = previousBalance + cashPayments + (flight.totalGivenBudget || 0)

  // MUHIM: totalExpenses ichida allaqachon chegara va platon xarajatlari bor (backend'dan kelgan)
  const allExpenses = flight.totalExpenses || 0
  const lightExpenses = flight.lightExpenses || 0
  const netProfit = totalIncome - allExpenses

  const percent = Number(form.driverProfitPercent) || 0

  // So'm da
  // YANGI LOGIKA: Haydovchi ulushi barcha to'lovlardan hisoblanadi (naqd + peritsena)
  // Lekin haydovchi berishi kerak faqat naqd to'lovlardan hisoblanadi
  
  // 1. Haydovchi ulushi - BARCHA to'lovlardan (totalIncome dan)
  const totalBasis = totalIncome - lightExpenses
  const driverShare = Math.round(totalBasis * percent / 100)
  
  // 2. Haydovchi berishi kerak - faqat NAQD to'lovlardan
  const cashBasis = driverAccessibleIncome - lightExpenses
  const cashNetProfit = cashBasis // Naqd to'lovlardan sof foyda
  const driverOwes = Math.max(0, cashNetProfit - driverShare) // Peritsena bo'lsa 0 bo'lishi mumkin

  // Debug
  console.log('[CompleteModal] Calculations:', {
    previousBalance,
    cashPayments,
    peritsenaPayments,
    totalGivenBudget: flight.totalGivenBudget,
    totalIncome,
    driverAccessibleIncome,
    allExpenses,
    lightExpenses,
    netProfit,
    totalBasis,
    cashBasis,
    driverShare,
    driverOwes
  })

  // USD da hisoblash (xalqaro reyslar uchun)
  const totalIncomeUSD = isInternational ? Math.round(totalIncome / uzsToUsdRate * 100) / 100 : 0
  const allExpensesUSD = isInternational ? (flight.totalExpensesUSD || Math.round(allExpenses / uzsToUsdRate * 100) / 100) : 0
  const netProfitUSD = isInternational ? Math.round((totalIncomeUSD - allExpensesUSD) * 100) / 100 : 0

  // USD da
  const lightExpensesUSD = isInternational ? (flight.lightExpensesUSD || Math.round(lightExpenses / uzsToUsdRate * 100) / 100) : 0
  const totalIncomeUSDForDriver = isInternational ? Math.round(totalIncome / uzsToUsdRate * 100) / 100 : 0
  const driverAccessibleIncomeUSD = isInternational ? Math.round(driverAccessibleIncome / uzsToUsdRate * 100) / 100 : 0
  
  // USD da haydovchi ulushi - barcha to'lovlardan
  const totalBasisUSD = totalIncomeUSDForDriver - lightExpensesUSD
  const driverShareUSD = isInternational ? Math.round(totalBasisUSD * percent / 100 * 100) / 100 : 0
  
  // USD da haydovchi berishi kerak - faqat naqd to'lovlardan
  const cashBasisUSD = driverAccessibleIncomeUSD - lightExpensesUSD
  const driverOwesUSD = isInternational ? Math.max(0, Math.round((cashBasisUSD - driverShareUSD) * 100) / 100) : 0

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    const data = {
      endOdometer: Number(form.endOdometer) || 0,
      endFuel: Number(form.endFuel) || 0,
      driverProfitPercent: percent
    }
    // DEBUG
    console.log('🚀 CompleteModal onSubmit data:', data)
    onSubmit(data)
  }, [form, percent, onSubmit])

  // Formatlash funksiyasi
  const formatUSD = (amount) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return createPortal(
    <ModalWrapper onClose={onClose} size="xl">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl max-h-[95vh] overflow-hidden">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Marshrutni yopish</h2>
                <p className="text-blue-400/80 text-sm mt-0.5">
                  Yakuniy hisob-kitob {isInternational && <span className="text-amber-400">(USD)</span>}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(95vh-100px)]">
          {/* Valyuta kursi ko'rsatish */}
          {isInternational && rates && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-amber-400 text-sm">Joriy kurs:</span>
              <span className="text-amber-300 font-bold">1 USD = {formatMoney(uzsToUsdRate)} so'm</span>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Calculator size={20} className="text-blue-400" />
              Moliyaviy xulosa {isInternational && <span className="text-amber-400 text-sm">(USD)</span>}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="text-emerald-400/80 text-sm font-medium">
                    Jami kirim {previousBalance > 0 && '(qoldiq bilan)'}
                  </span>
                </div>
                {isInternational ? (
                  <>
                    <p className="text-emerald-400 font-bold text-2xl">+{formatUSD(totalIncomeUSD)}</p>
                    <p className="text-emerald-400/60 text-xs mt-1">≈ {formatMoney(totalIncome)} so'm</p>
                    {(cashPayments > 0 || peritsenaPayments > 0) && (
                      <p className="text-emerald-400/60 text-xs">
                        Naqd: {formatMoney(cashPayments)} | Peritsena: {formatMoney(peritsenaPayments)}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-emerald-400 font-bold text-2xl">+{formatMoney(totalIncome)}</p>
                    {previousBalance > 0 && (
                      <p className="text-emerald-400/60 text-xs mt-1">
                        {formatMoney(cashPayments + peritsenaPayments + (flight.totalGivenBudget || 0))} + {formatMoney(previousBalance)} qoldiq
                      </p>
                    )}
                    {(cashPayments > 0 || peritsenaPayments > 0) && (
                      <p className="text-emerald-400/60 text-xs">
                        Naqd: {formatMoney(cashPayments)} | Peritsena: {formatMoney(peritsenaPayments)}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="bg-gradient-to-br from-red-500/20 to-rose-500/10 rounded-xl p-4 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={18} className="text-red-400" />
                  <span className="text-red-400/80 text-sm font-medium">Xarajatlar</span>
                </div>
                {isInternational ? (
                  <>
                    <p className="text-red-400 font-bold text-2xl">-{formatUSD(allExpensesUSD)}</p>
                    <p className="text-red-400/60 text-xs mt-1">≈ {formatMoney(allExpenses)} so'm</p>
                  </>
                ) : (
                  <p className="text-red-400 font-bold text-2xl">-{formatMoney(allExpenses)}</p>
                )}
              </div>
            </div>

            <div className={`rounded-xl p-4 border ${netProfit >= 0 ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/20' : 'bg-gradient-to-r from-rose-500/20 to-red-500/10 border-rose-500/20'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className={netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'} />
                  <span className="text-white font-semibold">Sof foyda</span>
                </div>
                {isInternational ? (
                  <div className="text-right">
                    <p className={`font-bold text-3xl ${netProfitUSD >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      {netProfitUSD >= 0 ? '+' : ''}{formatUSD(netProfitUSD)}
                    </p>
                    <p className={`text-xs mt-1 ${netProfit >= 0 ? 'text-cyan-400/60' : 'text-rose-400/60'}`}>
                      ≈ {formatMoney(netProfit)} so'm
                    </p>
                  </div>
                ) : (
                  <p className={`font-bold text-3xl ${netProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {netProfit >= 0 ? '+' : ''}{formatMoney(netProfit)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-violet-500/10 rounded-2xl p-5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Percent size={20} className="text-purple-400" />
              <h3 className="text-white font-bold text-lg">Haydovchi ulushi</h3>
            </div>

            {/* Tushuntirish */}
            {/* <div className="bg-blue-500/10 rounded-xl p-3 mb-4 border border-blue-500/20">
              <p className="text-blue-300 text-sm">
                💡 Haydovchi ulushi faqat uning qo'liga tushadigan puldan hisoblanadi:
              </p>
              <p className="text-blue-400 text-xs mt-1">
                • Naqd to'lovlar: {formatMoney(cashPayments)}
              </p>
              <p className="text-blue-400 text-xs">
                • Yo'l uchun berilgan: {formatMoney(flight.totalGivenBudget || 0)}
              </p>
              {previousBalance > 0 && (
                <p className="text-blue-400 text-xs">
                  • Avvalgi qoldiq: {formatMoney(previousBalance)}
                </p>
              )}
            </div> */}

            <div className="grid grid-cols-6 gap-2 mb-5">
              {[0, 5, 10, 15, 20, 25].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, driverProfitPercent: p.toString() }))}
                  className={`py-4 rounded-xl font-bold text-lg transition-all ${Number(form.driverProfitPercent) === p
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/10 text-slate-400 hover:bg-white/20'
                    }`}
                >
                  {p}%
                </button>
              ))}
            </div>

            {/* Custom foiz kiritish */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-400 mb-2">Yoki boshqa foiz kiriting</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.driverProfitPercent}
                onChange={e => setForm(f => ({ ...f, driverProfitPercent: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-purple-500/50 focus:outline-none transition-colors"
                placeholder="0-100 orasida foiz kiriting"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
                <p className="text-purple-300 text-sm mb-1">Haydovchi ulushi ({percent}%)</p>
                {isInternational ? (
                  <>
                    <p className="text-purple-400 font-bold text-xl">{formatUSD(driverShareUSD)}</p>
                    <p className="text-purple-400/60 text-xs mt-1">≈ {formatMoney(driverShare)} so'm</p>
                  </>
                ) : (
                  <p className="text-purple-400 font-bold text-xl">{formatMoney(driverShare)}</p>
                )}
              </div>
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-500/30">
                <p className="text-amber-300 text-sm mb-1">Haydovchi beradi</p>
                {isInternational ? (
                  <>
                    <p className="text-amber-400 font-bold text-2xl">{formatUSD(driverOwesUSD)}</p>
                    <p className="text-amber-400/60 text-xs mt-1">≈ {formatMoney(driverOwes)} so'm</p>
                  </>
                ) : (
                  <p className="text-amber-400 font-bold text-2xl">{formatMoney(driverOwes)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Tugash spidometri (km)</label>
              <input
                type="number"
                value={form.endOdometer}
                onChange={e => setForm(f => ({ ...f, endOdometer: e.target.value }))}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                placeholder={flight.startOdometer ? `${flight.startOdometer}+` : '0'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Qoldiq yoqilg'i</label>
              <input
                type="number"
                value={form.endFuel}
                onChange={e => setForm(f => ({ ...f, endFuel: e.target.value }))}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            Marshrutni yopish
            <Sparkles size={18} className="text-amber-300" />
          </button>
        </form>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// ============================================
// PAYMENT MODAL - To'lov olish/tahrirlash (PRO)
// ============================================
// TO'LOV TURLARI
const PAYMENT_TYPES = [
  { value: 'cash', label: 'Naqd', icon: Banknote, description: 'Haydovchi qo\'lida', color: 'emerald' },
  { value: 'peritsena', label: 'Peritsena', icon: Building2, description: 'Firma hisobida, shofyor qo\'lida emas', color: 'purple' }
]

export const PaymentModal = memo(function PaymentModal({ leg, onClose, onSubmit, isEditing = false }) {
  const [payment, setPayment] = useState(isEditing ? String(leg?.payment || 0) : '')
  const [paymentType, setPaymentType] = useState(leg?.paymentType || 'cash')
  const [transferFeePercent, setTransferFeePercent] = useState(leg?.transferFeePercent || 10)
  const quickAmounts = [500000, 1000000, 2000000, 3000000, 5000000]
  const feePercentOptions = [5, 10, 15, 20, 25]

  // Peritsena uchun firma xarajati hisoblash
  const transferFeeAmount = useMemo(() => {
    if (paymentType !== 'peritsena' || !payment) return 0
    return Math.round(Number(payment) * transferFeePercent / 100)
  }, [payment, paymentType, transferFeePercent])

  // Shofyorga tushadigan summa (peritsena uchun)
  const netAmount = useMemo(() => {
    if (paymentType !== 'peritsena' || !payment) return Number(payment) || 0
    return Number(payment) - transferFeeAmount
  }, [payment, paymentType, transferFeeAmount])

  const handleSubmit = useCallback(() => {
    if (!payment) return
    onSubmit({
      payment: Number(payment),
      paymentType,
      transferFeePercent: paymentType === 'peritsena' ? transferFeePercent : 0
    })
  }, [payment, paymentType, transferFeePercent, onSubmit])

  const selectedType = PAYMENT_TYPES.find(t => t.value === paymentType)
  const colorClasses = {
    emerald: { bg: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30', border: 'border-emerald-500', text: 'text-emerald-400' },
    blue: { bg: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/30', border: 'border-blue-500', text: 'text-blue-400' },
    purple: { bg: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/30', border: 'border-purple-500', text: 'text-purple-400' }
  }
  const colors = colorClasses[selectedType?.color || 'emerald']

  return createPortal(
    <ModalWrapper onClose={onClose} size="md">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl">
        <div className={`relative px-6 py-5 border-b border-white/10 bg-gradient-to-r ${paymentType === 'peritsena' ? 'from-purple-500/10 via-transparent to-violet-500/10' : 'from-emerald-500/10 via-transparent to-teal-500/10'}`}>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-2xl flex items-center justify-center shadow-xl ${colors.shadow}`}>
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{isEditing ? 'To\'lovni tahrirlash' : 'Mijozdan to\'lov'}</h2>
                <p className={`${colors.text} text-sm mt-0.5 flex items-center gap-1`}>
                  {leg.fromCity?.split(',')[0]}
                  <ArrowRight size={14} />
                  {leg.toCity?.split(',')[0]}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* To'lov turi tanlash */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">To'lov turi</label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPaymentType(type.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${paymentType === type.value
                    ? `${colorClasses[type.color].border} bg-white/10`
                    : 'border-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex justify-center mb-2">
                    <type.icon size={24} className={paymentType === type.value ? colorClasses[type.color].text : 'text-slate-400'} />
                  </div>
                  <div className={`text-sm font-bold ${paymentType === type.value ? colorClasses[type.color].text : 'text-white'}`}>
                    {type.label}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Peritsena uchun firma xarajati foizi */}
          {paymentType === 'peritsena' && (
            <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/20">
              <label className="block text-sm font-semibold text-purple-300 mb-3">
                Firma xarajati foizi
              </label>
              <div className="grid grid-cols-5 gap-2">
                {feePercentOptions.map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTransferFeePercent(pct)}
                    className={`py-2 rounded-xl text-sm font-bold transition-all ${transferFeePercent === pct
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-purple-400/70 mt-2">
                Bu foiz firma xarajatlariga sarflanadi
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">Tez tanlash</label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPayment(amt.toString())}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${Number(payment) === amt
                    ? `bg-gradient-to-r ${colors.bg} text-white shadow-lg ${colors.shadow}`
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">Mijozdan olingan to'lov (so'm)</label>
            <input
              type="number"
              value={payment}
              onChange={e => setPayment(e.target.value)}
              className={`w-full px-6 py-6 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-3xl font-bold text-center placeholder-slate-500 focus:${colors.border} focus:outline-none transition-colors`}
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Peritsena uchun hisob-kitob */}
          {paymentType === 'peritsena' && payment && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Jami to'lov:</span>
                <span className="text-white font-bold">{formatMoney(payment)} so'm</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-purple-400">Firma xarajati ({transferFeePercent}%):</span>
                <span className="text-purple-400 font-bold">-{formatMoney(transferFeeAmount)} so'm</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                <span className="text-emerald-400 font-semibold">Sof summa:</span>
                <span className="text-emerald-400 font-bold">{formatMoney(netAmount)} so'm</span>
              </div>
              <p className="text-xs text-amber-400/70 mt-2">
                <Building2 size={12} className="inline mr-1" />
                Bu pul firma hisobida saqlanadi
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!payment}
            className={`w-full py-5 bg-gradient-to-r ${colors.bg} text-white rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl ${colors.shadow} hover:shadow-2xl transition-all flex items-center justify-center gap-2`}
          >
            <CheckCircle size={22} />
            {isEditing ? 'Saqlash' : 'To\'lovni saqlash'}
          </button>
        </div>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// ============================================
// DRIVER PAYMENT MODAL - Haydovchidan pul olish
// ============================================
export const DriverPaymentModal = memo(function DriverPaymentModal({ flight, onClose, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const totalOwed = flight.driverOwes || 0
  const previouslyPaid = flight.driverPaidAmount || 0
  const remaining = totalOwed - previouslyPaid

  // Tez summa tugmalari - qolgan qarzga qarab
  const quickAmounts = useMemo(() => {
    if (remaining <= 0) return []
    const amounts = []
    // 25%, 50%, 75%, 100% qolgan qarzdan
    const percentages = [0.25, 0.5, 0.75, 1]
    percentages.forEach(p => {
      const val = Math.round(remaining * p / 1000) * 1000 // 1000 ga yaxlitlash
      if (val > 0 && val <= remaining && !amounts.includes(val)) {
        amounts.push(val)
      }
    })
    return amounts.slice(0, 4)
  }, [remaining])

  const handleSubmit = useCallback(() => {
    const paymentAmount = Number(amount)
    if (!paymentAmount || paymentAmount <= 0) return
    if (paymentAmount > remaining) {
      return // Qolgan qarzdan ko'p bo'lishi mumkin emas
    }
    onSubmit({ amount: paymentAmount, note })
  }, [amount, note, remaining, onSubmit])

  const isFullPayment = Number(amount) === remaining

  return createPortal(
    <ModalWrapper onClose={onClose} size="md">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Haydovchidan pul olish</h2>
                <p className="text-emerald-400/80 text-sm mt-0.5">
                  {flight.driver?.fullName || 'Haydovchi'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Qarz holati */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Jami qarz:</span>
              <span className="text-white font-bold">{formatMoney(totalOwed)} so'm</span>
            </div>
            {previouslyPaid > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 text-sm">To'langan:</span>
                <span className="text-emerald-400 font-bold">-{formatMoney(previouslyPaid)} so'm</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-amber-400 font-semibold">Qolgan qarz:</span>
              <span className="text-amber-400 font-bold text-xl">{formatMoney(remaining)} so'm</span>
            </div>
          </div>

          {/* Tez tanlash */}
          {quickAmounts.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-3">Tez tanlash</label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${Number(amount) === amt
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                  >
                    {formatMoney(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* To'liq to'lash tugmasi */}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setAmount(remaining.toString())}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isFullPayment
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                }`}
            >
              <CheckCircle size={20} />
              To'liq to'lash ({formatMoney(remaining)})
            </button>
          )}

          {/* Summa kiritish */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">To'lov summasi</label>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? formatMoney(amount) : ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                if (Number(val) <= remaining) {
                  setAmount(val)
                }
              }}
              className="w-full px-6 py-6 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-3xl font-bold text-center placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
              placeholder="0"
              autoFocus
            />
            <p className="text-center text-slate-500 text-sm mt-2">so'm</p>
            {Number(amount) > remaining && (
              <p className="text-center text-red-400 text-sm mt-1">Qolgan qarzdan ko'p bo'lishi mumkin emas</p>
            )}
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
              placeholder="Masalan: Naqd pul, karta orqali..."
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!amount || Number(amount) <= 0 || Number(amount) > remaining}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            {isFullPayment ? 'To\'liq to\'lash' : 'Qisman to\'lash'}
          </button>

          {/* To'lov tarixi */}
          {flight.driverPayments?.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-slate-400 text-sm font-semibold mb-3">To'lov tarixi</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {flight.driverPayments.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-emerald-400 font-semibold">{formatMoney(p.amount)}</span>
                      {p.note && <span className="text-slate-500 ml-2">- {p.note}</span>}
                    </div>
                    <span className="text-slate-500 text-xs">
                      {new Date(p.date).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// ============================================
// PLATON MODAL - Rossiya yo'l to'lovi (PRO)
// ============================================
export const PlatonModal = memo(function PlatonModal({ flight, onClose, onSubmit }) {
  const [form, setForm] = useState({
    amount: flight.platon?.amount?.toString() || '',
    currency: flight.platon?.currency || 'RUB',
    distanceKm: flight.platon?.distanceKm?.toString() || ''
  })

  return createPortal(
    <ModalWrapper onClose={onClose} size="md">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-rose-500/10 via-transparent to-red-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-red-500/5"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 via-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/30">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Platon to'lovi</h2>
                <p className="text-rose-400/80 text-sm mt-0.5">Rossiya yo'l to'lovi</p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ amount: Number(form.amount) || 0, currency: form.currency, distanceKm: Number(form.distanceKm) || 0 }) }} className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-400 mb-2">Summa</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-rose-500/50 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Valyuta</label>
              <select
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-4 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg font-bold focus:border-rose-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="RUB" className="bg-slate-900">₽ Rubl</option>
                <option value="USD" className="bg-slate-900">$ Dollar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Rossiyada yurgan masofa (km)</label>
            <input
              type="number"
              value={form.distanceKm}
              onChange={e => setForm(f => ({ ...f, distanceKm: e.target.value }))}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-rose-500/50 focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-rose-500 via-red-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-rose-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            Saqlash
          </button>
        </form>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// ============================================
// FLIGHT EDIT MODAL - Reys ma'lumotlarini tahrirlash (TO'LIQ)
// ============================================
export const FlightEditModal = memo(function FlightEditModal({ flight, onClose, onSubmit }) {
  const [activeTab, setActiveTab] = useState('general') // general, odometer, financial
  const [form, setForm] = useState({
    // Umumiy
    name: flight?.name || '',
    notes: flight?.notes || '',
    // Spidometr va yoqilg'i
    startOdometer: flight?.startOdometer?.toString() || '',
    startFuel: flight?.startFuel?.toString() || '',
    // Moliyaviy
    totalGivenBudget: flight?.totalGivenBudget?.toString() || '',
    totalPayment: flight?.totalPayment?.toString() || ''
  })

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onSubmit({
      name: form.name,
      notes: form.notes,
      startOdometer: Number(form.startOdometer) || 0,
      startFuel: Number(form.startFuel) || 0,
      totalGivenBudget: Number(form.totalGivenBudget) || 0,
      totalPayment: Number(form.totalPayment) || 0
    })
  }, [form, onSubmit])

  const tabs = [
    { id: 'general', label: 'Umumiy', icon: FileText },
    { id: 'odometer', label: 'Spidometr', icon: Gauge },
    { id: 'financial', label: 'Moliyaviy', icon: Wallet }
  ]

  return createPortal(
    <ModalWrapper onClose={onClose} size="lg">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl max-h-[95vh] overflow-hidden">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                <Gauge className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Marshrut ma'lumotlari</h2>
                <p className="text-blue-400/80 text-sm mt-0.5">Barcha ma'lumotlarni tahrirlash</p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-4">
          {tabs.map(tab => {
            const IconComp = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
              >
                <IconComp size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(95vh-180px)]">
          {/* Umumiy tab */}
          {activeTab === 'general' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Marshrut nomi</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                  placeholder="Masalan: Toshkent - Moskva"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Izoh (ixtiyoriy)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Qo'shimcha ma'lumot..."
                />
              </div>
            </>
          )}

          {/* Spidometr tab */}
          {activeTab === 'odometer' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Boshlang'ich spidometr (km)</label>
                <input
                  type="number"
                  value={form.startOdometer}
                  onChange={e => setForm(f => ({ ...f, startOdometer: e.target.value }))}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
                  placeholder="Masalan: 125000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Boshlang'ich yoqilg'i (kub/litr)</label>
                <input
                  type="number"
                  value={form.startFuel}
                  onChange={e => setForm(f => ({ ...f, startFuel: e.target.value }))}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                  placeholder="Masalan: 100"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-sm">
                  💡 Tugash spidometri va qoldiq yoqilg'i marshrutni yopishda kiritiladi
                </p>
              </div>
            </>
          )}

          {/* Moliyaviy tab */}
          {activeTab === 'financial' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} className="text-emerald-400" />
                    Mijozdan olingan to'lov (so'm)
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.totalPayment ? formatMoney(form.totalPayment) : ''}
                  onChange={e => setForm(f => ({ ...f, totalPayment: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-emerald-400/70 text-xs mt-1">Mijoz tomonidan to'langan jami summa</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  <span className="flex items-center gap-2">
                    <Wallet size={16} className="text-amber-400" />
                    Yo'l uchun berilgan pul (so'm)
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.totalGivenBudget ? formatMoney(form.totalGivenBudget) : ''}
                  onChange={e => setForm(f => ({ ...f, totalGivenBudget: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <p className="text-amber-400/70 text-xs mt-1">Haydovchiga yo'l xarajatlari uchun berilgan pul</p>
              </div>

              {/* Hisob-kitob */}
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Jami kirim:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatMoney((Number(form.totalPayment) || 0) + (Number(form.totalGivenBudget) || 0))} so'm
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Xarajatlar:</span>
                  <span className="text-red-400 font-bold">-{formatMoney(flight?.totalExpenses || 0)} so'm</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="text-slate-300 font-medium">Balans:</span>
                  <span className={`font-bold ${((Number(form.totalPayment) || 0) + (Number(form.totalGivenBudget) || 0) - (flight?.totalExpenses || 0)) >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                    }`}>
                    {formatMoney((Number(form.totalPayment) || 0) + (Number(form.totalGivenBudget) || 0) - (flight?.totalExpenses || 0))} so'm
                  </span>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            Saqlash
          </button>
        </form>
      </div>
    </ModalWrapper>,
    document.body
  )
})


// ============================================
// LEG EDIT MODAL - Buyurtma ma'lumotlarini tahrirlash
// ============================================
export const LegEditModal = memo(function LegEditModal({ leg, onClose, onSubmit }) {
  const [form, setForm] = useState({
    fromCity: leg?.fromCity || '',
    toCity: leg?.toCity || '',
    payment: leg?.payment?.toString() || '',
    givenBudget: leg?.givenBudget?.toString() || '',
    distance: leg?.distance?.toString() || '',
    note: leg?.note || ''
  })

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onSubmit({
      fromCity: form.fromCity,
      toCity: form.toCity,
      payment: Number(form.payment) || 0,
      givenBudget: Number(form.givenBudget) || 0,
      distance: Number(form.distance) || 0,
      note: form.note
    })
  }, [form, onSubmit])

  return createPortal(
    <ModalWrapper onClose={onClose} size="lg">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl max-h-[95vh] overflow-hidden">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Buyurtmani tahrirlash</h2>
                <p className="text-emerald-400/80 text-sm mt-0.5">{leg?.fromCity?.split(',')[0]} → {leg?.toCity?.split(',')[0]}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
              <X size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Manzillar */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Qayerdan</label>
              <input
                type="text"
                value={form.fromCity}
                onChange={e => setForm(f => ({ ...f, fromCity: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                placeholder="Boshlang'ich manzil"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2">Qayerga</label>
              <input
                type="text"
                value={form.toCity}
                onChange={e => setForm(f => ({ ...f, toCity: e.target.value }))}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
                placeholder="Boradigan manzil"
              />
            </div>
          </div>

          {/* Mijozdan to'lov */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Mijozdan to'lov (so'm)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.payment ? formatMoney(form.payment) : ''}
              onChange={e => setForm(f => ({ ...f, payment: e.target.value.replace(/\D/g, '') }))}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
              placeholder="0"
            />
            <p className="text-emerald-400/70 text-xs mt-1">Mijoz tomonidan to'lanadigan summa</p>
          </div>

          {/* Yo'l xarajati */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Yo'l xarajati (so'm)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.givenBudget ? formatMoney(form.givenBudget) : ''}
              onChange={e => setForm(f => ({ ...f, givenBudget: e.target.value.replace(/\D/g, '') }))}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-xl font-bold placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
              placeholder="0"
            />
            <p className="text-amber-400/70 text-xs mt-1">Haydovchiga berilgan yo'l puli</p>
          </div>
          {/* Masofa */}
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Masofa (km)</label>
            <input
              type="number"
              value={form.distance}
              onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-blue-500/50 focus:outline-none transition-colors"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-2">Izoh (ixtiyoriy)</label>
            <textarea
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors min-h-[80px] resize-none"
              placeholder="Bosqich bo'yicha qo'shimcha izohlar..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            Saqlash
          </button>
        </form>
      </div>
    </ModalWrapper>,
    document.body
  )
})
