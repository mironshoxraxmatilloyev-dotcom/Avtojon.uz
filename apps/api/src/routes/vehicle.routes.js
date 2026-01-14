const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Businessman = require('../models/Businessman');
const { protect, businessOnly } = require('../middleware/auth');

// ========== SUBSCRIPTION ENDPOINTS ==========

// Obuna holatini olish
router.get('/subscription', protect, businessOnly, async (req, res) => {
  try {
    // Businessman yoki User ID olish
    const userId = req.businessman?._id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    // Avval Businessman dan qidirish
    let user = await Businessman.findById(userId);
    
    // Agar Businessman topilmasa, User modelidan qidirish
    if (!user) {
      const User = require('../models/User');
      user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
      }
      
      // User uchun subscription tekshirish
      const now = new Date();
      const subscription = user.subscription || {};
      const endDate = subscription.endDate ? new Date(subscription.endDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const isExpired = now > endDate;
      
      return res.json({
        success: true,
        data: {
          plan: subscription.plan || 'trial',
          startDate: subscription.startDate || now,
          endDate: endDate,
          isExpired,
          canUse: !isExpired
        }
      });
    }

    // Businessman uchun - eski fleetSubscription yoki yangi subscription
    const subscription = user.subscription || user.fleetSubscription;
    
    // Agar subscription yo'q bo'lsa, default trial yaratish
    if (!subscription) {
      user.subscription = {
        plan: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 kun trial
      };
      await user.save();
    }

    const now = new Date();
    const sub = user.subscription || user.fleetSubscription;
    const endDate = new Date(sub.endDate);
    const isExpired = now > endDate;

    res.json({
      success: true,
      data: {
        plan: sub.plan,
        startDate: sub.startDate,
        endDate: sub.endDate,
        isExpired,
        canUse: !isExpired
      }
    });
  } catch (error) {
    console.error('Subscription GET error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pro ga o'tish
router.post('/subscription/upgrade', protect, businessOnly, async (req, res) => {
  try {
    const userId = req.businessman?._id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    let user = await Businessman.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    // Pro ga o'tkazish - 30 kun
    user.fleetSubscription = {
      plan: 'pro',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    await user.save();

    res.json({
      success: true,
      data: {
        plan: user.fleetSubscription.plan,
        startDate: user.fleetSubscription.startDate,
        endDate: user.fleetSubscription.endDate,
        isExpired: false,
        canUse: true
      }
    });
  } catch (error) {
    console.error('Subscription upgrade error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== VEHICLE ENDPOINTS ==========

// Barcha mashinalar (faqat aktiv)
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id, isActive: true }).populate('currentDriver', 'fullName username');
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta mashina
router.get('/:id', protect, businessOnly, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, user: req.user._id, isActive: true })
      .populate('currentDriver', 'fullName username');
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi mashina qo'shish
router.post('/', protect, businessOnly, async (req, res) => {
  try {
    const { 
      plateNumber, brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, 
      cargoCapacity, currentDriver, currentOdometer,
      // Moy almashtirish sozlamalari
      oilChangeIntervalKm, lastOilChangeOdometer
    } = req.body;

    // Faqat aktiv mashinalar orasida tekshirish
    const existingVehicle = await Vehicle.findOne({ 
      plateNumber: plateNumber.toUpperCase(),
      user: req.user._id,
      isActive: true 
    });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Bu raqamli mashina mavjud' });
    }

    const vehicle = await Vehicle.create({
      user: req.user._id,
      plateNumber,
      brand,
      model,
      year,
      fuelType,
      fuelTankCapacity,
      fuelConsumptionRate,
      cargoCapacity,
      currentOdometer: currentOdometer || 0,
      currentDriver: currentDriver || null,
      // Moy almashtirish sozlamalari
      oilChangeIntervalKm: oilChangeIntervalKm || 15000,
      lastOilChangeOdometer: lastOilChangeOdometer || 0
    });

    const populatedVehicle = await Vehicle.findById(vehicle._id).populate('currentDriver', 'fullName username');

    res.status(201).json({ success: true, data: populatedVehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mashinani tahrirlash
router.put('/:id', protect, businessOnly, async (req, res) => {
  try {
    const { 
      plateNumber, brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, 
      cargoCapacity, currentOdometer, vin, isActive,
      // Moy almashtirish sozlamalari
      oilChangeIntervalKm, lastOilChangeOdometer, lastOilChangeDate
    } = req.body;

    // Agar plateNumber o'zgartirilsa, boshqa mashinada yo'qligini tekshirish
    if (plateNumber) {
      const existing = await Vehicle.findOne({ 
        plateNumber: plateNumber.toUpperCase(), 
        user: req.user._id, 
        isActive: true,
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bu raqamli mashina mavjud' });
      }
    }

    // Yangilanadigan maydonlar
    const updateData = {};
    if (plateNumber !== undefined) updateData.plateNumber = plateNumber;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;
    if (fuelType !== undefined) updateData.fuelType = fuelType;
    if (fuelTankCapacity !== undefined) updateData.fuelTankCapacity = fuelTankCapacity;
    if (fuelConsumptionRate !== undefined) updateData.fuelConsumptionRate = fuelConsumptionRate;
    if (cargoCapacity !== undefined) updateData.cargoCapacity = cargoCapacity;
    if (currentOdometer !== undefined) updateData.currentOdometer = currentOdometer;
    if (vin !== undefined) updateData.vin = vin;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Moy almashtirish sozlamalari
    if (oilChangeIntervalKm !== undefined) updateData.oilChangeIntervalKm = Number(oilChangeIntervalKm);
    if (lastOilChangeOdometer !== undefined) updateData.lastOilChangeOdometer = Number(lastOilChangeOdometer);
    if (lastOilChangeDate !== undefined) updateData.lastOilChangeDate = lastOilChangeDate;

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyorga biriktirish
router.put('/:id/assign', protect, businessOnly, async (req, res) => {
  try {
    const { driverId } = req.body;

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { currentDriver: driverId || null },
      { new: true }
    ).populate('currentDriver', 'fullName username');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mashinani o'chirish (soft delete)
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isActive: true },
      { isActive: false, currentDriver: null },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }
    res.json({ success: true, message: 'Mashina o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
