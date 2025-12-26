const express = require('express');
const router = express.Router();

// Valyuta kurslari cache
let currencyCache = {
  rates: null,
  lastUpdated: null,
  ttl: 60 * 60 * 1000 // 1 soat
};

// Default kurslar (fallback)
const DEFAULT_RATES = {
  USD: 1,
  UZS: 12800,
  RUB: 95,
  KZT: 480,
  EUR: 0.92,
  TRY: 34,
  CNY: 7.2,
  GBP: 0.79,
  AED: 3.67,
  IRR: 42000,
  AFN: 70,
  TJS: 11,
  KGS: 89,
  TMT: 3.5,
  AZN: 1.7,
  GEL: 2.7,
  BYN: 3.3,
  UAH: 41,
  PLN: 4,
  LTL: 0.92, // EUR ga teng
  LVL: 0.92,
  EEK: 0.92
};

// Davlatlar va ularning valyutalari
const COUNTRY_CURRENCIES = {
  UZB: { code: 'UZS', symbol: 'so\'m', name: 'O\'zbek so\'mi' },
  KZ: { code: 'KZT', symbol: '₸', name: 'Qozog\'iston tengesi' },
  RU: { code: 'RUB', symbol: '₽', name: 'Rossiya rubli' },
  TJ: { code: 'TJS', symbol: 'SM', name: 'Tojikiston somonisi' },
  KG: { code: 'KGS', symbol: 'сом', name: 'Qirg\'iziston somi' },
  TM: { code: 'TMT', symbol: 'm', name: 'Turkmaniston manati' },
  AF: { code: 'AFN', symbol: '؋', name: 'Afg\'oniston afg\'onisi' },
  CN: { code: 'CNY', symbol: '¥', name: 'Xitoy yuani' },
  TR: { code: 'TRY', symbol: '₺', name: 'Turkiya lirasi' },
  IR: { code: 'IRR', symbol: '﷼', name: 'Eron riyoli' },
  AZ: { code: 'AZN', symbol: '₼', name: 'Ozarbayjon manati' },
  GE: { code: 'GEL', symbol: '₾', name: 'Gruziya larisi' },
  BY: { code: 'BYN', symbol: 'Br', name: 'Belarus rubli' },
  UA: { code: 'UAH', symbol: '₴', name: 'Ukraina grivnasi' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Polsha zlotisi' },
  DE: { code: 'EUR', symbol: '€', name: 'Yevro' },
  LT: { code: 'EUR', symbol: '€', name: 'Yevro' },
  LV: { code: 'EUR', symbol: '€', name: 'Yevro' },
  EE: { code: 'EUR', symbol: '€', name: 'Yevro' },
  FI: { code: 'EUR', symbol: '€', name: 'Yevro' },
  US: { code: 'USD', symbol: '$', name: 'AQSH dollari' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'BAA dirhami' }
};

// Realtime valyuta kurslarini olish
async function fetchRealTimeRates() {
  try {
    // Exchangerate-api.com dan kurslarni olish (bepul API)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('API javob bermadi');
    }
    
    const data = await response.json();
    
    if (data && data.rates) {
      // Cache yangilash
      currencyCache.rates = {
        USD: 1,
        ...data.rates
      };
      currencyCache.lastUpdated = new Date();
      
      return currencyCache.rates;
    }
    
    throw new Error('Noto\'g\'ri javob formati');
  } catch (error) {
    console.error('Valyuta kurslarini olishda xatolik:', error.message);
    
    // Fallback - default kurslar
    return DEFAULT_RATES;
  }
}

// Kurslarni olish (cache bilan)
async function getRates() {
  const now = Date.now();
  
  // Cache mavjud va yangi bo'lsa
  if (currencyCache.rates && currencyCache.lastUpdated) {
    const age = now - currencyCache.lastUpdated.getTime();
    if (age < currencyCache.ttl) {
      return currencyCache.rates;
    }
  }
  
  // Yangi kurslarni olish
  return await fetchRealTimeRates();
}

// Valyutani konvertatsiya qilish
function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1;
  const toRate = rates[toCurrency] || DEFAULT_RATES[toCurrency] || 1;
  
  // Avval USD ga, keyin maqsad valyutaga
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

// ============ ENDPOINTS ============

// Barcha valyuta kurslarini olish
router.get('/rates', async (req, res) => {
  try {
    const rates = await getRates();
    
    res.json({
      success: true,
      data: {
        rates,
        lastUpdated: currencyCache.lastUpdated || new Date(),
        base: 'USD'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message,
      data: { rates: DEFAULT_RATES, base: 'USD' }
    });
  }
});

// Davlatlar va ularning valyutalari
router.get('/countries', (req, res) => {
  res.json({
    success: true,
    data: COUNTRY_CURRENCIES
  });
});

// Konvertatsiya qilish
router.post('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.body;
    
    if (!amount || !from || !to) {
      return res.status(400).json({ 
        success: false, 
        message: 'amount, from va to maydonlari kerak' 
      });
    }
    
    const rates = await getRates();
    const converted = convertCurrency(Number(amount), from, to, rates);
    
    res.json({
      success: true,
      data: {
        original: { amount: Number(amount), currency: from },
        converted: { amount: Math.round(converted * 100) / 100, currency: to },
        rate: rates[to] / rates[from],
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Ko'p valyutaga konvertatsiya (xarajatlar uchun)
router.post('/convert-multi', async (req, res) => {
  try {
    const { amount, from, targets } = req.body;
    
    if (!amount || !from || !targets || !Array.isArray(targets)) {
      return res.status(400).json({ 
        success: false, 
        message: 'amount, from va targets[] maydonlari kerak' 
      });
    }
    
    const rates = await getRates();
    const results = {};
    
    targets.forEach(to => {
      results[to] = {
        amount: Math.round(convertCurrency(Number(amount), from, to, rates) * 100) / 100,
        rate: (rates[to] || 1) / (rates[from] || 1)
      };
    });
    
    res.json({
      success: true,
      data: {
        original: { amount: Number(amount), currency: from },
        converted: results,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
