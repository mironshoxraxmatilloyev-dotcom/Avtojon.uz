import { memo, useState } from 'react'
import { Plus, DollarSign, Truck, Home, Briefcase, Gift, Edit2, Trash2, TrendingUp, Calendar, Mic, User, Package } from 'lucide-react'
import { fmt, fmtDate } from './constants'
import VoiceMaintenanceRecorder from './VoiceMaintenanceRecorder'

// Daromad turlari
const INCOME_TYPES = {
  trip: { label: 'Marshrut', icon: Truck, color: 'blue', description: 'Yuk tashish' },
  rental: { label: 'Ijara', icon: Home, color: 'purple', description: 'Mashinani ijaraga berish' },
  contract: { label: 'Shartnoma', icon: Briefcase, color: 'emerald', description: 'Doimiy shartnoma' },
  other: { label: 'Boshqa', icon: Gift, color: 'amber', description: 'Boshqa daromad' }
}

export const IncomeTab = memo(({ data, onAdd, onEdit, onDelete, onVoiceAdd }) => {
  const { incomes = [], stats = {} }  = data
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

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
          <h2 className="text-xl font-bold text-gray-900">Daromadlar</h2>
          <p className="text-gray-500 text-sm mt-1">Mashina keltirgan daromadlar</p>
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
            <Plus size={18} />
            <span className="hidden sm:inline">Daromad qo'shish</span>
          </button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <VoiceMaintenanceRecorder
          context="income"
          onResult={(voiceData) => {
            setShowVoiceRecorder(false)
            if (onVoiceAdd) {
              onVoiceAdd(voiceData)
            }
          }}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Stats Cards - Light Mode */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Jami daromad</p>
          <p className="text-xl font-bold text-emerald-600">{fmt(stats.totalIncome || 0)}</p>
          <p className="text-xs text-gray-400">so'm</p>
        </div>

        {Object.entries(byType).slice(0, 3).map(([type, amount]) => {
          const config = INCOME_TYPES[type] || INCOME_TYPES.other
          const bgColors = { blue: 'bg-blue-50 border-blue-200', purple: 'bg-purple-50 border-purple-200', emerald: 'bg-emerald-50 border-emerald-200', amber: 'bg-amber-50 border-amber-200' }
          const iconColors = { blue: 'text-blue-500', purple: 'text-purple-500', emerald: 'text-emerald-500', amber: 'text-amber-500' }
          return (
            <div key={type} className={`p-4 ${bgColors[config.color]} rounded-xl border`}>
              <div className="flex items-center gap-2 mb-2">
                <config.icon className={`w-5 h-5 ${iconColors[config.color]}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{config.label}</p>
              <p className="text-lg font-bold text-gray-900">{fmt(amount)}</p>
              <p className="text-xs text-gray-400">so'm</p>
            </div>
          )
        })}
      </div>

      {/* Income List - Light Mode */}
      {incomes.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Daromadlar tarixi</h3>
          {incomes.map(income => (
            <IncomeCard
              key={income._id}
              income={income}
              onEdit={() => onEdit(income)}
              onDelete={() => onDelete(income._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onAdd={onAdd} />
      )}
    </div>
  )
})

const IncomeCard = memo(({ income, onEdit, onDelete }) => {
  const config = INCOME_TYPES[income.type] || INCOME_TYPES.other
  const Icon = config.icon
  const bgColors = { blue: 'bg-blue-50 border-blue-100', purple: 'bg-purple-50 border-purple-100', emerald: 'bg-emerald-50 border-emerald-100', amber: 'bg-amber-50 border-amber-100' }
  const iconColors = { blue: 'text-blue-500', purple: 'text-purple-500', emerald: 'text-emerald-500', amber: 'text-amber-500' }
  const badgeColors = { blue: 'bg-blue-100 text-blue-700', purple: 'bg-purple-100 text-purple-700', emerald: 'bg-emerald-100 text-emerald-700', amber: 'bg-amber-100 text-amber-700' }

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 ${bgColors[config.color]} rounded-lg flex items-center justify-center shrink-0 border`}>
            <Icon className={`w-5 h-5 ${iconColors[config.color]}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${badgeColors[config.color]}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={12} />
                {fmtDate(income.date)}
              </span>
            </div>

            {/* Mashrut ma'lumotlari */}
            {income.type === 'trip' && income.fromCity && income.toCity && (
              <p className="text-gray-900 font-medium mt-1">
                {income.fromCity} → {income.toCity}
                {income.distance > 0 && <span className="text-gray-500 text-sm ml-2">({fmt(income.distance)} km)</span>}
              </p>
            )}

            {/* Izoh */}
            {income.description && (
              <p className="text-gray-500 text-sm mt-1 truncate">{income.description}</p>
            )}

            {/* Qo'shimcha ma'lumotlar */}
            {(income.clientName || income.cargoWeight > 0) && (
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {income.clientName && <span className="flex items-center gap-1"><User size={12} /> {income.clientName}</span>}
                {income.cargoWeight > 0 && <span className="flex items-center gap-1"><Package size={12} /> {income.cargoWeight} t</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600">+{fmt(income.amount)}</p>
            <p className="text-xs text-gray-400">so'm</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
              <Edit2 size={16} />
            </button>
            <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
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
      Mashina keltirgan daromadlarni qo'shing - mashrut, ijara yoki boshqa
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

// ==================== FORM - Light Mode ====================

export const IncomeForm = memo(({ form, setForm, errors, onSubmit, isEdit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Daromad turi */}
      <div>
        <label className="block text-sm text-gray-600 mb-1.5">Daromad turi</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(INCOME_TYPES).map(([key, { label, icon: Icon, color }]) => {
            const isSelected = form.type === key
            const bgColors = { blue: 'bg-blue-50 border-blue-300', purple: 'bg-purple-50 border-purple-300', emerald: 'bg-emerald-50 border-emerald-300', amber: 'bg-amber-50 border-amber-300' }
            const iconColors = { blue: 'text-blue-500', purple: 'text-purple-500', emerald: 'text-emerald-500', amber: 'text-amber-500' }

            return (
              <button
                key={key}
                type="button"
                onClick={() => setForm({ ...form, type: key })}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left ${isSelected
                  ? bgColors[color]
                  : 'bg-gray-50 border-gray-200'
                  }`}
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
          <input
            type="date"
            value={form.date || ''}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        {form.type !== 'rental' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Summa *</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.amount ? fmt(form.amount) : ''}
              onChange={e => {
                const raw = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                setForm({ ...form, amount: raw })
              }}
              placeholder="5 000 000"
              className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none font-medium ${errors.amount ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
            />
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
              <input
                type="text"
                value={form.fromCity || ''}
                onChange={e => setForm({ ...form, fromCity: e.target.value })}
                placeholder="Toshkent"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Qayerga</label>
              <input
                type="text"
                value={form.toCity || ''}
                onChange={e => setForm({ ...form, toCity: e.target.value })}
                placeholder="Samarqand"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Yuk (t)</label>
              <input
                type="number"
                value={form.cargoWeight || ''}
                onChange={e => setForm({ ...form, cargoWeight: e.target.value })}
                placeholder="20"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Mijoz</label>
              <input
                type="text"
                value={form.clientName || ''}
                onChange={e => setForm({ ...form, clientName: e.target.value })}
                placeholder="Mijoz nomi"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none"
              />
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
              <input
                type="number"
                value={form.rentalDays || ''}
                onChange={e => {
                  const days = e.target.value
                  setForm(prev => {
                    const newForm = { ...prev, rentalDays: days }
                    if (prev.rentalRate && days && Number(days) > 0) {
                      newForm.amount = String(Number(prev.rentalRate) * Number(days))
                    }
                    return newForm
                  })
                }}
                placeholder="7"
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none font-medium ${errors.rentalDays ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kunlik narx *</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.rentalRate ? fmt(form.rentalRate) : ''}
                onChange={e => {
                  const raw = e.target.value.replace(/\s/g, '').replace(/\D/g, '')
                  setForm(prev => {
                    const newForm = { ...prev, rentalRate: raw }
                    if (prev.rentalDays && raw && Number(prev.rentalDays) > 0) {
                      newForm.amount = String(Number(raw) * Number(prev.rentalDays))
                    }
                    return newForm
                  })
                }}
                placeholder="500 000"
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-lg text-gray-900 focus:outline-none font-medium ${errors.rentalRate ? 'border-red-500' : 'border-gray-200 focus:border-emerald-500'}`}
              />
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
        <textarea
          value={form.description || ''}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Qo'shimcha ma'lumot"
          rows={2}
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
      >
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
