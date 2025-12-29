// Davlatlar
export const COUNTRIES = {
  UZB: { name: "O'zbekiston", flag: '🇺🇿', currency: 'UZS' },
  KZ: { name: "Qozog'iston", flag: '🇰🇿', currency: 'KZT' },
  RU: { name: 'Rossiya', flag: '🇷🇺', currency: 'RUB' },
  TJ: { name: 'Tojikiston', flag: '🇹🇯', currency: 'TJS' },
  KG: { name: "Qirg'iziston", flag: '🇰🇬', currency: 'KGS' },
  TM: { name: 'Turkmaniston', flag: '🇹🇲', currency: 'TMT' },
  AF: { name: "Afg'oniston", flag: '🇦🇫', currency: 'AFN' },
  CN: { name: 'Xitoy', flag: '🇨🇳', currency: 'CNY' },
  TR: { name: 'Turkiya', flag: '🇹🇷', currency: 'TRY' },
  IR: { name: 'Eron', flag: '🇮🇷', currency: 'IRR' },
  AZ: { name: 'Ozarbayjon', flag: '🇦🇿', currency: 'AZN' },
  GE: { name: 'Gruziya', flag: '🇬🇪', currency: 'GEL' },
  BY: { name: 'Belarus', flag: '🇧🇾', currency: 'BYN' },
  UA: { name: 'Ukraina', flag: '🇺🇦', currency: 'UAH' },
  PL: { name: 'Polsha', flag: '🇵🇱', currency: 'PLN' },
  DE: { name: 'Germaniya', flag: '🇩🇪', currency: 'EUR' },
  LT: { name: 'Litva', flag: '🇱🇹', currency: 'EUR' },
  LV: { name: 'Latviya', flag: '🇱🇻', currency: 'EUR' },
  EE: { name: 'Estoniya', flag: '🇪🇪', currency: 'EUR' },
  FI: { name: 'Finlandiya', flag: '🇫🇮', currency: 'EUR' },
  AE: { name: 'BAA', flag: '🇦🇪', currency: 'AED' }
}

// Valyutalar
export const CURRENCIES = {
  UZS: { symbol: "so'm", name: "O'zbek so'mi", flag: '🇺🇿' },
  USD: { symbol: '$', name: 'AQSH dollari', flag: '🇺🇸' },
  RUB: { symbol: '₽', name: 'Rossiya rubli', flag: '🇷🇺' },
  KZT: { symbol: '₸', name: 'Qozog\'iston tengesi', flag: '🇰🇿' },
  EUR: { symbol: '€', name: 'Yevro', flag: '🇪🇺' },
  TRY: { symbol: '₺', name: 'Turkiya lirasi', flag: '🇹🇷' },
  CNY: { symbol: '¥', name: 'Xitoy yuani', flag: '🇨🇳' },
  TJS: { symbol: 'SM', name: 'Tojikiston somonisi', flag: '🇹🇯' },
  KGS: { symbol: 'сом', name: 'Qirg\'iziston somi', flag: '🇰🇬' },
  TMT: { symbol: 'm', name: 'Turkmaniston manati', flag: '🇹🇲' },
  AZN: { symbol: '₼', name: 'Ozarbayjon manati', flag: '🇦🇿' },
  GEL: { symbol: '₾', name: 'Gruziya larisi', flag: '🇬🇪' },
  BYN: { symbol: 'Br', name: 'Belarus rubli', flag: '🇧🇾' },
  UAH: { symbol: '₴', name: 'Ukraina grivnasi', flag: '🇺🇦' },
  PLN: { symbol: 'zł', name: 'Polsha zlotisi', flag: '🇵🇱' },
  AED: { symbol: 'د.إ', name: 'BAA dirhami', flag: '🇦🇪' },
  AFN: { symbol: '؋', name: 'Afg\'oniston afg\'onisi', flag: '🇦🇫' },
  IRR: { symbol: '﷼', name: 'Eron riyoli', flag: '🇮🇷' }
}

// Tez-tez ishlatiladigan valyutalar
export const COMMON_CURRENCIES = ['UZS', 'USD', 'RUB', 'KZT', 'EUR', 'TRY']

// OLD CURRENCIES (for backward compatibility)
export const OLD_CURRENCIES = {
  USD: { symbol: '$$', name: 'Dollar' },
  UZS: { symbol: "so'm", name: "So'm" },
  KZT: { symbol: '₸', name: 'Tenge' },
  RUB: { symbol: '₽', name: 'Rubl' }
}

// Asosiy xarajat kategoriyalari - Lucide icon nomlari
// expenseClass: 'light' = yengil (shofyor hisobidan), 'heavy' = katta (biznesmen hisobidan)
export const EXPENSE_CATEGORIES = [
  // Yengil xarajatlar - shofyor hisobidan
  { value: 'fuel', label: "Yoqilg'i", iconName: 'Fuel', color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500', expenseClass: 'light' },
  { value: 'food', label: 'Ovqat', iconName: 'Utensils', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500', expenseClass: 'light' },
  { value: 'toll', label: "Yo'l to'lovi", iconName: 'Car', color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-500', expenseClass: 'light' },
  { value: 'wash', label: 'Moyka', iconName: 'Droplet', color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-500', expenseClass: 'light' },
  { value: 'fine', label: 'Jarima', iconName: 'FileText', color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-500', expenseClass: 'light' },
  { value: 'repair_small', label: "Mayda ta'mir", iconName: 'Wrench', color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-500', expenseClass: 'light' },
  // Katta xarajatlar - biznesmen hisobidan
  { value: 'repair_major', label: "Katta ta'mir", iconName: 'Wrench', color: 'from-red-600 to-rose-700', bgColor: 'bg-red-600', expenseClass: 'heavy' },
  { value: 'tire', label: 'Shina', iconName: 'Circle', color: 'from-slate-600 to-slate-800', bgColor: 'bg-slate-600', expenseClass: 'heavy' },
  { value: 'accident', label: 'Avariya', iconName: 'Shield', color: 'from-rose-600 to-red-700', bgColor: 'bg-rose-600', expenseClass: 'heavy' },
  { value: 'insurance', label: "Sug'urta", iconName: 'Shield', color: 'from-indigo-600 to-purple-700', bgColor: 'bg-indigo-600', expenseClass: 'heavy' },
  // Chegara (xalqaro reyslar uchun)
  { value: 'border', label: 'Chegara', iconName: 'Navigation', color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500', expenseClass: 'light' },
  // Boshqa
  { value: 'other', label: 'Boshqa', iconName: 'Package', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-500', expenseClass: 'light' }
]

// Yengil xarajatlar (shofyor hisobidan ayiriladi)
export const LIGHT_EXPENSE_TYPES = EXPENSE_CATEGORIES.filter(c => c.expenseClass === 'light').map(c => c.value)

// Katta xarajatlar (biznesmen hisobidan)
export const HEAVY_EXPENSE_TYPES = EXPENSE_CATEGORIES.filter(c => c.expenseClass === 'heavy').map(c => c.value)

// Chegara xarajatlari turlari
export const BORDER_TYPES = [
  { value: 'border_customs', label: 'Bojxona', iconName: 'Building2' },
  { value: 'border_transit', label: 'Tranzit', iconName: 'Truck' },
  { value: 'border_insurance', label: "Sug'urta", iconName: 'Shield' },
  { value: 'border_other', label: 'Boshqa', iconName: 'FileText' }
]

// Yoqilg'i turlari
export const FUEL_TYPES = [
  { value: 'fuel_metan', label: 'Metan', icon: '🟢', iconName: 'CircleDot', iconColor: 'text-green-500', unit: 'kub' },
  { value: 'fuel_propan', label: 'Propan', icon: '🟡', iconName: 'Circle', iconColor: 'text-yellow-500', unit: 'kub' },
  { value: 'fuel_benzin', label: 'Benzin', icon: '🔴', iconName: 'Fuel', iconColor: 'text-red-500', unit: 'litr' },
  { value: 'fuel_diesel', label: 'Dizel', icon: '🔵', iconName: 'Droplet', iconColor: 'text-blue-500', unit: 'litr' }
]

// Display uchun barcha turlar
export const EXPENSE_TYPES = [
  ...FUEL_TYPES.map(f => ({ ...f, color: 'from-amber-500 to-orange-500', expenseClass: 'light' })),
  { value: 'food', label: 'Ovqat', iconName: 'Utensils', color: 'from-green-500 to-emerald-500', expenseClass: 'light' },
  { value: 'toll', label: "Yo'l to'lovi", iconName: 'Car', color: 'from-blue-500 to-indigo-500', expenseClass: 'light' },
  { value: 'wash', label: 'Moyka', iconName: 'Droplet', color: 'from-cyan-500 to-blue-500', expenseClass: 'light' },
  { value: 'fine', label: 'Jarima', iconName: 'FileText', color: 'from-purple-500 to-violet-500', expenseClass: 'light' },
  { value: 'repair_small', label: "Mayda ta'mir", iconName: 'Wrench', color: 'from-orange-500 to-red-500', expenseClass: 'light' },
  { value: 'repair_major', label: "Katta ta'mir", iconName: 'Wrench', color: 'from-red-600 to-rose-700', expenseClass: 'heavy' },
  { value: 'tire', label: 'Shina', iconName: 'Circle', color: 'from-slate-600 to-slate-800', expenseClass: 'heavy' },
  { value: 'accident', label: 'Avariya', iconName: 'Shield', color: 'from-rose-600 to-red-700', expenseClass: 'heavy' },
  { value: 'insurance', label: "Sug'urta", iconName: 'Shield', color: 'from-indigo-600 to-purple-700', expenseClass: 'heavy' },
  { value: 'border_customs', label: 'Bojxona', iconName: 'Building2', color: 'from-indigo-500 to-purple-500', expenseClass: 'light' },
  { value: 'border_transit', label: 'Tranzit', iconName: 'Truck', color: 'from-indigo-500 to-purple-500', expenseClass: 'light' },
  { value: 'border_insurance', label: "Chegara sug'urta", iconName: 'Shield', color: 'from-indigo-500 to-purple-500', expenseClass: 'light' },
  { value: 'border_other', label: 'Chegara boshqa', iconName: 'Navigation', color: 'from-indigo-500 to-purple-500', expenseClass: 'light' },
  { value: 'other', label: 'Boshqa', iconName: 'Package', color: 'from-gray-500 to-slate-500', expenseClass: 'light' }
]

// Xarajat turini aniqlash funksiyasi
export const getExpenseClass = (type) => {
  if (!type) return 'light'
  // Katta xarajatlar
  if (['repair_major', 'tire', 'accident', 'insurance'].includes(type)) return 'heavy'
  // Qolganlar yengil
  return 'light'
}

// Xarajat katta yoki yengilligini tekshirish
export const isHeavyExpense = (type) => getExpenseClass(type) === 'heavy'

// Pul formatlash
export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
