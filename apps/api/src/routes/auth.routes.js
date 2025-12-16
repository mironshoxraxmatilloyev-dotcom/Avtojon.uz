const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateToken } = require('../utils/jwt');
const { generateTokenPair, refreshTokens, revokeAllUserTokens } = require('../utils/tokenManager');
const { protect } = require('../middleware/auth');
const { loginLimiter, registerLimiter, passwordLimiter } = require('../middleware/rateLimiter');
const { validate, authSchemas } = require('../utils/validators');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// Admin register
router.post('/register', registerLimiter, validate(authSchemas.register), asyncHandler(async (req, res) => {
  const { username, password, fullName, companyName, phone } = req.body;

  const existingUser = await User.findOne({ username: username.toLowerCase() });
  if (existingUser) {
    throw new ApiError(400, 'Bu username allaqachon band');
  }

  const user = await User.create({ 
    username: username.toLowerCase(), 
    password, 
    fullName, 
    companyName,
    phone,
    role: 'admin' 
  });
  
  // Token juftligi (access + refresh)
  const tokens = await generateTokenPair(user, 'admin');

  res.status(201).json({
    success: true,
    data: {
      user: { 
        id: user._id, 
        username: user.username, 
        fullName: user.fullName, 
        companyName: user.companyName,
        role: 'admin' 
      },
      ...tokens
    }
  });
}));

// Umumiy login (admin va shofyor uchun)
router.post('/login', loginLimiter, validate(authSchemas.login), asyncHandler(async (req, res) => {
  console.log('🔑 Login so\'rovi keldi:', req.body?.username);
  const { username, password } = req.body;
  const cleanUsername = username.toLowerCase().trim();

  // Avval admin tekshir
  const user = await User.findOne({ username: cleanUsername });
  if (user && await user.comparePassword(password)) {
    const tokens = await generateTokenPair(user, 'admin');
    return res.json({
      success: true,
      data: {
        user: { 
          id: user._id, 
          username: user.username, 
          fullName: user.fullName, 
          companyName: user.companyName,
          role: 'admin' 
        },
        ...tokens
      }
    });
  }

  // Keyin shofyor tekshir (faqat aktiv shofyorlar)
  const driver = await Driver.findOne({ username: cleanUsername, isActive: true });
  if (driver && await driver.comparePassword(password)) {
    const tokens = await generateTokenPair(driver, 'driver');
    return res.json({
      success: true,
      data: {
        user: { 
          id: driver._id, 
          username: driver.username, 
          fullName: driver.fullName, 
          role: 'driver', 
          userId: driver.user 
        },
        ...tokens
      }
    });
  }

  throw new ApiError(401, 'Username yoki parol noto\'g\'ri');
}));

// Get current user
router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.driver || req.user
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ApiError(400, 'Refresh token kerak');
  }
  
  // Foydalanuvchini olish funksiyasi
  const getUserById = async (id, role) => {
    if (role === 'admin') {
      return User.findById(id).select('-password');
    } else if (role === 'driver') {
      return Driver.findById(id).select('-password');
    }
    return null;
  };
  
  const tokens = await refreshTokens(refreshToken, getUserById);
  
  res.json({
    success: true,
    data: tokens
  });
}));

// Logout (barcha tokenlarni bekor qilish)
router.post('/logout', protect, asyncHandler(async (req, res) => {
  const userId = req.driver?._id || req.user?._id;
  const count = await revokeAllUserTokens(userId);
  
  res.json({
    success: true,
    message: `${count} ta token bekor qilindi`
  });
}));

// Parol o'zgartirish
router.post('/change-password', protect, passwordLimiter, validate(authSchemas.changePassword), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  let user;
  if (req.driver) {
    user = await Driver.findById(req.driver._id);
  } else {
    user = await User.findById(req.user._id);
  }
  
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi');
  }
  
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Joriy parol noto\'g\'ri');
  }
  
  user.password = newPassword;
  await user.save();
  
  // Barcha eski tokenlarni bekor qilish
  await revokeAllUserTokens(user._id);
  
  // Yangi tokenlar
  const role = req.driver ? 'driver' : 'admin';
  const tokens = await generateTokenPair(user, role);
  
  res.json({
    success: true,
    message: 'Parol muvaffaqiyatli o\'zgartirildi',
    data: tokens
  });
}));

// Demo login - avtomatik demo user yaratadi yoki mavjudini qaytaradi
router.post('/demo', loginLimiter, asyncHandler(async (req, res) => {
  const demoUsername = 'demo';
  const demoPassword = 'demo123456';
  
  // Demo user mavjudmi tekshir
  let demoUser = await User.findOne({ username: demoUsername });
  
  // Yo'q bo'lsa yangi yaratamiz
  if (!demoUser) {
    demoUser = await User.create({
      username: demoUsername,
      password: demoPassword,
      fullName: 'Demo Foydalanuvchi',
      companyName: 'Demo Kompaniya',
      phone: '+998901234567',
      role: 'admin'
    });
  }
  
  const tokens = await generateTokenPair(demoUser, 'admin');
  
  res.json({
    success: true,
    data: {
      user: {
        id: demoUser._id,
        username: demoUser.username,
        fullName: demoUser.fullName,
        companyName: demoUser.companyName,
        role: 'admin'
      },
      ...tokens
    }
  });
}));

module.exports = router;
