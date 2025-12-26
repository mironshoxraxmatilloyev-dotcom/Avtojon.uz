// Pul formatlash
export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

// Sana formatlash
export const formatDate = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'

// Xarajat turlari
export const EXPENSE_LABELS = {
  fuel_benzin: { icon: '⛽', label: 'Benzin', color: 'from-blue-500/20 to-blue-600/20' },
  fuel_diesel: { icon: '🛢️', label: 'Dizel', color: 'from-gray-500/20 to-gray-600/20' },
  fuel_gas: { icon: '🔵', label: 'Gaz', color: 'from-cyan-500/20 to-cyan-600/20' },
  fuel_metan: { icon: '🟢', label: 'Metan', color: 'from-green-500/20 to-green-600/20' },
  fuel_propan: { icon: '🟡', label: 'Propan', color: 'from-yellow-500/20 to-yellow-600/20' },
  food: { icon: '🍽️', label: 'Ovqat', color: 'from-orange-500/20 to-orange-600/20' },
  repair: { icon: '🔧', label: "Ta'mir", color: 'from-red-500/20 to-red-600/20' },
  toll: { icon: '🛣️', label: "Yo'l to'lovi", color: 'from-purple-500/20 to-purple-600/20' },
  fine: { icon: '📋', label: 'Jarima', color: 'from-rose-500/20 to-rose-600/20' },
  other: { icon: '📦', label: 'Boshqa', color: 'from-slate-500/20 to-slate-600/20' }
}
