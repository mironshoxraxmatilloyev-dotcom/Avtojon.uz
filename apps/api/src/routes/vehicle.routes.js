const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Businessman = require('../models/Businessman');
const { protect, businessOnly } = require('../middleware/auth');

// ========== SUBSCRIPTION ENDPOINTS ==========

// Obuna holatini olish
router.get('/subscription', protect, businessOnly, async (req, res) => {
  try {
    const user = await Businessman.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    // Agar subscription yo'q bo'lsa, default trial yaratish
    if (!user.fleetSubscription) {
      user.fleetSubscription = {
        plan: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      await user.save();
    }

    const now = new Date();
    const endDate = new Date(user.fleetSubscription.endDate);
    const isExpired = now > endDate;

    res.json({
      success: true,
      data: {
        plan: user.fleetSubscription.plan,
        startDate: user.fleetSubscription.startDate,
        endDate: user.fleetSubscription.endDate,
        isExpired,
        canUse: !isExpired
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pro ga o'tish
router.post('/subscription/upgrade', protect, businessOnly, async (req, res) => {
  try {
    const user = await Businessman.findById(req.user._id);
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
    const { plateNumber, brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, cargoCapacity, currentDriver } = req.body;

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
      currentDriver: currentDriver || null
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
    const { plateNumber, brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, cargoCapacity, currentOdometer, vin, isActive } = req.body;

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

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { plateNumber, brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, cargoCapacity, currentOdometer, vin, isActive },
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
