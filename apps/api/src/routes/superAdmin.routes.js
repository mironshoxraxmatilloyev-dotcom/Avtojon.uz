const express = require('express');
const router = express.Router();
const Businessman = require('../models/Businessman');
const Driver = require('../models/Driver');
const Flight = require('../models/Flight');
const Vehicle = require('../models/Vehicle');
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

// Umumiy statistika
router.get('/stats', superAdminAuth, asyncHandler(async (req, res) => {
  const [
    totalBusinessmen,
    activeBusinessmen,
    totalDrivers,
    activeDrivers,
    totalFlights,
    activeFlights,
    completedFlights,
    totalVehicles
  ] = await Promise.all([
    Businessman.countDocuments(),
    Businessman.countDocuments({ isActive: true }),
    Driver.countDocuments({ isActive: true }),
    Driver.countDocuments({ isActive: true, status: 'busy' }),
    Flight.countDocuments(),
    Flight.countDocuments({ status: 'active' }),
    Flight.countDocuments({ status: 'completed' }),
    Vehicle.countDocuments({ isActive: true })
  ]);

  res.json({
    success: true,
    data: {
      businessmen: {
        total: totalBusinessmen,
        active: activeBusinessmen,
        inactive: totalBusinessmen - activeBusinessmen
      },
      drivers: {
        total: totalDrivers,
        busy: activeDrivers,
        free: totalDrivers - activeDrivers
      },
      flights: {
        total: totalFlights,
        active: activeFlights,
        completed: completedFlights
      },
      vehicles: {
        total: totalVehicles
      }
    }
  });
}));

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
  const { fullName, businessType, phone, username, password } = req.body;
  
  if (!fullName || !businessType || !phone) {
    throw new ApiError(400, 'Barcha maydonlar majburiy: fullName, businessType, phone');
  }
  
  let finalUsername, finalPassword;
  
  // Agar username va parol berilgan bo'lsa - qo'lda kiritilgan
  if (username && password) {
    if (password.length < 6) {
      throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
    }
    
    // Username band emasligini tekshirish
    const existingUser = await Businessman.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      throw new ApiError(400, 'Bu username allaqachon band');
    }
    
    finalUsername = username.toLowerCase();
    finalPassword = password;
  } else {
    // Avtomatik generatsiya
    const credentials = generateCredentials(fullName, businessType);
    
    const checkExists = async (uname) => {
      const exists = await Businessman.findOne({ username: uname });
      return !!exists;
    };
    
    finalUsername = await makeUsernameUnique(credentials.username, checkExists);
    finalPassword = credentials.password;
  }
  
  // Biznesmen yaratish
  const businessman = await Businessman.create({
    fullName,
    businessType,
    phone,
    username: finalUsername,
    password: finalPassword
  });
  
  res.status(201).json({
    success: true,
    data: {
      businessman: {
        _id: businessman._id,
        fullName: businessman.fullName,
        businessType: businessman.businessType,
        phone: businessman.phone,
        username: businessman.username,
        isActive: businessman.isActive,
        createdAt: businessman.createdAt
      },
      credentials: {
        username: finalUsername,
        password: finalPassword
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

// Biznesmen parolini yangilash (avtomatik generatsiya)
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

// Biznesmen parolini qo'lda o'rnatish
router.post('/businessmen/:id/set-password', superAdminAuth, asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }
  
  const businessman = await Businessman.findById(req.params.id);
  if (!businessman) {
    throw new ApiError(404, 'Biznesmen topilmadi');
  }
  
  businessman.password = password;
  await businessman.save();
  
  res.json({
    success: true,
    data: {
      username: businessman.username,
      newPassword: password
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

// Barcha shofyorlarni olish
router.get('/drivers', superAdminAuth, asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ isActive: true })
    .select('-password')
    .populate('user', 'fullName businessType')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: drivers
  });
}));

// Barcha reyslarni olish
router.get('/flights', superAdminAuth, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;
  
  const flights = await Flight.find(query)
    .populate('driver', 'fullName phone')
    .populate('vehicle', 'plateNumber brand')
    .sort({ createdAt: -1 })
    .limit(100);
  
  res.json({
    success: true,
    data: flights
  });
}));

// Barcha mashinalarni olish
router.get('/vehicles', superAdminAuth, asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ isActive: true })
    .populate('currentDriver', 'fullName')
    .populate('user', 'fullName businessType')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: vehicles
  });
}));

module.exports = router;
