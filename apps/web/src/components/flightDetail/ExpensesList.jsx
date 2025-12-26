import { Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import { EXPENSE_TYPES, EXPENSE_CATEGORIES, formatMoney } from './constants'

export default function ExpensesList({ 
  flight, 
  isActive, 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense,
  onAddExpenseToLeg
}) {
  const expenses = flight.expenses || []
  const isInternational = flight?.flightType === 'international'
  
  // USD formatlash
  const formatUSD = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <Wallet className="text-red-600 w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Xarajatlar</h3>
            <p className="text-xs text-gray-500">
              {expenses.length} ta - Jami: {' '}
              {isInternational ? (
                <span className="font-bold text-red-600">-{formatUSD(flight.totalExpensesUSD || 0)}</span>
              ) : (
                <span className="font-bold text-red-600">-{formatMoney(flight.totalExpenses || 0)}</span>
              )}
            </p>
          </div>
        </div>
        {isActive && (
          <button onClick={onAddExpense} className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-semibold">
            <Plus size={14} className="inline mr-1" /> Qoshish
          </button>
        )}
      </div>

      {expenses.length > 0 ? (
        <div className="space-y-4">
          {flight.legs?.map((leg, legIdx) => {
            const legExpenses = expenses.filter(exp => exp.legIndex === legIdx || (exp.legId && exp.legId.toString() === leg._id?.toString()))
            if (legExpenses.length === 0) return null
            const legTotal = legExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
            const legTotalUSD = legExpenses.reduce((sum, exp) => sum + (exp.amountInUSD || 0), 0)
            
            return (
              <LegExpenseGroup key={leg._id || legIdx} leg={leg} legIdx={legIdx} expenses={legExpenses} 
                total={legTotal} totalUSD={legTotalUSD} isInternational={isInternational}
                isActive={isActive} onEdit={onEditExpense} onDelete={onDeleteExpense} onAddToLeg={() => onAddExpenseToLeg(leg, legIdx)} />
            )
          })}
          <ExpenseSummary expenses={expenses} isInternational={isInternational} />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Wallet size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Hali xarajatlar yoq</p>
        </div>
      )}
    </div>
  )
}

function LegExpenseGroup({ leg, legIdx, expenses, total, totalUSD, isInternational, isActive, onEdit, onDelete, onAddToLeg }) {
  const formatUSD = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{legIdx + 1}</div>
          <span className="text-sm font-medium text-gray-700">{leg.fromCity?.split(',')[0]} - {leg.toCity?.split(',')[0]}</span>
        </div>
        {isInternational ? (
          <div className="text-right">
            <span className="text-sm font-bold text-red-600">-{formatUSD(totalUSD)}</span>
            <span className="text-xs text-gray-400 ml-1">({formatMoney(total)})</span>
          </div>
        ) : (
          <span className="text-sm font-bold text-red-600">-{formatMoney(total)}</span>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {expenses.map((expense) => (
          <ExpenseItem key={expense._id} expense={expense} isActive={isActive} onEdit={onEdit} onDelete={onDelete} isInternational={isInternational} />
        ))}
      </div>
      {isActive && (
        <div className="px-3 py-2 bg-gray-50 border-t">
          <button onClick={onAddToLeg} className="w-full py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1">
            <Plus size={12} /> Xarajat qoshish
          </button>
        </div>
      )}
    </div>
  )
}

function ExpenseItem({ expense, isActive, onEdit, onDelete, isInternational }) {
  const expType = EXPENSE_TYPES.find(t => t.value === expense.type) || { icon: '📦', label: expense.type, color: 'from-gray-400 to-gray-500' }
  const isFuel = expense.type?.startsWith('fuel_')
  const fuelUnit = (expense.type === 'fuel_metan' || expense.type === 'fuel_propan') ? 'kub' : 'litr'
  const formatUSD = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  // Valyuta belgisi
  const currencySymbol = expense.currency === 'USD' ? '$' : expense.currency === 'RUB' ? '₽' : expense.currency === 'KZT' ? '₸' : ''
  
  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${expType.color} flex items-center justify-center text-sm`}>{expType.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {expType.label}
          {isFuel && expense.quantity && <span className="text-gray-500"> - {expense.quantity} {fuelUnit}</span>}
          {expense.currency && expense.currency !== 'UZS' && (
            <span className="ml-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{expense.currency}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 truncate">{expense.description || new Date(expense.date).toLocaleDateString('uz-UZ')}</p>
      </div>
      {isInternational && expense.amountInUSD ? (
        <div className="text-right">
          <p className="text-sm font-bold text-red-600">-{formatUSD(expense.amountInUSD)}</p>
          <p className="text-xs text-gray-400">{currencySymbol}{expense.amount?.toLocaleString()}</p>
        </div>
      ) : (
        <p className="text-sm font-bold text-red-600">-{formatMoney(expense.amount)}</p>
      )}
      {isActive && (
        <div className="flex gap-0.5">
          <button onClick={() => onEdit(expense)} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Pencil size={12} /></button>
          <button onClick={() => onDelete(expense._id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
        </div>
      )}
    </div>
  )
}

function ExpenseSummary({ expenses, isInternational }) {
  const formatUSD = (amount) => `$${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  const grouped = {}
  expenses.forEach(exp => {
    const type = exp.type?.startsWith('fuel_') ? 'fuel' : exp.type
    if (!grouped[type]) grouped[type] = { total: 0, totalUSD: 0 }
    grouped[type].total += exp.amount || 0
    grouped[type].totalUSD += exp.amountInUSD || 0
  })

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500 mb-2">Xarajat turlari:</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(grouped).map(([type, data]) => {
          const expType = EXPENSE_CATEGORIES.find(c => c.value === type) || { icon: '📦', label: type }
          return (
            <div key={type} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs">
              <span>{expType.icon}</span>
              <span className="text-gray-600">{expType.label}</span>
              {isInternational ? (
                <span className="font-bold text-gray-900">{formatUSD(data.totalUSD)}</span>
              ) : (
                <span className="font-bold text-gray-900">{formatMoney(data.total)}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
