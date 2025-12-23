// ==========================================
// REDIS KONFIGURATSIYASI (Optional)
// ==========================================

let redis = null;
let connected = false;

// Redis ulanishni boshlash (agar REDIS_URL mavjud bo'lsa)
const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('⚠️  REDIS_URL yo\'q - in-memory storage ishlatiladi');
    return null;
  }

  try {
    const Redis = require('ioredis');
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true
    });

    redis.on('connect', () => {
      connected = true;
      console.log('✅ Redis ulandi');
    });

    redis.on('error', (err) => {
      connected = false;
      console.error('❌ Redis xatosi:', err.message);
    });

    redis.on('close', () => {
      connected = false;
    });

    await redis.connect();
    return redis;
  } catch (error) {
    console.log('⚠️  Redis ulanmadi - in-memory storage ishlatiladi');
    redis = null;
    connected = false;
    return null;
  }
};

const getRedis = () => redis;
const isRedisConnected = () => connected && redis !== null;

module.exports = {
  initRedis,
  getRedis,
  isRedisConnected
};
