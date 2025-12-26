const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Flight = require('../models/Flight');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { protect, businessOnly } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateObjectId } = require('../utils/validators');

// ObjectId validatsiya funksiyasi
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  if (id.startsWith('temp_')) return false; // Vaqtinchalik ID
  return mongoose.Types.ObjectId.isValid(id);
};

// ============ STATISTIKA ENDPOINTLARI ============

// Yoqilg'i va xarajatlar statistikasi
router.get('/stats/fuel', protect, businessOnly, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const filter = { user: req.user._id };
  
  // Sana filtri
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const flights = await Flight.find(filter).lean();

  // Yoqilg'i statistikasi
  let totalFuelLitr = 0;
  let totalFuelKub = 0;
  let totalFuelCost = 0;
  let totalDistance = 0;
  let fuelByType = {
    fuel_metan: { quantity: 0, cost: 0, unit: 'kub' },
    fuel_propan: { quantity: 0, cost: 0, unit: 'kub' },
    fuel_benzin: { quantity: 0, cost: 0, unit: 'litr' },
    fuel_diesel: { quantity: 0, cost: 0, unit: 'litr' }
  };

  // Xarajatlar statistikasi
  let expensesByType = {
    fuel: 0,
    food: 0,
    repair: 0,
    toll: 0,
    fine: 0,
    other: 0
  };

  flights.forEach(flight => {
    // Masofa
    totalDistance += flight.totalDistance || 0;
    
    // Xarajatlar
    (flight.expenses || []).forEach(exp => {
      const amount = exp.amount || 0;
      
      // Yoqilg'i turlari
      if (exp.type?.startsWith('fuel_')) {
        totalFuelCost += amount;
        expensesByType.fuel += amount;
        
        if (fuelByType[exp.type]) {
          fuelByType[exp.type].cost += amount;
          if (exp.quantity) {
            fuelByType[exp.type].quantity += exp.quantity;
            
            // Litr yoki kub
            if (exp.type === 'fuel_metan' || exp.type === 'fuel_propan') {
              totalFuelKub += exp.quantity;
            } else {
              totalFuelLitr += exp.quantity;
            }
          }
        }
      } else if (exp.type === 'fuel') {
        totalFuelCost += amount;
        expensesByType.fuel += amount;
      } else if (expensesByType[exp.type] !== undefined) {
        expensesByType[exp.type] += amount;
      } else {
        expensesByType.other += amount;
      }
    });
  });

  // Sarflanish hisoblash (km/kub yoki km/litr)
  const fuelEfficiency = {
    metan: totalFuelKub > 0 ? Math.round((totalDistance / totalFuelKub) * 10) / 10 : 0, // km/kub
    propan: fuelByType.fuel_propan.quantity > 0 ? Math.round((totalDistance / fuelByType.fuel_propan.quantity) * 10) / 10 : 0,
    benzin: fuelByType.fuel_benzin.quantity > 0 ? Math.round((totalDistance / fuelByType.fuel_benzin.quantity) * 10) / 10 : 0,
    diesel: fuelByType.fuel_diesel.quantity > 0 ? Math.round((totalDistance / fuelByType.fuel_diesel.quantity) * 10) / 10 : 0,
    overall: (totalFuelLitr + totalFuelKub) > 0 ? Math.round((totalDistance / (totalFuelLitr + totalFuelKub)) * 10) / 10 : 0
  };

  // Jami xarajat
  const totalExpenses = Object.values(expensesByType).reduce((a, b) => a + b, 0);

  res.json({
    success: true,
    data: {
      totalDistance,
      totalExpenses,
      fuel: {
        totalCost: totalFuelCost,
        totalLitr: Math.round(totalFuelLitr * 10) / 10,
        totalKub: Math.round(totalFuelKub * 10) / 10,
        byType: fuelByType,
        efficiency: fuelEfficiency
      },
      expensesByType,
      flightsCount: flights.length
    }
  });
}));

// Barcha reyslar
router.get('/', protect, businessOnly, asyncHandler(async (req, res) => {
  const { status, driverId, limit } = req.query;
  const filter = { user: req.user._id };
  
  if (status) filter.status = status;
  
  // driverId faqat valid ObjectId bo'lsa qo'shish
  if (driverId && isValidObjectId(driverId)) {
    filter.driver = driverId;
  }

  // Limit qo'shish - default 50
  const queryLimit = parseInt(limit) || 50;

  const flights = await Flight.find(filter)
    .populate('driver', 'fullName phone')
    .populate('vehicle', 'plateNumber brand')
    .sort({ createdAt: -1 })
    .limit(queryLimit)
    .lean(); // 🚀 Tezroq - plain JS object qaytaradi

  res.json({ success: true, data: flights });
}));

// Shofyor qarzdorliklari ro'yxati (hisobotlar uchun) - /:id dan OLDIN bo'lishi kerak!
router.get('/driver-debts', protect, businessOnly, async (req, res) => {
  try {
    const { status, driverId } = req.query;

    // Barcha reyslarni olish (completed va active)
    const filter = { 
      user: req.user._id,
      status: { $in: ['completed', 'active'] }
    };

    if (driverId) {
      filter.driver = driverId;
    }

    const flights = await Flight.find(filter)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand')
      .sort({ createdAt: -1 })
      .lean();

    // Har bir reys uchun driverOwes ni hisoblash
    const processedFlights = flights.map(f => {
      const totalIncome = (f.totalPayment || 0) + (f.roadMoney || f.totalGivenBudget || 0);
      const totalExpenses = f.totalExpenses || 0;
      const netProfit = f.netProfit || f.profit || (totalIncome - totalExpenses);
      const driverProfitAmount = f.driverProfitAmount || 0;
      
      let calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;
      if (calculatedDriverOwes === 0 && netProfit > 0) {
        calculatedDriverOwes = netProfit - driverProfitAmount;
      }
      
      return {
        ...f,
        driverOwes: calculatedDriverOwes,
        calculatedNetProfit: netProfit,
        calculatedTotalIncome: totalIncome
      };
    });

    let filteredFlights = processedFlights.filter(f => f.driverOwes > 0);

    if (status === 'pending') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus !== 'paid');
    } else if (status === 'paid') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus === 'paid');
    }

    const totalDebt = filteredFlights.reduce((sum, f) => f.driverPaymentStatus !== 'paid' ? sum + (f.driverOwes || 0) : sum, 0);
    const paidAmount = filteredFlights.reduce((sum, f) => f.driverPaymentStatus === 'paid' ? sum + (f.driverOwes || 0) : sum, 0);

    res.json({ 
      success: true, 
      data: filteredFlights,
      stats: {
        totalDebt,
        paidAmount,
        pendingCount: filteredFlights.filter(f => f.driverPaymentStatus !== 'paid').length,
        paidCount: filteredFlights.filter(f => f.driverPaymentStatus === 'paid').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta reys
router.get('/:id', protect, validateObjectId('id'), asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id)
    .populate('driver', 'fullName phone')
    .populate('vehicle', 'plateNumber brand');

  if (!flight) throw new ApiError(404, 'Reys topilmadi');

  res.json({ success: true, data: flight });
}));

// Yangi reys ochish (boshlash)
router.post('/', protect, businessOnly, async (req, res) => {
  try {
    const { driverId, vehicleId, startOdometer, startFuel, firstLeg, notes, flightType, countriesInRoute } = req.body;

    // Shofyor tekshirish
    const driver = await Driver.findOne({ _id: driverId, user: req.user._id });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Shofyor topilmadi' });
    }

    // Mashina tekshirish
    let vehicle;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, user: req.user._id });
    } else {
      // Shofyorga biriktirilgan mashinani olish
      vehicle = await Vehicle.findOne({ 
        user: req.user._id,
        $or: [
          { currentDriver: driverId },
          { currentDriver: driver._id }
        ]
      });
    }
    
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Yangi reys yaratish
    const flightData = {
      user: req.user._id,
      driver: driverId,
      vehicle: vehicle._id,
      startOdometer: startOdometer || 0,
      startFuel: startFuel || 0,
      flightType: flightType || 'domestic',
      // Xalqaro reyslar uchun davlatlar ro'yxati
      countriesInRoute: flightType === 'international' ? (countriesInRoute || ['UZB']) : [],
      status: 'active',
      startedAt: new Date(),
      notes,
      legs: []
    };

    // Birinchi buyurtma (ixtiyoriy)
    if (firstLeg && firstLeg.fromCity && firstLeg.toCity) {
      flightData.legs.push({
        fromCity: firstLeg.fromCity,
        toCity: firstLeg.toCity,
        fromCoords: firstLeg.fromCoords || null,
        toCoords: firstLeg.toCoords || null,
        payment: firstLeg.payment || 0,
        givenBudget: firstLeg.givenBudget || 0, // Yo'l xarajatlari uchun berilgan pul
        distance: firstLeg.distance || 0,
        status: 'in_progress',
        startedAt: new Date()
      });
    }

    const flight = await Flight.create(flightData);

    // Shofyorni band qilish
    await Driver.findByIdAndUpdate(driverId, { status: 'busy' });

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - reys boshlandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${driverId}`).emit('flight-started', {
        flight: populatedFlight,
        message: 'Yangi reys boshlandi!'
      });
      io.to(`business-${req.user._id}`).emit('flight-started', {
        flight: populatedFlight
      });
    }

    res.status(201).json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Yangi buyurtma (leg) qo'shish
router.post('/:id/legs', protect, businessOnly, async (req, res) => {
  try {
    const { fromCity, toCity, fromCoords, toCoords, payment, givenBudget, distance, note } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (flight.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Reys faol emas' });
    }

    // Oldingi buyurtmani tugatish
    const lastLeg = flight.legs[flight.legs.length - 1];
    if (lastLeg && lastLeg.status === 'in_progress') {
      lastLeg.status = 'completed';
      lastLeg.completedAt = new Date();
    }

    // Yangi buyurtma qo'shish
    flight.legs.push({
      fromCity: fromCity || (lastLeg ? lastLeg.toCity : ''),
      toCity,
      fromCoords: fromCoords || (lastLeg ? lastLeg.toCoords : null),
      toCoords: toCoords || null,
      payment: payment || 0,
      givenBudget: givenBudget || 0, // Yo'l xarajatlari uchun berilgan pul
      distance: distance || 0,
      status: 'in_progress',
      startedAt: new Date(),
      note
    });

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - yangi buyurtma qo'shildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { flight: populatedFlight });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buyurtma uchun to'lov qo'shish/yangilash - TO'LOV KIRITILGANDA BUYURTMA TUGALLANADI
router.put('/:id/legs/:legId/payment', protect, businessOnly, async (req, res) => {
  try {
    const { payment } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const leg = flight.legs.id(req.params.legId);
    if (!leg) {
      return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    }

    leg.payment = Number(payment) || 0;
    
    // To'lov kiritilganda buyurtma (leg) tugallanadi
    if (Number(payment) > 0 && leg.status === 'in_progress') {
      leg.status = 'completed';
      leg.completedAt = new Date();
    }
    
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Buyurtma tugallandi!'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat qo'shish
router.post('/:id/expenses', protect, businessOnly, async (req, res) => {
  try {
    const { 
      type, amount, description, legIndex, legId,
      // Valyuta ma'lumotlari (xalqaro reyslar uchun)
      currency, country,
      // Chegara xarajatlari uchun
      borderInfo,
      // Yoqilg'i uchun qo'shimcha
      quantity, quantityUnit, pricePerUnit,
      odometer, stationName, location
    } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Agar legIndex berilmagan bo'lsa, oxirgi buyurtmaga biriktirish
    const actualLegIndex = legIndex !== undefined ? legIndex : (flight.legs.length - 1);
    const actualLegId = legId || (flight.legs[actualLegIndex] ? flight.legs[actualLegIndex]._id : null);

    // Valyuta kurslari olish
    const rates = await getCurrencyRates();
    const expenseCurrency = currency || 'UZS';
    const expenseAmount = Number(amount);
    
    // USD va UZS ga konvertatsiya
    const amountInUSD = Math.round(convertToUSD(expenseAmount, expenseCurrency, rates) * 100) / 100;
    const amountInUZS = Math.round(convertToUZS(expenseAmount, expenseCurrency, rates));

    // Yoqilg'i xarajati uchun qo'shimcha hisob-kitob
    let distanceSinceLast = null;
    let fuelConsumption = null;
    
    if (type && type.startsWith('fuel_') && odometer) {
      // Oldingi yoqilg'i xarajatini topish
      const lastFuelExpense = [...flight.expenses]
        .reverse()
        .find(exp => exp.type && exp.type.startsWith('fuel_') && exp.odometer);
      
      if (lastFuelExpense && lastFuelExpense.odometer) {
        distanceSinceLast = odometer - lastFuelExpense.odometer;
        
        // Sarflanish hisoblash (litr/100km)
        if (lastFuelExpense.quantity && distanceSinceLast > 0) {
          fuelConsumption = Math.round((lastFuelExpense.quantity / distanceSinceLast) * 100 * 10) / 10;
        }
      } else if (flight.startOdometer) {
        // Birinchi yoqilg'i - reys boshidan hisoblash
        distanceSinceLast = odometer - flight.startOdometer;
      }
    }

    // Xarajat ma'lumotlari
    const expenseData = {
      type,
      amount: expenseAmount,
      currency: expenseCurrency,
      amountInUSD,
      amountInUZS,
      exchangeRate: rates[expenseCurrency] || 1,
      country: country || null,
      description,
      legIndex: actualLegIndex,
      legId: actualLegId,
      date: new Date()
    };

    // Chegara xarajatlari uchun
    if (borderInfo && (type === 'border' || type === 'customs' || type === 'transit' || type === 'insurance')) {
      expenseData.borderInfo = {
        fromCountry: borderInfo.fromCountry || null,
        toCountry: borderInfo.toCountry || null,
        borderName: borderInfo.borderName || null
      };
    }

    // Yoqilg'i ma'lumotlari
    if (type && type.startsWith('fuel_')) {
      expenseData.quantity = quantity ? Number(quantity) : null;
      expenseData.quantityUnit = quantityUnit || (type === 'fuel_gas' || type === 'fuel_metan' ? 'kub' : 'litr');
      expenseData.pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;
      expenseData.stationName = stationName || null;
      expenseData.odometer = odometer ? Number(odometer) : null;
      expenseData.distanceSinceLast = distanceSinceLast;
      expenseData.fuelConsumption = fuelConsumption;
    }

    // Joylashuv
    if (location && (location.lat || location.name)) {
      expenseData.location = {
        name: location.name || null,
        lat: location.lat || null,
        lng: location.lng || null
      };
    }

    flight.expenses.push(expenseData);
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - reys yangilandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { flight: populatedFlight });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat tahrirlash
router.put('/:id/expenses/:expenseId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const expenseIndex = flight.expenses.findIndex(e => e._id.toString() === req.params.expenseId);
    if (expenseIndex === -1) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    const { type, amount, description, quantity, quantityUnit, pricePerUnit, odometer, stationName, location, date } = req.body;

    // Mavjud xarajatni yangilash
    if (type !== undefined) flight.expenses[expenseIndex].type = type;
    if (amount !== undefined) flight.expenses[expenseIndex].amount = Number(amount);
    if (description !== undefined) flight.expenses[expenseIndex].description = description;
    if (quantity !== undefined) flight.expenses[expenseIndex].quantity = quantity ? Number(quantity) : null;
    if (quantityUnit !== undefined) flight.expenses[expenseIndex].quantityUnit = quantityUnit;
    if (pricePerUnit !== undefined) flight.expenses[expenseIndex].pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;
    if (odometer !== undefined) flight.expenses[expenseIndex].odometer = odometer ? Number(odometer) : null;
    if (stationName !== undefined) flight.expenses[expenseIndex].stationName = stationName;
    if (location !== undefined) flight.expenses[expenseIndex].location = location;
    if (date !== undefined) flight.expenses[expenseIndex].date = new Date(date);

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Xarajat yangilandi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat o'chirish
router.delete('/:id/expenses/:expenseId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.expenses = flight.expenses.filter(e => e._id.toString() !== req.params.expenseId);
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - xarajat o'chirildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Xarajat o\'chirildi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni yangilash
router.put('/:id', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const { startOdometer, startFuel, endOdometer, endFuel, notes } = req.body;

    if (startOdometer !== undefined) flight.startOdometer = startOdometer;
    if (startFuel !== undefined) flight.startFuel = startFuel;
    if (endOdometer !== undefined) flight.endOdometer = endOdometer;
    if (endFuel !== undefined) flight.endFuel = endFuel;
    if (notes !== undefined) flight.notes = notes;

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - reys yangilandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Reys ma\'lumotlari yangilandi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni yopish (tugatish)
router.put('/:id/complete', protect, businessOnly, async (req, res) => {
  try {
    const { endOdometer, endFuel, driverProfitPercent } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (flight.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Reys allaqachon yopilgan' });
    }

    // Oxirgi buyurtmani tugatish
    const lastLeg = flight.legs[flight.legs.length - 1];
    if (lastLeg && lastLeg.status === 'in_progress') {
      lastLeg.status = 'completed';
      lastLeg.completedAt = new Date();
    }

    flight.status = 'completed';
    flight.completedAt = new Date();
    if (endOdometer) flight.endOdometer = endOdometer;
    if (endFuel !== undefined) flight.endFuel = endFuel;

    // Shofyor ulushi (foydadan %)
    const percent = Number(driverProfitPercent) || 0;
    flight.driverProfitPercent = percent;
    
    // ============ XALQARO REYS UCHUN USD DA HISOBLASH ============
    const isInternational = flight.flightType === 'international';
    
    // Valyuta kurslarini olish
    const rates = await getCurrencyRates();
    const uzsToUsdRate = rates.UZS || 12800;
    
    // Jami to'lov (mijozdan) - so'm da
    const totalPayment = flight.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);
    
    // Jami xarajatlar
    let totalExpensesUZS = 0;
    let totalExpensesUSD = 0;
    
    flight.expenses.forEach(exp => {
      if (exp.amountInUZS) {
        totalExpensesUZS += exp.amountInUZS;
      } else {
        totalExpensesUZS += exp.amount || 0;
      }
      
      if (exp.amountInUSD) {
        totalExpensesUSD += exp.amountInUSD;
      } else {
        // So'm dan USD ga konvertatsiya
        totalExpensesUSD += (exp.amount || 0) / uzsToUsdRate;
      }
    });
    
    // Xalqaro reys uchun USD da hisoblash
    if (isInternational) {
      // To'lovni USD ga konvertatsiya
      const totalPaymentUSD = totalPayment / uzsToUsdRate;
      const totalGivenBudgetUSD = (flight.totalGivenBudget || 0) / uzsToUsdRate;
      
      // Jami kirim USD da
      const totalIncomeUSD = totalPaymentUSD + totalGivenBudgetUSD;
      
      // Sof foyda USD da
      const netProfitUSD = totalIncomeUSD - totalExpensesUSD;
      
      // USD maydonlarini saqlash
      flight.totalPaymentUSD = Math.round(totalPaymentUSD * 100) / 100;
      flight.totalIncomeUSD = Math.round(totalIncomeUSD * 100) / 100;
      flight.totalExpensesUSD = Math.round(totalExpensesUSD * 100) / 100;
      flight.netProfitUSD = Math.round(netProfitUSD * 100) / 100;
      
      // Shofyor ulushi USD da
      if (netProfitUSD > 0 && percent > 0) {
        flight.driverProfitAmountUSD = Math.round(netProfitUSD * percent / 100 * 100) / 100;
        flight.driverProfitAmount = Math.round(flight.driverProfitAmountUSD * uzsToUsdRate);
      } else {
        flight.driverProfitAmountUSD = 0;
        flight.driverProfitAmount = 0;
      }
      
      // Biznesmen foydasi USD da
      flight.businessProfitUSD = Math.round((netProfitUSD - (flight.driverProfitAmountUSD || 0)) * 100) / 100;
      flight.driverOwesUSD = flight.businessProfitUSD;
      
      // Valyuta kursi saqlash
      flight.exchangeRateAtClose = uzsToUsdRate;
      flight.closedWithRates = rates;
    } else {
      // Mahalliy reys - so'm da hisoblash (eski logika)
      const totalExpenses = flight.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const profit = totalPayment - totalExpenses;
      
      // Faqat foyda musbat bo'lsa shofyorga ulush beriladi
      if (profit > 0 && percent > 0) {
        flight.driverProfitAmount = Math.round(profit * percent / 100);
      } else {
        flight.driverProfitAmount = 0;
      }
    }

    await flight.save();

    // Shofyor daromadini yangilash
    if (flight.driverProfitAmount > 0) {
      const driver = await Driver.findById(flight.driver);
      if (driver) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
        const lastUpdatedMonth = driver.earningsLastUpdated 
          ? `${driver.earningsLastUpdated.getFullYear()}-${driver.earningsLastUpdated.getMonth()}`
          : null;

        // Agar yangi oy bo'lsa, joriy oy daromadini nolga tushirish
        if (lastUpdatedMonth !== currentMonth) {
          driver.currentMonthEarnings = 0;
        }

        // Daromadlarni qo'shish
        driver.totalEarnings = (driver.totalEarnings || 0) + flight.driverProfitAmount;
        driver.currentMonthEarnings = (driver.currentMonthEarnings || 0) + flight.driverProfitAmount;
        driver.pendingEarnings = (driver.pendingEarnings || 0) + flight.driverProfitAmount;
        driver.earningsLastUpdated = now;
        driver.status = 'free';
        await driver.save();
      }
    } else {
      // Shofyorni bo'shatish
      await Driver.findByIdAndUpdate(flight.driver, { status: 'free' });
    }

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - reys yopildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-completed', {
        flight: populatedFlight,
        message: 'Reys yopildi!'
      });
      io.to(`business-${req.user._id}`).emit('flight-completed', {
        flight: populatedFlight
      });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni bekor qilish
router.put('/:id/cancel', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.status = 'cancelled';
    await flight.save();

    // Shofyorni bo'shatish
    await Driver.findByIdAndUpdate(flight.driver, { status: 'free' });

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - reys bekor qilindi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-cancelled', {
        flight: populatedFlight,
        message: 'Reys bekor qilindi!'
      });
      io.to(`business-${req.user._id}`).emit('flight-cancelled', {
        flight: populatedFlight
      });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni o'chirish (faqat haydovchi tasdiqlamasidan oldin)
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findOne({ _id: req.params.id, user: req.user._id });
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Haydovchi tasdiqlagan bo'lsa - o'chirib bo'lmaydi
    if (flight.driverConfirmed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Haydovchi tasdiqlagan reysni o\'chirib bo\'lmaydi' 
      });
    }

    // Reysni o'chirish
    await Flight.findByIdAndDelete(flight._id);

    // Agar reys faol bo'lsa, shofyorni bo'shatish
    if (flight.status === 'active') {
      await Driver.findByIdAndUpdate(flight.driver, { status: 'free' });
    }

    // Socket xabar - reys o'chirildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-deleted', {
        flightId: flight._id,
        message: 'Reys o\'chirildi'
      });
    }

    res.json({ success: true, message: 'Reys o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ XALQARO REYS ENDPOINTLARI ============

// Valyuta kurslari (helper) - realtime API dan olinadi
const DEFAULT_CURRENCY_RATES = {
  USD: 1,
  UZS: 12800,
  KZT: 480,
  RUB: 95,
  EUR: 0.92,
  TRY: 34,
  CNY: 7.2,
  TJS: 11,
  KGS: 89,
  TMT: 3.5,
  AZN: 1.7,
  GEL: 2.7,
  BYN: 3.3,
  UAH: 41,
  PLN: 4,
  AFN: 70,
  IRR: 42000,
  AED: 3.67
};

// Valyuta kurslarini olish (cache bilan)
let currencyRatesCache = { rates: null, lastUpdated: null };
async function getCurrencyRates() {
  const now = Date.now();
  // 1 soat cache
  if (currencyRatesCache.rates && currencyRatesCache.lastUpdated && (now - currencyRatesCache.lastUpdated < 3600000)) {
    return currencyRatesCache.rates;
  }
  
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        currencyRatesCache.rates = { USD: 1, ...data.rates };
        currencyRatesCache.lastUpdated = now;
        return currencyRatesCache.rates;
      }
    }
  } catch (e) {
    console.error('Valyuta kurslarini olishda xatolik:', e.message);
  }
  
  return DEFAULT_CURRENCY_RATES;
}

const convertToUSD = (amount, currency, rates = DEFAULT_CURRENCY_RATES) => {
  if (currency === 'USD') return amount;
  const rate = rates[currency] || DEFAULT_CURRENCY_RATES[currency] || 1;
  return amount / rate;
};

const convertToUZS = (amount, currency, rates = DEFAULT_CURRENCY_RATES) => {
  if (currency === 'UZS') return amount;
  const inUSD = convertToUSD(amount, currency, rates);
  const uzsRate = rates.UZS || DEFAULT_CURRENCY_RATES.UZS || 12800;
  return inUSD * uzsRate;
};

// Chegara o'tish qo'shish (umumiy xarajatlar ichiga ham qo'shiladi)
router.post('/:id/border-crossing', protect, businessOnly, async (req, res) => {
  try {
    const { 
      fromCountry, toCountry, borderName,
      customsFee, transitFee, insuranceFee, otherFees,
      currency, exchangeRate, note 
    } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Valyuta kurslari olish
    const rates = await getCurrencyRates();
    const curr = currency || 'USD';
    const rate = exchangeRate || rates[curr] || DEFAULT_CURRENCY_RATES[curr] || 1;
    const totalInOriginal = (customsFee || 0) + (transitFee || 0) + (insuranceFee || 0) + (otherFees || 0);
    const totalInUSD = convertToUSD(totalInOriginal, curr, rates);
    const totalInUZS = Math.round(convertToUZS(totalInOriginal, curr, rates));

    // Chegara o'tish ma'lumotlarini saqlash (eski format - backward compatibility)
    flight.borderCrossings.push({
      fromCountry: fromCountry.toUpperCase(),
      toCountry: toCountry.toUpperCase(),
      borderName,
      customsFee: customsFee || 0,
      transitFee: transitFee || 0,
      insuranceFee: insuranceFee || 0,
      otherFees: otherFees || 0,
      currency: curr,
      totalInOriginal,
      totalInUSD,
      totalInUZS,
      exchangeRate: rate,
      crossedAt: new Date(),
      note
    });

    // Umumiy xarajatlar ichiga ham qo'shish (yangi format)
    const borderInfo = {
      fromCountry: fromCountry.toUpperCase(),
      toCountry: toCountry.toUpperCase(),
      borderName
    };

    // Har bir xarajat turini alohida qo'shish
    if (customsFee && customsFee > 0) {
      flight.expenses.push({
        type: 'customs',
        amount: customsFee,
        currency: curr,
        amountInUSD: Math.round(convertToUSD(customsFee, curr, rates) * 100) / 100,
        amountInUZS: Math.round(convertToUZS(customsFee, curr, rates)),
        exchangeRate: rate,
        country: toCountry.toUpperCase(),
        borderInfo,
        description: `Bojxona: ${fromCountry} → ${toCountry}`,
        date: new Date()
      });
    }

    if (transitFee && transitFee > 0) {
      flight.expenses.push({
        type: 'transit',
        amount: transitFee,
        currency: curr,
        amountInUSD: Math.round(convertToUSD(transitFee, curr, rates) * 100) / 100,
        amountInUZS: Math.round(convertToUZS(transitFee, curr, rates)),
        exchangeRate: rate,
        country: toCountry.toUpperCase(),
        borderInfo,
        description: `Tranzit: ${fromCountry} → ${toCountry}`,
        date: new Date()
      });
    }

    if (insuranceFee && insuranceFee > 0) {
      flight.expenses.push({
        type: 'insurance',
        amount: insuranceFee,
        currency: curr,
        amountInUSD: Math.round(convertToUSD(insuranceFee, curr, rates) * 100) / 100,
        amountInUZS: Math.round(convertToUZS(insuranceFee, curr, rates)),
        exchangeRate: rate,
        country: toCountry.toUpperCase(),
        borderInfo,
        description: `Sug'urta: ${fromCountry} → ${toCountry}`,
        date: new Date()
      });
    }

    if (otherFees && otherFees > 0) {
      flight.expenses.push({
        type: 'border',
        amount: otherFees,
        currency: curr,
        amountInUSD: Math.round(convertToUSD(otherFees, curr, rates) * 100) / 100,
        amountInUZS: Math.round(convertToUZS(otherFees, curr, rates)),
        exchangeRate: rate,
        country: toCountry.toUpperCase(),
        borderInfo,
        description: `Boshqa chegara xarajatlari: ${fromCountry} → ${toCountry}`,
        date: new Date()
      });
    }

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - chegara xarajati qo'shildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: `Chegara xarajati qo'shildi: ${fromCountry} → ${toCountry}`
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Chegara o'tish o'chirish
router.delete('/:id/border-crossing/:crossingId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.borderCrossings = flight.borderCrossings.filter(
      bc => bc._id.toString() !== req.params.crossingId
    );
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - chegara xarajati o'chirildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Chegara xarajati o\'chirildi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Platon yangilash (umumiy xarajatlar ichiga ham qo'shiladi)
router.put('/:id/platon', protect, businessOnly, async (req, res) => {
  try {
    const { amount, currency, exchangeRate, distanceKm, note } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Valyuta kurslari olish
    const rates = await getCurrencyRates();
    const curr = currency || 'RUB';
    const rate = exchangeRate || rates[curr] || DEFAULT_CURRENCY_RATES[curr] || 95;
    const platonAmount = amount || 0;
    const amountInUSD = Math.round(convertToUSD(platonAmount, curr, rates) * 100) / 100;
    const amountInUZS = Math.round(convertToUZS(platonAmount, curr, rates));

    // Eski platon xarajatlarini o'chirish
    flight.expenses = flight.expenses.filter(e => e.type !== 'platon');

    flight.platon = {
      amount: platonAmount,
      currency: curr,
      amountInUSD,
      exchangeRate: rate,
      distanceKm: distanceKm || 0,
      note
    };

    // Umumiy xarajatlar ichiga ham qo'shish
    if (platonAmount > 0) {
      flight.expenses.push({
        type: 'platon',
        amount: platonAmount,
        currency: curr,
        amountInUSD,
        amountInUZS,
        exchangeRate: rate,
        country: 'RU',
        description: `Platon: ${distanceKm || 0} km`,
        date: new Date()
      });
    }

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - platon yangilandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Platon ma\'lumotlari yangilandi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Waypoint qo'shish
router.post('/:id/waypoint', protect, businessOnly, async (req, res) => {
  try {
    const { country, city, address, coords, type, order } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.waypoints.push({
      country: country.toUpperCase(),
      city,
      address,
      coords,
      type: type || 'transit',
      order: order || flight.waypoints.length
    });

    // Davlatlar ro'yxatini yangilash
    const countries = [...new Set(flight.waypoints.map(w => w.country))];
    flight.countriesInRoute = countries;

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - waypoint qo'shildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: `Yangi nuqta qo'shildi: ${city}`
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Waypoint o'chirish
router.delete('/:id/waypoint/:waypointId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.waypoints = flight.waypoints.filter(
      w => w._id.toString() !== req.params.waypointId
    );

    // Davlatlar ro'yxatini yangilash
    const countries = [...new Set(flight.waypoints.map(w => w.country))];
    flight.countriesInRoute = countries;

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - waypoint o'chirildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { 
        flight: populatedFlight,
        message: 'Nuqta o\'chirildi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor to'lov statusini yangilash (berdi/bermadi)
router.put('/:id/driver-payment', protect, businessOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'pending' yoki 'paid'

    if (!['pending', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri status' });
    }

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.driverPaymentStatus = status;
    flight.driverPaymentDate = status === 'paid' ? new Date() : null;

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
