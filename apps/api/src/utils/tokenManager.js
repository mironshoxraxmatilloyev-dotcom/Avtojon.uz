const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getRedis, isRedisConnected } = require('../config/redis');

// ==========================================
// TOKEN KONFIGURATSIYASI
// ==========================================

const config = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h', // 1 soat
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh_v2',
    expiresIn: '30d', // 30 kun - haydovchilar uchun qulay
    expiresInMs: 30 * 24 * 60 * 60 * 1000, // 30 kun millisekund
  },
};

// In-memory fallback
const memoryStore = new Map();

// Redis key prefixlari
const REDIS_PREFIX = {
  REFRESH_TOKEN: 'rt:',
  USER_TOKENS: 'ut:',
};

// ==========================================
// REDIS HELPER FUNKSIYALAR
// ==========================================

const storeToken = async (tokenId, data, ttlMs) => {
  const redis = getRedis();
  const ttlSeconds = Math.floor(ttlMs / 1000);

  if (redis && isRedisConnected()) {
    const key = REDIS_PREFIX.REFRESH_TOKEN + tokenId;
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    const userKey = REDIS_PREFIX.USER_TOKENS + data.userId;
    await redis.sadd(userKey, tokenId);
    await redis.expire(userKey, ttlSeconds);
  } else {
    memoryStore.set(tokenId, { ...data, expiresAt: Date.now() + ttlMs });
  }
};

const getToken = async (tokenId) => {
  const redis = getRedis();
  if (redis && isRedisConnected()) {
    const key = REDIS_PREFIX.REFRESH_TOKEN + tokenId;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  const data = memoryStore.get(tokenId);
  if (data && data.expiresAt > Date.now()) return data;
  memoryStore.delete(tokenId);
  return null;
};

const deleteToken = async (tokenId, userId) => {
  const redis = getRedis();
  if (redis && isRedisConnected()) {
    await redis.del(REDIS_PREFIX.REFRESH_TOKEN + tokenId);
    if (userId) await redis.srem(REDIS_PREFIX.USER_TOKENS + userId, tokenId);
  } else {
    memoryStore.delete(tokenId);
  }
};


const deleteAllUserTokens = async (userId) => {
  const redis = getRedis();
  let count = 0;
  if (redis && isRedisConnected()) {
    const userKey = REDIS_PREFIX.USER_TOKENS + userId;
    const tokenIds = await redis.smembers(userKey);
    if (tokenIds.length > 0) {
      const keys = tokenIds.map((id) => REDIS_PREFIX.REFRESH_TOKEN + id);
      await redis.del(...keys);
      count = tokenIds.length;
    }
    await redis.del(userKey);
  } else {
    for (const [tokenId, data] of memoryStore.entries()) {
      if (data.userId?.toString() === userId.toString()) {
        memoryStore.delete(tokenId);
        count++;
      }
    }
  }
  return count;
};

// ==========================================
// TOKEN YARATISH
// ==========================================

const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.accessToken.secret, {
    expiresIn: config.accessToken.expiresIn,
    issuer: 'avtojon-api',
  });
};

const generateRefreshToken = async (userId, role) => {
  const tokenId = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    { id: userId, role, tokenId },
    config.refreshToken.secret,
    { expiresIn: config.refreshToken.expiresIn, issuer: 'avtojon-api' }
  );
  await storeToken(tokenId, { userId: userId.toString(), role, createdAt: Date.now() }, config.refreshToken.expiresInMs);
  return { token, tokenId };
};

const generateTokenPair = async (user, role) => {
  const payload = { id: user._id || user.id, role, username: user.username };
  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, tokenId } = await generateRefreshToken(payload.id, role);
  return {
    accessToken,
    refreshToken,
    tokenId,
    expiresIn: 60 * 60, // 1 soat (sekundlarda)
    refreshExpiresIn: 30 * 24 * 60 * 60, // 30 kun (sekundlarda)
  };
};

// ==========================================
// TOKEN TEKSHIRISH
// ==========================================

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.accessToken.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') throw new Error('ACCESS_TOKEN_EXPIRED');
    throw new Error('INVALID_ACCESS_TOKEN');
  }
};

const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, config.refreshToken.secret);
    const storedToken = await getToken(decoded.tokenId);
    if (!storedToken) throw new Error('REFRESH_TOKEN_REVOKED');
    return decoded;
  } catch (error) {
    if (error.message.startsWith('REFRESH_TOKEN')) throw error;
    if (error.name === 'TokenExpiredError') throw new Error('REFRESH_TOKEN_EXPIRED');
    throw new Error('INVALID_REFRESH_TOKEN');
  }
};

// ==========================================
// TOKEN YANGILASH VA BEKOR QILISH
// ==========================================

const refreshTokens = async (refreshToken, getUserById) => {
  const decoded = await verifyRefreshToken(refreshToken);
  await deleteToken(decoded.tokenId, decoded.id);
  const user = await getUserById(decoded.id, decoded.role);
  if (!user) throw new Error('USER_NOT_FOUND');
  return generateTokenPair(user, decoded.role);
};

const revokeRefreshToken = async (tokenId, userId) => {
  await deleteToken(tokenId, userId);
  return true;
};

const revokeAllUserTokens = async (userId) => deleteAllUserTokens(userId);

const cleanupExpiredTokens = () => {
  if (!isRedisConnected()) {
    const now = Date.now();
    let count = 0;
    for (const [tokenId, data] of memoryStore.entries()) {
      if (data.expiresAt < now) { memoryStore.delete(tokenId); count++; }
    }
    return count;
  }
  return 0;
};

setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
};
