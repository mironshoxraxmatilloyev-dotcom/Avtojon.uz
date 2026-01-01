const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Businessman = require('../models/Businessman');

// Umumiy auth middleware
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token topilmadi' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Super Admin
    if (decoded.role === 'super_admin') {
      req.user = { 
        _id: 'super_admin', 
        role: 'super_admin', 
        fullName: 'Super Admin',
        username: decoded.username 
      };
      req.isSuperAdmin = true;
    }
    // Admin (eski foydalanuvchilar)
    else if (decoded.role === 'admin') {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
      }
    }
    // Biznesmen
    else if (decoded.role === 'business') {
      req.businessman = await Businessman.findById(decoded.id).select('-password');
      if (!req.businessman) {
        return res.status(401).json({ success: false, message: 'Biznesmen topilmadi' });
      }
      req.user = req.businessman; // Compatibility uchun
    }
    // Shofyor
    else if (decoded.role === 'driver') {
      req.driver = await Driver.findById(decoded.id).select('-password');
      if (!req.driver) {
        return res.status(401).json({ success: false, message: 'Shofyor topilmadi' });
      }
      // Shofyorning egasini ham olish
      req.user = await User.findById(req.driver.user);
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token yaroqsiz' });
  }
};

// Faqat biznesmen (admin) uchun
exports.businessOnly = (req, res, next) => {
  // Biznesmen yoki admin bo'lishi kerak, shofyor bo'lmasligi kerak
  if (req.driver) {
    return res.status(403).json({ success: false, message: 'Faqat biznesmen uchun' });
  }
  if (!req.user && !req.businessman) {
    return res.status(403).json({ success: false, message: 'Faqat biznesmen uchun' });
  }
  next();
};

// Faqat shofyor uchun
exports.driverOnly = (req, res, next) => {
  if (!req.driver) {
    return res.status(403).json({ success: false, message: 'Faqat shofyor uchun' });
  }
  next();
};

// Role bo'yicha ruxsat berish
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // SuperAdmin har doim ruxsat
    if (req.isSuperAdmin || req.userRole === 'super_admin') {
      return next();
    }
    
    // Berilgan role'lardan biri bo'lsa ruxsat
    if (roles.includes(req.userRole)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Bu amalni bajarish uchun ruxsat yo\'q' 
    });
  };
};
