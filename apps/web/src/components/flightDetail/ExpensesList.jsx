import { Wallet, Plus, Pencil, Trash2, Fuel, TrendingUp, TrendingDown, Minus, Package } from 'lucide-react'
import { EXPENSE_TYPES, EXPENSE_CATEGORIES, formatMoney, formatDate, formatDateTime } from './constants'

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

  const formatUSD = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Tasdiqlangan/tasdiqlanmagan xarajatlar soni
  const confirmedCount = expenses.filter(e => e.confirmedByDriver).length
  const unconfirmedCount = expenses.length - confirmedCount

  // Yoqilg'i xarajatlarini ajratib olish
  const fuelExpenses = expenses.filter(e => e.type?.startsWith('fuel_'))

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
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              {confirmedCount > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">✓ {confirmedCount}</span>
              )}
              {unconfirmedCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">⏳ {unconfirmedCount}</span>
              )}
            </div>
          )}
          {isActive && (
            <button onClick={onAddExpense} className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-semibold">
              <Plus size={14} className="inline mr-1" /> Qo'shish
            </button>
          )}
        </div>
      </div>

      {expenses.length > 0 ? (
        <div className="space-y-4">
          {/* Yoqilg'i sarflanishi statistikasi */}
          {fuelExpenses.length > 0 && (
            <FuelConsumptionStats flight={flight} fuelExpenses={fuelExpenses} />
          )}

          {/* Leg ga tegishli xarajatlar */}
          {flight.legs?.map((leg, legIdx) => {
            const legExpenses = expenses.filter(exp => exp.legIndex === legIdx || (exp.legId && exp.legId.toString() === leg._id?.toString()))
            if (legExpenses.length === 0) return null
            const legTotal = legExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
            const legTotalUSD = legExpenses.reduce((sum, exp) => sum + (exp.amountInUSD || 0), 0)

            return (
              <LegExpenseGroup key={leg._id || legIdx} leg={leg} legIdx={legIdx} expenses={legExpenses}
                total={legTotal} totalUSD={legTotalUSD} isInternational={isInternational}
                isActive={isActive} onEdit={onEditExpense} onDelete={onDeleteExpense}
                onAddToLeg={() => onAddExpenseToLeg(leg, legIdx)} flight={flight} />
            )
          })}

          {/* Umumiy xarajatlar (hech qaysi leg ga tegishli bo'lmagan) */}
          {(() => {
            const generalExpenses = expenses.filter(exp => 
              exp.legIndex === undefined && 
              exp.legIndex !== 0 && 
              (!exp.legId || !flight.legs?.some(leg => leg._id?.toString() === exp.legId?.toString()))
            )
            
            if (generalExpenses.length > 0) {
              const generalTotal = generalExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
              const generalTotalUSD = generalExpenses.reduce((sum, exp) => sum + (exp.amountInUSD || 0), 0)
              
              return (
                <GeneralExpenseGroup 
                  expenses={generalExpenses}
                  total={generalTotal} 
                  totalUSD={generalTotalUSD} 
                  isInternational={isInternational}
                  isActive={isActive} 
                  onEdit={onEditExpense} 
                  onDelete={onDeleteExpense}
                  onAdd={onAddExpense}
                  flight={flight} 
                />
              )
            }
            return null
          })()}

          <ExpenseSummary expenses={expenses} isInternational={isInternational} />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Wallet size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Hali xarajatlar yo'q</p>
        </div>
      )}
    </div>
  )
}

// Yoqilg'i sarflanishi statistikasi
function FuelConsumptionStats({ flight, fuelExpenses }) {
  // Faqat spidometri bor yoqilg'ilarni olish
  const fuelWithOdometer = fuelExpenses
    .filter(e => e.odometer)
    .sort((a, b) => (a.odometer || 0) - (b.odometer || 0))

  if (fuelWithOdometer.length === 0) return null

  // Jami statistika
  const firstOdometer = flight.startOdometer || fuelWithOdometer[0]?.odometer || 0
  const lastOdometer = fuelWithOdometer[fuelWithOdometer.length - 1]?.odometer || firstOdometer
  const totalDistance = lastOdometer - firstOdometer

  // Jami sarflangan yoqilg'i = boshlang'ich yoqilg'i (chunki har to'ldirishda bak to'ldiriladi)
  // Har bir oraliqda oldingi to'ldirishdagi yoqilg'i sarflanadi
  let totalUsedFuel = 0

  // Birinchi oraliq: boshlang'ich yoqilg'i sarflangan
  if (flight.startFuel && fuelWithOdometer.length > 0) {
    totalUsedFuel += flight.startFuel
  }

  // Keyingi oraliqlar: har bir to'ldirishdagi yoqilg'i sarflangan (oxirgisidan tashqari)
  for (let i = 0; i < fuelWithOdometer.length - 1; i++) {
    totalUsedFuel += fuelWithOdometer[i].quantity || 0
  }

  // O'rtacha sarflanish (km/kub yoki km/litr)
  const avgConsumption = totalUsedFuel > 0 && totalDistance > 0
    ? Math.round(totalDistance / totalUsedFuel * 10) / 10
    : 0

  // Jami yoqilg'i (ko'rsatish uchun)
  const totalFuel = (flight.startFuel || 0) + fuelExpenses.reduce((sum, e) => sum + (e.quantity || 0), 0)

  // Yoqilg'i turi
  const fuelType = fuelExpenses[0]?.type
  const fuelUnit = (fuelType === 'fuel_metan' || fuelType === 'fuel_propan') ? 'kub' : 'litr'

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Fuel className="text-white w-4 h-4" />
        </div>
        <h4 className="font-semibold text-emerald-800 text-sm">Yoqilg'i sarflanishi</h4>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-emerald-600">{totalDistance.toLocaleString()}</p>
          <p className="text-xs text-gray-500">km masofa</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-600">{totalFuel}</p>
          <p className="text-xs text-gray-500">{fuelUnit} yoqilg'i</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-purple-600">{avgConsumption}</p>
          <p className="text-xs text-gray-500">km/{fuelUnit}</p>
        </div>
      </div>

      {/* Har bir to'ldirish orasidagi sarflanish */}
      {fuelWithOdometer.length >= 1 && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-700 font-medium">Oraliq sarflanishlar:</p>
          {fuelWithOdometer.map((fuel, idx) => {
            let distance, consumption, prevOdometer, prevQuantity

            if (idx === 0) {
              // Birinchi yoqilg'i - mashrut boshidan hisoblash
              if (!flight.startOdometer || !flight.startFuel) return null
              prevOdometer = flight.startOdometer
              prevQuantity = flight.startFuel
              distance = (fuel.odometer || 0) - prevOdometer
              consumption = prevQuantity && distance > 0
                ? Math.round(distance / prevQuantity * 10) / 10
                : 0
            } else {
              // Keyingi yoqilg'ilar - oldingi to'ldirishdan hisoblash
              const prevFuel = fuelWithOdometer[idx - 1]
              prevOdometer = prevFuel.odometer
              prevQuantity = prevFuel.quantity
              distance = (fuel.odometer || 0) - (prevFuel.odometer || 0)
              consumption = prevQuantity && distance > 0
                ? Math.round(distance / prevQuantity * 10) / 10
                : 0
            }

            // Oldingi sarflanish bilan solishtirish
            let prevConsumption = 0
            if (idx > 0) {
              // Oldingi oraliq sarflanishni hisoblash
              if (idx === 1 && flight.startOdometer && flight.startFuel) {
                const firstDistance = fuelWithOdometer[0].odometer - flight.startOdometer
                prevConsumption = flight.startFuel && firstDistance > 0
                  ? Math.round(firstDistance / flight.startFuel * 10) / 10
                  : 0
              } else if (idx > 1) {
                const prevPrevFuel = fuelWithOdometer[idx - 2]
                const prevFuel = fuelWithOdometer[idx - 1]
                const prevDistance = (prevFuel.odometer || 0) - (prevPrevFuel.odometer || 0)
                prevConsumption = prevPrevFuel.quantity && prevDistance > 0
                  ? Math.round(prevDistance / prevPrevFuel.quantity * 10) / 10
                  : 0
              }
            }

            const diff = consumption - prevConsumption
            const isImproved = diff > 0
            const isWorse = diff < 0

            return (
              <div key={fuel._id} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-gray-600">
                    {prevOdometer?.toLocaleString()} → {fuel.odometer?.toLocaleString()} km
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">+{distance.toLocaleString()} km</span>
                  <span className="text-gray-500">/ {prevQuantity} {fuelUnit}</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${consumption >= avgConsumption ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    = {consumption} km/{fuelUnit}
                  </span>
                  {idx > 0 && prevConsumption > 0 && (
                    <span className={`flex items-center gap-0.5 ${isImproved ? 'text-emerald-500' : isWorse ? 'text-red-500' : 'text-gray-400'}`}>
                      {isImproved ? <TrendingUp size={12} /> : isWorse ? <TrendingDown size={12} /> : <Minus size={12} />}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GeneralExpenseGroup({ expenses, total, totalUSD, isInternational, isActive, onEdit, onDelete, onAdd, flight }) {
  const formatUSD = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Package size={16} className="text-gray-500" />
          Umumiy xarajatlar
        </h4>
        {isInternational ? (
          <span className="text-sm font-bold text-red-600">-${formatUSD(totalUSD)}</span>
        ) : (
          <span className="text-sm font-bold text-red-600">-{formatMoney(total)}</span>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {expenses.map((expense) => (
          <ExpenseItem key={expense._id} expense={expense} isActive={isActive} onEdit={onEdit} onDelete={onDelete} isInternational={isInternational} flight={flight} allExpenses={expenses} />
        ))}
      </div>
      {isActive && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <button onClick={onAdd} className="w-full py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1">
            <Plus size={12} /> Xarajat qo'shish
          </button>
        </div>
      )}
    </div>
  )
}

function LegExpenseGroup({ leg, legIdx, expenses, total, totalUSD, isInternational, isActive, onEdit, onDelete, onAddToLeg, flight }) {
  const formatUSD = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
          <ExpenseItem key={expense._id} expense={expense} isActive={isActive} onEdit={onEdit} onDelete={onDelete} isInternational={isInternational} flight={flight} allExpenses={expenses} />
        ))}
      </div>
      {isActive && (
        <div className="px-3 py-2 bg-gray-50 border-t">
          <button onClick={onAddToLeg} className="w-full py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1">
            <Plus size={12} /> Xarajat qo'shish
          </button>
        </div>
      )}
    </div>
  )
}

function ExpenseItem({ expense, isActive, onEdit, onDelete, isInternational, flight, allExpenses }) {
  const expType = EXPENSE_TYPES.find(t => t.value === expense.type) || { iconName: 'Package', label: expense.type, color: 'from-gray-400 to-gray-500' }
  
  // Icon komponentini olish
  const IconComponent = expType.iconName ? require('lucide-react')[expType.iconName] : Package
  
  const isFuel = expense.type?.startsWith('fuel_')
  const fuelUnit = (expense.type === 'fuel_metan' || expense.type === 'fuel_propan') ? 'kub' : 'litr'
  const formatUSD = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const isConfirmed = expense.confirmedByDriver

  const currencySymbol = expense.currency === 'USD' ? '$' : expense.currency === 'RUB' ? '₽' : expense.currency === 'KZT' ? '₸' : ''

  // Yoqilg'i uchun sarflanish hisoblash
  let fuelStats = null
  if (isFuel && expense.odometer && expense.quantity) {
    // Oldingi yoqilg'i yoki mashrut boshlanishini topish
    const allFuelExpenses = (flight?.expenses || allExpenses || [])
      .filter(e => e.type?.startsWith('fuel_') && e.odometer)
      .sort((a, b) => (a.odometer || 0) - (b.odometer || 0))

    const currentIdx = allFuelExpenses.findIndex(e => e._id === expense._id)

    if (currentIdx > 0) {
      // Oldingi yoqilg'idan hisoblash
      const prevFuel = allFuelExpenses[currentIdx - 1]
      const distance = expense.odometer - prevFuel.odometer
      const consumption = prevFuel.quantity && distance > 0
        ? Math.round(distance / prevFuel.quantity * 10) / 10
        : 0
      fuelStats = { distance, consumption, prevOdometer: prevFuel.odometer }
    } else if (flight?.startOdometer) {
      // Mashrut boshlanishidan hisoblash
      const distance = expense.odometer - flight.startOdometer
      const consumption = flight.startFuel && distance > 0
        ? Math.round(distance / flight.startFuel * 10) / 10
        : 0
      fuelStats = { distance, consumption, prevOdometer: flight.startOdometer, isFirst: true }
    }
  }

  return (
    <div className={`px-3 py-2 hover:bg-gray-50 ${isConfirmed ? 'bg-emerald-50/50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${expType.color} flex items-center justify-center text-sm flex-shrink-0`}>
          <IconComponent size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5 flex-wrap">
            <span>{expType.label}</span>
            {isFuel && expense.quantity && <span className="text-gray-500">- {expense.quantity} {fuelUnit}</span>}
            {expense.currency && expense.currency !== 'UZS' && (
              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{expense.currency}</span>
            )}
            {/* Katta xarajatlar uchun Biznesmen belgisi */}
            {(expense.amount >= 1000000 || expense.amountInUSD >= 100) && (
              <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-semibold">Biznesmen</span>
            )}
            {/* Reys boshlanganda qo'shilgan xarajatlar uchun zarar belgisi */}
            {expense.timing === 'before' && (
              <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Zarar</span>
            )}
            {isConfirmed ? (
              <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">✓ Tasdiqlangan</span>
            ) : (
              <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">⏳ Kutilmoqda</span>
            )}
          </p>
          
          {/* Asosiy ma'lumotlar */}
          <div className="text-xs text-gray-500 space-y-0.5 mt-1">
            {/* Sana va vaqt */}
            <div className="flex items-center gap-2">
              <span>📅 {formatDateTime(expense.date)}</span>
              {expense.timing && (
                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                  {expense.timing === 'before' ? 'Reys oldidan' : expense.timing === 'after' ? 'Reys keyin' : 'Reys davomida'}
                </span>
              )}
            </div>
            
            {/* Tasdiqlash ma'lumotlari */}
            <div className="flex items-center gap-2 flex-wrap">
              {expense.confirmedByDriver && expense.confirmedAt && (
                <span className="text-emerald-600">✅ {formatDateTime(expense.confirmedAt)} da tasdiqlangan</span>
              )}
              {!expense.confirmedByDriver && (
                <span className="text-amber-600">⏳ Haydovchi tasdiqini kutmoqda</span>
              )}
            </div>
            
            {/* Tavsif */}
            {expense.description && (
              <div>💬 {expense.description}</div>
            )}
            
            {/* Yoqilg'i uchun qo'shimcha ma'lumotlar */}
            {isFuel && (
              <div className="space-y-0.5">
                {expense.stationName && <div>⛽ {expense.stationName}</div>}
                {expense.odometer && <div>📍 Spidometr: {expense.odometer.toLocaleString()} km</div>}
                {expense.pricePerUnit && <div>💰 Narx: {formatMoney(expense.pricePerUnit)} / {fuelUnit}</div>}
                {expense.location?.name && <div>📍 {expense.location.name}</div>}
              </div>
            )}
            
            {/* Moy almashtirish uchun */}
            {expense.type === 'oil' && expense.odometer && (
              <div>📍 Spidometr: {expense.odometer.toLocaleString()} km</div>
            )}
            
            {/* Shina uchun */}
            {expense.type === 'tire' && (
              <div className="space-y-0.5">
                {expense.odometer && <div>📍 Spidometr: {expense.odometer.toLocaleString()} km</div>}
                {expense.tireNumber && <div>🛞 Shina raqami: {expense.tireNumber}</div>}
                {expense.tireCount && <div>🔢 Shinalar soni: {expense.tireCount}</div>}
              </div>
            )}
            
            {/* Chegara xarajatlari uchun */}
            {expense.borderInfo && (
              <div>🌍 {expense.borderInfo.fromCountry} → {expense.borderInfo.toCountry}</div>
            )}
            
            {/* Valyuta kursi */}
            {expense.currency && expense.currency !== 'UZS' && expense.exchangeRate && (
              <div>💱 Kurs: 1 {expense.currency} = {expense.exchangeRate.toLocaleString()} UZS</div>
            )}
          </div>
        </div>
        
        {/* Summa */}
        {isInternational && expense.amountInUSD ? (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-red-600">-${formatUSD(expense.amountInUSD)}</p>
            <p className="text-xs text-gray-400">{currencySymbol}{expense.amount?.toLocaleString()}</p>
          </div>
        ) : (
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-red-600">-{formatMoney(expense.amountInUZS || expense.amount)}</p>
            {expense.currency && expense.currency !== 'UZS' && (
              <p className="text-xs text-gray-400">{currencySymbol}{expense.amount?.toLocaleString()}</p>
            )}
          </div>
        )}
        
        {/* Tugmalar */}
        {isActive && (
          <div className="flex gap-0.5 flex-shrink-0">
            <button onClick={() => onEdit(expense)} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Pencil size={12} /></button>
            <button onClick={() => onDelete(expense._id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12} /></button>
          </div>
        )}
      </div>

      {/* Yoqilg'i sarflanishi */}
      {fuelStats && fuelStats.distance > 0 && (
        <div className="mt-2 ml-11 p-2 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-700 space-y-1">
            <div className="font-medium">⛽ Yoqilg'i sarflanishi:</div>
            <div className="flex items-center gap-4">
              <span>📏 Masofa: {fuelStats.distance.toLocaleString()} km</span>
              {fuelStats.consumption > 0 && (
                <span>📊 Sarflanish: {fuelStats.consumption} km/{fuelUnit}</span>
              )}
            </div>
            {fuelStats.prevOdometer && (
              <div className="text-xs text-gray-500">
                {fuelStats.isFirst ? 'Mashrut boshidan' : 'Oldingi to\'ldirishdan'}: {fuelStats.prevOdometer.toLocaleString()} km
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpenseSummary({ expenses, isInternational }) {
  const formatUSD = (amount) => `${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
          const expType = EXPENSE_CATEGORIES.find(c => c.value === type) || { iconName: 'Package', label: type }
          const IconComponent = expType.iconName ? require('lucide-react')[expType.iconName] : Package
          return (
            <div key={type} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-lg text-xs">
              <IconComponent size={14} className="text-gray-500" />
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
