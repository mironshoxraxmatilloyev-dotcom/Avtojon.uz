import api from './api'

// Valyuta kurslari cache
let ratesCache = {
  rates: null,
  lastUpdated: null,
  ttl: 30 * 60 * 1000 // 30 daqiqa
}

// Default kurslar (fallback)
const DEFAULT_RATES = {
  USD: 1,
  UZS: 12800,
  RUB: 95,
  KZT: 480,
  EUR: 0.92,
  TRY: 34,
  CNY: 7.2,
  TJS: 11,
  KGS: 89,
  TMT: 3.5,
  AZN: 1.7,
  GEL: 2.7,
  BYN: 3.3,
  UAH: 41,
  PLN: 4,
  AFN: 70,
  IRR: 42000,
  AED: 3.67
}

// Davlatlar va ularning valyutalari
export const COUNTRY_CURRENCIES = {
  UZB: { code: 'UZS', symbol: 'so\'m', name: 'O\'zbek so\'mi', flag: '🇺🇿' },
  KZ: { code: 'KZT', symbol: '₸', name: 'Tenge', flag: '🇰🇿' },
  RU: { code: 'RUB', symbol: '₽', name: 'Rubl', flag: '🇷🇺' },
  TJ: { code: 'TJS', symbol: 'SM', name: 'Somoni', flag: '🇹🇯' },
  KG: { code: 'KGS', symbol: 'сом', name: 'Som', flag: '🇰🇬' },
  TM: { code: 'TMT', symbol: 'm', name: 'Manat', flag: '🇹🇲' },
  AF: { code: 'AFN', symbol: '؋', name: 'Afg\'oni', flag: '🇦🇫' },
  CN: { code: 'CNY', symbol: '¥', name: 'Yuan', flag: '🇨🇳' },
  TR: { code: 'TRY', symbol: '₺', name: 'Lira', flag: '🇹🇷' },
  IR: { code: 'IRR', symbol: '﷼', name: 'Riyal', flag: '🇮🇷' },
  AZ: { code: 'AZN', symbol: '₼', name: 'Manat', flag: '🇦🇿' },
  GE: { code: 'GEL', symbol: '₾', name: 'Lari', flag: '🇬🇪' },
  BY: { code: 'BYN', symbol: 'Br', name: 'Rubl', flag: '🇧🇾' },
  UA: { code: 'UAH', symbol: '₴', name: 'Grivna', flag: '🇺🇦' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Zlotiy', flag: '🇵🇱' },
  DE: { code: 'EUR', symbol: '€', name: 'Yevro', flag: '🇩🇪' },
  LT: { code: 'EUR', symbol: '€', name: 'Yevro', flag: '🇱🇹' },
  LV: { code: 'EUR', symbol: '€', name: 'Yevro', flag: '🇱🇻' },
  EE: { code: 'EUR', symbol: '€', name: 'Yevro', flag: '🇪🇪' },
  FI: { code: 'EUR', symbol: '€', name: 'Yevro', flag: '🇫🇮' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'Dirham', flag: '🇦🇪' }
}

// Valyuta belgilari
export const CURRENCY_SYMBOLS = {
  USD: '$',
  UZS: 'so\'m',
  RUB: '₽',
  KZT: '₸',
  EUR: '€',
  TRY: '₺',
  CNY: '¥',
  TJS: 'SM',
  KGS: 'сом',
  TMT: 'm',
  AZN: '₼',
  GEL: '₾',
  BYN: 'Br',
  UAH: '₴',
  PLN: 'zł',
  AFN: '؋',
  IRR: '﷼',
  AED: 'د.إ'
}

// Realtime valyuta kurslarini olish
export async function fetchRates() {
  try {
    const res = await api.get('/currency/rates')
    if (res.data?.data?.rates) {
      ratesCache.rates = res.data.data.rates
      ratesCache.lastUpdated = new Date()
      return ratesCache.rates
    }
    return DEFAULT_RATES
  } catch (error) {
    console.error('Valyuta kurslarini olishda xatolik:', error)
    return DEFAULT_RATES
  }
}

// Kurslarni olish (cache bilan)
export async function getRates() {
  const now = Date.now()
  
  // Cache mavjud va yangi bo'lsa
  if (ratesCache.rates && ratesCache.lastUpdated) {
    const age = now - ratesCache.lastUpdated.getTime()
    if (age < ratesCache.ttl) {
      return ratesCache.rates
    }
  }
  
  return await fetchRates()
}

// Valyutani konvertatsiya qilish
export function convertCurrency(amount, fromCurrency, toCurrency, rates = DEFAULT_RATES) {
  if (!amount || fromCurrency === toCurrency) return amount
  
  const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1
  const toRate = rates[toCurrency] || DEFAULT_RATES[toCurrency] || 1
  
  // Avval USD ga, keyin maqsad valyutaga
  const inUSD = amount / fromRate
  return inUSD * toRate
}

// USD ga konvertatsiya
export function toUSD(amount, fromCurrency, rates = DEFAULT_RATES) {
  return convertCurrency(amount, fromCurrency, 'USD', rates)
}

// So'm ga konvertatsiya
export function toUZS(amount, fromCurrency, rates = DEFAULT_RATES) {
  return convertCurrency(amount, fromCurrency, 'UZS', rates)
}

// Formatlash
export function formatCurrency(amount, currency = 'UZS', showSymbol = true) {
  const formatted = new Intl.NumberFormat('uz-UZ', {
    maximumFractionDigits: currency === 'USD' ? 2 : 0
  }).format(amount || 0)
  
  if (!showSymbol) return formatted
  
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${symbol}`
}

// Davlat bo'yicha valyuta olish
export function getCurrencyByCountry(countryCode) {
  return COUNTRY_CURRENCIES[countryCode] || COUNTRY_CURRENCIES.UZB
}

// Xarajatni USD va UZS da hisoblash
export async function calculateExpenseInMultipleCurrencies(amount, originalCurrency) {
  const rates = await getRates()
  
  const inUSD = toUSD(amount, originalCurrency, rates)
  const inUZS = toUZS(amount, originalCurrency, rates)
  
  return {
    original: { amount, currency: originalCurrency },
    inUSD: Math.round(inUSD * 100) / 100,
    inUZS: Math.round(inUZS),
    rates: {
      [originalCurrency]: rates[originalCurrency] || 1,
      USD: 1,
      UZS: rates.UZS || DEFAULT_RATES.UZS
    }
  }
}

export default {
  fetchRates,
  getRates,
  convertCurrency,
  toUSD,
  toUZS,
  formatCurrency,
  getCurrencyByCountry,
  calculateExpenseInMultipleCurrencies,
  COUNTRY_CURRENCIES,
  CURRENCY_SYMBOLS,
  DEFAULT_RATES
}
