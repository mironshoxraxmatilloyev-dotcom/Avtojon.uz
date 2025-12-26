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
export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: "Yoqilg'i", iconName: 'Fuel', color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500' },
  { value: 'food', label: 'Ovqat', iconName: 'Utensils', color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500' },
  { value: 'repair', label: "Ta'mir", iconName: 'Wrench', color: 'from-red-500 to-rose-500', bgColor: 'bg-red-500' },
  { value: 'toll', label: "Yo'l to'lovi", iconName: 'Car', color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-500' },
  { value: 'border', label: 'Chegara', iconName: 'Navigation', color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500' },
  { value: 'fine', label: 'Jarima', iconName: 'FileText', color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-500' },
  { value: 'other', label: 'Boshqa', iconName: 'Package', color: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-500' }
]

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
  ...FUEL_TYPES.map(f => ({ ...f, color: 'from-amber-500 to-orange-500' })),
  { value: 'food', label: 'Ovqat', iconName: 'Utensils', color: 'from-green-500 to-emerald-500' },
  { value: 'repair', label: "Ta'mir", iconName: 'Wrench', color: 'from-red-500 to-rose-500' },
  { value: 'toll', label: "Yo'l to'lovi", iconName: 'Car', color: 'from-blue-500 to-indigo-500' },
  { value: 'border_customs', label: 'Bojxona', iconName: 'Building2', color: 'from-indigo-500 to-purple-500' },
  { value: 'border_transit', label: 'Tranzit', iconName: 'Truck', color: 'from-indigo-500 to-purple-500' },
  { value: 'border_insurance', label: "Sug'urta", iconName: 'Shield', color: 'from-indigo-500 to-purple-500' },
  { value: 'border_other', label: 'Chegara boshqa', iconName: 'Navigation', color: 'from-indigo-500 to-purple-500' },
  { value: 'fine', label: 'Jarima', iconName: 'FileText', color: 'from-purple-500 to-violet-500' },
  { value: 'other', label: 'Boshqa', iconName: 'Package', color: 'from-gray-500 to-slate-500' }
]

// Pul formatlash
export const formatMoney = (n) => n ? new Intl.NumberFormat('uz-UZ').format(n) : '0'
