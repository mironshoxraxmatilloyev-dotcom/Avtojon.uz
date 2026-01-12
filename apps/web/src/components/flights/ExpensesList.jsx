import { Plus, Wallet, Trash2, Pencil, Fuel, Droplet, CircleDot, Circle, Utensils, Wrench, Car, FileText, Package } from 'lucide-react'

// Xarajat turlari - Lucide iconlar bilan
const EXPENSE_TYPES = {
  fuel_benzin: { label: 'Benzin', Icon: Fuel, color: 'text-red-500' },
  fuel_diesel: { label: 'Dizel', Icon: Droplet, color: 'text-blue-500' },
  fuel_gas: { label: 'Gaz', Icon: CircleDot, color: 'text-blue-500' },
  fuel_metan: { label: 'Metan', Icon: CircleDot, color: 'text-green-500' },
  fuel_propan: { label: 'Propan', Icon: Circle, color: 'text-yellow-500' },
  fuel: { label: 'Yoqilg\'i', Icon: Fuel, color: 'text-amber-500' },
  food: { label: 'Ovqat', Icon: Utensils, color: 'text-green-500' },
  repair: { label: 'Ta\'mir', Icon: Wrench, color: 'text-red-500' },
  toll: { label: 'Yo\'l to\'lovi', Icon: Car, color: 'text-blue-500' },
  fine: { label: 'Jarima', Icon: FileText, color: 'text-purple-500' },
  other: { label: 'Boshqa', Icon: Package, color: 'text-gray-500' },
}

export default function ExpensesList({ expenses, isActive, onAddExpense, onEditExpense, onDeleteExpense, formatMoney }) {
  const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <Wallet className="text-red-600 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Xarajatlar</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">Jami: {formatMoney(totalExpenses)}</p>
          </div>
        </div>
        {isActive && (
          <button 
            onClick={onAddExpense}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition"
          >
            <Plus size={14} /> Qo'shish
          </button>
        )}
      </div>

      {expenses?.length > 0 ? (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ExpenseItem 
              key={expense._id} 
              expense={expense} 
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
              isActive={isActive}
              formatMoney={formatMoney} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-400">
          <Wallet size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Xarajatlar yo'q</p>
        </div>
      )}
    </div>
  )
}

function ExpenseItem({ expense, onEdit, onDelete, isActive, formatMoney }) {
  const type = EXPENSE_TYPES[expense.type] || EXPENSE_TYPES.other
  const isFuel = expense.type?.startsWith('fuel')

  return (
    <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <type.Icon size={18} className={type.color} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-sm">{type.label}</span>
              {/* Katta xarajatlar uchun Biznesmen belgisi */}
              {(expense.amount >= 1000000 || expense.amountInUSD >= 100) && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-semibold">Biznesmen</span>
              )}
              {/* Reys boshlanganda qo'shilgan xarajatlar uchun zarar belgisi */}
              {expense.timing === 'before' && (
                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">Zarar</span>
              )}
              <span className="font-bold text-red-600 text-sm">-{formatMoney(expense.amount)}</span>
            </div>
            
            {/* Yoqilg'i detallari */}
            {isFuel && expense.quantity && (
              <div className="flex flex-wrap gap-2 mt-1 text-[10px] sm:text-xs text-gray-500">
                <span>{expense.quantity} {expense.quantityUnit || 'L'}</span>
                {expense.pricePerUnit && <span>{formatMoney(expense.pricePerUnit)}/{expense.quantityUnit || 'L'}</span>}
                {expense.odometer && <span>{expense.odometer} km</span>}
                {expense.fuelConsumption && <span>{expense.fuelConsumption} L/100km</span>}
              </div>
            )}
            
            {/* Tasdiqlash ma'lumotlari */}
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
              {expense.confirmedByDriver && (
                <span className="text-emerald-600">✅ Tasdiqlangan</span>
              )}
              {!expense.confirmedByDriver && (
                <span className="text-amber-600">⏳ Kutilmoqda</span>
              )}
            </div>
            
            {expense.description && (
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">{expense.description}</p>
            )}
            
            {expense.stationName && (
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{expense.stationName}</p>
            )}
          </div>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              onClick={() => onEdit(expense)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Tahrirlash"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={() => onDelete(expense._id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="O'chirish"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
