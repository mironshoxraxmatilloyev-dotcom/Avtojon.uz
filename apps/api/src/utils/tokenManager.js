const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ==========================================
// TOKEN KONFIGURATSIYASI
// ==========================================

const config = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m' // 15 daqiqa
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    expiresIn: '7d' // 7 kun
  }
};

// Refresh tokenlarni saqlash (production'da Redis ishlatish kerak)
const refreshTokenStore = new Map();

// ==========================================
// TOKEN YARATISH
// ==========================================

/**
 * Access token yaratish
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.accessToken.secret, {
    expiresIn: config.accessToken.expiresIn,
    issuer: 'avtojon-api'
  });
};

/**
 * Refresh token yaratish
 */
const generateRefreshToken = (userId, role) => {
  const tokenId = crypto.randomBytes(32).toString('hex');
  
  const token = jwt.sign(
    { id: userId, role, tokenId },
    config.refreshToken.secret,
    {
      expiresIn: config.refreshToken.expiresIn,
      issuer: 'avtojon-api'
    }
  );
  
  // Tokenni saqlash
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 kun
  refreshTokenStore.set(tokenId, {
    userId,
    role,
    expiresAt,
    createdAt: Date.now()
  });
  
  return { token, tokenId };
};

/**
 * Token juftligini yaratish
 */
const generateTokenPair = (user, role) => {
  const payload = {
    id: user._id || user.id,
    role,
    username: user.username
  };
  
  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, tokenId } = generateRefreshToken(payload.id, role);
  
  return {
    accessToken,
    refreshToken,
    tokenId,
    expiresIn: 15 * 60, // 15 daqiqa (sekundlarda)
    refreshExpiresIn: 7 * 24 * 60 * 60 // 7 kun (sekundlarda)
  };
};

// ==========================================
// TOKEN TEKSHIRISH
// ==========================================

/**
 * Access tokenni tekshirish
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.accessToken.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('ACCESS_TOKEN_EXPIRED');
    }
    throw new Error('INVALID_ACCESS_TOKEN');
  }
};

/**
 * Refresh tokenni tekshirish
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.refreshToken.secret);
    
    // Token store'da mavjudligini tekshirish
    const storedToken = refreshTokenStore.get(decoded.tokenId);
    if (!storedToken) {
      throw new Error('REFRESH_TOKEN_REVOKED');
    }
    
    // Muddati o'tganligini tekshirish
    if (storedToken.expiresAt < Date.now()) {
      refreshTokenStore.delete(decoded.tokenId);
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    
    return decoded;
  } catch (error) {
    if (error.message.startsWith('REFRESH_TOKEN')) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw new Error('INVALID_REFRESH_TOKEN');
  }
};

// ==========================================
// TOKEN YANGILASH
// ==========================================

/**
 * Tokenlarni yangilash (rotation)
 */
const refreshTokens = async (refreshToken, getUserById) => {
  const decoded = verifyRefreshToken(refreshToken);
  
  // Eski refresh tokenni o'chirish (rotation)
  refreshTokenStore.delete(decoded.tokenId);
  
  // Foydalanuvchini olish
  const user = await getUserById(decoded.id, decoded.role);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  
  // Yangi token juftligini yaratish
  return generateTokenPair(user, decoded.role);
};

// ==========================================
// TOKEN BEKOR QILISH
// ==========================================

/**
 * Bitta refresh tokenni bekor qilish
 */
const revokeRefreshToken = (tokenId) => {
  return refreshTokenStore.delete(tokenId);
};

/**
 * Foydalanuvchining barcha tokenlarini bekor qilish
 */
const revokeAllUserTokens = (userId) => {
  let count = 0;
  for (const [tokenId, data] of refreshTokenStore.entries()) {
    if (data.userId.toString() === userId.toString()) {
      refreshTokenStore.delete(tokenId);
      count++;
    }
  }
  return count;
};

/**
 * Muddati o'tgan tokenlarni tozalash
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  let count = 0;
  for (const [tokenId, data] of refreshTokenStore.entries()) {
    if (data.expiresAt < now) {
      refreshTokenStore.delete(tokenId);
      count++;
    }
  }
  return count;
};

// Har soatda tozalash
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};
