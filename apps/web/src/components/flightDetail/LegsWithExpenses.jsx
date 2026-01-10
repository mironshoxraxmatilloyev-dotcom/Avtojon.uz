import { useState } from 'react'
import { Route, Plus, Pencil, Trash2, MapPin, Fuel, Utensils, Wrench, Car, FileText, Package, DollarSign, Wallet, ArrowRight, Navigation, CheckCircle2, Building2, Truck, Shield, CircleDot, Circle, Droplet } from 'lucide-react'
import { EXPENSE_TYPES, EXPENSE_CATEGORIES, formatMoney, isHeavyExpense } from './constants'

// Icon mapping
const ICONS = {
  Fuel, Utensils, Wrench, Car, Navigation, FileText, Package,
  Building2, Truck, Shield, CircleDot, Circle, Droplet
}

const CATEGORY_ICONS = {
  fuel: Fuel,
  food: Utensils,
  repair: Wrench,
  repair_small: Wrench,
  repair_major: Wrench,
  toll: Car,
  wash: Droplet,
  tire: Circle,
  accident: Shield,
  insurance: Shield,
  fine: FileText,
  other: Package,
  border: Navigation
}

export default function LegsWithExpenses({
  flight,
  isActive,
  onAddLeg,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onAddPayment,
  onEditPayment,
  onEditLeg,
  onDeleteLeg,
  selectedLegIndex: externalSelectedLegIndex,
  onSelectedLegChange,
  onViewFlightExpenses
}) {
  const [internalSelectedLegIndex, setInternalSelectedLegIndex] = useState(0)

  // Tashqaridan boshqarilsa tashqaridagi, aks holda ichki state
  const selectedLegIndex = externalSelectedLegIndex !== undefined ? externalSelectedLegIndex : internalSelectedLegIndex
  const setSelectedLegIndex = onSelectedLegChange || setInternalSelectedLegIndex

  const selectedLeg = flight.legs?.[selectedLegIndex]

  const legExpenses = flight.expenses?.filter(exp =>
    exp.legIndex === selectedLegIndex ||
    (exp.legId && exp.legId.toString() === selectedLeg?._id?.toString())
  ) || []

  // Xarajatlarni kategoriya bo'yicha guruhlash
  const groupedExpenses = {}
  legExpenses.forEach(exp => {
    const type = exp.type?.startsWith('fuel_') ? 'fuel' : exp.type?.startsWith('border_') ? 'border' : exp.type
    if (!groupedExpenses[type]) groupedExpenses[type] = { items: [], total: 0 }
    groupedExpenses[type].items.push(exp)
    groupedExpenses[type].total += exp.amountInUZS || exp.amount || 0
  })

  const totalLegExpenses = legExpenses.reduce((sum, e) => sum + (e.amountInUZS || e.amount || 0), 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Route className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Yo'nalishlar</h3>
            <p className="text-sm text-slate-400">{flight.legs?.length || 0} ta bosqich • {flight.expenses?.length || 0} ta xarajat</p>
          </div>
        </div>
        {isActive && (
          <button
            onClick={onAddLeg}
            className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Bosqich
          </button>
        )}
      </div>

      {/* Stepper */}
      {flight.legs && flight.legs.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 bg-white overflow-x-auto">
          <div className="flex items-center gap-2">
            {flight.legs.map((leg, idx) => {
              const isSelected = selectedLegIndex === idx
              const isCompleted = leg.status === 'completed'
              const legExp = flight.expenses?.filter(e => e.legIndex === idx) || []

              return (
                <button
                  key={leg._id || idx}
                  onClick={() => setSelectedLegIndex(idx)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all flex-shrink-0 ${isSelected
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-white/20' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">
                      {leg.fromCity?.split(',')[0]} → {leg.toCity?.split(',')[0]}
                    </p>
                    {leg.payment > 0 && (
                      <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-emerald-500'}`}>
                        +{formatMoney(leg.payment)}
                      </p>
                    )}
                  </div>
                  {legExp.length > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isSelected ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                      }`}>{legExp.length}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Leg Content */}
      {selectedLeg ? (
        <div className="p-5">
          {/* Leg Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg ${selectedLeg.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}>
                {selectedLeg.status === 'completed' ? <CheckCircle2 size={20} /> : selectedLegIndex + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                  <span>{selectedLeg.fromCity?.split(',')[0] || 'Boshlanish'}</span>
                  <ArrowRight size={18} className="text-indigo-400" />
                  <span>{selectedLeg.toCity?.split(',')[0]}</span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{selectedLeg.distance || 0} km masofa</span>
                    {selectedLeg.givenBudget > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-blue-500 font-medium">Yo'l xarajati: {formatMoney(selectedLeg.givenBudget)}</span>
                      </>
                    )}
                  </div>
                  {selectedLeg.note && (
                    <div className="group/note relative">
                      <p className="text-sm text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-lg border-l-4 border-indigo-400 mt-1 pr-10">
                        <FileText size={14} className="inline mr-1.5 text-indigo-400" />
                        {selectedLeg.note}
                      </p>
                      {isActive && (
                        <button
                          onClick={() => onEditLeg(selectedLeg)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-all opacity-0 group-hover/note:opacity-100"
                          title="Izohni tahrirlash"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Payment */}
              {selectedLeg.payment > 0 ? (
                <div className="flex items-center gap-3">
                  <div className={`px-5 py-3 rounded-xl border ${
                    selectedLeg.paymentType === 'peritsena' 
                      ? 'bg-purple-50 border-purple-200' 
                      : selectedLeg.paymentType === 'transfer'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <p className={`text-xs font-medium ${
                      selectedLeg.paymentType === 'peritsena' 
                        ? 'text-purple-600' 
                        : selectedLeg.paymentType === 'transfer'
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                    }`}>
                      {selectedLeg.paymentType === 'peritsena' 
                        ? '🏦 Peritsena' 
                        : selectedLeg.paymentType === 'transfer'
                          ? '💳 Perevozka'
                          : '💵 Naqd to\'lov'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      selectedLeg.paymentType === 'peritsena' 
                        ? 'text-purple-600' 
                        : selectedLeg.paymentType === 'transfer'
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                    }`}>+{formatMoney(selectedLeg.payment)}</p>
                    {selectedLeg.paymentType === 'peritsena' && selectedLeg.transferFeePercent > 0 && (
                      <p className="text-xs text-purple-500 mt-1">
                        Firma: {selectedLeg.transferFeePercent}% = -{formatMoney(selectedLeg.transferFeeAmount || Math.round(selectedLeg.payment * selectedLeg.transferFeePercent / 100))}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <button
                      onClick={() => onEditPayment(selectedLeg)}
                      className="px-4 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-600 active:scale-[0.98] transition-all"
                      title="To'lovni tahrirlash"
                    >
                      <Pencil size={18} />
                    </button>
                  )}
                </div>
              ) : isActive && (
                <button
                  onClick={() => onAddPayment(selectedLeg)}
                  className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all"
                >
                  <DollarSign size={20} />
                  To'lov olish
                </button>
              )}

              {/* Edit/Delete Leg Buttons */}
              {isActive && (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-2">
                  <button
                    onClick={() => onEditLeg(selectedLeg)}
                    className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                    title="Bosqichni tahrirlash"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => onDeleteLeg(selectedLeg._id)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Bosqichni o'chirish"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Xarajatlar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Xarajatlar</h4>
                {totalLegExpenses > 0 && (
                  <p className="text-sm text-red-500 font-medium">Jami: -{formatMoney(totalLegExpenses)}</p>
                )}
              </div>
            </div>
            {isActive && (
              <div className="flex gap-2">
                <button
                  onClick={() => onAddExpense(selectedLeg, selectedLegIndex)}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                  <Plus size={18} /> Qo'shish
                </button>
                {flight.expenses && flight.expenses.length > 0 && (
                  <button
                    onClick={onViewFlightExpenses}
                    className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all"
                  >
                    <FileText size={18} /> Ko'rish ({flight.expenses.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Xarajatlar Content */}
          {legExpenses.length > 0 ? (
            <div className="space-y-4">
              {/* Category Cards */}
              {Object.keys(groupedExpenses).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(groupedExpenses).map(([type, data]) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.value === type) || { iconName: 'Package', label: type, color: 'from-gray-500 to-gray-600' }
                    const Icon = CATEGORY_ICONS[type] || Package

                    return (
                      <div key={type} className={`bg-gradient-to-br ${cat.color} p-4 rounded-xl text-white relative overflow-hidden`}>
                        <div className="absolute -right-2 -bottom-2 opacity-10">
                          <Icon size={50} />
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon size={24} />
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">{data.items.length}x</span>
                          </div>
                          <p className="text-xl font-bold">{formatMoney(data.total)}</p>
                          <p className="text-sm opacity-80">{cat.label}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Expense List - Detailed Format with addedBy info */}
              <div className="space-y-2">
                {legExpenses.map((expense) => {
                  const expType = EXPENSE_TYPES.find(t => t.value === expense.type) || { iconName: 'Package', label: expense.type }
                  const IconComp = ICONS[expType.iconName] || Package
                  const isHeavy = isHeavyExpense(expense.type) || expense.expenseClass === 'heavy'

                  return (
                    <div key={expense._id} className={`p-3 rounded-lg group hover:bg-slate-100 transition-colors ${isHeavy ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${expType.iconColor ? 'bg-white border border-slate-100' : 'bg-gradient-to-br ' + (expType.color || 'from-gray-500 to-slate-500')}`}>
                            <IconComp className={`w-4 h-4 ${expType.iconColor || 'text-white'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{expType.label}</span>
                              {expense.confirmedByDriver ? (
                                <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">✓ Tasdiqlangan</span>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">⏳ Kutilmoqda</span>
                              )}
                            </div>
                            {/* Kim qo'shgani ma'lumoti - faqat ovoz va haydovchi uchun */}
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              {expense.addedBy === 'voice' && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  🎤 Ovoz orqali qo'shilgan
                                </span>
                              )}
                              {expense.addedBy === 'driver' && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  👨‍💼 Haydovchi tomonidan qo'shilgan
                                </span>
                              )}
                              {isHeavy && expense.addedBy === 'businessman' && (
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                  🏢 Biznesmen
                                </span>
                              )}
                              {expense.date && (
                                <span>📅 {new Date(expense.date).toLocaleDateString('uz-UZ')} {new Date(expense.date).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                              )}
                            </div>
                            {expense.description && (
                              <div className="text-xs text-slate-500 mt-1">💬 {expense.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isHeavy ? 'text-rose-600' : 'text-red-500'}`}>-{formatMoney(expense.amountInUZS || expense.amount)}</span>
                          {isActive && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onEditExpense(expense)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => onDeleteExpense(expense._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-14 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <MapPin size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-600 font-semibold mb-1">Bu bosqichda xarajat yo'q</p>
              <p className="text-slate-400 text-sm mb-4">Xarajatlarni qo'shish uchun tugmani bosing</p>
              {isActive && (
                <button
                  onClick={() => onAddExpense(selectedLeg, selectedLegIndex)}
                  className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold inline-flex items-center gap-2 hover:bg-orange-600 active:scale-[0.98] transition-all"
                >
                  <Plus size={20} /> Xarajat qo'shish
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-14 text-center">
          <div className="w-18 h-18 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Route size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">Hali bosqichlar yo'q</p>
          <p className="text-slate-400 text-sm mt-1">Yuqoridagi "Bosqich" tugmasini bosing</p>
        </div>
      )}
    </div>
  )
}
