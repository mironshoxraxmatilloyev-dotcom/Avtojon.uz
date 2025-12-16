// ==========================================
// RATE LIMITER
// ==========================================

// GLOBAL xotirada so'rovlarni saqlash
const store = new Map();

/**
 * Rate limiter yaratish
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    message = 'Juda ko\'p so\'rov.',
    keyGenerator = (req) => req.ip || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = store.get(key);
    
    // Yangi yoki muddati o'tgan
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      store.set(key, record);
    }
    
    record.count++;
    
    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
    
    // Headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);
    
    // BLOKLASH - count > max bo'lganda
    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        message,
        errorType: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetSeconds
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
  windowMs: 60 * 1000,
  max: 500,
  message: 'Juda ko\'p so\'rov. 1 daqiqada 500 ta so\'rovgacha ruxsat.'
});

// Login limiter - 5 ta urinishdan keyin 1 soat blok
// Username + IP kombinatsiyasi
const loginLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 5,
  message: 'Juda ko\'p kirish urinishi. 1 soatdan keyin qayta urinib ko\'ring.',
  keyGenerator: (req) => {
    const username = (req.body?.username || '').toLowerCase().trim();
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return `login:${username}:${ip}`;
  }
});

// Register limiter
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Juda ko\'p ro\'yxatdan o\'tish urinishi.'
});

// Location limiter
const locationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Juda ko\'p joylashuv so\'rovi.'
});

// Password limiter
const passwordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Juda ko\'p parol o\'zgartirish urinishi.'
});

// Auth limiter (umumiy)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Juda ko\'p kirish urinishi.'
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
