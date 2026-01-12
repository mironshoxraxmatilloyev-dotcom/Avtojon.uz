const express = require('express');
const router = express.Router();

// Valyuta kurslari cache
let currencyCache = {
  rates: null,
  lastUpdated: null,
  ttl: 60 * 60 * 1000 // 1 soat
};

// Default kurslar (fallback) - real bozor kurslariga yaqin
const DEFAULT_RATES = {
  USD: 1,
  UZS: 12850,    // O'zbekiston so'mi
  RUB: 103,      // Rossiya rubli (real bozor kursi)
  KZT: 525,      // Qozog'iston tengesi
  EUR: 0.92,     // Yevro
  TRY: 35,       // Turkiya lirasi
  CNY: 7.3,      // Xitoy yuani
  GBP: 0.79,     // Angliya funti
  AED: 3.67,     // BAA dirhami
  IRR: 42000,    // Eron riyoli
  AFN: 70,       // Afg'oniston afg'onisi
  TJS: 11,       // Tojikiston somonisi
  KGS: 89,       // Qirg'iziston somi
  TMT: 3.5,      // Turkmaniston manati
  AZN: 1.7,      // Ozarbayjon manati
  GEL: 2.7,      // Gruziya larisi
  BYN: 3.3,      // Belarus rubli
  UAH: 41,       // Ukraina grivnasi
  PLN: 4         // Polsha zlotisi
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

// Realtime valyuta kurslarini olish - bir nechta manbadan
async function fetchRealTimeRates() {
  const rates = { USD: 1 };
  
  try {
    // 1. O'zbekiston Markaziy Banki (CBU) - UZS kursi
    try {
      const cbuResponse = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/', {
        signal: AbortSignal.timeout(5000)
      });
      if (cbuResponse.ok) {
        const cbuData = await cbuResponse.json();
        const usdRate = cbuData.find(c => c.Ccy === 'USD');
        const rubRate = cbuData.find(c => c.Ccy === 'RUB');
        const eurRate = cbuData.find(c => c.Ccy === 'EUR');
        const kztRate = cbuData.find(c => c.Ccy === 'KZT');
        
        if (usdRate?.Rate) rates.UZS = parseFloat(usdRate.Rate);
        // CBU dan boshqa valyutalarning UZS ga nisbatan kursini hisoblash
        if (rubRate?.Rate && rates.UZS) {
          rates.RUB = rates.UZS / parseFloat(rubRate.Rate);
        }
        if (eurRate?.Rate && rates.UZS) {
          rates.EUR = rates.UZS / parseFloat(eurRate.Rate);
        }
        if (kztRate?.Rate && rates.UZS) {
          rates.KZT = rates.UZS / parseFloat(kztRate.Rate);
        }
      }
    } catch (e) {
      console.log('CBU API xatolik:', e.message);
    }

    // 2. Rossiya Markaziy Banki (CBR) - RUB kursi (agar CBU dan olinmagan bo'lsa)
    if (!rates.RUB) {
      try {
        const cbrResponse = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
          signal: AbortSignal.timeout(5000)
        });
        if (cbrResponse.ok) {
          const cbrData = await cbrResponse.json();
          if (cbrData?.Valute?.USD?.Value) {
            rates.RUB = cbrData.Valute.USD.Value; // 1 USD = X RUB
          }
        }
      } catch (e) {
        console.log('CBR API xatolik:', e.message);
      }
    }

    // 3. Qozog'iston Milliy Banki (NBK) - KZT kursi (agar CBU dan olinmagan bo'lsa)
    if (!rates.KZT) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const nbkResponse = await fetch(`https://nationalbank.kz/rss/get_rates.cfm?fdate=${today}`, {
          signal: AbortSignal.timeout(5000)
        });
        if (nbkResponse.ok) {
          const nbkText = await nbkResponse.text();
          // XML dan USD kursini olish
          const usdMatch = nbkText.match(/<title>USD<\/title>[\s\S]*?<description>([\d.]+)<\/description>/);
          if (usdMatch && usdMatch[1]) {
            rates.KZT = parseFloat(usdMatch[1]);
          }
        }
      } catch (e) {
        console.log('NBK API xatolik:', e.message);
      }
    }

    // 4. Exchangerate-api.com dan qolgan valyutalarni olish
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.rates) {
          // Faqat mavjud bo'lmagan kurslarni qo'shish
          Object.keys(data.rates).forEach(currency => {
            if (!rates[currency]) {
              rates[currency] = data.rates[currency];
            }
          });
        }
      }
    } catch (e) {
      console.log('Exchangerate API xatolik:', e.message);
    }

    // Default qiymatlarni qo'shish (agar hali olinmagan bo'lsa)
    Object.keys(DEFAULT_RATES).forEach(currency => {
      if (!rates[currency]) {
        rates[currency] = DEFAULT_RATES[currency];
      }
    });

    // Cache yangilash
    currencyCache.rates = rates;
    currencyCache.lastUpdated = new Date();
    
    console.log('Valyuta kurslari yangilandi:', {
      UZS: rates.UZS,
      RUB: rates.RUB,
      KZT: rates.KZT,
      EUR: rates.EUR
    });
    
    return rates;
  } catch (error) {
    console.error('Valyuta kurslarini olishda xatolik:', error.message);
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
