const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

// Admin register
router.post('/register', async (req, res) => {
  try {
    const { username, password, fullName, companyName, phone } = req.body;

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu username allaqachon band' });
    }

    const user = await User.create({ 
      username: username.toLowerCase(), 
      password, 
      fullName, 
      companyName,
      phone,
      role: 'admin' 
    });
    
    const token = generateToken(user._id, 'admin');

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
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Umumiy login (admin va shofyor uchun)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = username.toLowerCase().trim();

    // Avval admin tekshir
    const user = await User.findOne({ username: cleanUsername });
    if (user && await user.comparePassword(password)) {
      const token = generateToken(user._id, 'admin');
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
          token
        }
      });
    }

    // Keyin shofyor tekshir
    const driver = await Driver.findOne({ username: cleanUsername });
    if (driver && await driver.comparePassword(password)) {
      const token = generateToken(driver._id, 'driver');
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
          token
        }
      });
    }

    return res.status(401).json({ success: false, message: 'Username yoki parol noto\'g\'ri' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    data: req.driver || req.user
  });
});

module.exports = router;
