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
    const { driverId, vehicleId, startOdometer, startFuel, firstLeg, notes } = req.body;

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

    // Socket xabar
    const io = req.app.get('io');
    if (io) {
      io.to(`driver-${driverId}`).emit('flight-started', {
        flight: populatedFlight,
        message: 'Yangi reys boshlandi!'
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

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat qo'shish
router.post('/:id/expenses', protect, businessOnly, async (req, res) => {
  try {
    const { type, amount, description, legIndex, legId } = req.body;

    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Reys topilmadi' });
    }

    // Agar legIndex berilmagan bo'lsa, oxirgi bosqichga biriktirish
    const actualLegIndex = legIndex !== undefined ? legIndex : (flight.legs.length - 1);
    const actualLegId = legId || (flight.legs[actualLegIndex] ? flight.legs[actualLegIndex]._id : null);

    flight.expenses.push({
      type,
      amount,
      description,
      legIndex: actualLegIndex,
      legId: actualLegId,
      date: new Date()
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

module.exports = router;
