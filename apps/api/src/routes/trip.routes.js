const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');
const { protect, businessOnly, driverOnly } = require('../middleware/auth');
const { convertToUSD, getDefaultRate, getAllRates } = require('../utils/currency');

// Valyuta kurslarini olish
router.get('/currency-rates', protect, async (req, res) => {
  try {
    res.json({ success: true, data: getAllRates() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Barcha reyslar (biznesmen uchun)
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    const { status, driverId, vehicleId } = req.query;
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;
    if (driverId) filter.driver = driverId;
    if (vehicleId) filter.vehicle = vehicleId;

    const trips = await Trip.find(filter)
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Faol reyslar
router.get('/active', protect, businessOnly, async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user._id, status: 'in_progress' })
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model');

    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta reys
router.get('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driver', 'fullName username phone')
      .populate('vehicle', 'plateNumber brand model');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Reys xarajatlarini olish (eski tizim uchun)
    const expenses = await Expense.find({ trip: trip._id }).sort({ createdAt: -1 });
    
    const expensesByType = {};
    expenses.forEach(exp => {
      if (!expensesByType[exp.expenseType]) {
        expensesByType[exp.expenseType] = { total: 0, count: 0, items: [] };
      }
      expensesByType[exp.expenseType].total += exp.amount;
      expensesByType[exp.expenseType].count += 1;
      expensesByType[exp.expenseType].items.push(exp);
    });

    res.json({ 
      success: true, 
      data: {
        ...trip.toObject(),
        expenses,
        expensesByType
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi reys yaratish
router.post('/', protect, businessOnly, async (req, res) => {
  try {
    const { 
      driverId, vehicleId, startAddress, endAddress, 
      estimatedDuration, estimatedDistance,
      // Yangi maydonlar
      odometerStart, income, incomeCurrency, incomeExchangeRate,
      driverSalary, driverSalaryCurrency, driverSalaryExchangeRate,
      // Reys xarajatlari uchun berilgan pul
      tripBudget,
      // Reys haqi (shofyorga to'lanadigan)
      tripPayment,
      // Koordinatalar
      startCoords, endCoords
    } = req.body;

    const driver = await Driver.findOne({ _id: driverId, user: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const tripData = {
      user: req.user._id,
      driver: driverId,
      vehicle: vehicleId,
      startAddress,
      endAddress,
      estimatedDuration,
      estimatedDistance,
      tripBudget: tripBudget || 0,
      tripPayment: tripPayment || 0,
      status: 'pending',
      startCoords,
      endCoords
    };

    // Odometr
    if (odometerStart) {
      tripData.odometer = { start: odometerStart, end: 0, traveled: 0 };
    }

    // Daromad
    if (income) {
      const curr = incomeCurrency || 'USD';
      const rate = incomeExchangeRate || getDefaultRate(curr);
      tripData.income = {
        amount: income,
        currency: curr,
        exchangeRate: rate,
        amountInUSD: convertToUSD(income, curr, rate)
      };
    }

    // Shofyor oyligi
    if (driverSalary) {
      const curr = driverSalaryCurrency || 'USD';
      const rate = driverSalaryExchangeRate || getDefaultRate(curr);
      tripData.driverSalary = {
        amount: driverSalary,
        currency: curr,
        exchangeRate: rate,
        amountInUSD: convertToUSD(driverSalary, curr, rate)
      };
    }

    const trip = await Trip.create(tripData);

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model');

    // 🔔 Socket.io orqali shofyorga xabar yuborish
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${driverId}`).emit('new-trip', {
        trip: populatedTrip,
        message: 'Sizga yangi reys tayinlandi!'
      });
      console.log(`📢 Yangi reys xabari yuborildi: driver-${driverId}`);
    }

    res.status(201).json({ success: true, data: populatedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni yangilash (umumiy)
router.put('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const updates = req.body;

    // Odometr yangilash
    if (updates.odometerStart !== undefined) {
      trip.odometer.start = updates.odometerStart;
    }
    if (updates.odometerEnd !== undefined) {
      trip.odometer.end = updates.odometerEnd;
    }
    // Yurgan km to'g'ridan-to'g'ri kiritish
    if (updates.traveledKm !== undefined) {
      trip.odometer.traveled = updates.traveledKm;
    }

    // Reys xarajatlari uchun berilgan pul
    if (updates.tripBudget !== undefined) {
      trip.tripBudget = updates.tripBudget;
    }

    // Daromad yangilash
    if (updates.income !== undefined) {
      const curr = updates.incomeCurrency || trip.income?.currency || 'USD';
      const rate = updates.incomeExchangeRate || getDefaultRate(curr);
      trip.income = {
        amount: updates.income,
        currency: curr,
        exchangeRate: rate,
        amountInUSD: convertToUSD(updates.income, curr, rate)
      };
    }

    // Shofyor oyligi yangilash
    if (updates.driverSalary !== undefined) {
      const curr = updates.driverSalaryCurrency || trip.driverSalary?.currency || 'USD';
      const rate = updates.driverSalaryExchangeRate || getDefaultRate(curr);
      trip.driverSalary = {
        amount: updates.driverSalary,
        currency: curr,
        exchangeRate: rate,
        amountInUSD: convertToUSD(updates.driverSalary, curr, rate)
      };
    }

    // Qoldiq yoqilg'i (astatka)
    if (updates.fuelRemaining !== undefined) {
      trip.fuelSummary.remaining = updates.fuelRemaining;
    }

    // Pitanya (ovqat)
    if (updates.food !== undefined) {
      const curr = updates.foodCurrency || 'USD';
      const rate = updates.foodExchangeRate || getDefaultRate(curr);
      trip.food = {
        amount: updates.food,
        currency: curr,
        exchangeRate: rate,
        amountInUSD: convertToUSD(updates.food, curr, rate)
      };
    }

    // Boshqa oddiy maydonlar
    if (updates.startAddress) trip.startAddress = updates.startAddress;
    if (updates.endAddress) trip.endAddress = updates.endAddress;
    if (updates.estimatedDuration) trip.estimatedDuration = updates.estimatedDuration;
    if (updates.estimatedDistance) trip.estimatedDistance = updates.estimatedDistance;
    if (updates.notes) trip.notes = updates.notes;

    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'fullName username phone')
      .populate('vehicle', 'plateNumber brand model');

    res.json({ success: true, data: populatedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ YOQILG'I ENDPOINTLARI ============

// Yoqilg'i qo'shish
router.post('/:id/fuel', protect, async (req, res) => {
  try {
    const { country, liters, pricePerLiter, currency, exchangeRate, note } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const curr = currency || 'USD';
    const rate = exchangeRate || getDefaultRate(curr);
    const totalInOriginal = liters * pricePerLiter;
    const totalInUSD = convertToUSD(totalInOriginal, curr, rate);

    trip.fuelEntries.push({
      country: country.toUpperCase(),
      liters,
      pricePerLiter,
      currency: curr,
      totalInOriginal,
      totalInUSD,
      exchangeRate: rate,
      note,
      date: new Date()
    });

    await trip.save();

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yoqilg'i o'chirish
router.delete('/:id/fuel/:fuelId', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    trip.fuelEntries = trip.fuelEntries.filter(f => f._id.toString() !== req.params.fuelId);
    await trip.save();

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ YO'L XARAJATLARI ENDPOINTLARI ============

// Yo'l xarajatlarini yangilash (UZB, QZ yoki RU)
router.put('/:id/road-expenses/:country', protect, async (req, res) => {
  try {
    const { border, gai, toll, parking, currency, exchangeRate } = req.body;
    const country = req.params.country.toLowerCase();

    if (!['uzb', 'qz', 'ru'].includes(country)) {
      return res.status(400).json({ success: false, message: 'Davlat faqat UZB, QZ yoki RU bo\'lishi mumkin' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const curr = currency || 'USD';
    const rate = exchangeRate || getDefaultRate(curr);
    const totalInOriginal = (border || 0) + (gai || 0) + (toll || 0) + (parking || 0);
    const totalInUSD = convertToUSD(totalInOriginal, curr, rate);

    if (!trip.roadExpenses) {
      trip.roadExpenses = { uzb: {}, qz: {}, ru: {}, totalUSD: 0 };
    }

    trip.roadExpenses[country] = {
      border: border || 0,
      gai: gai || 0,
      toll: toll || 0,
      parking: parking || 0,
      currency: curr,
      totalInOriginal,
      totalInUSD,
      exchangeRate: rate
    };

    await trip.save();

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ KUTILMAGAN XARAJATLAR ============

// Kutilmagan xarajat qo'shish
router.post('/:id/unexpected', protect, async (req, res) => {
  try {
    const { type, amount, currency, exchangeRate, description } = req.body;

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const curr = currency || 'USD';
    const rate = exchangeRate || getDefaultRate(curr);

    trip.unexpectedExpenses.push({
      type,
      amount,
      currency: curr,
      amountInUSD: convertToUSD(amount, curr, rate),
      exchangeRate: rate,
      description,
      date: new Date()
    });

    await trip.save();

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Kutilmagan xarajat o'chirish
router.delete('/:id/unexpected/:expenseId', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    trip.unexpectedExpenses = trip.unexpectedExpenses.filter(
      e => e._id.toString() !== req.params.expenseId
    );
    await trip.save();

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ REYS BOSHQARUVI ============

// Reysni boshlash
router.put('/:id/start', protect, async (req, res) => {
  try {
    const { odometerStart } = req.body;
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (trip.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Bu reys allaqachon boshlangan yoki tugatilgan' });
    }

    trip.status = 'in_progress';
    trip.startedAt = new Date();
    
    if (odometerStart) {
      trip.odometer.start = odometerStart;
    }

    await trip.save();
    await Driver.findByIdAndUpdate(trip.driver, { status: 'busy' });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'fullName username status')
      .populate('vehicle', 'plateNumber brand model');

    // 🔔 Socket.io orqali shofyorga xabar yuborish
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${trip.driver}`).emit('trip-started', {
        trip: populatedTrip,
        message: 'Reys boshlandi!'
      });
    }

    res.json({ success: true, data: populatedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni tugatish
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const { odometerEnd, fuelRemaining } = req.body;

    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (trip.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Bu reys faol emas' });
    }

    trip.status = 'completed';
    trip.completedAt = new Date();

    if (odometerEnd) {
      trip.odometer.end = odometerEnd;
    }

    if (fuelRemaining !== undefined) {
      trip.fuelSummary.remaining = fuelRemaining;
    }

    await trip.save();
    await Driver.findByIdAndUpdate(trip.driver, { status: 'free' });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'fullName username status')
      .populate('vehicle', 'plateNumber brand model');

    res.json({ success: true, data: populatedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni bekor qilish
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (trip.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Tugatilgan reysni bekor qilib bo\'lmaydi' });
    }

    const wasInProgress = trip.status === 'in_progress';
    const driverId = trip.driver;
    
    trip.status = 'cancelled';
    await trip.save();

    if (wasInProgress) {
      await Driver.findByIdAndUpdate(driverId, { status: 'free' });
    }

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model');

    // 🔔 Socket.io orqali shofyorga xabar yuborish
    const io = req.app.get('io');
    if (io && driverId) {
      io.to(`driver-${driverId}`).emit('trip-cancelled', {
        trip: populatedTrip,
        message: 'Reys bekor qilindi!'
      });
      console.log(`📢 Reys bekor qilindi xabari yuborildi: driver-${driverId}`);
    }

    res.json({ success: true, data: populatedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni o'chirish
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }
    res.json({ success: true, message: 'Reys o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
