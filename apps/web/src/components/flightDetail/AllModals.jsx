import { useState, useCallback, memo, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Route, Map, DollarSign, CheckCircle, Wallet, TrendingUp, TrendingDown,
  Calculator, Percent, ArrowRight, Sparkles, Fuel, Utensils, Wrench, Car,
  Navigation, FileText, Package, Building2, Truck, Shield, CircleDot, Circle, Droplet
} from 'lucide-react'
import AddressAutocomplete from '../AddressAutocomplete'
import { EXPENSE_CATEGORIES, FUEL_TYPES, BORDER_TYPES, formatMoney } from './constants'

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
export const LegModal = memo(function LegModal({ flight, onClose, onSubmit, onOpenLocationPicker }) {
  const lastLeg = flight.legs?.[flight.legs.length - 1]
  const isLocal = flight?.flightType !== 'international' // Mahalliy reys
  const [form, setForm] = useState({
    fromCity: lastLeg?.toCity || '',
    toCity: '',
    givenBudget: '',
    distance: '',
    fromCoords: lastLeg?.toCoords || null,
    toCoords: null
  })

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!form.toCity?.trim()) return
    onSubmit({
      fromCity: form.fromCity || lastLeg?.toCity || '',
      toCity: form.toCity.trim(),
      fromCoords: form.fromCoords,
      toCoords: form.toCoords,
      givenBudget: Number(form.givenBudget) || 0,
      distance: Number(form.distance) || 0
    })
  }, [form, lastLeg, onSubmit])

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
                <h2 className="text-xl font-bold text-white">Yangi bosqich</h2>
                <p className="text-emerald-400/80 text-sm mt-0.5">
                  {isLocal ? '🇺🇿 Mahalliy yo\'nalish' : '🌍 Xalqaro yo\'nalish'}
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

          <button
            type="submit"
            disabled={!form.toCity?.trim()}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            Bosqich qo'shish
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
export const ExpenseModal = memo(function ExpenseModal({ flight, selectedLeg, editingExpense, onClose, onSubmit }) {
  const isInternational = flight?.flightType === 'international'

  const [form, setForm] = useState(() => ({
    category: editingExpense?.type?.startsWith('fuel_') ? 'fuel' : editingExpense?.type?.startsWith('border_') ? 'border' : (editingExpense?.type || 'fuel'),
    type: editingExpense?.type || 'fuel_metan',
    amount: editingExpense?.amount?.toString() || '',
    currency: editingExpense?.currency || 'UZS',
    description: editingExpense?.description || '',
    quantity: editingExpense?.quantity?.toString() || ''
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
  const quickAmounts = useMemo(() => {
    if (form.currency === 'USD') return [10, 20, 50, 100, 200]
    if (form.currency === 'RUB') return [1000, 2000, 5000, 10000, 20000]
    if (form.currency === 'KZT') return [5000, 10000, 20000, 50000, 100000]
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

    onSubmit({
      type: isFuel ? form.type : isBorder ? form.type : form.category,
      amount: Number(form.amount),
      currency: isBorder ? 'USD' : form.currency,
      amountInUSD,
      amountInUZS,
      description: form.description,
      quantity: isFuel && form.quantity ? Number(form.quantity) : null,
      date: new Date(),
      legId: selectedLeg?.leg?._id || null,
      legIndex: selectedLeg?.index ?? null,
      exchangeRate: rates?.[form.currency] || 1
    })
  }, [form, selectedLeg, onSubmit, isFuel, isBorder, convertedToUZS, rates])

  // Valyutalar ro'yxati
  const currencies = isInternational ? [
    { code: 'UZS', symbol: "so'm", flag: '🇺🇿' },
    { code: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'RUB', symbol: '₽', flag: '🇷🇺' },
    { code: 'KZT', symbol: '₸', flag: '🇰🇿' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺' },
    { code: 'TRY', symbol: '₺', flag: '🇹🇷' }
  ] : [{ code: 'UZS', symbol: "so'm", flag: '🇺🇿' }]

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
                  💱 Joriy kurs: 1 {form.currency} = {formatMoney(Math.round(rates.UZS / rates[form.currency]))} so'm
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
    </ModalWrapper>,
    document.body
  )
})


// ============================================
// COMPLETE MODAL - Reysni yopish (PRO)
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

  const totalIncome = (flight.totalPayment || 0) + (flight.totalGivenBudget || 0)
  const borderExpenses = flight.borderCrossingsTotalUZS || (flight.borderCrossingsTotalUSD ? Math.round(flight.borderCrossingsTotalUSD * 12800) : 0)
  const platonExpenses = flight.platon?.amountInUZS || (flight.platon?.amountInUSD ? Math.round(flight.platon.amountInUSD * 12800) : 0)
  const allExpenses = (flight.totalExpenses || 0) + borderExpenses + platonExpenses
  const netProfit = totalIncome - allExpenses

  // USD da hisoblash (xalqaro reyslar uchun)
  const totalIncomeUSD = isInternational ? Math.round(totalIncome / uzsToUsdRate * 100) / 100 : 0
  const allExpensesUSD = isInternational ? (flight.totalExpensesUSD || Math.round(allExpenses / uzsToUsdRate * 100) / 100) : 0
  const netProfitUSD = isInternational ? Math.round((totalIncomeUSD - allExpensesUSD) * 100) / 100 : 0

  const percent = Number(form.driverProfitPercent) || 0

  // So'm da
  const driverShare = Math.round(netProfit * percent / 100)
  const driverOwes = netProfit - driverShare

  // USD da
  const driverShareUSD = isInternational ? Math.round(netProfitUSD * percent / 100 * 100) / 100 : 0
  const driverOwesUSD = isInternational ? Math.round((netProfitUSD - driverShareUSD) * 100) / 100 : 0

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
                <h2 className="text-xl font-bold text-white">Reysni yopish</h2>
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
              <span className="text-amber-400 text-sm">💱 Joriy kurs:</span>
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
                  <span className="text-emerald-400/80 text-sm font-medium">Jami kirim</span>
                </div>
                {isInternational ? (
                  <>
                    <p className="text-emerald-400 font-bold text-2xl">+{formatUSD(totalIncomeUSD)}</p>
                    <p className="text-emerald-400/60 text-xs mt-1">≈ {formatMoney(totalIncome)} so'm</p>
                  </>
                ) : (
                  <p className="text-emerald-400 font-bold text-2xl">+{formatMoney(totalIncome)}</p>
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
              <h3 className="text-white font-bold text-lg">Shofyor ulushi</h3>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-5">
              {[0, 10, 20, 30, 40, 50].map(p => (
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

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
                <p className="text-purple-300 text-sm mb-1">Shofyor ulushi ({percent}%)</p>
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
                <p className="text-amber-300 text-sm mb-1">Shofyor beradi</p>
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
            Reysni yopish
            <Sparkles size={18} className="text-amber-300" />
          </button>
        </form>
      </div>
    </ModalWrapper>,
    document.body
  )
})

// ============================================
// PAYMENT MODAL - To'lov olish (PRO)
// ============================================
export const PaymentModal = memo(function PaymentModal({ leg, onClose, onSubmit }) {
  const [payment, setPayment] = useState('')
  const quickAmounts = [500000, 1000000, 2000000, 3000000, 5000000]

  return createPortal(
    <ModalWrapper onClose={onClose} size="md">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl">
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Mijozdan to'lov</h2>
                <p className="text-emerald-400/80 text-sm mt-0.5 flex items-center gap-1">
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
          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">Tez tanlash</label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setPayment(amt.toString())}
                  className={`py-3 rounded-xl text-sm font-bold transition-all ${Number(payment) === amt
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-400 mb-3">To'lov summasi</label>
            <input
              type="text"
              inputMode="numeric"
              value={payment ? formatMoney(payment) : ''}
              onChange={e => setPayment(e.target.value.replace(/\D/g, ''))}
              className="w-full px-6 py-6 bg-white/5 border-2 border-white/10 rounded-2xl text-white text-3xl font-bold text-center placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
              placeholder="0"
              autoFocus
            />
            <p className="text-center text-slate-500 text-sm mt-2">so'm</p>
          </div>

          <button
            type="button"
            onClick={() => payment && onSubmit(Number(payment))}
            disabled={!payment}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl shadow-emerald-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={22} />
            To'lovni saqlash
          </button>
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
