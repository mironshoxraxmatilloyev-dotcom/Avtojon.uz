const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const Flight = require('../models/Flight');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { protect, businessOnly } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateObjectId } = require('../utils/validators');

// Katta xarajat turlari (shofyor oyligiga ta'sir qilmaydi)
const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];

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

    // Har bir mashrut uchun driverOwes ni hisoblash
    const processedFlights = flights.map(f => {
      const totalIncome = (f.totalPayment || 0) + (f.roadMoney || f.totalGivenBudget || 0);
      
      // YANGI LOGIKA: Faqat yengil xarajatlar ayiriladi
      const lightExpenses = f.lightExpenses || 0;
      const heavyExpenses = f.heavyExpenses || 0;
      const totalExpenses = f.totalExpenses || 0;
      
      // Sof foyda - faqat yengil xarajatlar ayirilgan
      // Agar lightExpenses mavjud bo'lsa, uni ishlatamiz
      // Aks holda, eski logika (backward compatibility)
      const netProfit = f.netProfit || (totalIncome - lightExpenses);
      
      const driverProfitAmount = f.driverProfitAmount || 0;

      let calculatedDriverOwes = f.driverOwes || f.businessProfit || 0;
      if (calculatedDriverOwes === 0 && netProfit > 0) {
        calculatedDriverOwes = netProfit - driverProfitAmount;
      }

      return {
        ...f,
        driverOwes: calculatedDriverOwes,
        calculatedNetProfit: netProfit,
        calculatedTotalIncome: totalIncome,
        lightExpenses,
        heavyExpenses
      };
    });

    // TUZATILDI: Barcha marshrutlarni qaytarish (qarz bor yoki to'langan)
    // Faqat driverOwes > 0 bo'lgan marshrutlarni olish (qarz bo'lgan marshrutlar)
    let filteredFlights = processedFlights.filter(f => f.driverOwes > 0);

    if (status === 'pending') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus !== 'paid');
    } else if (status === 'paid') {
      filteredFlights = filteredFlights.filter(f => f.driverPaymentStatus === 'paid');
    }
    // Agar filter 'all' bo'lsa, barcha marshrutlar qaytariladi (pending va paid)

    // TUZATILDI: Qolgan qarzni to'g'ri hisoblash
    const totalDebt = filteredFlights.reduce((sum, f) => {
      if (f.driverPaymentStatus === 'paid') return sum;
      const remaining = (f.driverOwes || 0) - (f.driverPaidAmount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
    
    const paidAmount = filteredFlights.reduce((sum, f) => sum + (f.driverPaidAmount || 0), 0);

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

// Bitta mashrut
router.get('/:id', protect, validateObjectId('id'), asyncHandler(async (req, res) => {
  const flight = await Flight.findById(req.params.id)
    .populate('driver', 'fullName phone')
    .populate('vehicle', 'plateNumber brand');

  if (!flight) throw new ApiError(404, 'Mashrut topilmadi');

  res.json({ success: true, data: flight });
}));

// Yangi mashrut ochish (boshlash)
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

    // 🚀 Haydovchining reys boshlanmasdan oldingi xarajatlarini olish
    const beforeExpenses = (driver.expenses || []).filter(exp => exp.timing === 'before');

    // Reys boshlanishidan oldin qo'shilgan xarajatlar jami
    const beforeExpensesTotal = beforeExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Haydovchidagi avvalgi qoldiq = oldingi reyslardan qolgan pul - reys boshlanmasdan oldingi xarajatlar
    // MUHIM: Reys boshlanmasdan oldingi xarajatlar avvalgi qoldiqdan ayiriladi
    const previousBalance = Math.max(0, (driver.currentBalance || 0) - beforeExpensesTotal);

    // DEBUG - Xarajatlarni ko'rish
    console.log('🔍 Driver currentBalance:', driver.currentBalance);
    console.log('🔍 Before expenses total:', beforeExpensesTotal);
    console.log('🔍 Previous balance (after before expenses):', previousBalance);

    // Yangi mashrut yaratish
    const flightData = {
      user: req.user._id,
      driver: driverId,
      vehicle: vehicle._id,
      startOdometer: startOdometer || 0,
      startFuel: startFuel || 0,
      flightType: flightType || 'domestic',
      // Avvalgi reysdan qolgan pul (reys boshlanmasdan oldingi xarajatlar ayirilgan)
      previousBalance: previousBalance,
      // Xalqaro reyslar uchun davlatlar ro'yxati
      countriesInRoute: flightType === 'international' ? (countriesInRoute || ['UZB']) : [],
      status: 'active',
      startedAt: new Date(),
      notes,
      legs: [],
      // 🚀 Reys boshlanmasdan oldingi xarajatlarni reysga ko'chirish
      // MUHIM: Driver.expenses'dan o'chirilmaydi, faqat flight'ga qo'shiladi
      expenses: beforeExpenses.map(exp => {
        const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];
        const isHeavy = HEAVY_EXPENSE_TYPES.includes(exp.type) || exp.expenseClass === 'heavy';

        return {
          type: exp.type,
          expenseClass: isHeavy ? 'heavy' : 'light',
          timing: 'before', // Reys boshlanishidan oldin
          amount: exp.amount,
          currency: 'UZS',
          amountInUSD: Math.round(exp.amount / 12800 * 100) / 100,
          amountInUZS: exp.amount,
          exchangeRate: 1,
          description: exp.description || 'Reys boshlanishidan oldingi xarajat',
          date: exp.date || new Date(),
          legIndex: 0,
          legId: null
        };
      })
    };

    // Birinchi buyurtma (ixtiyoriy)
    if (firstLeg && firstLeg.fromCity && firstLeg.toCity) {
      flightData.legs.push({
        fromCity: firstLeg.fromCity,
        toCity: firstLeg.toCity,
        fromCoords: firstLeg.fromCoords || null,
        toCoords: firstLeg.toCoords || null,
        payment: firstLeg.payment || 0,
        givenBudget: firstLeg.givenBudget || 0, // Faqat biznesmen berilgan pul
        distance: firstLeg.distance || 0,
        status: 'in_progress',
        startedAt: new Date(),
        note: firstLeg.note || ''
      });
    }

    const flight = await Flight.create(flightData);

    // 🚀 Haydovchidan "before" xarajatlarni o'chirish, statusni band qilish va jami xarajatlarni yangilash
    driver.expenses = driver.expenses.filter(exp => exp.timing !== 'before');
    driver.totalExpensesBefore = 0;
    driver.status = 'busy';
    await driver.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone currentBalance')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - mashrut boshlandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${driverId}`).emit('flight-started', {
        flight: populatedFlight,
        message: 'Yangi mashrut boshlandi!'
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
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    if (flight.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Mashrut faol emas' });
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
    const { payment, paymentType, transferFeePercent } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    const leg = flight.legs.id(req.params.legId);
    if (!leg) {
      return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    }

    leg.payment = Number(payment) || 0;
    
    // To'lov turi: 'cash', 'transfer', 'peritsena'
    if (paymentType) {
      leg.paymentType = paymentType;
    }
    
    // Peritsena uchun firma xarajati foizi
    if (paymentType === 'peritsena' && transferFeePercent !== undefined) {
      leg.transferFeePercent = Number(transferFeePercent) || 0;
      // Firma xarajati summasi avtomatik hisoblanadi (Flight model pre-save da)
    } else if (paymentType !== 'peritsena') {
      leg.transferFeePercent = 0;
      leg.transferFeeAmount = 0;
    }

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
      odometer, stationName, location,
      // Shina raqamlari
      tireNumber,
      // Xarajat turi (yengil/katta)
      expenseClass,
      // Xarajat qo'shilgan vaqti: 'before' = reys boshlanishidan oldin, 'during' = davomida, 'after' = tugagandan keyin
      timing,
      // Sana
      date
    } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
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
    let fuelConsumption = null; // Shu oraliq uchun km/kub
    let avgFuelConsumption = null; // Umumiy o'rtacha km/kub
    let totalFuelQuantity = null;
    let totalDistance = null;
    let previousFuelQuantity = null; // Oldingi to'ldirish miqdori

    if (type && type.startsWith('fuel_') && odometer) {
      // Shu turdagi barcha yoqilg'i xarajatlarini olish
      const sameFuelExpenses = flight.expenses.filter(
        (exp) => exp.type === type && exp.odometer && exp.quantity
      );

      // Jami olingan yoqilg'i (boshlang'ich + qo'shilganlar + hozirgi)
      const startFuel = flight.startFuel || 0;
      const addedFuel = sameFuelExpenses.reduce((sum, exp) => sum + (exp.quantity || 0), 0) + (quantity || 0);
      totalFuelQuantity = startFuel + addedFuel;

      // Jami bosib o'tilgan masofa (mashrut boshidan)
      totalDistance = odometer - (flight.startOdometer || 0);

      // Oldingi to'ldirishdan beri masofa va oldingi yoqilg'i miqdori
      const lastFuelExpense = [...sameFuelExpenses].reverse()[0];
      if (lastFuelExpense) {
        distanceSinceLast = odometer - lastFuelExpense.odometer;
        previousFuelQuantity = lastFuelExpense.quantity; // Oldingi to'ldirish
      } else {
        distanceSinceLast = totalDistance;
        previousFuelQuantity = startFuel; // Boshlang'ich yoqilg'i
      }

      // 1. ORALIQ SARF: Shu oralig'idagi masofa / OLDINGI to'ldirish (yoki boshlang'ich)
      // Mantiq: Shu masofani bosib o'tish uchun OLDINGI yoqilg'i sarflangan
      if (previousFuelQuantity > 0 && distanceSinceLast > 0) {
        fuelConsumption = Math.round((distanceSinceLast / previousFuelQuantity) * 10) / 10;
      }

      // 2. UMUMIY O'RTACHA: Jami masofa / (Boshlang'ich + Qo'shilgan yoqilg'i)
      if (totalFuelQuantity > 0 && totalDistance > 0) {
        avgFuelConsumption = Math.round((totalDistance / totalFuelQuantity) * 10) / 10;
      }
    }

    // Xarajat ma'lumotlari
    // Katta xarajat turlari (shofyor oyligiga ta'sir qilmaydi)
    const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];
    const actualExpenseClass = expenseClass || (HEAVY_EXPENSE_TYPES.includes(type) ? 'heavy' : 'light');

    const expenseData = {
      type,
      expenseClass: actualExpenseClass,
      timing: timing || 'during', // 'before', 'during', 'after'
      amount: expenseAmount,
      currency: expenseCurrency,
      amountInUSD,
      amountInUZS,
      exchangeRate: rates[expenseCurrency] || 1,
      country: country || null,
      description,
      legIndex: actualLegIndex,
      legId: actualLegId,
      addedBy: 'businessman', // Kim qo'shgani
      date: date ? new Date(date) : new Date()
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
      // Shu to'ldirish uchun km/kub (oralig'idagi masofa / hozirgi to'ldirish)
      expenseData.fuelConsumption = fuelConsumption;
      // Umumiy o'rtacha km/kub (jami masofa / jami yoqilg'i)
      expenseData.avgFuelConsumption = avgFuelConsumption;
      // Jami masofa va jami yoqilg'i (UI da ko'rsatish uchun)
      expenseData.totalDistance = totalDistance;
      expenseData.totalFuelQuantity = totalFuelQuantity;
    }

    // Joylashuv
    if (location && (location.lat || location.name)) {
      expenseData.location = {
        name: location.name || null,
        lat: location.lat || null,
        lng: location.lng || null
      };
    }

    // Shina raqamlari (tire replacement uchun)
    if (type === 'tire' && tireNumber) {
      expenseData.tireNumber = tireNumber;
      // Agar tireNumber array bo'lsa (bir nechta shinalar almastirilgan)
      if (Array.isArray(tireNumber)) {
        expenseData.tireNumbers = tireNumber;
        expenseData.tireCount = tireNumber.length;
      } else {
        // Yoki string bo'lsa (bitta shina)
        expenseData.tireNumbers = [tireNumber];
        expenseData.tireCount = 1;
      }
    }

    flight.expenses.push(expenseData);
    await flight.save();

    // 🚀 MUHIM: Xarajatni driver.expenses ga ham qo'shish (faqat yengil xarajatlar)
    // Katta xarajatlar (repair_major, tire, accident, insurance, oil) driver.expenses ga qo'shilmaydi
    const isHeavyExpense = HEAVY_EXPENSE_TYPES.includes(type) || actualExpenseClass === 'heavy';

    if (!isHeavyExpense) {
      // Yengil xarajat - driver.expenses ga qo'shish
      const driver = await Driver.findById(flight.driver);
      if (driver) {
        driver.expenses.push({
          flightId: flight._id,
          amount: expenseData.amountInUZS || expenseData.amount || 0,
          type: type,
          timing: timing || 'during',
          description: description || '',
          date: new Date()
        });

        // Xarajat vaqti bo'yicha jami xarajatlarni yangilash
        if (timing === 'before') {
          driver.totalExpensesBefore = (driver.totalExpensesBefore || 0) + (expenseData.amountInUZS || 0);
        } else if (timing === 'after') {
          driver.totalExpensesAfter = (driver.totalExpensesAfter || 0) + (expenseData.amountInUZS || 0);
        } else {
          driver.totalExpensesDuring = (driver.totalExpensesDuring || 0) + (expenseData.amountInUZS || 0);
        }

        await driver.save();
      }
    }

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - mashrut yangilandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', { flight: populatedFlight });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    // Agar reys yopilgan bo'lsa, haydovchi balansini yangilash
    if (flight.status === 'completed') {
      const driver = await Driver.findById(flight.driver);
      if (driver) {
        // Xarajat qo'shilganda: driverOwes kamayadi (chunki foyda kamayadi)
        // Demak driver.currentBalance ham kamayishi kerak
        const expenseAmount = expenseData.amountInUZS || expenseData.amount || 0;
        driver.currentBalance = (driver.currentBalance || 0) - expenseAmount;
        await driver.save();
      }
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
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    const expenseIndex = flight.expenses.findIndex(e => e._id.toString() === req.params.expenseId);
    if (expenseIndex === -1) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    const {
      type, amount, description, quantity, quantityUnit, pricePerUnit,
      odometer, stationName, location, date,
      // Valyuta ma'lumotlari
      currency, amountInUSD, amountInUZS, exchangeRate,
      // Xarajat vaqti
      timing
    } = req.body;

    // Eski xarajat ma'lumotlarini saqlash (driver.expenses dan o'chirish uchun)
    const oldExpense = flight.expenses[expenseIndex];
    const oldAmountInUZS = oldExpense.amountInUZS || oldExpense.amount || 0;
    const oldTiming = oldExpense.timing || 'during';
    const oldType = oldExpense.type;

    // Mavjud xarajatni yangilash (addedBy maydonini saqlab qolish)
    if (type !== undefined) flight.expenses[expenseIndex].type = type;
    if (amount !== undefined) flight.expenses[expenseIndex].amount = Number(amount);
    if (description !== undefined) flight.expenses[expenseIndex].description = description;
    if (timing !== undefined) flight.expenses[expenseIndex].timing = timing;
    if (quantity !== undefined) flight.expenses[expenseIndex].quantity = quantity ? Number(quantity) : null;
    if (quantityUnit !== undefined) flight.expenses[expenseIndex].quantityUnit = quantityUnit;
    if (pricePerUnit !== undefined) flight.expenses[expenseIndex].pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;
    if (odometer !== undefined) flight.expenses[expenseIndex].odometer = odometer ? Number(odometer) : null;
    if (stationName !== undefined) flight.expenses[expenseIndex].stationName = stationName;
    if (location !== undefined) flight.expenses[expenseIndex].location = location;
    if (date !== undefined) flight.expenses[expenseIndex].date = new Date(date);
    // addedBy maydonini saqlab qolish (yangilanmasin)

    // Valyuta ma'lumotlarini yangilash
    if (currency !== undefined) flight.expenses[expenseIndex].currency = currency;
    if (amountInUSD !== undefined) flight.expenses[expenseIndex].amountInUSD = Number(amountInUSD);
    if (amountInUZS !== undefined) flight.expenses[expenseIndex].amountInUZS = Number(amountInUZS);
    if (exchangeRate !== undefined) flight.expenses[expenseIndex].exchangeRate = Number(exchangeRate);

    await flight.save();

    // 🚀 MUHIM: Driver.expenses ni yangilash (faqat yengil xarajatlar)
    const oldIsHeavy = HEAVY_EXPENSE_TYPES.includes(oldType) || oldExpense.expenseClass === 'heavy';
    const newIsHeavy = HEAVY_EXPENSE_TYPES.includes(type || oldType) || flight.expenses[expenseIndex].expenseClass === 'heavy';

    const driver = await Driver.findById(flight.driver);
    if (driver) {
      // Eski xarajat yengil bo'lsa, driver.expenses dan o'chirish
      if (!oldIsHeavy) {
        driver.expenses = driver.expenses.filter(exp =>
          !(exp.flightId && exp.flightId.toString() === flight._id.toString() &&
            exp.date.getTime() === oldExpense.date.getTime())
        );

        // Eski xarajat vaqti bo'yicha jami xarajatlarni yangilash
        if (oldTiming === 'before') {
          driver.totalExpensesBefore = Math.max(0, (driver.totalExpensesBefore || 0) - oldAmountInUZS);
        } else if (oldTiming === 'after') {
          driver.totalExpensesAfter = Math.max(0, (driver.totalExpensesAfter || 0) - oldAmountInUZS);
        } else {
          driver.totalExpensesDuring = Math.max(0, (driver.totalExpensesDuring || 0) - oldAmountInUZS);
        }
      }

      // Yangi xarajat turi o'zgargan bo'lsa (heavy -> light yoki light -> heavy)
      // Eski heavy edi, yangi light bo'lsa - yangi xarajatni qo'shish
      if (oldIsHeavy && !newIsHeavy) {
        const newExpense = flight.expenses[expenseIndex];
        const newAmountInUZS = newExpense.amountInUZS || newExpense.amount || 0;
        const newTiming = newExpense.timing || 'during';

        driver.expenses.push({
          flightId: flight._id,
          amount: newAmountInUZS,
          type: newExpense.type,
          timing: newTiming,
          description: newExpense.description || '',
          date: newExpense.date || new Date()
        });

        // Yangi xarajat vaqti bo'yicha jami xarajatlarni yangilash
        if (newTiming === 'before') {
          driver.totalExpensesBefore = (driver.totalExpensesBefore || 0) + newAmountInUZS;
        } else if (newTiming === 'after') {
          driver.totalExpensesAfter = (driver.totalExpensesAfter || 0) + newAmountInUZS;
        } else {
          driver.totalExpensesDuring = (driver.totalExpensesDuring || 0) + newAmountInUZS;
        }
      }
      // Eski light edi, yangi heavy bo'lsa - o'chirish allaqachon yuqorida qilingan

      await driver.save();
    }

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

// Mashrutni yangilash
router.put('/:id', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    const {
      name, startOdometer, startFuel, endOdometer, endFuel, notes,
      // Moliyaviy maydonlar
      totalGivenBudget, totalPayment
    } = req.body;

    // Umumiy maydonlar
    if (name !== undefined) flight.name = name;
    if (notes !== undefined) flight.notes = notes;

    // Spidometr va yoqilg'i
    if (startOdometer !== undefined) flight.startOdometer = startOdometer;
    if (startFuel !== undefined) flight.startFuel = startFuel;
    if (endOdometer !== undefined) flight.endOdometer = endOdometer;
    if (endFuel !== undefined) flight.endFuel = endFuel;

    // Moliyaviy maydonlar - legs dagi qiymatlarni yangilash
    if (totalGivenBudget !== undefined || totalPayment !== undefined) {
      // Agar legs bo'sh bo'lsa, bitta virtual leg yaratish
      if (!flight.legs || flight.legs.length === 0) {
        flight.legs = [{
          fromCity: 'Boshlanish',
          toCity: 'Tugash',
          payment: totalPayment || 0,
          givenBudget: totalGivenBudget || 0,
          status: 'in_progress',
          startedAt: new Date()
        }];
      } else {
        // Mavjud legs dagi qiymatlarni yangilash
        // Birinchi leg ga yangi qiymatlarni qo'shish
        const currentTotalPayment = flight.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);
        const currentTotalGivenBudget = flight.legs.reduce((sum, leg) => sum + (leg.givenBudget || 0), 0);

        // Farqni birinchi leg ga qo'shish
        if (totalPayment !== undefined) {
          const paymentDiff = totalPayment - currentTotalPayment;
          flight.legs[0].payment = (flight.legs[0].payment || 0) + paymentDiff;
        }

        if (totalGivenBudget !== undefined) {
          const budgetDiff = totalGivenBudget - currentTotalGivenBudget;
          flight.legs[0].givenBudget = (flight.legs[0].givenBudget || 0) + budgetDiff;
        }
      }
    }

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - mashrut yangilandi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', {
        flight: populatedFlight,
        message: 'Mashrut ma\'lumotlari yangilandi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mashrutni yopish (tugatish)
router.put('/:id/complete', protect, businessOnly, async (req, res) => {
  try {
    const { endOdometer, endFuel, driverProfitPercent } = req.body;

    // DEBUG
    console.log('🔍 Complete request body:', { endOdometer, endFuel, driverProfitPercent });

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    if (flight.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Mashrut allaqachon yopilgan' });
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

    // DEBUG
    console.log('🔍 Percent:', percent);

    // ============ XALQARO MASHRUT UCHUN USD DA HISOBLASH ============
    const isInternational = flight.flightType === 'international';

    // Valyuta kurslarini olish
    const rates = await getCurrencyRates();
    const uzsToUsdRate = rates.UZS || 12800;

    // Jami to'lov (mijozdan) - so'm da
    const totalPayment = flight.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);

    // Jami berilgan yo'l puli
    const totalGivenBudget = flight.legs.reduce((sum, leg) => sum + (leg.givenBudget || 0), 0);

    // Jami xarajatlar - vaqti bo'yicha guruhlash
    let totalExpensesUZS = 0;
    let totalExpensesUSD = 0;
    let lightExpensesUZS = 0; // Yengil xarajatlar (shofyor hisobidan)
    let heavyExpensesUZS = 0; // Katta xarajatlar (biznesmen hisobidan)

    // Xarajatlarni vaqti bo'yicha guruhlash
    let expensesBeforeUZS = 0; // Reys boshlanishidan oldin
    let expensesDuringUZS = 0; // Reys davomida
    let expensesAfterUZS = 0; // Reys tugagandan keyin

    // Katta xarajat turlari (shofyor oyligiga ta'sir qilmaydi)
    const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];

    flight.expenses.forEach(exp => {
      const isHeavy = HEAVY_EXPENSE_TYPES.includes(exp.type) || exp.expenseClass === 'heavy';
      const amountUZS = exp.amountInUZS || exp.amount || 0;
      const amountUSD = exp.amountInUSD || (exp.amount || 0) / uzsToUsdRate;

      totalExpensesUZS += amountUZS;
      totalExpensesUSD += amountUSD;

      // Vaqti bo'yicha guruhlash
      const timing = exp.timing || 'during';
      if (timing === 'before') {
        expensesBeforeUZS += amountUZS;
      } else if (timing === 'after') {
        expensesAfterUZS += amountUZS;
      } else {
        expensesDuringUZS += amountUZS;
      }

      // MUHIM: Reys boshlanmasdan oldingi xarajatlar (before) yengil xarajatlar sifatida hisoblanmaydi
      // Chunki ular avvalgi qoldiqdan ayiriladi, shofyor ulushidan emas
      if (timing !== 'before') {
        if (isHeavy) {
          heavyExpensesUZS += amountUZS;
        } else {
          lightExpensesUZS += amountUZS;
        }
      }
    });

    // Chegara xarajatlarini qo'shish (yengil xarajat)
    if (flight.borderCrossings && flight.borderCrossings.length > 0) {
      const borderUZS = flight.borderCrossingsTotalUZS || 0;
      const borderUSD = flight.borderCrossingsTotalUSD || 0;
      totalExpensesUZS += borderUZS;
      totalExpensesUSD += borderUSD;
      lightExpensesUZS += borderUZS;
      expensesDuringUZS += borderUZS;
    }

    // Platon xarajatini qo'shish (yengil xarajat)
    if (flight.platon && flight.platon.amountInUSD) {
      const platonUSD = flight.platon.amountInUSD;
      const platonUZS = Math.round(platonUSD * uzsToUsdRate);
      totalExpensesUZS += platonUZS;
      totalExpensesUSD += platonUSD;
      lightExpensesUZS += platonUZS;
      expensesDuringUZS += platonUZS;
    }

    // Xalqaro mashrut uchun USD da hisoblash
    if (isInternational) {
      // To'lovni USD ga konvertatsiya
      const totalPaymentUSD = totalPayment / uzsToUsdRate;
      const totalGivenBudgetUSD = totalGivenBudget / uzsToUsdRate;

      // Jami kirim USD da
      const totalIncomeUSD = totalPaymentUSD + totalGivenBudgetUSD;

      // Sof foyda USD da - FAQAT YENGIL XARAJATLAR ayiriladi
      // Katta xarajatlar alohida ko'rsatiladi
      let lightExpensesUSD = 0;
      let heavyExpensesUSD = 0;
      
      flight.expenses.forEach(exp => {
        const isHeavy = HEAVY_EXPENSE_TYPES.includes(exp.type) || exp.expenseClass === 'heavy';
        if (isHeavy) {
          heavyExpensesUSD += (exp.amountInUSD || 0);
        } else {
          lightExpensesUSD += (exp.amountInUSD || 0);
        }
      });
      
      // Chegara va Platon ham yengil xarajatlar
      if (flight.borderCrossings && flight.borderCrossings.length > 0) {
        lightExpensesUSD += (flight.borderCrossingsTotalUSD || 0);
      }
      if (flight.platon && flight.platon.amountInUSD) {
        lightExpensesUSD += flight.platon.amountInUSD;
      }
      
      const netProfitUSD = totalIncomeUSD - lightExpensesUSD;

      // USD maydonlarini saqlash
      flight.totalPaymentUSD = Math.round(totalPaymentUSD * 100) / 100;
      flight.totalIncomeUSD = Math.round(totalIncomeUSD * 100) / 100;
      flight.totalExpensesUSD = Math.round(totalExpensesUSD * 100) / 100;
      flight.lightExpensesUSD = Math.round(lightExpensesUSD * 100) / 100;
      flight.heavyExpensesUSD = Math.round(heavyExpensesUSD * 100) / 100;
      flight.netProfitUSD = Math.round(netProfitUSD * 100) / 100;

      // Shofyor ulushi USD da
      if (netProfitUSD > 0 && percent > 0) {
        flight.driverProfitAmountUSD = Math.round(netProfitUSD * percent / 100 * 100) / 100;
        flight.driverProfitAmount = Math.round(flight.driverProfitAmountUSD * uzsToUsdRate);
      } else {
        flight.driverProfitAmountUSD = 0;
        flight.driverProfitAmount = 0;
      }

      // Sof foyda UZS da (statistika uchun)
      flight.netProfit = Math.round(netProfitUSD * uzsToUsdRate);

      // Biznesmen foydasi USD da
      flight.businessProfitUSD = Math.round((netProfitUSD - (flight.driverProfitAmountUSD || 0)) * 100) / 100;
      flight.driverOwesUSD = flight.businessProfitUSD;

      // Valyuta kursi saqlash
      flight.exchangeRateAtClose = uzsToUsdRate;
      flight.closedWithRates = rates;
    } else {
      // Mahalliy mashrut - so'm da hisoblash
      // YANGI TIZIM: Xarajatlarni vaqti bo'yicha guruhlash
      // 1. Reys boshlanishidan oldin xarajat → Biznesmenning balansidan ayiriladi (zarar)
      // 2. Reys davomida xarajat → Reys foydasidan qoplanadi
      // 3. Reys tugagandan keyin xarajat → Qolgan foydasidan ayiriladi

      // Avvalgi reysdan qolgan pul (haydovchida)
      const previousBalance = flight.previousBalance || 0;

      const totalPaymentAmount = totalPayment;
      const totalGivenBudgetAmount = totalGivenBudget;
      const totalIncome = totalPaymentAmount + totalGivenBudgetAmount;

      // ============ HISOBLASH ALGORITMI ============
      // MUHIM: FAQAT YENGIL xarajatlar haydovchi foydasi hisobiga kiradi
      // Katta xarajatlar alohida ko'rsatiladi va biznesmen hisobidan to'lanadi
      // Sof foyda = Jami kirim - Yengil xarajatlar
      const netProfit = totalIncome - lightExpensesUZS;

      // Haqiqiy sof foyda = Avvalgi qoldiq + Reys foydasidan
      const totalNetProfit = previousBalance + netProfit;

      // Shofyor ulushi - sof foydadan hisoblanadi
      // Sof foyda allaqachon faqat yengil xarajatlar ayirilgan
      if (totalNetProfit > 0 && percent > 0) {
        flight.driverProfitAmount = Math.round(totalNetProfit * percent / 100);
      } else {
        flight.driverProfitAmount = 0;
      }

      // Biznesmen foydasi = Haqiqiy sof foyda - Shofyor ulushi
      flight.businessProfit = totalNetProfit - flight.driverProfitAmount;

      // Shofyor beradigan pul = Biznesmen foydasi
      flight.driverOwes = flight.businessProfit;

      // DEBUG - Hisoblash tekshirish
      console.log('🔍 Hisoblash:', {
        previousBalance,
        totalIncome,
        totalExpensesUZS,
        netProfit,
        totalNetProfit,
        lightExpensesUZS,
        driverProfitAmount: flight.driverProfitAmount,
        businessProfit: flight.businessProfit
      });

      // Jami kirim
      flight.totalIncome = totalIncome;

      // Sof foyda (barcha xarajatlar bilan)
      flight.netProfit = netProfit;

      // Jami xarajatlar
      flight.totalExpenses = Math.round(totalExpensesUZS);

      // Yengil va katta xarajatlarni saqlash
      flight.lightExpenses = Math.round(lightExpensesUZS);
      flight.heavyExpenses = Math.round(heavyExpensesUZS);

      // Xarajatlarni vaqti bo'yicha saqlash (hisobotlar uchun)
      flight.expensesByTiming = {
        before: Math.round(expensesBeforeUZS),
        during: Math.round(expensesDuringUZS),
        after: Math.round(expensesAfterUZS)
      };
    }

    // ============ ANIQ YOQILGʻI SARFI HISOBLASH (mashrut yopilganda) ============
    // Formula: Sarflangan = Boshlang'ich + Barcha to'ldirishlar - Oxirgi qoldiq
    if (endOdometer && flight.startOdometer) {
      const totalDistanceFinal = endOdometer - flight.startOdometer;
      flight.totalDistance = totalDistanceFinal;

      // Yoqilg'i turi bo'yicha hisoblash
      const fuelTypes = ['fuel_metan', 'fuel_propan', 'fuel_benzin', 'fuel_diesel'];
      const fuelStats = {};

      fuelTypes.forEach(fuelType => {
        const fuelExpenses = flight.expenses.filter(exp => exp.type === fuelType && exp.quantity);
        if (fuelExpenses.length > 0 || (fuelType === 'fuel_metan' && flight.startFuel)) {
          const startFuel = fuelType === 'fuel_metan' ? (flight.startFuel || 0) : 0;
          const addedFuel = fuelExpenses.reduce((sum, exp) => sum + (exp.quantity || 0), 0);
          const endFuelAmount = fuelType === 'fuel_metan' ? (endFuel || 0) : 0;

          // Aniq sarflangan yoqilg'i = Boshlang'ich + To'ldirishlar - Qoldiq
          const consumedFuel = startFuel + addedFuel - endFuelAmount;

          if (consumedFuel > 0) {
            fuelStats[fuelType] = {
              startFuel,
              addedFuel,
              endFuel: endFuelAmount,
              consumed: Math.round(consumedFuel * 10) / 10,
              // Aniq km/kub (yoki km/litr)
              efficiency: Math.round((totalDistanceFinal / consumedFuel) * 10) / 10
            };
          }
        }
      });

      flight.fuelStats = fuelStats;
    }

    await flight.save();

    // Shofyor daromadini va balansini yangilash
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

      // Daromadlarni qo'shish (agar shofyor ulushi bor bo'lsa)
      if (flight.driverProfitAmount > 0) {
        driver.totalEarnings = (driver.totalEarnings || 0) + flight.driverProfitAmount;
        driver.currentMonthEarnings = (driver.currentMonthEarnings || 0) + flight.driverProfitAmount;
        driver.pendingEarnings = (driver.pendingEarnings || 0) + flight.driverProfitAmount;
      }

      // MUHIM: Haydovchi balansini yangilash
      // Mashrut yopilganda haydovchida qoladigan pul = avvalgi qoldiq + reys foydasidan - shofyor ulushi
      // 
      // Misol: 
      // - Avvalgi qoldiq: 1,000,000
      // - Reys foydasidan: 4,500,000
      // - Shofyor ulushi (10%): 450,000 ← Bu shofyorning haqi
      // - Haydovchida qoladi: 1,000,000 + 4,500,000 - 450,000 = 5,050,000
      // - Biznesmen oladi: 4,050,000 (driverOwes)
      // - Haydovchida turadi: 5,050,000 (currentBalance)
      //
      // driverOwes = biznesmenga berishi kerak pul (netProfit - driverProfitAmount)
      // currentBalance = haydovchida qoladigan pul (previousBalance + netProfit - driverProfitAmount)

      const newBalance = (flight.previousBalance || 0) + (flight.netProfit || 0) - (flight.driverProfitAmount || 0);
      driver.currentBalance = Math.max(0, newBalance);

      // 🚀 Reys boshlanmasdan oldingi xarajatlarni o'chirish
      // Chunki ular reysga ko'chirildi va hisoblandi
      driver.expenses = (driver.expenses || []).filter(exp => exp.timing !== 'before');
      driver.totalExpensesBefore = 0;

      // Shofyor xarajatlarini hisoblab berish
      // Reys boshlanishidan oldin xarajatlar → zarar sifatida ko'rsatiladi
      // Reys davomida xarajatlar → foydadan qoplanadi
      // Reys tugagandan keyin xarajatlar → qolgan foydadan ayiriladi

      // Shofyor xarajatlarini Flight ga qo'shish (hisobotlar uchun)
      flight.driverExpensesBefore = expensesBeforeUZS;
      flight.driverExpensesDuring = expensesDuringUZS;
      flight.driverExpensesAfter = expensesAfterUZS;
      flight.driverTotalExpenses = totalExpensesUZS;

      driver.earningsLastUpdated = now;
      driver.status = 'free';
      await driver.save();
    }

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // DEBUG - qaytarilayotgan ma'lumotlarni ko'rish
    console.log('🔍 PopulatedFlight:', {
      driverProfitPercent: populatedFlight.driverProfitPercent,
      driverProfitAmount: populatedFlight.driverProfitAmount,
      businessProfit: populatedFlight.businessProfit,
      driverOwes: populatedFlight.driverOwes
    });

    // Socket xabar - mashrut yopildi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-completed', {
        flight: populatedFlight,
        message: 'Mashrut yopildi!'
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
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    flight.status = 'cancelled';
    await flight.save();

    // Shofyorni bo'shatish
    await Driver.findByIdAndUpdate(flight.driver, { status: 'free' });

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar - mashrut bekor qilindi
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-cancelled', {
        flight: populatedFlight,
        message: 'Mashrut bekor qilindi!'
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

// ============ XALQARO MASHRUT ENDPOINTLARI ============

// Valyuta kurslari (helper) - realtime API dan olinadi
const DEFAULT_CURRENCY_RATES = {
  USD: 1,
  UZS: 12850,    // O'zbekiston so'mi (CBU kursi)
  KZT: 525,      // Qozog'iston tengesi
  RUB: 103,      // Rossiya rubli (real bozor kursi)
  EUR: 0.92,     // Yevro
  TRY: 35,       // Turkiya lirasi
  CNY: 7.3,      // Xitoy yuani
  TJS: 11,       // Tojikiston somonisi
  KGS: 89,       // Qirg'iziston somi
  TMT: 3.5,      // Turkmaniston manati
  AZN: 1.7,      // Ozarbayjon manati
  GEL: 2.7,      // Gruziya larisi
  BYN: 3.3,      // Belarus rubli
  UAH: 41,       // Ukraina grivnasi
  PLN: 4,        // Polsha zlotisi
  AFN: 70,       // Afg'oniston afg'onisi
  IRR: 42000,    // Eron riyoli
  AED: 3.67      // BAA dirhami
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
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 5000 });
    if (response.data && response.data.rates) {
      currencyRatesCache.rates = { USD: 1, ...response.data.rates };
      currencyRatesCache.lastUpdated = now;
      return currencyRatesCache.rates;
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
  // UZS kursi - rates'da bo'lmasligi mumkin, shuning uchun DEFAULT_CURRENCY_RATES dan olamiz
  const uzsRate = DEFAULT_CURRENCY_RATES.UZS || 12800;
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

// Bosqich (Leg) o'chirish
router.delete('/:id/legs/:legId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Bosqichni topish va o'chirish
    const legIndex = flight.legs.findIndex(l => l._id.toString() === req.params.legId);
    if (legIndex === -1) {
      return res.status(404).json({ success: false, message: 'Bosqich topilmadi' });
    }

    flight.legs.splice(legIndex, 1);

    // Totallarni qayta hisoblash
    flight.totalPayment = flight.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);
    flight.totalGivenBudget = flight.legs.reduce((sum, leg) => sum + (leg.givenBudget || 0), 0);
    flight.totalDistance = flight.legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', {
        flight: populatedFlight,
        message: 'Bosqich o\'chirildi'
      });
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bosqich (Leg) tahrirlash
router.put('/:id/legs/:legId', protect, businessOnly, async (req, res) => {
  try {
    const { fromCity, toCity, payment, givenBudget, distance, fromCoords, toCoords, note } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const leg = flight.legs.id(req.params.legId);
    if (!leg) {
      return res.status(404).json({ success: false, message: 'Bosqich topilmadi' });
    }

    // Ma'lumotlarni yangilash
    if (fromCity) leg.fromCity = fromCity;
    if (toCity) leg.toCity = toCity;
    if (payment !== undefined) leg.payment = Number(payment);
    if (givenBudget !== undefined) leg.givenBudget = Number(givenBudget);
    if (distance !== undefined) leg.distance = Number(distance);
    if (fromCoords) leg.fromCoords = fromCoords;
    if (toCoords) leg.toCoords = toCoords;
    if (note !== undefined) leg.note = note;

    // Totallarni qayta hisoblash
    flight.totalPayment = flight.legs.reduce((sum, l) => sum + (l.payment || 0), 0);
    flight.totalGivenBudget = flight.legs.reduce((sum, l) => sum + (l.givenBudget || 0), 0);
    flight.totalDistance = flight.legs.reduce((sum, l) => sum + (l.distance || 0), 0);

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${flight.driver}`).emit('flight-updated', {
        flight: populatedFlight,
        message: 'Bosqich yangilandi'
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

// Haydovchidan pul olish (qisman yoki to'liq)
router.post('/:id/driver-payment', protect, businessOnly, async (req, res) => {
  try {
    console.log('[DriverPayment] Request body:', req.body)
    console.log('[DriverPayment] Flight ID:', req.params.id)
    console.log('[DriverPayment] User ID:', req.user?._id)
    console.log('[DriverPayment] User role:', req.user?.role)
    
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      console.log('[DriverPayment] Invalid amount:', amount)
      return res.status(400).json({ success: false, message: 'Summa kiritilmagan' });
    }

    const flight = await Flight.findOne({ _id: req.params.id, user: req.user._id });
    if (!flight) {
      console.log('[DriverPayment] Flight not found for user:', req.user._id)
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // TUZATILDI: active va completed reyslar uchun to'lov qabul qilinadi
    if (!['active', 'completed'].includes(flight.status)) {
      console.log('[DriverPayment] Flight status not valid:', flight.status)
      return res.status(400).json({ success: false, message: 'Faqat faol va yopilgan reyslar uchun to\'lov qabul qilinadi' });
    }

    const totalOwed = flight.driverOwes || 0;
    const previouslyPaid = flight.driverPaidAmount || 0;
    const remainingBefore = totalOwed - previouslyPaid;

    // TUZATILDI: Istalgan miqdorda pul olish mumkin (cheklovsiz)
    // if (amount > remainingBefore) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Qolgan qarz ${remainingBefore.toLocaleString()} so'm. Bundan ko'p qabul qilib bo'lmaydi.`
    //   });
    // }

    // To'lovni qo'shish
    if (!flight.driverPayments) {
      flight.driverPayments = [];
    }

    flight.driverPayments.push({
      amount: Number(amount),
      date: new Date(),
      note: note || ''
    });

    // Jami to'langan summani yangilash
    flight.driverPaidAmount = previouslyPaid + Number(amount);
    flight.driverRemainingDebt = totalOwed - flight.driverPaidAmount;

    // Status yangilash
    if (flight.driverRemainingDebt <= 0) {
      flight.driverPaymentStatus = 'paid';
      flight.driverPaymentDate = new Date();
    } else {
      flight.driverPaymentStatus = 'partial';
    }

    await flight.save();

    // MUHIM: Haydovchi balansini yangilash
    // Haydovchida qolgan pul = Sof foyda - Biznesmenga berilgan pul
    // Ya'ni: netProfit - driverPaidAmount
    // Bu pul keyingi reysda "avvalgi qoldiq" (previousBalance) sifatida ko'rinadi
    const driver = await Driver.findById(flight.driver);
    if (driver) {
      // MUHIM: Haydovchida qolgan pul = Biznesmenga berishi kerak - Biznesmenga bergan
      // Ya'ni: driverOwes - driverPaidAmount = driverRemainingDebt
      // Shofyor ulushi (driverProfitAmount) bu yerga kirmaydi - u shofyorniki
      driver.currentBalance = flight.driverRemainingDebt || 0;
      await driver.save();
    }

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone currentBalance')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
      io.to(`driver-${flight.driver}`).emit('flight-updated', {
        flight: populatedFlight,
        message: `${amount.toLocaleString()} so'm to'lov qabul qilindi`
      });
    }

    res.json({
      success: true,
      data: populatedFlight,
      payment: {
        amount,
        totalPaid: flight.driverPaidAmount,
        remaining: flight.driverRemainingDebt,
        status: flight.driverPaymentStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Haydovchidan olingan to'lovni bekor qilish (orqaga qaytarish)
router.delete('/:id/driver-payment/:paymentIndex', protect, businessOnly, async (req, res) => {
  try {
    const { id, paymentIndex } = req.params;
    const index = parseInt(paymentIndex);

    const flight = await Flight.findOne({ _id: id, user: req.user._id });
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (!flight.driverPayments || !flight.driverPayments[index]) {
      return res.status(404).json({ success: false, message: 'To\'lov topilmadi' });
    }

    // To'lovni olish
    const payment = flight.driverPayments[index];
    const paymentAmount = payment.amount;

    // To'lovni o'chirish
    flight.driverPayments.splice(index, 1);

    // Jami to'langan summani yangilash
    flight.driverPaidAmount = Math.max(0, (flight.driverPaidAmount || 0) - paymentAmount);
    flight.driverRemainingDebt = (flight.driverOwes || 0) - flight.driverPaidAmount;

    // Status yangilash
    if (flight.driverPaidAmount === 0) {
      flight.driverPaymentStatus = 'pending';
      flight.driverPaymentDate = null;
    } else if (flight.driverRemainingDebt <= 0) {
      flight.driverPaymentStatus = 'paid';
    } else {
      flight.driverPaymentStatus = 'partial';
    }

    await flight.save();

    // Haydovchi balansini yangilash
    const driver = await Driver.findById(flight.driver);
    if (driver) {
      driver.currentBalance = flight.driverRemainingDebt || 0;
      await driver.save();
    }

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone currentBalance')
      .populate('vehicle', 'plateNumber brand');

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`business-${req.user._id}`).emit('flight-updated', { flight: populatedFlight });
      io.to(`driver-${flight.driver}`).emit('flight-updated', {
        flight: populatedFlight,
        message: `${paymentAmount.toLocaleString()} so'm to'lov bekor qilindi`
      });
    }

    res.json({
      success: true,
      message: 'To\'lov bekor qilindi',
      data: populatedFlight,
      refundedAmount: paymentAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni o'chirish
router.delete('/:id/expenses/:expenseId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    const expenseIndex = flight.expenses.findIndex(e => e._id.toString() === req.params.expenseId);
    if (expenseIndex === -1) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    // O'chiriladigan xarajat ma'lumotlarini saqlash
    const deletedExpense = flight.expenses[expenseIndex];
    const deletedAmountInUZS = deletedExpense.amountInUZS || deletedExpense.amount || 0;
    const deletedTiming = deletedExpense.timing || 'during';
    const deletedType = deletedExpense.type;

    // Xarajatni o'chirish
    flight.expenses.splice(expenseIndex, 1);
    await flight.save();

    // 🚀 MUHIM: Driver.expenses dan ham o'chirish (faqat yengil xarajatlar)
    const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];
    const isHeavyExpense = HEAVY_EXPENSE_TYPES.includes(deletedType) || deletedExpense.expenseClass === 'heavy';

    if (!isHeavyExpense) {
      const driver = await Driver.findById(flight.driver);
      if (driver) {
        // Driver.expenses dan o'chirish
        driver.expenses = driver.expenses.filter(exp =>
          !(exp.flightId && exp.flightId.toString() === flight._id.toString() &&
            exp.date.getTime() === deletedExpense.date.getTime() &&
            exp.type === deletedType)
        );

        // Xarajat vaqti bo'yicha jami xarajatlarni yangilash
        if (deletedTiming === 'before') {
          driver.totalExpensesBefore = Math.max(0, (driver.totalExpensesBefore || 0) - deletedAmountInUZS);
        } else if (deletedTiming === 'after') {
          driver.totalExpensesAfter = Math.max(0, (driver.totalExpensesAfter || 0) - deletedAmountInUZS);
        } else {
          driver.totalExpensesDuring = Math.max(0, (driver.totalExpensesDuring || 0) - deletedAmountInUZS);
        }

        await driver.save();
      }
    }

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

module.exports = router;
