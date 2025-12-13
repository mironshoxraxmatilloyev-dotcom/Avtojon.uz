const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');
const { protect, businessOnly } = require('../middleware/auth');

// Barcha maoshlar
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    const { driverId, status } = req.query;
    const filter = { user: req.user._id };
    
    if (driverId) filter.driver = driverId;
    if (status) filter.status = status;

    const salaries = await Salary.find(filter)
      .populate('driver', 'fullName username')
      .sort({ periodStart: -1 });

    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Maosh hisoblash
router.post('/calculate', protect, businessOnly, async (req, res) => {
  try {
    const { driverId, periodStart, periodEnd } = req.body;

    const driver = await Driver.findOne({ _id: driverId, user: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    const startDate = new Date(periodStart);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(periodEnd);
    endDate.setHours(23, 59, 59, 999);

    console.log('Calculating salary for driver:', driverId);
    console.log('Period:', startDate, 'to', endDate);

    // Tugatilgan reyslarni olish - user va driver bo'yicha filter
    const trips = await Trip.find({
      user: req.user._id,
      driver: driverId,
      status: 'completed'
    });
    
    console.log('All completed trips for driver:', trips.length);
    console.log('Trips details:', trips.map(t => ({
      id: t._id,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
      tripPayment: t.tripPayment
    })));
    
    // Sana bo'yicha filter - completedAt yoki createdAt ishlatish
    const filteredTrips = trips.filter(t => {
      const completedDate = t.completedAt || t.createdAt;
      if (!completedDate) return false;
      const completed = new Date(completedDate);
      const inRange = completed >= startDate && completed <= endDate;
      console.log(`Trip ${t._id}: completedAt=${t.completedAt}, createdAt=${t.createdAt}, inRange=${inRange}`);
      return inRange;
    });
    
    console.log('Filtered trips in period:', filteredTrips.length);

    // Xarajatlarni olish
    const expenses = await Expense.find({
      driver: driverId,
      user: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const tripsCount = filteredTrips.length;
    const tripsPayment = filteredTrips.reduce((sum, t) => sum + (t.tripPayment || 0), 0);
    const totalBonus = filteredTrips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0);
    const totalPenalty = filteredTrips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0);
    
    console.log('Calculated:', { tripsCount, tripsPayment, totalBonus, totalPenalty });
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const netSalary = driver.baseSalary + tripsPayment + totalBonus - totalPenalty;

    // Mavjud maoshni yangilash yoki yangi yaratish
    let salary = await Salary.findOne({
      driver: driverId,
      user: req.user._id,
      periodStart: startDate,
      periodEnd: endDate
    });

    if (salary) {
      salary.baseSalary = driver.baseSalary;
      salary.tripsCount = tripsCount;
      salary.tripsPayment = tripsPayment;
      salary.totalBonus = totalBonus;
      salary.totalPenalty = totalPenalty;
      salary.totalExpenses = totalExpenses;
      salary.netSalary = netSalary;
      salary.status = 'calculated';
      salary.calculatedAt = new Date();
      await salary.save();
    } else {
      salary = await Salary.create({
        user: req.user._id,
        driver: driverId,
        periodStart: startDate,
        periodEnd: endDate,
        baseSalary: driver.baseSalary,
        tripsCount,
        tripsPayment,
        totalBonus,
        totalPenalty,
        totalExpenses,
        netSalary,
        status: 'calculated',
        calculatedAt: new Date()
      });
    }

    const populated = await Salary.findById(salary._id).populate('driver', 'fullName username');

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Maoshni tasdiqlash
router.put('/:id/approve', protect, businessOnly, async (req, res) => {
  try {
    const salary = await Salary.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'approved', approvedAt: new Date() },
      { new: true }
    ).populate('driver', 'fullName username');

    if (!salary) {
      return res.status(404).json({ success: false, message: 'Maosh topilmadi' });
    }

    res.json({ success: true, data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// To'langan deb belgilash
router.put('/:id/pay', protect, businessOnly, async (req, res) => {
  try {
    const salary = await Salary.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'paid', paidAt: new Date() },
      { new: true }
    ).populate('driver', 'fullName username');

    if (!salary) {
      return res.status(404).json({ success: false, message: 'Maosh topilmadi' });
    }

    res.json({ success: true, data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Maoshni o'chirish
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const salary = await Salary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Maosh topilmadi' });
    }
    res.json({ success: true, message: 'Maosh o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
