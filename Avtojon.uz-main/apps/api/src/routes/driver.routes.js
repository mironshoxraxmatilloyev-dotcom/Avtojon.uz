const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { protect, businessOnly } = require('../middleware/auth');

// Shofyorlar joylashuvi (xarita uchun) - /:id dan OLDIN bo'lishi kerak!
router.get('/locations', protect, businessOnly, async (req, res) => {
  try {
    const drivers = await Driver.find({ user: req.user._id, isActive: true })
      .select('fullName phone status lastLocation');
    
    // Debug: Joylashuvlarni ko'rsatish
    console.log('📍 Shofyorlar joylashuvi so\'raldi:');
    console.log('   Biznesmen ID:', req.user._id);
    console.log('   Topilgan shofyorlar:', drivers.length);
    drivers.forEach(d => {
      if (d.lastLocation?.lat) {
        console.log(`   ✅ ${d.fullName}: ${d.lastLocation.lat.toFixed(4)}, ${d.lastLocation.lng.toFixed(4)} (±${d.lastLocation.accuracy || '?'}m)`);
      } else {
        console.log(`   ❌ ${d.fullName}: Joylashuv yo'q`);
      }
    });
    
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Barcha shofyorlar (biznesmen uchun)
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    const drivers = await Driver.find({ user: req.user._id }).select('-password');
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta shofyor
router.get('/:id', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id }).select('-password');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi shofyor qo'shish
router.post('/', protect, businessOnly, async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingDriver = await Driver.findOne({ username: username.toLowerCase() });
    if (existingDriver) {
      return res.status(400).json({ success: false, message: 'Bu username band' });
    }

    const driver = await Driver.create({
      ...req.body,
      user: req.user._id,
      username: username.toLowerCase()
    });

    res.status(201).json({
      success: true,
      data: { ...driver.toObject(), password: undefined }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyorni tahrirlash
router.put('/:id', protect, businessOnly, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.username; // username o'zgartirib bo'lmaydi
    delete updateData.password; // parol alohida o'zgartiriladi

    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    ).select('-password');

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyorni o'chirish
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }
    res.json({ success: true, message: 'Shofyor o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
