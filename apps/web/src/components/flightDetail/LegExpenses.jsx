import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Fuel, MapPin, CircleDot, Circle, Droplet, Utensils, Wrench, Car, FileText, Package, Wallet } from 'lucide-react'
import { formatMoney, formatDate, formatDateTime } from './constants'

// Xarajat turlari - Lucide iconlar bilan
const EXPENSE_TYPES = {
  fuel_metan: { Icon: CircleDot, color: 'from-green-500 to-emerald-500', iconColor: 'text-green-500', label: 'Metan' },
  fuel_propan: { Icon: Circle, color: 'from-yellow-500 to-amber-500', iconColor: 'text-yellow-500', label: 'Propan' },
  fuel_benzin: { Icon: Fuel, color: 'from-orange-500 to-red-500', iconColor: 'text-red-500', label: 'Benzin' },
  fuel_diesel: { Icon: Droplet, color: 'from-amber-600 to-orange-600', iconColor: 'text-blue-500', label: 'Dizel' },
  food: { Icon: Utensils, color: 'from-green-500 to-emerald-500', iconColor: 'text-green-500', label: 'Ovqat' },
  repair: { Icon: Wrench, color: 'from-red-500 to-rose-500', iconColor: 'text-red-500', label: 'Ta\'mir' },
  toll: { Icon: Car, color: 'from-blue-500 to-indigo-500', iconColor: 'text-blue-500', label: 'Yo\'l to\'lovi' },
  fine: { Icon: FileText, color: 'from-purple-500 to-violet-500', iconColor: 'text-purple-500', label: 'Jarima' },
  other: { Icon: Package, color: 'from-gray-500 to-slate-500', iconColor: 'text-gray-500', label: 'Boshqa' }
}

export default function LegExpenses({ 
  legs, 
  expenses, 
  isActive, 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense,
  onAddPayment 
}) {
  const [expandedLegs, setExpandedLegs] = useState({})

  const toggleLeg = (legId) => {
    setExpandedLegs(prev => ({ ...prev, [legId]: !prev[legId] }))
  }

  // Har bir buyurtma uchun xarajatlarni hisoblash
  const getLegExpenses = (leg, legIndex) => {
    return expenses?.filter(exp => 
      exp.legIndex === legIndex || 
      (exp.legId && exp.legId.toString() === leg._id?.toString())
    ) || []
  }

  return (
    <div className="space-y-3">
      {legs?.map((leg, idx) => {
        const legExpenses = getLegExpenses(leg, idx)
        const totalSpent = legExpenses.reduce((sum, exp) => sum + (exp.amountInUZS || exp.amount || 0), 0)
        const isExpanded = expandedLegs[leg._id || idx]
        const balance = (leg.givenBudget || 0) + (leg.previousBalance || 0) - totalSpent
        
        return (
          <div 
            key={leg._id || idx} 
            className={`rounded-xl border overflow-hidden transition-all ${
              leg.status === 'completed' 
                ? 'border-emerald-200 bg-emerald-50/50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Buyurtma sarlavhasi - bosilganda ochiladi */}
            <div 
              onClick={() => toggleLeg(leg._id || idx)}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50 transition"
            >
              {/* Raqam */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${
                leg.status === 'completed'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : leg.status === 'in_progress'
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                {leg.status === 'completed' ? '✓' : idx + 1}
              </div>

              {/* Yo'nalish va ma'lumotlar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <span className="truncate max-w-[100px]">{leg.fromCity?.split(',')[0]}</span>
                  <span className="text-gray-400">→</span>
                  <span className="truncate max-w-[100px]">{leg.toCity?.split(',')[0]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>{leg.distance || 0} km</span>
                  {legExpenses.length > 0 && (
                    <span className="text-red-500 font-medium">{legExpenses.length} xarajat</span>
                  )}
                </div>
              </div>

              {/* Moliyaviy ma'lumot */}
              <div className="text-right flex-shrink-0">
                {leg.payment > 0 ? (
                  <p className="font-bold text-emerald-600 text-sm">+{formatMoney(leg.payment)}</p>
                ) : (
                  <p className="text-gray-400 text-xs">To'lov yo'q</p>
                )}
                <p className={`text-xs font-medium ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  Qoldiq: {formatMoney(balance)}
                </p>
              </div>

              {/* Chevron */}
              <div className="text-gray-400">
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </div>

            {/* Kengaytirilgan qism - xarajatlar */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                {/* Moliyaviy xulosa */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Berilgan</p>
                    <p className="text-sm font-bold text-orange-600">{formatMoney(leg.givenBudget || 0)}</p>
                    {leg.previousBalance > 0 && (
                      <p className="text-[9px] text-emerald-500">+{formatMoney(leg.previousBalance)} qoldiq</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Sarflangan</p>
                    <p className="text-sm font-bold text-red-600">-{formatMoney(totalSpent)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">Qoldiq</p>
                    <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatMoney(balance)}
                    </p>
                  </div>
                </div>

                {/* Xarajatlar ro'yxati */}
                {legExpenses.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {legExpenses.map((expense) => {
                      const expType = EXPENSE_TYPES[expense.type] || EXPENSE_TYPES.other
                      const isFuel = expense.type?.startsWith('fuel_')
                      const fuelUnit = (expense.type === 'fuel_metan' || expense.type === 'fuel_propan') ? 'kub' : 'litr'
                      
                      return (
                        <div key={expense._id} className="px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          {/* Debug: expense obyektini console ga chiqarish */}
                          {console.log('LegExpenses expense:', expense)}
                          
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${expType.color} flex items-center justify-center flex-shrink-0`}>
                              <expType.Icon size={18} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {expType.label}
                                  {isFuel && expense.quantity && (
                                    <span className="text-gray-500 font-normal ml-1">• {expense.quantity} {fuelUnit}</span>
                                  )}
                                </p>
                                <p className="text-sm font-bold text-red-600 flex-shrink-0">
                                  -{formatMoney(expense.amountInUZS || expense.amount)}
                                </p>
                              </div>
                              
                              {/* Qo'shimcha ma'lumotlar */}
                              <div className="mt-1 space-y-1">
                                {/* Sana */}
                                <div className="text-xs text-gray-500">
                                  📅 {formatDateTime(expense.date)}
                                  {expense.timing && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                      {expense.timing === 'before' ? 'Reys oldidan' : expense.timing === 'after' ? 'Reys keyin' : 'Reys davomida'}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Kim qo'shgani */}
                                <div className="text-xs text-gray-500">
                                  👤 {
                                    expense.addedBy === 'voice' ? 'Ovoz orqali' : 
                                    expense.addedBy === 'driver' ? 'Haydovchi tomonidan' : 
                                    'Biznesmen tomonidan'
                                  } qo'shilgan
                                  {expense.confirmedByDriver && expense.confirmedAt && (
                                    <span className="ml-2 text-emerald-600">✅ {formatDateTime(expense.confirmedAt)} da tasdiqlangan</span>
                                  )}
                                  {!expense.confirmedByDriver && (
                                    <span className="ml-2 text-amber-600">⏳ Haydovchi tasdiqini kutmoqda</span>
                                  )}
                                </div>
                                
                                {/* Tavsif */}
                                {expense.description && (
                                  <div className="text-xs text-gray-500">💬 {expense.description}</div>
                                )}
                                
                                {/* Yoqilg'i uchun qo'shimcha ma'lumotlar */}
                                {isFuel && (
                                  <div className="text-xs text-gray-500 space-y-0.5">
                                    {expense.stationName && <div>⛽ {expense.stationName}</div>}
                                    {expense.odometer && <div>📍 Spidometr: {expense.odometer.toLocaleString()} km</div>}
                                    {expense.pricePerUnit && <div>💰 Narx: {formatMoney(expense.pricePerUnit)} / {fuelUnit}</div>}
                                    {expense.location?.name && <div>📍 {expense.location.name}</div>}
                                  </div>
                                )}
                                
                                {/* Moy almashtirish uchun */}
                                {expense.type === 'oil' && expense.odometer && (
                                  <div className="text-xs text-gray-500">📍 Spidometr: {expense.odometer.toLocaleString()} km</div>
                                )}
                                
                                {/* Shina uchun */}
                                {expense.type === 'tire' && (
                                  <div className="text-xs text-gray-500 space-y-0.5">
                                    {expense.odometer && <div>📍 Spidometr: {expense.odometer.toLocaleString()} km</div>}
                                    {expense.tireNumber && <div>🛞 Shina raqami: {expense.tireNumber}</div>}
                                  </div>
                                )}
                                
                                {/* Chegara xarajatlari uchun */}
                                {expense.borderInfo && (
                                  <div className="text-xs text-gray-500">🌍 {expense.borderInfo.fromCountry} → {expense.borderInfo.toCountry}</div>
                                )}
                                
                                {/* Valyuta kursi */}
                                {expense.currency && expense.currency !== 'UZS' && expense.exchangeRate && (
                                  <div className="text-xs text-gray-500">💱 Kurs: 1 {expense.currency} = {expense.exchangeRate.toLocaleString()} UZS</div>
                                )}
                              </div>
                            </div>
                            
                            {isActive && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onEditExpense(expense) }}
                                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteExpense(expense._id) }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-400">
                    <p className="text-sm">Bu bosqichda xarajat yo'q</p>
                  </div>
                )}

                {/* Amallar */}
                {isActive && (
                  <div className="flex gap-2 p-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddExpense(leg, idx) }}
                      className="flex-1 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:shadow-md transition"
                    >
                      <Plus size={14} /> Xarajat qo'shish
                    </button>
                    {!leg.payment && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddPayment(leg) }}
                        className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:shadow-md transition"
                      >
                        <Wallet size={14} /> To'lov olish
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {(!legs || legs.length === 0) && (
        <div className="text-center py-8 text-gray-400">
          <MapPin size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Hali buyurtmalar yo'q</p>
        </div>
      )}
    </div>
  )
}
