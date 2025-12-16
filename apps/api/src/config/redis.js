const Redis = require('ioredis');

// Redis yoqilganmi tekshirish
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Redis konfiguratsiyasi
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // Qayta ulanishni o'chirish
  lazyConnect: true,
  enableOfflineQueue: false,
};

// Redis instance
let redis = null;
let isConnected = false;

/**
 * Redis ga ulanish
 */
const connectRedis = async () => {
  // Redis o'chirilgan bo'lsa, ulanmaslik
  if (!REDIS_ENABLED) {
    console.log('ℹ️ Redis o\'chirilgan, in-memory mode ishlatiladi');
    return null;
  }

  if (redis && isConnected) return redis;

  try {
    redis = new Redis(redisConfig);

    redis.on('connect', () => {
      isConnected = true;
      console.log('✅ Redis ulandi');
    });

    redis.on('error', () => {
      // Silent - spam qilmaslik
      isConnected = false;
    });

    redis.on('close', () => {
      isConnected = false;
    });

    // Ulanishni tekshirish
    await redis.ping();
    return redis;
  } catch (error) {
    console.log('ℹ️ Redis mavjud emas, in-memory mode ishlatiladi');
    redis = null;
    return null;
  }
};

/**
 * Redis instance olish
 */
const getRedis = () => redis;

/**
 * Redis ulanganligini tekshirish
 */
const isRedisConnected = () => isConnected;

/**
 * Redis ni yopish
 */
const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
    isConnected = false;
  }
};

module.exports = {
  connectRedis,
  getRedis,
  isRedisConnected,
  closeRedis,
};
