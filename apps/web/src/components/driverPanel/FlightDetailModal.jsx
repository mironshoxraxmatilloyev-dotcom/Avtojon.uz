import { X, Route, Package, Wallet, MapPin, Clock, CheckCircle, Fuel, Utensils, Wrench, Car, Globe, Flag, Plus } from 'lucide-react'
import { formatMoney, formatDate, EXPENSE_LABELS } from './constants'
import api from '../../services/api'
import { useState, useEffect } from 'react'
import { useTranslation } from '../../store/langStore'
import { showToast } from '../Toast'

// Icon mapping for expense types
const EXPENSE_ICONS = {
  fuel: Fuel,
  food: Utensils,
  repair: Wrench,
  toll: Car,
  parking: Car,
  wash: Wallet,
  other: Package,
}

// Mashrut nomini legs dan olish
const getFlightRoute = (flight, t) => {
  if (!flight?.legs?.length) return t('route')
  const firstLeg = flight.legs[0]
  const lastLeg = flight.legs[flight.legs.length - 1]
  const from = firstLeg?.fromCity || ''
  const to = lastLeg?.toCity || ''
  if (from && to) return `${from} → ${to}`
  return t('route')
}

const EXPENSE_TYPES = [
  { value: 'fuel', label: "Yoqilg'i" },
  { value: 'food', label: 'Ovqat' },
  { value: 'toll', label: "Yo'l to'lovi" },
  { value: 'wash', label: 'Yuvish' },
  { value: 'repair', label: "Ta'mirlash" },
  { value: 'parking', label: 'Parkovka' },
  { value: 'other', label: 'Boshqa' }
]

export default function FlightDetailModal({ flight: initialFlight, onClose, onUpdate }) {
  const [flight, setFlight] = useState(initialFlight)
  const { t, lang } = useTranslation()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ type: 'other', amount: '', description: '' })
  const [addingExpense, setAddingExpense] = useState(false)

  // Expense labels - til bo'yicha (Lucide iconlar bilan)
  const expenseLabels = {
    fuel: { Icon: Fuel, color: 'text-amber-500', label: lang === 'ru' ? 'Ёқилғи' : "Yoqilg'i" },
    food: { Icon: Utensils, color: 'text-green-500', label: lang === 'ru' ? 'Овқат' : 'Ovqat' },
    repair: { Icon: Wrench, color: 'text-red-500', label: lang === 'ru' ? 'Таъмирлаш' : "Ta'mirlash" },
    toll: { Icon: Car, color: 'text-blue-500', label: lang === 'ru' ? 'Йўл тўлови' : "Yo'l to'lovi" },
    parking: { Icon: Car, color: 'text-purple-500', label: lang === 'ru' ? 'Парковка' : 'Parkovka' },
    wash: { Icon: Wallet, color: 'text-cyan-500', label: lang === 'ru' ? 'Ювиш' : 'Yuvish' },
    other: { Icon: Package, color: 'text-gray-500', label: lang === 'ru' ? 'Бошқа' : 'Boshqa' },
  }

  // initialFlight o'zgarganda flight ni yangilash
  useEffect(() => {
    setFlight(initialFlight)
  }, [initialFlight])

  if (!flight) return null

  const totalIncome = (flight.totalPayment || 0) + (flight.roadMoney || flight.totalGivenBudget || 0)
  const totalExpenses = flight.totalExpenses || 0
  const netProfit = flight.netProfit || flight.profit || (totalIncome - totalExpenses)
  const driverOwes = flight.driverOwes || flight.businessProfit || 0
  const routeName = getFlightRoute(flight, t)

  const statusColors = {
    completed: 'bg-emerald-500',
    active: 'bg-blue-500',
    cancelled: 'bg-red-500'
  }

  // Xarajatni tasdiqlash - OPTIMISTIC UPDATE
  const handleConfirmExpense = async (expenseId) => {
    // 🚀 Darhol UI ni yangilash (optimistic)
    const updatedFlight = {
      ...flight,
      expenses: flight.expenses.map(e =>
        e._id === expenseId ? { ...e, confirmedByDriver: true, confirmedAt: new Date().toISOString() } : e
      )
    }
    setFlight(updatedFlight)
    if (onUpdate) onUpdate(updatedFlight)

    // Background da serverga yuborish
    try {
      const res = await api.put(`/driver/me/flights/${flight._id}/expenses/${expenseId}/confirm`)
      if (res.data.success && res.data.data) {
        // Deep copy qilish - React state yangilanishini ta'minlash
        const newFlight = JSON.parse(JSON.stringify(res.data.data))
        setFlight(newFlight)
        if (onUpdate) onUpdate(newFlight)
      }
    } catch (err) {
      // Xatolik bo'lsa, qaytarish
      console.error('Xarajatni tasdiqlashda xatolik:', err)
      setFlight(flight)
    }
  }

  // Xarajat qo'shish
  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      showToast.error('Xarajat miqdorini kiriting!')
      return
    }

    setAddingExpense(true)
    try {
      const res = await api.post(`/driver/me/flights/${flight._id}/expenses`, {
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        description: expenseForm.description,
        timing: 'before'
      })
      
      if (res.data.success && res.data.data) {
        const newFlight = JSON.parse(JSON.stringify(res.data.data))
        setFlight(newFlight)
        if (onUpdate) onUpdate(newFlight)
        setExpenseForm({ type: 'other', amount: '', description: '' })
        setShowExpenseForm(false)
        showToast.success("Xarajat qo'shildi!")
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setAddingExpense(false)
    }
  }

  // Tasdiqlanmagan xarajatlar soni
  const unconfirmedCount = flight.expenses?.filter(e => !e.confirmedByDriver).length || 0

  // Tarjimalar
  const labels = {
    distance: lang === 'ru' ? 'Масофа' : 'Masofa',
    orders: lang === 'ru' ? 'Буюртмалар' : 'Buyurtmalar',
    clientPayment: lang === 'ru' ? 'Мижоздан олинган' : 'Mijozdan olingan',
    clientPaymentHint: lang === 'ru' ? 'Буюртмалар учун тўлов' : "Buyurtmalar uchun to'lov",
    roadExpense: lang === 'ru' ? 'Йўл харажати' : "Yo'l xarajati",
    roadExpenseHint: lang === 'ru' ? 'Йўлда сарфлаш учун' : "Yo'lda sarflash uchun",
    ordersTitle: lang === 'ru' ? 'Буюртмалар' : 'Buyurtmalar',
    expensesTitle: lang === 'ru' ? 'Харажатлар' : 'Xarajatlar',
    unconfirmed: lang === 'ru' ? 'та тасдиқланмаган' : 'ta tasdiqlanmagan',
    calculation: lang === 'ru' ? 'Ҳисоб-китоб' : 'Hisob-kitob',
    totalIncome: lang === 'ru' ? 'Жами кирим' : 'Jami kirim',
    totalExpense: lang === 'ru' ? 'Жами харажат' : 'Jami xarajat',
    netProfit: lang === 'ru' ? 'Соф фойда' : 'Sof foyda',
    yourShare: lang === 'ru' ? 'Улушингиз' : 'Ulushingiz',
    mustPay: lang === 'ru' ? 'Бериш керак:' : 'Berish kerak:',
    willReturn: lang === 'ru' ? 'Сизга қайтарилади:' : 'Sizga qaytariladi:',
    paid: lang === 'ru' ? 'Тўланган' : "To'langan",
    waiting: lang === 'ru' ? 'Кутилмоқда' : 'Kutilmoqda',
    close: lang === 'ru' ? 'Ёпиш' : 'Yopish',
    count: lang === 'ru' ? 'та' : 'ta',
    sum: lang === 'ru' ? 'сўм' : "so'm",
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 ${statusColors[flight.status] || 'bg-slate-500'} flex-shrink-0`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Route className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-bold text-base truncate">{routeName}</h3>
                <p className="text-white/70 text-xs">{formatDate(flight.createdAt)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Asosiy ma'lumotlar */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox icon={MapPin} label={labels.distance} value={`${flight.totalDistance || 0} km`} />
            <StatBox icon={Package} label={labels.orders} value={`${flight.legs?.length || 0} ${labels.count}`} />
            <StatBox icon={Wallet} label={labels.clientPayment} value={formatMoney(flight.totalPayment)} color="emerald" hint={labels.clientPaymentHint} />
            <StatBox icon={Wallet} label={labels.roadExpense} value={formatMoney(flight.roadMoney || flight.totalGivenBudget || 0)} color="blue" hint={labels.roadExpenseHint} />
          </div>

          {/* Buyurtmalar */}
          {flight.legs?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <h4 className="text-slate-700 font-semibold text-sm mb-2">{labels.ordersTitle}</h4>
              <div className="space-y-1.5">
                {flight.legs.map((leg, idx) => (
                  <div key={leg._id || idx} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${leg.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {leg.status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-medium text-sm truncate">{leg.fromCity || '?'} → {leg.toCity || '?'}</p>
                      <p className="text-slate-400 text-xs">{leg.distance || 0} km</p>
                    </div>
                    <span className="text-emerald-600 font-semibold text-sm">{formatMoney(leg.payment)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Xarajatlar */}
          {flight.expenses?.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-slate-700 font-semibold text-sm">{labels.expensesTitle} ({flight.expenses.length})</h4>
                {unconfirmedCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                    {unconfirmedCount} {labels.unconfirmed}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {flight.expenses.map((exp, idx) => {
                  const info = expenseLabels[exp.type] || expenseLabels.other
                  const isConfirmed = exp.confirmedByDriver
                  const IconComponent = info.Icon
                  return (
                    <div key={exp._id || idx} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isConfirmed ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-slate-100'}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <IconComponent size={18} className={info.color} />
                        <div className="min-w-0">
                          <span className="text-slate-700 font-medium text-sm block truncate">{info.label}</span>
                          {exp.description && <span className="text-slate-400 text-xs block truncate">{exp.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-red-500 font-bold text-sm">-{formatMoney(exp.amount)}</span>
                        <button
                          type="button"
                          disabled={isConfirmed}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isConfirmed) handleConfirmExpense(exp._id)
                          }}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            isConfirmed 
                              ? 'bg-emerald-500 border-emerald-500' 
                              : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {isConfirmed && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Xarajat qo'shish form */}
          {showExpenseForm && (
            <form onSubmit={handleAddExpense} className="bg-blue-50 rounded-xl p-3 border border-blue-200 space-y-2">
              <h4 className="text-blue-900 font-semibold text-sm">Xarajat qo'shish</h4>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Xarajat turi</label>
                <select
                  value={expenseForm.type}
                  onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {EXPENSE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Miqdori (so'm)</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Izoh (ixtiyoriy)</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Xarajat haqida..."
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseForm(false)
                    setExpenseForm({ type: 'other', amount: '', description: '' })
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={addingExpense}
                  className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {addingExpense ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          )}

          {/* Xarajat qo'shish button */}
          {!showExpenseForm && (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-semibold transition flex items-center justify-center gap-2 border border-blue-200"
            >
              <Plus size={18} /> Xarajat qo'shish
            </button>
          )}

          {/* Hisob-kitob */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
            <h4 className="text-indigo-800 font-semibold text-sm mb-2">{labels.calculation}</h4>
            <div className="space-y-1.5 text-sm">
              <SummaryRow label={labels.totalIncome} value={`${formatMoney(totalIncome)} ${labels.sum}`} />
              <SummaryRow label={labels.totalExpense} value={`-${formatMoney(totalExpenses)} ${labels.sum}`} valueClass="text-red-500" />
              <div className="border-t border-indigo-200 pt-1.5 mt-1.5">
                <SummaryRow label={labels.netProfit} value={`${formatMoney(netProfit)} ${labels.sum}`} valueClass={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} bold />
              </div>
              {(flight.driverProfitPercent > 0 || flight.driverProfitAmount > 0) && (
                <SummaryRow label={`${labels.yourShare} (${flight.driverProfitPercent || 0}%)`} value={`+${formatMoney(flight.driverProfitAmount || 0)} ${labels.sum}`} valueClass="text-amber-600" bold />
              )}
            </div>

            {driverOwes > 0 && (
              <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-purple-800 font-medium text-sm">{labels.mustPay}</span>
                  <span className="text-purple-800 font-bold">{formatMoney(driverOwes)} {labels.sum}</span>
                </div>
                {flight.status === 'completed' && (
                  <div className="mt-1.5 flex items-center gap-1">
                    {flight.driverPaymentStatus === 'paid' ? (
                      <span className="text-emerald-600 text-xs flex items-center gap-1"><CheckCircle size={12} /> {labels.paid}</span>
                    ) : (
                      <span className="text-amber-600 text-xs flex items-center gap-1"><Clock size={12} /> {labels.waiting}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {driverOwes < 0 && (
              <div className="mt-3 p-3 bg-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-medium text-sm">{labels.willReturn}</span>
                  <span className="text-emerald-800 font-bold">{formatMoney(Math.abs(driverOwes))} {labels.sum}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors">
            {labels.close}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color = 'slate', hint }) {
  const colors = { slate: 'bg-slate-50 text-slate-700', emerald: 'bg-emerald-50 text-emerald-700', blue: 'bg-blue-50 text-blue-700' }
  return (
    <div className={`rounded-lg p-2.5 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={12} className="opacity-60" />
        <span className="text-xs opacity-80">{label}</span>
      </div>
      <p className="font-bold">{value}</p>
      {hint && <p className="text-[10px] opacity-50">{hint}</p>}
    </div>
  )
}

function SummaryRow({ label, value, valueClass = 'text-slate-700', bold = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-600">{label}</span>
      <span className={`${valueClass} ${bold ? 'font-bold' : 'font-semibold'}`}>{value}</span>
    </div>
  )
}
