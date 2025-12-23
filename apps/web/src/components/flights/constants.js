// Davlatlar
export const COUNTRIES = {
  UZB: { name: "O'zbekiston", flag: '🇺🇿' },
  KZ: { name: "Qozog'iston", flag: '🇰🇿' },
  RU: { name: 'Rossiya', flag: '🇷🇺' }
}

// Valyutalar
export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dollar' },
  UZS: { symbol: "so'm", name: "So'm" },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

// Asosiy xarajat kategoriyalari
export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: "Yoqilg'i", icon: '⛽', color: 'from-amber-500 to-orange-500' },
  { value: 'food', label: 'Ovqat', icon: '🍽️', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: "Ta'mir", icon: '🔧', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: "Yo'l to'lovi", icon: '🛣️', color: 'from-blue-500 to-indigo-500' },
  { value: 'fine', label: 'Jarima', icon: '📋', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', icon: '📦', color: 'from-gray-500 to-slate-500' }
]

// Yoqilg'i turlari
export const FUEL_TYPES = [
  { value: 'fuel_metan', label: 'Metan', icon: '🟢', unit: 'kub' },
  { value: 'fuel_propan', label: 'Propan', icon: '🟡', unit: 'kub' },
  { value: 'fuel_benzin', label: 'Benzin', icon: '⛽', unit: 'litr' },
  { value: 'fuel_diesel', label: 'Dizel', icon: '🛢️', unit: 'litr' }
]

// Display uchun barcha turlar
export const EXPENSE_TYPES = [
  ...FUEL_TYPES.map(f => ({ ...f, color: 'from-amber-500 to-orange-500' })),
  { value: 'food', label: 'Ovqat', icon: '🍽️', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: "Ta'mir", icon: '🔧', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: "Yo'l to'lovi", icon: '🛣️', color: 'from-blue-500 to-indigo-500' },
  { value: 'fine', label: 'Jarima', icon: '📋', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', icon: '📦', color: 'from-gray-500 to-slate-500' }
]

// Pul formatlash
export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

// Sana formatlash
export const formatDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '-'
