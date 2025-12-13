const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

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
    
    if (decoded.role === 'admin') {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
      }
    } else if (decoded.role === 'driver') {
      req.driver = await Driver.findById(decoded.id).select('-password');
      if (!req.driver) {
        return res.status(401).json({ success: false, message: 'Shofyor topilmadi' });
      }
      // Shofyorning egasini ham olish
      req.user = await User.findById(req.driver.user);
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token yaroqsiz' });
  }
};

// Faqat biznesmen (admin) uchun
exports.businessOnly = (req, res, next) => {
  if (!req.user || req.driver) {
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
