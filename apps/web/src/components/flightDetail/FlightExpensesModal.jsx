import { X, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

const EXPENSE_CATEGORIES = {
  fuel: { label: "Yoqilg'i", icon: '⛽', color: '#f97316' },
  food: { label: 'Ovqat', icon: '🍽️', color: '#10b981' },
  repair: { label: "Ta'mir", icon: '🔧', color: '#ef4444' },
  toll: { label: "Yo'l to'lovi", icon: '🛣️', color: '#3b82f6' },
  wash: { label: 'Yuvish', icon: '💧', color: '#06b6d4' },
  other: { label: 'Boshqa', icon: '📦', color: '#6b7280' },
};

const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0';

export default function FlightExpensesModal({ show, flight, onClose, onAddExpense, isAddingMode = false, onSubmit, driver, loading }) {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState({
    amount: '',
    type: 'other',
    description: '',
    timing: 'during' // 'before', 'during', 'after'
  })

  if (!show) return null;

  // Agar xarajat qo'shish rejimida bo'lsa
  if (isAddingMode) {
    const handleAddToList = () => {
      if (!form.amount || Number(form.amount) <= 0) {
        alert('Xarajat miqdorini kiriting!')
        return
      }

      const newExpense = {
        id: Date.now(),
        ...form
      }

      setExpenses([...expenses, newExpense])
      setForm({ amount: '', type: 'other', description: '', timing: 'during' })
    }

    const handleRemove = (id) => {
      setExpenses(expenses.filter(e => e.id !== id))
    }

    const handleSubmitForm = (e) => {
      e.preventDefault()

      if (expenses.length === 0) {
        alert('Kamita bitta xarajat qo\'shish kerak!')
        return
      }

      // Barcha xarajatlarni bir vaqtada yuborish
      expenses.forEach(exp => {
        onSubmit({
          amount: exp.amount,
          type: exp.type,
          description: exp.description
        })
      })

      setExpenses([])
      setForm({ amount: '', type: 'other', description: '', timing: 'during' })
      onClose()
    }

    const getTotal = () => {
      return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Xarajat qo'shish</h2>
              <p className="text-xs text-slate-500 mt-1">
                {flight ? `${flight.name || 'Faol marshrut'} (reys davomida)` : `${driver?.fullName || 'Haydovchi'} (reys boshlanmaganda)`}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Input Form */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Xarajat turi
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Vaqti
                </label>
                <select
                  value={form.timing}
                  onChange={(e) => setForm({ ...form, timing: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="before">📍 Reys boshlanishidan oldin</option>
                  <option value="during">🚗 Reys davomida</option>
                  <option value="after">🏁 Reys tugagandan keyin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Miqdori (so'm)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Izoh (ixtiyoriy)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Xarajat haqida..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  rows="2"
                />
              </div>

              <button
                type="button"
                onClick={handleAddToList}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={18} /> Qo'shish
              </button>
            </div>

            {/* Xarajatlar ro'yxati */}
            {expenses.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">Qo'shilgan xarajatlar</h3>
                  <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded">
                    {expenses.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {expenses.map(exp => {
                    const category = EXPENSE_CATEGORIES[exp.type] || EXPENSE_CATEGORIES.other
                    const amount = Number(exp.amount || 0)

                    return (
                      <div key={exp.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-2xl">{category.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{category.label}</p>
                          {exp.description && (
                            <p className="text-xs text-slate-500 truncate">{exp.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{formatMoney(amount)}</p>
                            <p className="text-xs text-slate-500">so'm</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Jami xulosa */}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-600">Jami xarajat:</p>
                    <p className="text-sm font-bold text-slate-800">{formatMoney(getTotal())} so'm</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm font-semibold text-slate-600">Xarajatlar qo'shilmagan</p>
                <p className="text-xs text-slate-400 text-center mt-2">Yuqoridagi formadan xarajat qo'shish uchun ma'lumotlarni kiriting</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition text-sm"
            >
              Bekor qilish
            </button>
            <button
              onClick={handleSubmitForm}
              disabled={loading || expenses.length === 0}
              className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Viewing mode - reys ichida xarajatlarni ko'rish
  const groupedExpenses = {
    before: flight?.expenses?.filter(e => e.timing === 'before') || [],
    during: flight?.expenses?.filter(e => e.timing === 'during') || [],
    after: flight?.expenses?.filter(e => e.timing === 'after') || [],
  };

  const totalExpenses = (flight?.expenses || []).reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0);

  const renderExpenseItem = (expense) => {
    const category = EXPENSE_CATEGORIES[expense.type] || EXPENSE_CATEGORIES.other;
    const amount = expense.amountInUZS || expense.amount || 0;

    return (
      <div key={expense._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-2xl">{category.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{category.label}</p>
          {expense.description && (
            <p className="text-xs text-slate-500 truncate">{expense.description}</p>
          )}
          {expense.quantity && (
            <p className="text-xs text-slate-400">
              {expense.quantity} {expense.quantityUnit || 'dona'}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">{formatMoney(amount)}</p>
          <p className="text-xs text-slate-500">so'm</p>
        </div>
      </div>
    );
  };

  const renderExpenseSection = (title, expenses, timing) => {
    if (!expenses || expenses.length === 0) return null;

    const sectionTotal = expenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0);

    return (
      <div key={timing} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded">
            {expenses.length}
          </span>
        </div>
        <div className="space-y-2">
          {expenses.map(renderExpenseItem)}
        </div>
        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
          <p className="text-xs font-semibold text-slate-600">Jami:</p>
          <p className="text-sm font-bold text-slate-800">{formatMoney(sectionTotal)} so'm</p>
        </div>
      </div>
    );
  };

  const hasExpenses = (groupedExpenses.before?.length || 0) +
    (groupedExpenses.during?.length || 0) +
    (groupedExpenses.after?.length || 0) > 0;

  // Viewing mode - reys ichida xarajatlarni ko'rish
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Xarajatlar</h2>
            <p className="text-xs text-slate-500 mt-1">{flight?.name || 'Marshrut'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {hasExpenses ? (
            <>
              {/* Reysdan oldin */}
              {renderExpenseSection(
                '📍 Reysdan oldin',
                groupedExpenses.before,
                'before'
              )}

              {/* Reys davomida */}
              {renderExpenseSection(
                '🚗 Reys davomida',
                groupedExpenses.during,
                'during'
              )}

              {/* Reysdan keyin */}
              {renderExpenseSection(
                '✅ Reysdan keyin',
                groupedExpenses.after,
                'after'
              )}

              {/* Jami xulosa */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Jami xarajatlar:</p>
                  <p className="text-sm font-bold text-slate-800">{formatMoney(totalExpenses)} so'm</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Yo'l uchun berilgan:</p>
                  <p className="text-sm font-bold text-slate-800">{formatMoney(flight?.totalGivenBudget || 0)} so'm</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-indigo-200">
                  <p className="text-sm font-semibold text-slate-700">Qoldiq:</p>
                  <p className={`text-base font-bold ${(flight?.totalGivenBudget || 0) - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatMoney((flight?.totalGivenBudget || 0) - totalExpenses)} so'm
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-semibold text-slate-600">Xarajatlar qo'shilmagan</p>
              <p className="text-xs text-slate-400 text-center mt-2">Reys davomida xarajat qo'shish uchun quyidagi tugmani bosing</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onAddExpense();
            }}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={18} />
            Xarajat qo'shish
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition text-sm"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
