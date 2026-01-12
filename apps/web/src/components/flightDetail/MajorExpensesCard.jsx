import { Wrench, Plus, Trash2, Pencil, Circle, AlertTriangle, Shield, Droplet, Filter, Wind, Settings } from 'lucide-react'
import { formatMoney } from './index'

const MAJOR_EXPENSE_TYPES = {
  repair_major: { label: "Katta ta'mir", Icon: Wrench, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  tire: { label: 'Shina', Icon: Circle, color: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  accident: { label: 'Baxtsiz hodisa', Icon: AlertTriangle, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  insurance: { label: "Sug'urta", Icon: Shield, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  oil: { label: 'Moy', Icon: Droplet, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  filter: { label: 'Filtr', Icon: Filter, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  filter_oil: { label: 'Moy filtri', Icon: Droplet, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  filter_air: { label: 'Havo filtri', Icon: Wind, color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-200' },
  filter_cabin: { label: 'Salon filtri', Icon: Wind, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  filter_gas: { label: 'Gaz filtri', Icon: Settings, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
}

export default function MajorExpensesCard({ expenses, onEdit, onDelete, onAdd, isActive }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
              <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Katta xarajatlar</h3>
              <p className="text-xs text-slate-500">Ta'mir, shina, sug'urta va boshqalar</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Wrench className="w-6 h-6 text-slate-400" strokeWidth={2} />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Katta xarajatlar yo'q</p>
          <p className="text-xs text-slate-500 text-center max-w-xs mb-4">
            Katta ta'mir, shina, sug'urta kabi xarajatlar bu yerda ko'rsatiladi
          </p>
          {isActive && onAdd && (
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              Xarajat qo'shish
            </button>
          )}
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Eslatma:</span> Katta xarajatlar haydovchi oyligiga ta'sir qilmaydi va alohida hisoblanadi.
          </p>
        </div>
      </div>
    )
  }

  const total = expenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
            <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Katta xarajatlar</h3>
            <p className="text-xs text-slate-500">{expenses.length} ta xarajat</p>
          </div>
        </div>
        {isActive && onAdd && (
          <button
            onClick={onAdd}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all active:scale-95"
            title="Xarajat qo'shish"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {expenses.map((expense) => {
          const expenseType = MAJOR_EXPENSE_TYPES[expense.type] || { 
            label: 'Boshqa', 
            Icon: Settings, 
            color: 'text-slate-600', 
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200'
          }
          const amount = expense.amountInUZS || expense.amount || 0
          const ExpenseIcon = expenseType.Icon

          return (
            <div
              key={expense._id}
              className={`flex items-center gap-3 p-3 ${expenseType.bgColor} rounded-xl border ${expenseType.borderColor} hover:shadow-sm transition-all group`}
            >
              <div className={`w-10 h-10 ${expenseType.bgColor} rounded-lg flex items-center justify-center border ${expenseType.borderColor}`}>
                <ExpenseIcon className={`w-5 h-5 ${expenseType.color}`} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{expenseType.label}</p>
                {expense.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{expense.description}</p>
                )}
                {expense.timing && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      expense.timing === 'before' ? 'bg-blue-500' :
                      expense.timing === 'during' ? 'bg-emerald-500' :
                      'bg-purple-500'
                    }`} />
                    <p className="text-xs text-slate-400">
                      {expense.timing === 'before' && 'Reys oldidan'}
                      {expense.timing === 'during' && 'Reys davomida'}
                      {expense.timing === 'after' && 'Reys keyin'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatMoney(amount)}</p>
                  <p className="text-xs text-slate-500">so'm</p>
                </div>
                {isActive && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                        title="Tahrirlash"
                      >
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(expense._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                        title="O'chirish"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
        <p className="text-sm font-semibold text-slate-700">Jami katta xarajatlar:</p>
        <p className="text-lg font-bold text-orange-600">{formatMoney(total)} so'm</p>
      </div>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Eslatma:</span> Bu xarajatlar haydovchi oyligiga ta'sir qilmaydi va alohida hisoblanadi.
        </p>
      </div>
    </div>
  )
}
