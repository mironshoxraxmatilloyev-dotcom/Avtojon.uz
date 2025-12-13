const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { protect, businessOnly } = require('../middleware/auth');

// Shofyorlar joylashuvi (xarita uchun) - /:id dan OLDIN bo'lishi kerak!
router.get('/locations', protect, businessOnly, async (req, res) => {
  try {
    // Cache ni o'chirish
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const drivers = await Driver.find({ user: req.user._id, isActive: true })
      .select('fullName phone status lastLocation')
      .lean(); // Tezroq ishlash uchun
    
    // Debug: Joylashuvlarni ko'rsatish
    console.log('📍 Shofyorlar joylashuvi so\'raldi:');
    console.log('   Biznesmen ID:', req.user._id);
    console.log('   Topilgan shofyorlar:', drivers.length);
    drivers.forEach(d => {
      if (d.lastLocation?.lat) {
        const updatedAt = d.lastLocation.updatedAt ? new Date(d.lastLocation.updatedAt).toLocaleTimeString() : '?';
        console.log(`   ✅ ${d.fullName}: ${d.lastLocation.lat.toFixed(4)}, ${d.lastLocation.lng.toFixed(4)} (±${d.lastLocation.accuracy || '?'}m) @ ${updatedAt}`);
      } else {
        console.log(`   ❌ ${d.fullName}: Joylashuv yo'q`);
      }
    });
    
    res.json({ success: true, data: drivers, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Barcha shofyorlar (biznesmen uchun) - faqat aktiv shofyorlar
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    // lastLocation ham qaytarish (reys qo'shishda kerak)
    const drivers = await Driver.find({ user: req.user._id, isActive: true })
      .select('-password')
      .lean();
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta shofyor
router.get('/:id', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true }).select('-password');
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

    // Faqat aktiv shofyorlar orasida username tekshirish
    const existingDriver = await Driver.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    });
    if (existingDriver) {
      return res.status(400).json({ success: false, message: 'Bu username band' });
    }

    // Agar o'chirilgan shofyor bo'lsa, uni qayta aktivlashtirish o'rniga yangi yaratamiz
    // Eski o'chirilgan shofyorning username ni o'zgartiramiz
    const deletedDriver = await Driver.findOne({
      username: username.toLowerCase(),
      isActive: false
    });
    if (deletedDriver) {
      // Eski username ni o'zgartirish (deleted_timestamp_username)
      await Driver.updateOne(
        { _id: deletedDriver._id },
        { username: `deleted_${Date.now()}_${username.toLowerCase()}` }
      );
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

// Shofyorni o'chirish (soft delete - isActive: false)
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }
    res.json({ success: true, message: 'Shofyor o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
