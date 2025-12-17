const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Flight = require('../models/Flight');
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

    // ============ ESKI TRIP TIZIMI ============
    const trips = await Trip.find({
      user: req.user._id,
      driver: driverId,
      status: 'completed'
    });
    
    const filteredTrips = trips.filter(t => {
      const completedDate = t.completedAt || t.createdAt;
      if (!completedDate) return false;
      const completed = new Date(completedDate);
      return completed >= startDate && completed <= endDate;
    });

    const oldTripsCount = filteredTrips.length;
    const oldTripsPayment = filteredTrips.reduce((sum, t) => sum + (t.tripPayment || 0), 0);
    const oldBonus = filteredTrips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0);
    const oldPenalty = filteredTrips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0);

    // ============ YANGI FLIGHT TIZIMI ============
    const flights = await Flight.find({
      user: req.user._id,
      driver: driverId,
      status: 'completed'
    });
    
    const filteredFlights = flights.filter(f => {
      const completedDate = f.completedAt || f.createdAt;
      if (!completedDate) return false;
      const completed = new Date(completedDate);
      return completed >= startDate && completed <= endDate;
    });

    const flightsCount = filteredFlights.length;
    // Flight dan to'lov - mijozdan olingan to'lov (totalPayment)
    const flightsPayment = filteredFlights.reduce((sum, f) => sum + (f.totalPayment || 0), 0);
    // Flight dan shofyor ulushi (foydadan ajratilgan %)
    const flightDriverProfit = filteredFlights.reduce((sum, f) => sum + (f.driverProfitAmount || 0), 0);
    // Flight dan zarar (profit < 0 bo'lsa jarima sifatida)
    const flightPenalty = filteredFlights.reduce((sum, f) => sum + (f.profit < 0 ? Math.abs(f.profit) : 0), 0);

    // ============ XARAJATLAR ============
    const expenses = await Expense.find({
      driver: driverId,
      user: req.user._id,
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // ============ JAMI HISOBLASH ============
    const tripsCount = oldTripsCount + flightsCount;
    
    // Shofyorga beriladigan reys haqi:
    // - Eski trip tizimida: tripPayment (agar per_trip to'lov turi bo'lsa)
    // - Yangi flight tizimida: driverProfitAmount (foydadan ulush)
    const tripsPayment = (driver.paymentType === 'per_trip' ? oldTripsPayment : 0) + flightDriverProfit;
    
    // Bonus = faqat qo'shimcha mukofotlar
    const totalBonus = oldBonus;
    const totalPenalty = oldPenalty + flightPenalty;

    // Sof maosh = Bazaviy oylik + Reys haqi (foydadan ulush) + Bonus - Jarima
    const netSalary = (driver.baseSalary || 0) + tripsPayment + totalBonus - totalPenalty;

    // Mavjud maoshni yangilash yoki yangi yaratish
    let salary = await Salary.findOne({
      driver: driverId,
      user: req.user._id,
      periodStart: startDate,
      periodEnd: endDate
    });

    if (salary) {
      salary.baseSalary = driver.baseSalary || 0;
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
        baseSalary: driver.baseSalary || 0,
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
    console.error('Salary calculate error:', error);
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
