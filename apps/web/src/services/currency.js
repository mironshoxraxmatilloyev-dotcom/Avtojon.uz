import api from './api'

// Valyuta kurslari cache
let ratesCache = {
  rates: null,
  lastUpdated: null,
  ttl: 30 * 60 * 1000 // 30 daqiqa
}

// Default kurslar (fallback) - real bozor kurslariga yaqin
const DEFAULT_RATES = {
  USD: 1,
  UZS: 12850,    // O'zbekiston so'mi (CBU kursi)
  RUB: 103,      // Rossiya rubli (real bozor kursi)
  KZT: 525,      // Qozog'iston tengesi
  EUR: 0.92,     // Yevro
  TRY: 35,       // Turkiya lirasi
  CNY: 7.3,      // Xitoy yuani
  TJS: 11,       // Tojikiston somonisi
  KGS: 89,       // Qirg'iziston somi
  TMT: 3.5,      // Turkmaniston manati
  AZN: 1.7,      // Ozarbayjon manati
  GEL: 2.7,      // Gruziya larisi
  BYN: 3.3,      // Belarus rubli
  UAH: 41,       // Ukraina grivnasi
  PLN: 4,        // Polsha zlotisi
  AFN: 70,       // Afg'oniston afg'onisi
  IRR: 42000,    // Eron riyoli
  AED: 3.67      // BAA dirhami
}

// Davlatlar va ularning valyutalari
export const COUNTRY_CURRENCIES = {
  UZB: { code: 'UZS', symbol: 'so\'m', name: 'O\'zbek so\'mi', countryCode: 'UZ' },
  KZ: { code: 'KZT', symbol: '₸', name: 'Tenge', countryCode: 'KZ' },
  RU: { code: 'RUB', symbol: '₽', name: 'Rubl', countryCode: 'RU' },
  TJ: { code: 'TJS', symbol: 'SM', name: 'Somoni', countryCode: 'TJ' },
  KG: { code: 'KGS', symbol: 'сом', name: 'Som', countryCode: 'KG' },
  TM: { code: 'TMT', symbol: 'm', name: 'Manat', countryCode: 'TM' },
  AF: { code: 'AFN', symbol: '؋', name: 'Afg\'oni', countryCode: 'AF' },
  CN: { code: 'CNY', symbol: '¥', name: 'Yuan', countryCode: 'CN' },
  TR: { code: 'TRY', symbol: '₺', name: 'Lira', countryCode: 'TR' },
  IR: { code: 'IRR', symbol: '﷼', name: 'Riyal', countryCode: 'IR' },
  AZ: { code: 'AZN', symbol: '₼', name: 'Manat', countryCode: 'AZ' },
  GE: { code: 'GEL', symbol: '₾', name: 'Lari', countryCode: 'GE' },
  BY: { code: 'BYN', symbol: 'Br', name: 'Rubl', countryCode: 'BY' },
  UA: { code: 'UAH', symbol: '₴', name: 'Grivna', countryCode: 'UA' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Zlotiy', countryCode: 'PL' },
  DE: { code: 'EUR', symbol: '€', name: 'Yevro', countryCode: 'DE' },
  LT: { code: 'EUR', symbol: '€', name: 'Yevro', countryCode: 'LT' },
  LV: { code: 'EUR', symbol: '€', name: 'Yevro', countryCode: 'LV' },
  EE: { code: 'EUR', symbol: '€', name: 'Yevro', countryCode: 'EE' },
  FI: { code: 'EUR', symbol: '€', name: 'Yevro', countryCode: 'FI' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'Dirham', countryCode: 'AE' }
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
