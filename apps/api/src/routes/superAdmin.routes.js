const express = require('express');
const router = express.Router();
const User = require('../models/User');
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
    totalVehicles,
    totalUsers,
    activeUsers
  ] = await Promise.all([
    Businessman.countDocuments(),
    Businessman.countDocuments({ isActive: true }),
    Driver.countDocuments({ isActive: true }),
    Driver.countDocuments({ isActive: true, status: 'busy' }),
    Flight.countDocuments(),
    Flight.countDocuments({ status: 'active' }),
    Flight.countDocuments({ status: 'completed' }),
    Vehicle.countDocuments({ isActive: true }),
    User.countDocuments(),
    User.countDocuments({ isActive: true })
  ]);

  res.json({
    success: true,
    data: {
      businessmen: {
        total: totalBusinessmen,
        active: activeBusinessmen,
        inactive: totalBusinessmen - activeBusinessmen
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
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
    
  // Username band emasligini tekshirish - faqat aktiv biznesmenlar orasida
    const existingUser = await Businessman.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    });
    if (existingUser) {
      throw new ApiError(400, 'Bu username allaqachon band');
    }
    
    // Agar o'chirilgan biznesmen bo'lsa, username ni o'zgartirish
    const deletedUser = await Businessman.findOne({
      username: username.toLowerCase(),
      isActive: false
    });
    if (deletedUser) {
      await Businessman.updateOne(
        { _id: deletedUser._id },
        { username: `deleted_${Date.now()}_${username.toLowerCase()}` }
      );
    }
    
    finalUsername = username.toLowerCase();
    finalPassword = password;
  } else {
    // Avtomatik generatsiya - phone ham uzatiladi
    const credentials = generateCredentials(fullName, businessType, phone);
    
    const checkExists = async (uname) => {
      // Faqat aktiv biznesmenlarni tekshirish
      const exists = await Businessman.findOne({ username: uname, isActive: true });
      return !!exists;
    };
    
    finalUsername = await makeUsernameUnique(credentials.username, checkExists);
    finalPassword = credentials.password;
    
    // Agar o'chirilgan biznesmen bo'lsa, username ni o'zgartirish
    const deletedUser = await Businessman.findOne({
      username: finalUsername,
      isActive: false
    });
    if (deletedUser) {
      await Businessman.updateOne(
        { _id: deletedUser._id },
        { username: `deleted_${Date.now()}_${finalUsername}` }
      );
    }
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

// ============ INDIVIDUAL FOYDALANUVCHILAR (O'zi register qilganlar) ============

// Barcha individual foydalanuvchilarni olish
router.get('/users', superAdminAuth, asyncHandler(async (req, res) => {
  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: users
  });
}));

// Individual foydalanuvchi ma'lumotlarini yangilash
router.put('/users/:id', superAdminAuth, asyncHandler(async (req, res) => {
  const { fullName, companyName, phone, isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi');
  }
  
  if (fullName) user.fullName = fullName;
  if (companyName !== undefined) user.companyName = companyName;
  if (phone !== undefined) user.phone = phone;
  if (typeof isActive === 'boolean') user.isActive = isActive;
  
  await user.save();
  
  res.json({
    success: true,
    data: {
      id: user._id,
      fullName: user.fullName,
      companyName: user.companyName,
      phone: user.phone,
      username: user.username,
      isActive: user.isActive
    }
  });
}));

// Individual foydalanuvchi parolini o'rnatish
router.post('/users/:id/set-password', superAdminAuth, asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }
  
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi');
  }
  
  user.password = password;
  await user.save();
  
  res.json({
    success: true,
    data: {
      username: user.username,
      newPassword: password
    }
  });
}));

// Individual foydalanuvchi o'chirish
router.delete('/users/:id', superAdminAuth, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi');
  }
  
  res.json({
    success: true,
    message: 'Foydalanuvchi o\'chirildi'
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

// Barcha mashrutlarni olish
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

// ============ OBUNA BOSHQARISH ============

// Individual foydalanuvchi obunasini olish
router.get('/users/:id/subscription', superAdminAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi');
  }

  const subscription = user.subscription || {};
  const now = new Date();
  const endDate = subscription.endDate ? new Date(subscription.endDate) : now;
  const isExpired = now > endDate;

  res.json({
    success: true,
    data: {
      plan: subscription.plan || 'trial',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isExpired,
      daysLeft: isExpired ? 0 : Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    }
  });
}));

// Individual foydalanuvchi obunasini uzaytirish
router.post('/users/:id/subscription/extend', superAdminAuth, asyncHandler(async (req, res) => {
  const { days, plan } = req.body;
  
  if (!days || days < 1) {
    throw new ApiError(400, 'Kunlar soni majburiy (kamida 1 kun)');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'Foydalanuvchi topilmadi');
  }

  const now = new Date();
  const currentEndDate = user.subscription?.endDate ? new Date(user.subscription.endDate) : now;
  
  // Agar obuna tugagan bo'lsa, hozirdan boshlab hisoblash
  // Agar hali tugamagan bo'lsa, mavjud muddat ustiga qo'shish
  const baseDate = currentEndDate > now ? currentEndDate : now;
  const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  user.subscription = {
    plan: plan || 'pro',
    startDate: user.subscription?.startDate || now,
    endDate: newEndDate,
    isExpired: false
  };

  await user.save();

  res.json({
    success: true,
    message: `Obuna ${days} kunga uzaytirildi`,
    data: {
      plan: user.subscription.plan,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      daysLeft: Math.ceil((newEndDate - now) / (1000 * 60 * 60 * 24))
    }
  });
}));

// Biznesmen obunasini olish
router.get('/businessmen/:id/subscription', superAdminAuth, asyncHandler(async (req, res) => {
  const businessman = await Businessman.findById(req.params.id);
  if (!businessman) {
    throw new ApiError(404, 'Biznesmen topilmadi');
  }

  const subscription = businessman.subscription || {};
  const now = new Date();
  const endDate = subscription.endDate ? new Date(subscription.endDate) : now;
  const isExpired = now > endDate;

  res.json({
    success: true,
    data: {
      plan: subscription.plan || 'trial',
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isExpired,
      daysLeft: isExpired ? 0 : Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    }
  });
}));

// Biznesmen obunasini uzaytirish
router.post('/businessmen/:id/subscription/extend', superAdminAuth, asyncHandler(async (req, res) => {
  const { days, plan } = req.body;
  
  if (!days || days < 1) {
    throw new ApiError(400, 'Kunlar soni majburiy (kamida 1 kun)');
  }

  const businessman = await Businessman.findById(req.params.id);
  if (!businessman) {
    throw new ApiError(404, 'Biznesmen topilmadi');
  }

  const now = new Date();
  const currentEndDate = businessman.subscription?.endDate ? new Date(businessman.subscription.endDate) : now;
  
  const baseDate = currentEndDate > now ? currentEndDate : now;
  const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  businessman.subscription = {
    plan: plan || 'pro',
    startDate: businessman.subscription?.startDate || now,
    endDate: newEndDate,
    isExpired: false
  };

  await businessman.save();

  res.json({
    success: true,
    message: `Obuna ${days} kunga uzaytirildi`,
    data: {
      plan: businessman.subscription.plan,
      startDate: businessman.subscription.startDate,
      endDate: businessman.subscription.endDate,
      daysLeft: Math.ceil((newEndDate - now) / (1000 * 60 * 60 * 24))
    }
  });
}));

module.exports = router;
