const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { protect, driverOnly } = require('../middleware/auth');
const { locationLimiter } = require('../middleware/rateLimiter');
const { validate, driverSchemas } = require('../utils/validators');
const { asyncHandler } = require('../middleware/errorHandler');

// Shofyor o'z ma'lumotlari
router.get('/me', protect, driverOnly, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driver._id).select('-password');
    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🚀 TEZKOR: Barcha ma'lumotlarni bitta so'rovda olish
router.get('/me/dashboard', protect, driverOnly, async (req, res) => {
  try {
    // Parallel so'rovlar
    const [driver, flights] = await Promise.all([
      Driver.findById(req.driver._id).select('-password').lean(),
      Flight.find({ driver: req.driver._id })
        .populate('vehicle', 'plateNumber brand model')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ]);

    // Faol mashrut
    const activeFlight = flights.find(f => f.status === 'active') || null;
    
    // Tugallangan reyslar (oxirgi 10 ta)
    const completedFlights = flights.filter(f => f.status === 'completed').slice(0, 10);
    
    // Statistika
    const stats = {
      totalCompletedFlights: flights.filter(f => f.status === 'completed').length,
      totalEarnings: flights.reduce((sum, f) => sum + (f.driverProfitAmount || 0), 0)
    };

    res.json({ 
      success: true, 
      data: {
        driver,
        activeFlight,
        completedFlights,
        allFlights: flights,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GPS joylashuvni yuborish - Real-time Socket.io
router.post('/me/location', protect, driverOnly, locationLimiter, validate(driverSchemas.location), asyncHandler(async (req, res) => {
  const { lat, lng, accuracy, speed, heading, timestamp } = req.body;
  
  const accuracyNum = accuracy || null;
  const isAccurate = accuracyNum ? accuracyNum < 100 : true;
  
  const locationData = { 
    lat, 
    lng, 
    accuracy: accuracyNum,
    speed: speed ? parseFloat(speed) : null,
    heading: heading ? parseFloat(heading) : null,
    updatedAt: new Date(),
    deviceTimestamp: timestamp ? new Date(timestamp) : null
  };

  await Driver.findByIdAndUpdate(req.driver._id, { lastLocation: locationData });

  // Socket.io orqali biznesmenga real-time yuborish
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
}));

// Shofyorga biriktirilgan mashinalar
router.get('/me/vehicles', protect, driverOnly, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ 
      user: req.driver.user,
      $or: [{ currentDriver: req.driver._id }, { currentDriver: null }]
    });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Shofyor reyslari (trips -> flights ga yo'naltirish)
router.get('/me/trips', protect, driverOnly, async (req, res) => {
  try {
    const flights = await Flight.find({ driver: req.driver._id })
      .populate('vehicle', 'plateNumber brand model')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

// Faol mashrut olish
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

// Reysni tasdiqlash (haydovchi)
router.put('/me/flights/:id/confirm', protect, driverOnly, async (req, res) => {
  try {
    const flight = await Flight.findOne({ 
      _id: req.params.id, 
      driver: req.driver._id,
      status: 'active'
    });
    
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Faol mashrut topilmadi' });
    }

    if (flight.driverConfirmed) {
      return res.status(400).json({ success: false, message: 'Mashrut allaqachon tasdiqlangan' });
    }

    flight.driverConfirmed = true;
    flight.driverConfirmedAt = new Date();
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    const io = req.app.get('io');
    if (io) {
      io.to(`business-${flight.user.toString()}`).emit('flight-confirmed', {
        flight: populatedFlight,
        message: `${req.driver.fullName} reysni tasdiqladi!`
      });
    }

    res.json({ success: true, data: populatedFlight, message: 'Mashrut tasdiqlandi!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Buyurtmani tugatish
router.put('/me/flights/:id/legs/:legId/complete', protect, driverOnly, async (req, res) => {
  try {
    const flight = await Flight.findOne({ 
      _id: req.params.id, 
      driver: req.driver._id,
      status: 'active'
    });
    
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Faol mashrut topilmadi' });
    }

    const leg = flight.legs.id(req.params.legId);
    if (!leg) {
      return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
    }

    leg.status = 'completed';
    leg.completedAt = new Date();
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    const io = req.app.get('io');
    if (io) {
      io.to(`business-${flight.user.toString()}`).emit('flight-updated', {
        flight: populatedFlight,
        message: `${req.driver.fullName} buyurtmani tugatdi: ${leg.fromCity} → ${leg.toCity}`
      });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajat qo'shish (Flight tizimi)
router.post('/me/flights/:id/expenses', protect, driverOnly, async (req, res) => {
  try {
    const { type, amount, description, quantity, quantityUnit, pricePerUnit, location, stationName, odometer } = req.body;

    const flight = await Flight.findOne({ 
      _id: req.params.id, 
      driver: req.driver._id,
      status: 'active'
    });
    
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Faol mashrut topilmadi' });
    }

    let distanceSinceLast = null;
    let fuelConsumption = null;
    
    if (type && type.startsWith('fuel_') && odometer) {
      const lastFuelExpense = [...flight.expenses]
        .reverse()
        .find(exp => exp.type && exp.type.startsWith('fuel_') && exp.odometer);
      
      if (lastFuelExpense && lastFuelExpense.odometer) {
        distanceSinceLast = odometer - lastFuelExpense.odometer;
        if (lastFuelExpense.quantity && distanceSinceLast > 0) {
          fuelConsumption = Math.round((lastFuelExpense.quantity / distanceSinceLast) * 100 * 10) / 10;
        }
      } else if (flight.startOdometer) {
        distanceSinceLast = odometer - flight.startOdometer;
      }
    }

    const expenseData = {
      type: type || 'other',
      amount: Number(amount) || 0,
      description,
      date: new Date(),
      legIndex: flight.legs.length > 0 ? flight.legs.length - 1 : 0
    };

    if (type && type.startsWith('fuel_')) {
      expenseData.quantity = quantity ? Number(quantity) : null;
      expenseData.quantityUnit = quantityUnit || (type === 'fuel_gas' || type === 'fuel_metan' ? 'kub' : 'litr');
      expenseData.pricePerUnit = pricePerUnit ? Number(pricePerUnit) : null;
      expenseData.stationName = stationName || null;
      expenseData.odometer = odometer ? Number(odometer) : null;
      expenseData.distanceSinceLast = distanceSinceLast;
      expenseData.fuelConsumption = fuelConsumption;
    }

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

    const io = req.app.get('io');
    if (io) {
      const expenseLabel = type && type.startsWith('fuel_') ? 'yoqilg\'i oldi' : 'xarajat qo\'shdi';
      io.to(`business-${flight.user.toString()}`).emit('flight-updated', {
        flight: populatedFlight,
        message: `${req.driver.fullName} ${expenseLabel}`
      });
    }

    res.json({ success: true, data: populatedFlight });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xarajatni tasdiqlash (haydovchi)
router.put('/me/flights/:id/expenses/:expenseId/confirm', protect, driverOnly, async (req, res) => {
  try {
    const flight = await Flight.findOne({ 
      _id: req.params.id, 
      driver: req.driver._id
    });
    
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Mashrut topilmadi' });
    }

    const expense = flight.expenses.id(req.params.expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Xarajat topilmadi' });
    }

    if (expense.confirmedByDriver) {
      return res.status(400).json({ success: false, message: 'Xarajat allaqachon tasdiqlangan' });
    }

    expense.confirmedByDriver = true;
    expense.confirmedAt = new Date();
    await flight.save();

    const populatedFlight = await Flight.findById(flight._id)
      .populate('driver', 'fullName phone')
      .populate('vehicle', 'plateNumber brand');

    // Biznesmenga xabar yuborish
    const io = req.app.get('io');
    if (io) {
      // user ObjectId ni string ga o'girish
      const businessId = flight.user.toString();
      const businessRoom = `business-${businessId}`;
      
      // Room da qancha client borligini tekshirish
      const room = io.sockets.adapter.rooms.get(businessRoom);
      const roomSize = room ? room.size : 0;
      
      console.log('═══════════════════════════════════════════');
      console.log('📤 EXPENSE CONFIRMED - SOCKET DEBUG');
      console.log('═══════════════════════════════════════════');
      console.log('📤 Flight ID:', flight._id.toString());
      console.log('📤 Flight user (businessId):', businessId);
      console.log('📤 Target room:', businessRoom);
      console.log('📤 Room size (clients):', roomSize);
      console.log('📤 Driver:', req.driver.fullName);
      console.log('📤 Expense ID:', req.params.expenseId);
      
      // Barcha roomlarni ko'rsatish
      const allRooms = [];
      io.sockets.adapter.rooms.forEach((sockets, roomName) => {
        if (roomName.startsWith('business-') || roomName.startsWith('driver-')) {
          allRooms.push({ room: roomName, clients: sockets.size });
        }
      });
      console.log('📤 All active rooms:', JSON.stringify(allRooms));
      console.log('═══════════════════════════════════════════');
      
      // expense-confirmed eventi
      io.to(businessRoom).emit('expense-confirmed', {
        flight: populatedFlight,
        expenseId: req.params.expenseId,
        message: `${req.driver.fullName} xarajatni tasdiqladi`
      });
      
      // flight-updated eventi ham yuboramiz (backup sifatida)
      io.to(businessRoom).emit('flight-updated', {
        flight: populatedFlight,
        message: `✅ ${req.driver.fullName} xarajatni tasdiqladi`
      });
      
      console.log('📤 Events emitted to room:', businessRoom);
    } else {
      console.log('❌ Socket.io not available');
    }

    res.json({ success: true, data: populatedFlight, message: 'Xarajat tasdiqlandi!' });
  } catch (error) {
    console.error('Expense confirm error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
