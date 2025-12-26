export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
export const formatDate = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'

export const EXPENSE_LABELS = {
  fuel_benzin: { icon: '⛽', label: 'Benzin' },
  fuel_diesel: { icon: '🛢️', label: 'Dizel' },
  fuel_gas: { icon: '🔵', label: 'Gaz' },
  fuel_metan: { icon: '🟢', label: 'Metan' },
  fuel_propan: { icon: '🟡', label: 'Propan' },
  food: { icon: '🍽️', label: 'Ovqat' },
  repair: { icon: '🔧', label: "Ta'mir" },
  toll: { icon: '🛣️', label: "Yo'l to'lovi" },
  fine: { icon: '📋', label: 'Jarima' },
  other: { icon: '📦', label: 'Boshqa' }
}
