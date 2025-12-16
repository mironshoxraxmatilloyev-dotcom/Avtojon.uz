// ==========================================
// RATE LIMITER (Tashqi kutubxonasiz)
// ==========================================

// Xotirada so'rovlarni saqlash
const requestCounts = new Map();

// Eski yozuvlarni tozalash (har 5 daqiqada)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.windowStart > data.windowMs * 2) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter yaratish
 * @param {Object} options
 * @param {number} options.windowMs - Vaqt oynasi (ms)
 * @param {number} options.max - Maksimal so'rovlar soni
 * @param {string} options.message - Xato xabari
 * @param {boolean} options.skipSuccessfulRequests - Muvaffaqiyatli so'rovlarni o'tkazib yuborish
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 daqiqa
    max = 100,
    message = 'Juda ko\'p so\'rov. Iltimos, biroz kuting.',
    skipSuccessfulRequests = false,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let data = requestCounts.get(key);
    
    // Yangi yoki muddati o'tgan
    if (!data || now - data.windowStart > windowMs) {
      data = {
        count: 0,
        windowStart: now,
        windowMs
      };
      requestCounts.set(key, data);
    }
    
    data.count++;
    
    // Qolgan vaqt va so'rovlar
    const remaining = Math.max(0, max - data.count);
    const resetTime = Math.ceil((data.windowStart + windowMs - now) / 1000);
    
    // Headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetTime);
    
    // Limit oshgan
    if (data.count > max) {
      res.setHeader('Retry-After', resetTime);
      return res.status(429).json({
        success: false,
        message,
        errorType: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetTime
      });
    }
    
    // Muvaffaqiyatli so'rovlarni hisoblamaslik
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          data.count--;
        }
      });
    }
    
    next();
  };
};

// ==========================================
// TAYYOR LIMITERLAR
// ==========================================

// Umumiy API limiter
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 100,
  message: 'Juda ko\'p so\'rov. 1 daqiqada 100 ta so\'rovgacha ruxsat.'
});

// Auth endpointlar uchun qattiqroq limit
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 10,
  message: 'Juda ko\'p kirish urinishi. 15 daqiqadan keyin qayta urinib ko\'ring.',
  keyGenerator: (req) => {
    // Username + IP kombinatsiyasi
    const username = req.body?.username || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${username}:${ip}`;
  }
});

// Login uchun alohida (brute force himoyasi)
const loginLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 5,
  message: 'Juda ko\'p noto\'g\'ri kirish urinishi. 1 soatdan keyin qayta urinib ko\'ring.',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const username = req.body?.username || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `login:${username}:${ip}`;
  }
});

// Ro'yxatdan o'tish uchun
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 3,
  message: 'Juda ko\'p ro\'yxatdan o\'tish urinishi. 1 soatdan keyin qayta urinib ko\'ring.'
});

// GPS joylashuv yuborish uchun
const locationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 30, // Har 2 sekundda 1 ta
  message: 'Juda ko\'p joylashuv so\'rovi.'
});

// Parol o'zgartirish uchun
const passwordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 3,
  message: 'Juda ko\'p parol o\'zgartirish urinishi.'
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  locationLimiter,
  passwordLimiter
};
