const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Flight = require('../models/Flight');
const { protect, businessOnly } = require('../middleware/auth');

// ObjectId validatsiya funksiyasi
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  if (id.startsWith('temp_')) return false; // Vaqtinchalik ID
  return mongoose.Types.ObjectId.isValid(id);
};

// Shofyorlar joylashuvi (xarita uchun) - /:id dan OLDIN bo'lishi kerak!
router.get('/locations', protect, businessOnly, async (req, res) => {
  try {
    // Cache ni o'chirish
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const drivers = await Driver.find({ user: req.user._id, isActive: true })
      .select('fullName phone status lastLocation')
      .lean();

    res.json({ success: true, data: drivers, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Barcha shofyorlar (biznesmen uchun) - faqat aktiv shofyorlar
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    // lastLocation ham qaytarish (mashrut qo'shishda kerak)
    const drivers = await Driver.find({ user: req.user._id, isActive: true })
      .select('-password')
      .lean();
    res.json({ success: true, data: drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta shofyor (mashina bilan birga)
router.get('/:id', protect, businessOnly, async (req, res) => {
  try {
    // Vaqtinchalik ID tekshirish
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri shofyor ID' });
    }

    // 🚀 Parallel so'rovlar - tezroq
    const [driver, vehicle] = await Promise.all([
      Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true })
        .select('-password')
        .lean(),
      Vehicle.findOne({ currentDriver: req.params.id, user: req.user._id, isActive: true })
        .select('_id plateNumber brand model year fuelType currentOdometer oilChangeIntervalKm lastOilChangeOdometer lastOilChangeDate')
        .lean()
    ]);

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    // currentBalance default qiymat (eski driverlar uchun)
    if (driver.currentBalance === undefined) {
      driver.currentBalance = 0;
    }

    // Mashina ma'lumotini driver ga qo'shish
    res.json({ success: true, data: { ...driver, vehicle } });
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

// Shofyor parolini yangilash
router.put('/:id/password', protect, businessOnly, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    driver.password = password;
    await driver.save();

    res.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (error) {
    console.error('Password update error:', error);
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

    // Shofyorga biriktirilgan mashinani ham o'chirish (soft delete)
    await Vehicle.updateMany(
      { currentDriver: req.params.id, user: req.user._id },
      { isActive: false, currentDriver: null }
    );

    // Shofyorning faol mashrutlarini bekor qilish
    await Flight.updateMany(
      { driver: req.params.id, status: 'active' },
      { status: 'cancelled' }
    );

    res.json({ success: true, message: 'Shofyor va unga tegishli ma\'lumotlar o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor oyligini to'lash
router.post('/:id/pay-salary', protect, businessOnly, async (req, res) => {
  try {
    const { amount, note } = req.body;

    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    const payAmount = amount || driver.pendingEarnings || 0;
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'To\'lanadigan summa yo\'q' });
    }

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // To'lov tarixiga qo'shish
    driver.salaryPayments = driver.salaryPayments || [];
    driver.salaryPayments.push({
      amount: payAmount,
      paidAt: now,
      period,
      note: note || `Oylik to'lov - ${period}`
    });

    // Kutilayotgan daromadni nolga tushirish
    driver.pendingEarnings = Math.max(0, (driver.pendingEarnings || 0) - payAmount);
    driver.currentMonthEarnings = 0;

    await driver.save();

    res.json({
      success: true,
      message: `${payAmount.toLocaleString()} so'm to'landi`,
      data: driver
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor to'lov tarixi
router.get('/:id/salary-history', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true })
      .select('fullName salaryPayments pendingEarnings totalEarnings currentMonthEarnings')
      .lean();

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Barcha shofyorlar oyliklari (hisobotlar uchun)
router.get('/salaries/pending', protect, businessOnly, async (req, res) => {
  try {
    const drivers = await Driver.find({
      user: req.user._id,
      isActive: true,
      pendingEarnings: { $gt: 0 }
    })
      .select('fullName phone pendingEarnings currentMonthEarnings totalEarnings salaryPayments')
      .lean();

    const totalPending = drivers.reduce((sum, d) => sum + (d.pendingEarnings || 0), 0);

    res.json({
      success: true,
      data: drivers,
      stats: {
        totalPending,
        driversCount: drivers.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyorga xarajat qo'shish
router.post('/:id/add-expense', protect, businessOnly, async (req, res) => {
  try {
    const { amount, type, timing, description, flightId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Xarajat miqdori noto\'g\'ri' });
    }

    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    // Xarajat qo'shish
    const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];
    const actualExpenseClass = HEAVY_EXPENSE_TYPES.includes(type) ? 'heavy' : 'light';

    driver.expenses = driver.expenses || [];
    driver.expenses.push({
      flightId: flightId || null,
      amount,
      type: type || 'other',
      expenseClass: actualExpenseClass,
      timing: timing || 'during',
      description,
      date: new Date()
    });

    // Vaqti bo'yicha jami xarajatlarni hisoblash
    driver.totalExpensesBefore = driver.expenses
      .filter(e => e.timing === 'before')
      .reduce((sum, e) => sum + e.amount, 0);

    driver.totalExpensesDuring = driver.expenses
      .filter(e => e.timing === 'during')
      .reduce((sum, e) => sum + e.amount, 0);

    driver.totalExpensesAfter = driver.expenses
      .filter(e => e.timing === 'after')
      .reduce((sum, e) => sum + e.amount, 0);

    await driver.save();

    res.json({
      success: true,
      message: 'Xarajat muvaffaqiyatli qo\'shildi',
      data: driver
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor xarajatlarini olish
router.get('/:id/expenses', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true })
      .select('fullName expenses totalExpensesBefore totalExpensesDuring totalExpensesAfter')
      .lean();

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni tahrirlash
router.put('/:id/expenses/:expenseId', protect, businessOnly, async (req, res) => {
  try {
    const { amount, type, timing, description, date } = req.body;
    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    const expenseIndex = driver.expenses.findIndex(e => e._id.toString() === req.params.expenseId);
    if (expenseIndex === -1) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    // Update expense
    driver.expenses[expenseIndex] = {
      ...driver.expenses[expenseIndex].toObject(),
      amount: amount || driver.expenses[expenseIndex].amount,
      type: type || driver.expenses[expenseIndex].type,
      timing: timing || driver.expenses[expenseIndex].timing,
      description: description !== undefined ? description : driver.expenses[expenseIndex].description,
      date: date || driver.expenses[expenseIndex].date
    };

    // Recalculate totals
    driver.totalExpensesBefore = driver.expenses
      .filter(e => e.timing === 'before')
      .reduce((sum, e) => sum + e.amount, 0);

    driver.totalExpensesDuring = driver.expenses
      .filter(e => e.timing === 'during')
      .reduce((sum, e) => sum + e.amount, 0);

    driver.totalExpensesAfter = driver.expenses
      .filter(e => e.timing === 'after')
      .reduce((sum, e) => sum + e.amount, 0);

    await driver.save();

    res.json({ success: true, message: 'Xarajat yangilandi', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni o'chirish
router.delete('/:id/expenses/:expenseId', protect, businessOnly, async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, user: req.user._id, isActive: true });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    // Remove expense
    driver.expenses = driver.expenses.filter(e => e._id.toString() !== req.params.expenseId);

    // Recalculate totals
    driver.totalExpensesBefore = driver.expenses
      .filter(e => e.timing === 'before')
      .reduce((sum, e) => sum + e.amount, 0);

    driver.totalExpensesDuring = driver.expenses
      .filter(e => e.timing === 'during')
      .reduce((sum, e) => sum + e.amount, 0);

    driver.totalExpensesAfter = driver.expenses
      .filter(e => e.timing === 'after')
      .reduce((sum, e) => sum + e.amount, 0);

    await driver.save();

    res.json({ success: true, message: 'Xarajat o\'chirildi', data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
