export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
export const formatDate = (d) => d ? new Date(d).toLocaleString('uz-UZ') : '-'

// Expense labels - icon nomlari Lucide icon nomlari
export const EXPENSE_LABELS = {
  fuel_benzin: { iconName: 'Fuel', color: 'text-red-500', label: 'Benzin' },
  fuel_diesel: { iconName: 'Droplet', color: 'text-blue-500', label: 'Dizel' },
  fuel_gas: { iconName: 'CircleDot', color: 'text-blue-500', label: 'Gaz' },
  fuel_metan: { iconName: 'CircleDot', color: 'text-green-500', label: 'Metan' },
  fuel_propan: { iconName: 'Circle', color: 'text-yellow-500', label: 'Propan' },
  food: { iconName: 'Utensils', color: 'text-green-500', label: 'Ovqat' },
  repair: { iconName: 'Wrench', color: 'text-red-500', label: "Ta'mir" },
  toll: { iconName: 'Car', color: 'text-blue-500', label: "Yo'l to'lovi" },
  fine: { iconName: 'FileText', color: 'text-purple-500', label: 'Jarima' },
  other: { iconName: 'Package', color: 'text-gray-500', label: 'Boshqa' }
}
