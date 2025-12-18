const express = require('express');
const router = express.Router();
const Businessman = require('../models/Businessman');
const { generateCredentials, makeUsernameUnique } = require('../utils/credentialGenerator');
const { generateTokenPair } = require('../utils/tokenManager');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { loginLimiter } = require('../middleware/rateLimiter');

// Super Admin credentials from .env
const SUPER_ADMIN = {
  login: process.env.SUPER_ADMIN_LOGIN || 'super_admin',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2024'
};

// JWT verify
const jwt = require('jsonwebtoken');

// Middleware: Super Admin tekshirish (JWT orqali)
const superAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autentifikatsiya kerak');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'super_admin') {
      throw new ApiError(403, 'Super Admin huquqi kerak');
    }
    
    req.isSuperAdmin = true;
    return next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token muddati tugagan');
    }
    throw new ApiError(401, 'Noto\'g\'ri token');
  }
};

// Super Admin login - endi auth.routes.js da amalga oshiriladi
// Bu route faqat backward compatibility uchun

// Barcha biznesmenlarni olish
router.get('/businessmen', superAdminAuth, asyncHandler(async (req, res) => {
  const businessmen = await Businessman.find()
    .select('-password')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: businessmen
  });
}));

// Yangi biznesmen qo'shish
router.post('/businessmen', superAdminAuth, asyncHandler(async (req, res) => {
  const { fullName, businessType, phone } = req.body;
  
  if (!fullName || !businessType || !phone) {
    throw new ApiError(400, 'Barcha maydonlar majburiy: fullName, businessType, phone');
  }
  
  // Login/parol generatsiya
  const credentials = generateCredentials(fullName, businessType);
  
  // Username unique bo'lishini tekshirish
  const checkExists = async (username) => {
    const exists = await Businessman.findOne({ username });
    return !!exists;
  };
  
  const uniqueUsername = await makeUsernameUnique(credentials.username, checkExists);
  
  // Biznesmen yaratish
  const businessman = await Businessman.create({
    fullName,
    businessType,
    phone,
    username: uniqueUsername,
    password: credentials.password
  });
  
  res.status(201).json({
    success: true,
    data: {
      businessman: {
        id: businessman._id,
        fullName: businessman.fullName,
        businessType: businessman.businessType,
        phone: businessman.phone,
        username: businessman.username,
        isActive: businessman.isActive,
        createdAt: businessman.createdAt
      },
      credentials: {
        username: uniqueUsername,
        password: credentials.password // Faqat yaratilganda ko'rsatiladi
      }
    }
  });
}));

// Biznesmen ma'lumotlarini yangilash
router.put('/businessmen/:id', superAdminAuth, asyncHandler(async (req, res) => {
  const { fullName, businessType, phone, isActive } = req.body;
  
  const businessman = await Businessman.findById(req.params.id);
  if (!businessman) {
    throw new ApiError(404, 'Biznesmen topilmadi');
  }
  
  if (fullName) businessman.fullName = fullName;
  if (businessType) businessman.businessType = businessType;
  if (phone) businessman.phone = phone;
  if (typeof isActive === 'boolean') businessman.isActive = isActive;
  
  await businessman.save();
  
  res.json({
    success: true,
    data: {
      id: businessman._id,
      fullName: businessman.fullName,
      businessType: businessman.businessType,
      phone: businessman.phone,
      username: businessman.username,
      isActive: businessman.isActive
    }
  });
}));

// Biznesmen parolini yangilash
router.post('/businessmen/:id/reset-password', superAdminAuth, asyncHandler(async (req, res) => {
  const businessman = await Businessman.findById(req.params.id);
  if (!businessman) {
    throw new ApiError(404, 'Biznesmen topilmadi');
  }
  
  // Yangi parol generatsiya
  const credentials = generateCredentials(businessman.fullName, businessman.businessType);
  
  businessman.password = credentials.password;
  await businessman.save();
  
  res.json({
    success: true,
    data: {
      username: businessman.username,
      newPassword: credentials.password
    }
  });
}));

// Biznesmen o'chirish
router.delete('/businessmen/:id', superAdminAuth, asyncHandler(async (req, res) => {
  const businessman = await Businessman.findByIdAndDelete(req.params.id);
  
  if (!businessman) {
    throw new ApiError(404, 'Biznesmen topilmadi');
  }
  
  res.json({
    success: true,
    message: 'Biznesmen o\'chirildi'
  });
}));

module.exports = router;
