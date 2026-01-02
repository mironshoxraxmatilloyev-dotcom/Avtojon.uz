import { createPortal } from 'react-dom'
import { X, Gauge, Fuel, Receipt, Banknote } from 'lucide-react'
import { EXPENSE_CATEGORIES, FUEL_TYPES, formatMoney } from './constants'
import AddressAutocomplete from '../AddressAutocomplete'

// Raqamni formatlash
const formatNumber = (value) => {
  if (!value) return ''
  const num = value.toString().replace(/\s/g, '')
  if (isNaN(num)) return value
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Modal wrapper - Light mode
function Modal({ show, onClose, title, icon: Icon, iconColor = 'blue', children }) {
  if (!show) return null

  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/25',
    green: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
    red: 'from-red-500 to-rose-600 shadow-red-500/25',
    purple: 'from-purple-500 to-indigo-600 shadow-purple-500/25',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/25',
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl shadow-slate-200/50 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-11 h-11 bg-gradient-to-br ${colorClasses[iconColor]} rounded-xl flex items-center justify-center shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Buyurtma qoshish modali
export function LegModal({ show, onClose, onSubmit, form, setForm, lastLeg, isDomestic }) {
  return (
    <Modal show={show} onClose={onClose} title="Yangi bosqich" icon={Receipt} iconColor="green">
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Qayerdan */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xs">A</span>
              Qayerdan
            </span>
          </label>
          <AddressAutocomplete
            value={form.fromCity || lastLeg?.toCity || ''}
            onChange={(val) => setForm({ ...form, fromCity: val })}
            onSelect={(s) => setForm({ ...form, fromCity: s.name, fromCoords: { lat: s.lat, lng: s.lng } })}
            placeholder="Boshlang'ich manzil..."
            focusColor="green"
            domesticOnly={isDomestic}
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Qayerga */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-xs">B</span>
              Qayerga *
            </span>
          </label>
          <AddressAutocomplete
            value={form.toCity}
            onChange={(val) => setForm({ ...form, toCity: val })}
            onSelect={(s) => setForm({ ...form, toCity: s.name, toCoords: { lat: s.lat, lng: s.lng } })}
            placeholder="Borish manzili..."
            focusColor="green"
            domesticOnly={isDomestic}
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* To'lov va Yo'l puli */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              To'lov (so'm)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(form.payment)}
                onChange={(e) => setForm({ ...form, payment: e.target.value.replace(/\s/g, '') })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Yo'l puli (so'm)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(form.givenBudget)}
                onChange={(e) => setForm({ ...form, givenBudget: e.target.value.replace(/\s/g, '') })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          ✓ Bosqich qo'shish
        </button>
      </form>
    </Modal>
  )
}

// Xarajat qoshish modali - Professional Light Mode
export function ExpenseModal({ show, onClose, onSubmit, form, setForm, isEditing, selectedLeg }) {
  const isFuel = form.category === 'fuel'
  const fuelType = FUEL_TYPES.find(f => f.value === form.type)

  const modalTitle = isEditing
    ? 'Xarajatni tahrirlash'
    : (selectedLeg ? `${selectedLeg.leg?.fromCity?.split(',')[0]} → ${selectedLeg.leg?.toCity?.split(',')[0]}` : 'Xarajat qo\'shish')

  return (
    <Modal show={show} onClose={onClose} title={modalTitle} icon={Banknote} iconColor="red">
      <form onSubmit={onSubmit} className="space-y-5">

        {/* Kategoriya */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Kategoriya</label>
          <div className="grid grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map(cat => {
              const isSelected = form.category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value, type: cat.value === 'fuel' ? 'fuel_metan' : cat.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${isSelected
                    ? 'border-red-500 bg-red-50 shadow-lg shadow-red-500/10'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  <span className="text-2xl block mb-1">{cat.icon}</span>
                  <p className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-slate-600'}`}>{cat.label}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Yoqilgi turi */}
        {isFuel && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Yoqilg'i turi</label>
            <div className="grid grid-cols-4 gap-2">
              {FUEL_TYPES.map(fuel => {
                const isSelected = form.type === fuel.value
                return (
                  <button
                    key={fuel.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: fuel.value })}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all ${isSelected
                      ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    <span className="text-xl block mb-0.5">{fuel.icon}</span>
                    <p className={`text-[10px] font-medium ${isSelected ? 'text-amber-600' : 'text-slate-500'}`}>{fuel.label}</p>
                    <p className={`text-[9px] ${isSelected ? 'text-amber-500' : 'text-slate-400'}`}>{fuel.unit}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Miqdor va narx */}
        {isFuel && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Miqdor ({fuelType?.unit || 'litr'})
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                1 {fuelType?.unit || 'litr'} narxi
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatNumber(form.pricePerUnit)}
                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value.replace(/\s/g, '') })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Summa */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Summa (so'm) *</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(form.amount)}
              onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/\s/g, '') })}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-xl font-bold placeholder-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">so'm</span>
          </div>
        </div>

        {/* Izoh */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Izoh (ixtiyoriy)</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:outline-none transition-all"
            placeholder="Qo'shimcha ma'lumot..."
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isEditing ? 'Yangilash' : 'Xarajat qo\'shish'}
        </button>
      </form>
    </Modal>
  )
}

// Marshrutni yopish modali
export function CompleteModal({ show, onClose, onSubmit, form, setForm, flight }) {
  const totalIncome = (flight?.totalPayment || 0) + (flight?.totalGivenBudget || 0)
  const netProfit = totalIncome - (flight?.totalExpenses || 0)
  const driverPercent = Number(form.driverProfitPercent) || 0
  const driverAmount = netProfit > 0 ? Math.round(netProfit * driverPercent / 100) : 0
  const driverOwes = netProfit - driverAmount

  return (
    <Modal show={show} onClose={onClose} title="Marshrutni yopish" icon={Receipt} iconColor="blue">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Gauge size={14} className="inline mr-1.5 text-blue-500" />
              Tugash spidometr
            </label>
            <input
              type="number"
              value={form.endOdometer}
              onChange={(e) => setForm({ ...form, endOdometer: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Fuel size={14} className="inline mr-1.5 text-amber-500" />
              Qoldiq yoqilg'i
            </label>
            <input
              type="number"
              value={form.endFuel}
              onChange={(e) => setForm({ ...form, endFuel: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Haydovchi ulushi (%)</label>
          <input
            type="number"
            value={form.driverProfitPercent}
            onChange={(e) => setForm({ ...form, driverProfitPercent: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
            placeholder="0"
            min="0"
            max="100"
          />
        </div>

        {/* Hisob-kitob */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 space-y-3 border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Sof foyda:</span>
            <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatMoney(netProfit)} so'm
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Haydovchi ulushi ({driverPercent}%):</span>
            <span className="text-purple-600 font-bold">{formatMoney(driverAmount)} so'm</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-3">
            <span className="text-slate-700 font-medium">Haydovchi beradi:</span>
            <span className="text-emerald-600 font-bold text-xl">{formatMoney(driverOwes)} so'm</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Marshrutni yopish
        </button>
      </form>
    </Modal>
  )
}

// Tolov qoshish modali
export function PaymentModal({ show, onClose, onSubmit, form, setForm, leg }) {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={`${leg?.fromCity?.split(',')[0]} → ${leg?.toCity?.split(',')[0]}`}
      icon={Banknote}
      iconColor="green"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">To'lov summasi (so'm) *</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(form.payment)}
              onChange={(e) => setForm({ ...form, payment: e.target.value.replace(/\s/g, '') })}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-xl font-bold placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              placeholder="0"
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">so'm</span>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          To'lovni qo'shish
        </button>
      </form>
    </Modal>
  )
}
