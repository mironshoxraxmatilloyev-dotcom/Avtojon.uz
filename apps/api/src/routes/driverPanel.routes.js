const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Flight = require('../models/Flight');
const Vehicle = require('../models/Vehicle');
const Expense = require('../models/Expense');
const Driver = require('../models/Driver');
const { protect, driverOnly } = require('../middleware/auth');

// Shofyor o'z ma'lumotlari
router.get('/me', protect, driverOnly, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).select('-password');
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GPS joylashuvni yuborish - Real-time Socket.io
router.post('/me/location', protect, driverOnly, async (req, res) => {
  try {
    const { lat, lng, accuracy, speed, heading, timestamp } = req.body;
    
    // Koordinatalarni tekshirish
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri koordinatalar' });
    }

    // Koordinatalar oqilona chegarada ekanligini tekshirish
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ success: false, message: 'Koordinatalar chegaradan tashqarida' });
    }

    const accuracyNum = accuracy ? parseFloat(accuracy) : null;
    const isAccurate = accuracyNum ? accuracyNum < 100 : true;
    
    const locationData = { 
      lat: latNum, 
      lng: lngNum, 
      accuracy: accuracyNum,
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseFloat(heading) : null,
      updatedAt: new Date(),
      deviceTimestamp: timestamp ? new Date(timestamp) : null
    };

    // Har doim saqlash - aniqlik qanday bo'lmasin
    const updated = await Driver.findByIdAndUpdate(
      req.driver._id, 
      { lastLocation: locationData },
      { new: true }
    );

    console.log(`📍 GPS yangilandi: ${req.driver.fullName} - ${latNum.toFixed(4)}, ${lngNum.toFixed(4)} (±${accuracyNum || '?'}m)`);

    // 🔌 Socket.io orqali biznesmenga real-time yuborish
    const io = req.app.get('io');
    if (io) {
      io.to(`business-${req.driver.user}`).emit('driver-location', {
        driverId: req.driver._id,
        driverName: req.driver.fullName,
        location: locationData
      });
    }

    res.json({ 
      success: true, 
      message: 'Joylashuv yangilandi',
      accuracy: accuracyNum ? `${accuracyNum.toFixed(1)}m` : null,
      isAccurate
    });
  } catch (error) {
    console.error('GPS xatolik:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyorga biriktirilgan mashinalar
router.get('/me/vehicles', protect, driverOnly, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ 
      user: req.driver.user,
      $or: [
        { currentDriver: req.driver._id },
        { currentDriver: null }
      ]
    });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor reyslari (pending va in_progress ham)
router.get('/me/trips', protect, driverOnly, async (req, res) => {
  try {
    console.log('Driver ID:', req.driver._id);
    const trips = await Trip.find({ driver: req.driver._id })
      .populate('vehicle', 'plateNumber brand model')
      .sort({ createdAt: -1 });
    console.log('Found trips:', trips.length);
    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pending reysni boshlash (admin yaratgan)
router.put('/me/trips/:id/start', protect, driverOnly, async (req, res) => {
  try {
    // Faol reys bormi tekshirish
    const activeTrip = await Trip.findOne({ driver: req.driver._id, status: 'in_progress' });
    if (activeTrip) {
      return res.status(400).json({ success: false, message: 'Sizda allaqachon faol reys bor' });
    }

    const trip = await Trip.findOne({ _id: req.params.id, driver: req.driver._id, status: 'pending' });
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi yoki allaqachon boshlangan' });
    }

    trip.status = 'in_progress';
    trip.startedAt = new Date();
    await trip.save();

    // Shofyorni "reysda" qilish
    await Driver.findByIdAndUpdate(req.driver._id, { status: 'busy' });

    const populated = await Trip.findById(trip._id)
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model');

    // 🔔 Socket.io orqali biznesmenga xabar yuborish
    const io = req.app.get('io');
    if (io) {
      const businessId = trip.user.toString();
      const roomName = `business-${businessId}`;
      
      // Debug: xonadagi clientlar sonini ko'rish
      const room = io.sockets.adapter.rooms.get(roomName);
      const clientsCount = room ? room.size : 0;
      console.log(`📊 Xona: ${roomName}, Clientlar soni: ${clientsCount}`);
      
      io.to(roomName).emit('trip-started', {
        trip: populated,
        message: `${req.driver.fullName} reysni boshladi!`
      });
      console.log(`📢 Reys boshlandi xabari yuborildi: ${roomName}`);
    } else {
      console.log('⚠️ Socket.io topilmadi!');
    }

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reys boshlash (shofyor o'zi yaratadi)
router.post('/me/trips/start', protect, driverOnly, async (req, res) => {
  try {
    const { vehicleId, startAddress, endAddress, estimatedDistance } = req.body;

    // Faol reys bormi tekshirish
    const activeTrip = await Trip.findOne({ driver: req.driver._id, status: 'in_progress' });
    if (activeTrip) {
      return res.status(400).json({ success: false, message: 'Sizda allaqachon faol reys bor' });
    }

    const driver = await Driver.findById(req.driver._id);

    const trip = await Trip.create({
      user: req.driver.user,
      driver: req.driver._id,
      vehicle: vehicleId,
      startAddress,
      endAddress,
      estimatedDistance,
      tripPayment: driver.perTripRate || 0,
      status: 'in_progress',
      startedAt: new Date()
    });

    const populated = await Trip.findById(trip._id)
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model');

    // 🔔 Socket.io orqali biznesmenga xabar yuborish
    const io = req.app.get('io');
    if (io) {
      const businessId = driver.user.toString();
      const roomName = `business-${businessId}`;
      
      // Debug: xonadagi clientlar sonini ko'rish
      const room = io.sockets.adapter.rooms.get(roomName);
      const clientsCount = room ? room.size : 0;
      console.log(`📊 Xona: ${roomName}, Clientlar soni: ${clientsCount}`);
      
      io.to(roomName).emit('trip-started', {
        trip: populated,
        message: `${driver.fullName} yangi reys boshladi!`
      });
      console.log(`📢 Yangi reys boshlandi xabari yuborildi: ${roomName}`);
    } else {
      console.log('⚠️ Socket.io topilmadi!');
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni tugatish
router.put('/me/trips/:id/complete', protect, driverOnly, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, driver: req.driver._id, status: 'in_progress' });
    
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Faol reys topilmadi' });
    }

    const completedAt = new Date();

    // Bonus/Jarima avtomatik hisoblash (remainingBudget asosida)
    let bonusAmount = 0;
    let penaltyAmount = 0;
    
    if (trip.tripBudget > 0) {
      const remaining = trip.remainingBudget || (trip.tripBudget - (trip.totalExpenses || 0));
      if (remaining > 0) {
        // Pul ortib qoldi - bonus
        bonusAmount = remaining;
      } else if (remaining < 0) {
        // Ortiqcha sarfladi - jarima
        penaltyAmount = Math.abs(remaining);
      }
    }

    trip.status = 'completed';
    trip.completedAt = completedAt;
    trip.bonusAmount = bonusAmount;
    trip.penaltyAmount = penaltyAmount;

    await trip.save();

    // Shofyorni "bo'sh" qilish
    await Driver.findByIdAndUpdate(req.driver._id, { status: 'free' });

    const populated = await Trip.findById(trip._id)
      .populate('driver', 'fullName username')
      .populate('vehicle', 'plateNumber brand model');

    // 🔔 Socket.io orqali biznesmenga xabar yuborish
    const io = req.app.get('io');
    if (io) {
      const businessId = trip.user.toString();
      const roomName = `business-${businessId}`;
      
      // Debug: xonadagi clientlar sonini ko'rish
      const room = io.sockets.adapter.rooms.get(roomName);
      const clientsCount = room ? room.size : 0;
      console.log(`📊 Xona: ${roomName}, Clientlar soni: ${clientsCount}`);
      
      io.to(roomName).emit('trip-completed', {
        trip: populated,
        message: `${req.driver.fullName} reysni tugatdi!`
      });
      console.log(`📢 Reys tugatildi xabari yuborildi: ${roomName}`);
    } else {
      console.log('⚠️ Socket.io topilmadi!');
    }

    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat qo'shish (yangi tizim - Trip modeliga)
router.post('/me/expenses', protect, driverOnly, async (req, res) => {
  try {
    const { 
      tripId, expenseType, amount, description, 
      fuelLiters, fuelPricePerLiter, receiptImage,
      // Yangi maydonlar
      country, currency, exchangeRate
    } = req.body;

    // Faol reysni olish
    let trip = null;
    if (tripId) {
      trip = await Trip.findOne({ _id: tripId, driver: req.driver._id });
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Faol reys topilmadi' });
    }

    const curr = currency || 'UZS';
    const rate = exchangeRate || 1;
    const amountNum = Number(amount);
    const amountInUSD = curr === 'USD' ? amountNum : amountNum / rate;
    
    console.log('📦 Xarajat qo\'shilmoqda:', {
      amount: amountNum,
      currency: curr,
      exchangeRate: rate,
      tripId,
      expenseType,
      tripBudget: trip.tripBudget,
      currentTotalExpenses: trip.totalExpenses
    });

    // Xarajat turiga qarab Trip modeliga qo'shish
    if (expenseType === 'fuel') {
      // Yoqilg'i - fuelEntries ga qo'shish
      const liters = Number(fuelLiters) || 0;
      const pricePerLiter = Number(fuelPricePerLiter) || (liters > 0 ? amountNum / liters : 0);
      
      trip.fuelEntries.push({
        country: country || 'UZB',
        liters: liters,
        pricePerLiter: pricePerLiter,
        currency: curr,
        totalInOriginal: amountNum,
        totalInUSD: amountInUSD,
        exchangeRate: rate,
        note: description,
        date: new Date()
      });
    } else if (expenseType === 'toll') {
      // Yo'l puli - roadExpenses ga qo'shish
      const ctry = (country || 'UZB').toLowerCase();
      if (!trip.roadExpenses) trip.roadExpenses = { uzb: {}, qz: {}, ru: {}, totalUSD: 0 };
      if (!trip.roadExpenses[ctry]) trip.roadExpenses[ctry] = {};
      trip.roadExpenses[ctry].toll = (trip.roadExpenses[ctry].toll || 0) + amountInUSD;
      trip.roadExpenses[ctry].totalInUSD = (trip.roadExpenses[ctry].totalInUSD || 0) + amountInUSD;
    } else if (expenseType === 'parking') {
      // Stoyanka - roadExpenses ga qo'shish
      const ctry = (country || 'UZB').toLowerCase();
      if (!trip.roadExpenses) trip.roadExpenses = { uzb: {}, qz: {}, ru: {}, totalUSD: 0 };
      if (!trip.roadExpenses[ctry]) trip.roadExpenses[ctry] = {};
      trip.roadExpenses[ctry].parking = (trip.roadExpenses[ctry].parking || 0) + amountInUSD;
      trip.roadExpenses[ctry].totalInUSD = (trip.roadExpenses[ctry].totalInUSD || 0) + amountInUSD;
    } else if (expenseType === 'food') {
      // Ovqat - food ga qo'shish
      trip.food = {
        amount: (trip.food?.amount || 0) + amountNum,
        currency: curr,
        amountInUSD: (trip.food?.amountInUSD || 0) + amountInUSD,
        exchangeRate: rate
      };
    } else if (expenseType === 'repair') {
      // Ta'mirlash - unexpectedExpenses ga qo'shish
      trip.unexpectedExpenses.push({
        type: 'repair',
        amount: amountNum,
        currency: curr,
        amountInUSD: amountInUSD,
        exchangeRate: rate,
        description: description,
        date: new Date()
      });
    } else {
      // Boshqa - unexpectedExpenses ga qo'shish
      trip.unexpectedExpenses.push({
        type: 'other',
        amount: amountNum,
        currency: curr,
        amountInUSD: amountInUSD,
        exchangeRate: rate,
        description: description,
        date: new Date()
      });
    }

    // totalExpenses va remainingBudget Trip model pre('save') da avtomatik hisoblanadi
    console.log('✅ Xarajat qo\'shildi, trip.save() chaqirilmoqda...');

    await trip.save();

    // Eski Expense modeliga ham yozish (orqaga moslik)
    await Expense.create({
      user: req.driver.user,
      driver: req.driver._id,
      vehicle: trip.vehicle,
      trip: trip._id,
      expenseType,
      amount: amountNum,
      description,
      fuelLiters,
      fuelPricePerLiter,
      receiptImage
    });

    res.status(201).json({ success: true, data: trip, message: 'Xarajat qo\'shildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor xarajatlari
router.get('/me/expenses', protect, driverOnly, async (req, res) => {
  try {
    const expenses = await Expense.find({ driver: req.driver._id })
      .populate('vehicle', 'plateNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor maoshi
router.get('/me/salary', protect, driverOnly, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id);
    const trips = await Trip.find({ driver: req.driver._id, status: 'completed' });
    
    const totalBonus = trips.reduce((sum, t) => sum + (t.bonusAmount || 0), 0);
    const totalPenalty = trips.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0);

    res.json({
      success: true,
      data: {
        baseSalary: driver.baseSalary || 0,
        tripsCount: trips.length,
        totalBonus,
        totalPenalty,
        netSalary: (driver.baseSalary || 0) + totalBonus - totalPenalty
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ FLIGHT (YANGI TIZIM) ============

// Shofyor reyslari (Flight tizimi)
router.get('/me/flights', protect, driverOnly, async (req, res) => {
  try {
    const flights = await Flight.find({ driver: req.driver._id })
      .populate('vehicle', 'plateNumber brand model')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Faol reys olish
router.get('/me/flights/active', protect, driverOnly, async (req, res) => {
  try {
    const flight = await Flight.findOne({ 
      driver: req.driver._id, 
      status: 'active' 
    }).populate('vehicle', 'plateNumber brand model');
    
    res.json({ success: true, data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bosqichni tugatish
router.put('/me/flights/:id/legs/:legId/complete', protect, driverOnly, async (req, res) => {
  try {
    const flight = await Flight.findOne({ 
      _id: req.params.id, 
      driver: req.driver._id,
      status: 'active'
    });
    
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Faol reys topilmadi' });
    }

    const leg = flight.legs.id(req.params.legId);
    if (!leg) {
      return res.status(404).json({ success: false, message: 'Bosqich topilmadi' });
    }

    leg.status = 'completed';
    leg.completedAt = new Date();
    await flight.save();

    res.json({ success: true, data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat qo'shish (Flight tizimi)
router.post('/me/flights/:id/expenses', protect, driverOnly, async (req, res) => {
  try {
    const { type, amount, description, currency, country } = req.body;

    const flight = await Flight.findOne({ 
      _id: req.params.id, 
      driver: req.driver._id,
      status: 'active'
    });
    
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Faol reys topilmadi' });
    }

    flight.expenses.push({
      type: type || 'other',
      amount: Number(amount) || 0,
      description,
      currency: currency || 'UZS',
      country: country || 'UZB',
      date: new Date()
    });

    await flight.save();

    // Socket orqali biznesmenga xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`business-${flight.user}`).emit('flight-expense-added', {
        flightId: flight._id,
        expense: flight.expenses[flight.expenses.length - 1],
        driverName: req.driver.fullName
      });
    }

    res.json({ success: true, data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
