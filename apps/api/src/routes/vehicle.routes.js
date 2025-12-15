const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect, businessOnly } = require('../middleware/auth');

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
    const { brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, cargoCapacity, isActive } = req.body;

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { brand, model, year, fuelType, fuelTankCapacity, fuelConsumptionRate, cargoCapacity, isActive },
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
