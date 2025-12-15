const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { protect, businessOnly } = require('../middleware/auth');

// Barcha reyslar
router.get('/', protect, businessOnly, async (req, res) => {
  try {
    const { status, driverId } = req.query;
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;
    if (driverId) filter.driver = driverId;

    const flights = await Flight.find(filter)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bitta reys
router.get('/:id', protect, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    res.json({ success: true, data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

    // Birinchi bosqich (ixtiyoriy)
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

// Yangi bosqich (leg) qo'shish
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

    // Oldingi bosqichni tugatish
    const lastLeg = flight.legs[flight.legs.length - 1];
    if (lastLeg && lastLeg.status === 'in_progress') {
      lastLeg.status = 'completed';
      lastLeg.completedAt = new Date();
    }

    // Yangi bosqich qo'shish
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

    // Socket xabar - yangi bosqich qo'shildi
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

// Xarajat qo'shish
router.post('/:id/expenses', protect, businessOnly, async (req, res) => {
  try {
    const { 
      type, amount, description, legIndex, legId,
      // Yoqilg'i uchun qo'shimcha
      quantity, quantityUnit, pricePerUnit,
      odometer, stationName, location
    } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Agar legIndex berilmagan bo'lsa, oxirgi bosqichga biriktirish
    const actualLegIndex = legIndex !== undefined ? legIndex : (flight.legs.length - 1);
    const actualLegId = legId || (flight.legs[actualLegIndex] ? flight.legs[actualLegIndex]._id : null);

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
      amount: Number(amount),
      description,
      legIndex: actualLegIndex,
      legId: actualLegId,
      date: new Date()
    };

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

// Xarajat o'chirish
router.delete('/:id/expenses/:expenseId', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    flight.expenses = flight.expenses.filter(e => e._id.toString() !== req.params.expenseId);
    await flight.save();

    res.json({ success: true, data: flight });
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

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni yopish (tugatish)
router.put('/:id/complete', protect, businessOnly, async (req, res) => {
  try {
    const { endOdometer, endFuel } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    if (flight.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Reys allaqachon yopilgan' });
    }

    // Oxirgi bosqichni tugatish
    const lastLeg = flight.legs[flight.legs.length - 1];
    if (lastLeg && lastLeg.status === 'in_progress') {
      lastLeg.status = 'completed';
      lastLeg.completedAt = new Date();
    }

    flight.status = 'completed';
    flight.completedAt = new Date();
    if (endOdometer) flight.endOdometer = endOdometer;
    if (endFuel !== undefined) flight.endFuel = endFuel;

    await flight.save();

    // Shofyorni bo'shatish
    await Driver.findByIdAndUpdate(flight.driver, { status: 'free' });

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

    res.json({ success: true, data: flight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reysni o'chirish
router.delete('/:id', protect, businessOnly, async (req, res) => {
  try {
    const flight = await Flight.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Agar reys faol bo'lsa, shofyorni bo'shatish
    if (flight.status === 'active') {
      await Driver.findByIdAndUpdate(flight.driver, { status: 'free' });
    }

    res.json({ success: true, message: 'Reys o\'chirildi' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ XALQARO REYS ENDPOINTLARI ============

// Valyuta kurslari (helper)
const CURRENCY_RATES = {
  USD: 1,
  UZS: 12800,
  KZT: 450,
  RUB: 90
};

const convertToUSD = (amount, currency) => {
  if (currency === 'USD') return amount;
  return amount / (CURRENCY_RATES[currency] || 1);
};

// Chegara o'tish qo'shish
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

    const curr = currency || 'USD';
    const rate = exchangeRate || CURRENCY_RATES[curr] || 1;
    const totalInOriginal = (customsFee || 0) + (transitFee || 0) + (insuranceFee || 0) + (otherFees || 0);
    const totalInUSD = convertToUSD(totalInOriginal, curr);
    // So'm da hisoblash (1 USD = 12800 so'm)
    const UZS_RATE = 12800;
    const totalInUZS = Math.round(totalInUSD * UZS_RATE);

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

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

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

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Platon yangilash
router.put('/:id/platon', protect, businessOnly, async (req, res) => {
  try {
    const { amount, currency, exchangeRate, distanceKm, note } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    const curr = currency || 'RUB';
    const rate = exchangeRate || CURRENCY_RATES[curr] || 90;

    flight.platon = {
      amount: amount || 0,
      currency: curr,
      amountInUSD: convertToUSD(amount || 0, curr),
      exchangeRate: rate,
      distanceKm: distanceKm || 0,
      note
    };

    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

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

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
