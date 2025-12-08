// Valyuta kurslari (USD ga nisbatan)
// Bu kurslar default qiymatlar - real loyihada API dan olinishi kerak

const DEFAULT_RATES = {
  USD: 1,
  UZS: 12800, // 1 USD = 12800 UZS
  KZT: 450,   // 1 USD = 450 KZT
  RUB: 90     // 1 USD = 90 RUB
};

// Valyutani USD ga aylantirish
function convertToUSD(amount, currency, customRate = null) {
  if (!amount || amount === 0) return 0;
  if (currency === 'USD') return amount;
  
  const rate = customRate || DEFAULT_RATES[currency];
  if (!rate) return amount;
  
  return Number((amount / rate).toFixed(2));
}

// USD dan boshqa valyutaga aylantirish
function convertFromUSD(amountUSD, currency, customRate = null) {
  if (!amountUSD || amountUSD === 0) return 0;
  if (currency === 'USD') return amountUSD;
  
  const rate = customRate || DEFAULT_RATES[currency];
  if (!rate) return amountUSD;
  
  return Number((amountUSD * rate).toFixed(2));
}

// Default kursni olish
function getDefaultRate(currency) {
  return DEFAULT_RATES[currency] || 1;
}

// Barcha kurslarni olish
function getAllRates() {
  return { ...DEFAULT_RATES };
}

// Valyuta formatlash
function formatCurrency(amount, currency = 'USD') {
  const formats = {
    USD: { locale: 'en-US', options: { style: 'currency', currency: 'USD' } },
    UZS: { locale: 'uz-UZ', options: { style: 'decimal', maximumFractionDigits: 0 } },
    KZT: { locale: 'kk-KZ', options: { style: 'decimal', maximumFractionDigits: 0 } },
    RUB: { locale: 'ru-RU', options: { style: 'decimal', maximumFractionDigits: 0 } }
  };
  
  const format = formats[currency] || formats.USD;
  const formatted = new Intl.NumberFormat(format.locale, format.options).format(amount);
  
  if (currency === 'UZS') return `${formatted} so'm`;
  if (currency === 'KZT') return `${formatted} ₸`;
  if (currency === 'RUB') return `${formatted} ₽`;
  return formatted;
}

module.exports = {
  convertToUSD,
  convertFromUSD,
  getDefaultRate,
  getAllRates,
  formatCurrency,
  DEFAULT_RATES
};
