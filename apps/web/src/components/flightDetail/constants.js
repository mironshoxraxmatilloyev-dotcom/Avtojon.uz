// Davlatlar - iconName Lucide icon nomi
export const COUNTRIES = {
  UZB: { name: "O'zbekiston", iconName: 'Flag', code: 'UZ', currency: 'UZS' },
  KZ: { name: "Qozog'iston", iconName: 'Flag', code: 'KZ', currency: 'KZT' },
  RU: { name: 'Rossiya', iconName: 'Flag', code: 'RU', currency: 'RUB' },
  TJ: { name: 'Tojikiston', iconName: 'Flag', code: 'TJ', currency: 'TJS' },
  KG: { name: "Qirg'iziston", iconName: 'Flag', code: 'KG', currency: 'KGS' },
  TM: { name: 'Turkmaniston', iconName: 'Flag', code: 'TM', currency: 'TMT' },
  AF: { name: "Afg'oniston", iconName: 'Flag', code: 'AF', currency: 'AFN' },
  CN: { name: 'Xitoy', iconName: 'Flag', code: 'CN', currency: 'CNY' },
  TR: { name: 'Turkiya', iconName: 'Flag', code: 'TR', currency: 'TRY' },
  IR: { name: 'Eron', iconName: 'Flag', code: 'IR', currency: 'IRR' },
  AZ: { name: 'Ozarbayjon', iconName: 'Flag', code: 'AZ', currency: 'AZN' },
  GE: { name: 'Gruziya', iconName: 'Flag', code: 'GE', currency: 'GEL' },
  BY: { name: 'Belarus', iconName: 'Flag', code: 'BY', currency: 'BYN' },
  UA: { name: 'Ukraina', iconName: 'Flag', code: 'UA', currency: 'UAH' },
  PL: { name: 'Polsha', iconName: 'Flag', code: 'PL', currency: 'PLN' },
  DE: { name: 'Germaniya', iconName: 'Flag', code: 'DE', currency: 'EUR' },
  LT: { name: 'Litva', iconName: 'Flag', code: 'LT', currency: 'EUR' },
  LV: { name: 'Latviya', iconName: 'Flag', code: 'LV', currency: 'EUR' },
  EE: { name: 'Estoniya', iconName: 'Flag', code: 'EE', currency: 'EUR' },
  FI: { name: 'Finlandiya', iconName: 'Flag', code: 'FI', currency: 'EUR' },
  AE: { name: 'BAA', iconName: 'Flag', code: 'AE', currency: 'AED' }
}

// Valyutalar - iconName Lucide icon nomi
export const CURRENCIES = {
  UZS: { symbol: "so'm", name: "O'zbek so'mi", code: 'UZ' },
  USD: { symbol: '$', name: 'AQSH dollari', code: 'US' },
  RUB: { symbol: '₽', name: 'Rossiya rubli', code: 'RU' },
  KZT: { symbol: '₸', name: 'Qozog\'iston tengesi', code: 'KZ' },
  EUR: { symbol: '€', name: 'Yevro', code: 'EU' },
  TRY: { symbol: '₺', name: 'Turkiya lirasi', code: 'TR' },
  CNY: { symbol: '¥', name: 'Xitoy yuani', code: 'CN' },
  TJS: { symbol: 'SM', name: 'Tojikiston somonisi', code: 'TJ' },
  KGS: { symbol: 'сом', name: 'Qirg\'iziston somi', code: 'KG' },
  TMT: { symbol: 'm', name: 'Turkmaniston manati', code: 'TM' },
  AZN: { symbol: '₼', name: 'Ozarbayjon manati', code: 'AZ' },
  GEL: { symbol: '₾', name: 'Gruziya larisi', code: 'GE' },
  BYN: { symbol: 'Br', name: 'Belarus rubli', code: 'BY' },
  UAH: { symbol: '₴', name: 'Ukraina grivnasi', code: 'UA' },
  PLN: { symbol: 'zł', name: 'Polsha zlotisi', code: 'PL' },
  AED: { symbol: 'د.إ', name: 'BAA dirhami', code: 'AE' },
  AFN: { symbol: '؋', name: 'Afg\'oniston afg\'onisi', code: 'AF' },
  IRR: { symbol: '﷼', name: 'Eron riyoli', code: 'IR' }
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
  // Katta xarajatlar - biznesmen hisobidan (shofyor oyligiga ta'sir qilmaydi)
  { value: 'oil', label: 'Moy almashtirish', iconName: 'Droplet', color: 'from-yellow-600 to-amber-600', bgColor: 'bg-yellow-600', expenseClass: 'heavy', hasOdometer: true },
  { value: 'filter', label: 'Filtr', iconName: 'Filter', color: 'from-blue-600 to-cyan-600', bgColor: 'bg-blue-600', expenseClass: 'heavy' },
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

// Filtr turlari
export const FILTER_TYPES = [
  { value: 'filter_oil', label: 'Moy filtri', iconName: 'Droplet' },
  { value: 'filter_air', label: 'Havo filtri', iconName: 'Wind' },
  { value: 'filter_cabin', label: 'Salarka filtri', iconName: 'Wind' },
  { value: 'filter_gas', label: 'Gaz filtri', iconName: 'CircleDot' }
]

// Yoqilg'i turlari
export const FUEL_TYPES = [
  { value: 'fuel_metan', label: 'Metan', iconName: 'CircleDot', iconColor: 'text-green-500', unit: 'kub' },
  { value: 'fuel_propan', label: 'Propan', iconName: 'Circle', iconColor: 'text-yellow-500', unit: 'kub' },
  { value: 'fuel_benzin', label: 'Benzin', iconName: 'Fuel', iconColor: 'text-red-500', unit: 'litr' },
  { value: 'fuel_diesel', label: 'Dizel', iconName: 'Droplet', iconColor: 'text-blue-500', unit: 'litr' }
]

// Display uchun barcha turlar
export const EXPENSE_TYPES = [
  ...FUEL_TYPES.map(f => ({ ...f, color: 'from-amber-500 to-orange-500', expenseClass: 'light' })),
  { value: 'oil', label: 'Moy', iconName: 'Droplet', color: 'from-yellow-600 to-amber-600', expenseClass: 'heavy', hasOdometer: true },
  { value: 'filter', label: 'Filtr', iconName: 'Filter', color: 'from-blue-600 to-cyan-600', expenseClass: 'heavy' },
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
  // Katta xarajatlar (shofyor oyligiga ta'sir qilmaydi)
  if (['repair_major', 'tire', 'accident', 'insurance', 'oil'].includes(type)) return 'heavy'
  // Qolganlar yengil
  return 'light'
}

// Xarajat katta yoki yengilligini tekshirish
export const isHeavyExpense = (type) => getExpenseClass(type) === 'heavy'

// Pul formatlash
export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'

// Sana formatlash - timezone muammolarini hal qilish uchun
export const formatDateTime = (date) => {
  if (!date) return '-'
  
  // Date obyektini yaratish - timezone offset muammosini hal qilish
  let d
  if (typeof date === 'string') {
    // ISO string bo'lsa, to'g'ridan-to'g'ri Date obyektiga aylantirish
    d = new Date(date)
  } else {
    d = new Date(date)
  }
  
  // Agar sana noto'g'ri bo'lsa
  if (isNaN(d.getTime())) return '-'
  
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']

  const day = d.getDate()
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day}-${month}, ${year} • ${hours}:${minutes}`
}

// Faqat sana formatlash (vaqtsiz)
export const formatDate = (date) => {
  if (!date) return '-'
  
  let d
  if (typeof date === 'string') {
    d = new Date(date)
  } else {
    d = new Date(date)
  }
  
  if (isNaN(d.getTime())) return '-'
  
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
  
  const day = d.getDate()
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  
  return `${day}-${month}, ${year}`
}
