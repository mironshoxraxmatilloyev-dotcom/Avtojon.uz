import { memo, useState } from 'react'
import { Plus, DollarSign, Truck, Home, Gift, Edit2, Trash2, TrendingUp, Calendar, Mic, User, Package, X } from 'lucide-react'
import { fmt, fmtDate } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

// Daromad turlari
const INCOME_TYPES = {
  trip: { label: 'Marshrut', icon: Truck, color: 'blue', description: 'Yuk tashish' },
  rental: { label: 'Ijara', icon: Home, color: 'purple', description: 'Mashinani ijaraga berish' },
  other: { label: 'Boshqa', icon: Gift, color: 'amber', description: 'Boshqa daromad' }
}

export const IncomeTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd }) => {
  const { incomes = [], stats = {} } = data
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState(null)

  // Daromad turlarini guruhlash
  const byType = incomes.reduce((acc, inc) => {
    const type = inc.type || 'other'
    acc[type] = (acc[type] || 0) + (inc.amount || 0)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Mashina keltirgan daromadlar</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25"
          >
            <Mic size={18} />
            <span className="hidden sm:inline">Ovoz</span>
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25"
          >
            <TrendingUp size={18} />
            <span className="hidden sm:inline">Daromad qo'shish</span>
            <span className="sm:hidden">Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="income"
          onResult={(voiceData) => {
            setShowVoiceRecorder(false)
            if (onVoiceAdd) onVoiceAdd(voiceData)
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Stats Cards - Label tepada, pul pastda, qalinroq */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Jami daromad</p>
          <p className="text-2xl font-bold text-emerald-600">{fmt(stats.totalIncome || 0)}</p>
          <p className="text-xs text-gray-400 mt-0.5">so'm</p>
        </div>

        {Object.entries(byType).slice(0, 3).map(([type, amount]) => {
          const config = INCOME_TYPES[type] || INCOME_TYPES.other
          const bgColors = { blue: 'bg-blue-50 border-blue-200', purple: 'bg-purple-50 border-purple-200', emerald: 'bg-emerald-50 border-emerald-200', amber: 'bg-amber-50 border-amber-200' }
          const textColors = { blue: 'text-blue-600', purple: 'text-purple-600', emerald: 'text-emerald-600', amber: 'text-amber-600' }
          return (
            <div key={type} className={`p-4 ${bgColors[config.color]} rounded-xl border`}>
              <p className="text-sm font-medium text-gray-600 mb-1">{config.label}</p>
              <p className={`text-2xl font-bold ${textColors[config.color]}`}>{fmt(amount)}</p>
              <p className="text-xs text-gray-400 mt-0.5">so'm</p>
            </div>
          )
        })}
      </div>

      {/* Income List */}
      {incomes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Daromadlar tarixi</h3>
          {incomes.map(income => (
            <IncomeCard
              key={income._id}
              income={income}
              onClick={() => setSelectedIncome(income)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onAdd={onAdd} />
      )}

      {/* Income Detail Modal */}
      {selectedIncome && (
        <IncomeDetailModal
          income={selectedIncome}
          onClose={() => setSelectedIncome(null)}
          onEdit={() => { setSelectedIncome(null); onEdit(selectedIncome) }}
          onDelete={() => { setSelectedIncome(null); onDelete(selectedIncome._id) }}
        />
      )}
    </div>
  )
})

// Income Card - faqat tur va summa, bosilganda modal
const IncomeCard = memo(({ income, onClick }) => {
  const config = INCOME_TYPES[income.type] || INCOME_TYPES.other
  const Icon = config.icon
  const bgColors = { blue: 'bg-blue-50', purple: 'bg-purple-50', amber: 'bg-amber-50' }
  const iconColors = { blue: 'text-blue-500', purple: 'text-purple-500', amber: 'text-amber-500' }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${bgColors[config.color]} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColors[config.color]}`} />
          </div>
          <p className="text-gray-900 font-bold text-lg">{config.label}</p>
        </div>
        <p className="text-xl font-bold text-emerald-600">+{fmt(income.amount)}</p>
      </div>
    </div>
  )
})

// Income Detail Modal - to'liq ma'lumotlar
const IncomeDetailModal = memo(({ income, onClose, onEdit, onDelete }) => {
  const config = INCOME_TYPES[income.type] || INCOME_TYPES.other
  const Icon = config.icon
  const bgColors = { blue: 'bg-blue-50', purple: 'bg-purple-50', amber: 'bg-amber-50' }
  const iconColors = { blue: 'text-blue-500', purple: 'text-purple-500', amber: 'text-amber-500' }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${bgColors[config.color]} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColors[config.color]}`} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{config.label}</h3>
              <p className="text-xs text-gray-500">{fmtDate(income.date)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summa */}
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Daromad summasi</p>
            <p className="text-3xl font-bold text-emerald-600">+{fmt(income.amount)}</p>
            <p className="text-sm text-gray-400">so'm</p>
          </div>

          {/* Ma'lumotlar */}
          <div className="space-y-3">
            {income.type === 'trip' && income.fromCity && income.toCity && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Marshrut</span>
                <span className="font-medium text-gray-900">{income.fromCity} → {income.toCity}</span>
              </div>
            )}
            {income.distance > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Masofa</span>
                <span className="font-medium text-gray-900">{fmt(income.distance)} km</span>
              </div>
            )}
            {income.clientName && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Mijoz</span>
                <span className="font-medium text-gray-900">{income.clientName}</span>
              </div>
            )}
            {income.cargoWeight > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Yuk og'irligi</span>
                <span className="font-medium text-gray-900">{income.cargoWeight} t</span>
              </div>
            )}
            {income.type === 'rental' && income.rentalDays > 0 && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Ijara kunlari</span>
                  <span className="font-medium text-gray-900">{income.rentalDays} kun</span>
                </div>
                {income.rentalRate > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Kunlik narx</span>
                    <span className="font-medium text-gray-900">{fmt(income.rentalRate)} so'm</span>
                  </div>
                )}
              </>
            )}
            {income.description && (
              <div className="py-2">
                <span className="text-gray-500 text-sm">Izoh</span>
                <p className="text-gray-900 mt-1">{income.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-100">
          <button onClick={onEdit} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
            <Edit2 size={16} /> Tahrirlash
          </button>
          <button onClick={onDelete} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
            <Trash2 size={16} /> O'chirish
          </button>
        </div>
      </div>
    </div>
  )
})

const EmptyState = memo(({ onAdd }) => (
  <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
      <TrendingUp className="w-8 h-8 text-emerald-500" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Daromad yo'q</h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
      Mashina keltirgan daromadlarni qo'shing
    </p>
    <button
      onClick={onAdd}
      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-500/25"
    >
      <Plus size={18} />
      Daromad qo'shish
    </button>
  </div>
))

// ==================== FORM ====================
export const IncomeForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Daromad turi */}
      <div>
        <label className="block text-sm text-gray-600 mb-1.5">Daromad turi</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(INCOME_TYPES).map(([key, { label, icon: Icon, color }]) => {
            const isSelected = form.type === key
            const bgColors = { blue: 'bg-blue-50 border-blue-300', purple: 'bg-purple-50 border-purple-300', amber: 'bg-amber-50 border-amber-300' }
            const iconColors = { blue: 'text-blue-500', purple: 'text-purple-500', amber: 'text-amber-500' }
            return (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, type: key })}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${isSelected ? bgColors[color] : 'bg-gray-50 border-gray-200'}`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? iconColors[color] : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sana va Summa */}
      <div className={`grid gap-3 ${form.type === 'rental' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Sana</label>
          <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none" />
        </div>
        {form.type !== 'rental' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Summa *</label>
            <input type="text" inputMode="numeric" value={form.amount ? fmt(form.amount) : ''} onChange={e => { const raw = e.target.value.replace(/\s/g, '').replace(/\D/g, ''); setForm({ ...form, amount: raw }) }} placeholder="5 000 000" className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none font-medium ${errors.amount ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'}`} />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>
        )}
      </div>

      {/* Marshrut uchun */}
      {form.type === 'trip' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Qayerdan</label>
              <input type="text" value={form.fromCity || ''} onChange={e => setForm({ ...form, fromCity: e.target.value })} placeholder="Toshkent" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Qayerga</label>
              <input type="text" value={form.toCity || ''} onChange={e => setForm({ ...form, toCity: e.target.value })} placeholder="Samarqand" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Yuk (t)</label>
              <input type="number" value={form.cargoWeight || ''} onChange={e => setForm({ ...form, cargoWeight: e.target.value })} placeholder="20" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mijoz</label>
              <input type="text" value={form.clientName || ''} onChange={e => setForm({ ...form, clientName: e.target.value })} placeholder="Mijoz nomi" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
        </>
      )}

      {/* Ijara uchun */}
      {form.type === 'rental' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kunlar *</label>
              <input type="number" value={form.rentalDays || ''} onChange={e => { const days = e.target.value; setForm(prev => { const newForm = { ...prev, rentalDays: days }; if (prev.rentalRate && days && Number(days) > 0) newForm.amount = String(Number(prev.rentalRate) * Number(days)); return newForm }) }} placeholder="7" className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none font-medium ${errors.rentalDays ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kunlik narx *</label>
              <input type="text" inputMode="numeric" value={form.rentalRate ? fmt(form.rentalRate) : ''} onChange={e => { const raw = e.target.value.replace(/\s/g, '').replace(/\D/g, ''); setForm(prev => { const newForm = { ...prev, rentalRate: raw }; if (prev.rentalDays && raw && Number(prev.rentalDays) > 0) newForm.amount = String(Number(raw) * Number(prev.rentalDays)); return newForm }) }} placeholder="500 000" className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none font-medium ${errors.rentalRate ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'}`} />
            </div>
          </div>
          {form.rentalDays && form.rentalRate && Number(form.rentalDays) > 0 && Number(form.rentalRate) > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 text-sm">Jami:</span>
                <span className="text-emerald-700 font-bold">{fmt(Number(form.rentalDays) * Number(form.rentalRate))} so'm</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Izoh */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Izoh</label>
        <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Qo'shimcha ma'lumot" rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none resize-none" />
      </div>

      <button type="submit" className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25">
        {isEdit ? 'Saqlash' : 'Qo\'shish'}
      </button>
    </form>
  )
})

export const initIncomeForm = () => ({
  type: 'trip',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  fromCity: '',
  toCity: '',
  cargoWeight: '',
  clientName: '',
  rentalDays: '',
  rentalRate: '',
  description: ''
})
