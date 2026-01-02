// Davlatlar - iconName Lucide icon nomi
export const COUNTRIES = {
  UZB: { name: "O'zbekiston", iconName: 'Flag', code: 'UZ' },
  KZ: { name: "Qozog'iston", iconName: 'Flag', code: 'KZ' },
  RU: { name: 'Rossiya', iconName: 'Flag', code: 'RU' }
}

// Valyutalar
export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar' },
  UZS: { symbol: "so'm", name: "So'm" },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

// Asosiy xarajat kategoriyalari - iconName Lucide icon nomi
export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: "Yoqilg'i", iconName: 'Fuel', color: 'from-amber-500 to-orange-500' },
  { value: 'food', label: 'Ovqat', iconName: 'Utensils', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: "Ta'mir", iconName: 'Wrench', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: "Yo'l to'lovi", iconName: 'Car', color: 'from-blue-500 to-indigo-500' },
  { value: 'fine', label: 'Jarima', iconName: 'FileText', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', iconName: 'Package', color: 'from-gray-500 to-slate-500' }
]

// Yoqilg'i turlari - iconName Lucide icon nomi
export const FUEL_TYPES = [
  { value: 'fuel_metan', label: 'Metan', iconName: 'CircleDot', iconColor: 'text-green-500', unit: 'kub' },
  { value: 'fuel_propan', label: 'Propan', iconName: 'Circle', iconColor: 'text-yellow-500', unit: 'kub' },
  { value: 'fuel_benzin', label: 'Benzin', iconName: 'Fuel', iconColor: 'text-red-500', unit: 'litr' },
  { value: 'fuel_diesel', label: 'Dizel', iconName: 'Droplet', iconColor: 'text-blue-500', unit: 'litr' }
]

// Display uchun barcha turlar
export const EXPENSE_TYPES = [
  ...FUEL_TYPES.map(f => ({ ...f, color: 'from-amber-500 to-orange-500' })),
  { value: 'food', label: 'Ovqat', iconName: 'Utensils', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: "Ta'mir", iconName: 'Wrench', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: "Yo'l to'lovi", iconName: 'Car', color: 'from-blue-500 to-indigo-500' },
  { value: 'fine', label: 'Jarima', iconName: 'FileText', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', iconName: 'Package', color: 'from-gray-500 to-slate-500' }
]

// Pul formatlash
export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

// Sana formatlash
export const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
