const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, businessOnly } = require('../middleware/auth');

// Barcha xarajatlar
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    const { driverId, vehicleId, expenseType, isVerified } = req.query;
    const filter = { user: req.user._id };
    
    if (driverId) filter.driver = driverId;
    if (vehicleId) filter.vehicle = vehicleId;
    if (expenseType) filter.expenseType = expenseType;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const expenses = await Expense.find(filter)
      .populate('driver', 'fullName')
      .populate('vehicle', 'plateNumber')
      .populate('trip', 'startAddress endAddress')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat qo'shish
router.post('/', protect, businessOnly, async (req, res) => {
  try {
    const { driverId, vehicleId, tripId, expenseType, amount, description, fuelLiters, fuelPricePerLiter, odometerReading } = req.body;

    const expense = await Expense.create({
      user: req.user._id,
      driver: driverId,
      vehicle: vehicleId,
      trip: tripId,
      expenseType,
      amount,
      description,
      fuelLiters,
      fuelPricePerLiter,
      odometerReading
    });

    const populated = await Expense.findById(expense._id)
      .populate('driver', 'fullName')
      .populate('vehicle', 'plateNumber');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni tasdiqlash
router.put('/:id/verify', protect, businessOnly, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isVerified: true, verifiedAt: new Date() },
      { new: true }
    ).populate('driver', 'fullName').populate('vehicle', 'plateNumber');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni o'chirish
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }
    res.json({ success: true, message: 'Xarajat o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Statistika
router.get('/stats', protect, businessOnly, async (req, res) => {
  try {
    const stats = await Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: {
        _id: '$expenseType',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);

    const totalAmount = stats.reduce((sum, s) => sum + s.total, 0);

    res.json({ success: true, data: { byType: stats, totalAmount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
