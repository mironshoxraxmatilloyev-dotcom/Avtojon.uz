const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// ============ PERITSENA TO'LOVLARI ============

// Yangi Peritsena to'lovini qo'shish
router.post('/', protect, asyncHandler(async (req, res) => {
  const { flightId, amount, companyFeePercent = 10, notes } = req.body;
  
  // Validatsiya
  if (!flightId || !amount) {
    return res.status(400).json({ 
      success: false, 
      message: 'Flight ID va summa kiritilishi shart' 
    });
  }

  // Reysni topamiz
  const flight = await Flight.findById(flightId);
  if (!flight) {
    return res.status(404).json({ 
      success: false, 
      message: 'Reys topilmadi' 
    });
  }

  // Foizni tekshirish (1-100 orasida bo'lishi kerak)
  const feePercent = Math.min(Math.max(1, parseInt(companyFeePercent) || 10), 100);
  
  // Summalarni hisoblaymiz
  const companyFee = Math.round(amount * (feePercent / 100));
  const driverAmount = amount - companyFee;

  // Yangi to'lov yozuvini yaratamiz
  const payment = {
    amount: amount,
    date: new Date(),
    note: notes || 'Peritsena to\'lovi',
    isPeritsena: true,
    companyFeePercent: feePercent,
    companyFeeAmount: companyFee,
    driverAmount: driverAmount
  };

  // Reysga to'lovni qo'shamiz
  flight.driverPayments.push(payment);
  
  // Statistikani yangilaymiz
  flight.peritsenaStats.totalAmount += amount;
  flight.peritsenaStats.companyEarnings += companyFee;
  flight.peritsenaStats.driverEarnings += driverAmount;

  // Reysni saqlaymiz
  await flight.save();

  res.status(201).json({
    success: true,
    data: {
      payment: {
        amount: payment.amount,
        date: payment.date,
        companyFee: payment.companyFeeAmount,
        driverAmount: payment.driverAmount,
        companyFeePercent: payment.companyFeePercent,
        note: payment.note
      },
      stats: flight.peritsenaStats
    }
  });
}));

// Reysdagi barcha Peritsena to'lovlarini olish
router.get('/:flightId', protect, asyncHandler(async (req, res) => {
  const { flightId } = req.params;

  const flight = await Flight.findById(flightId, {
    'driverPayments': { $filter: { input: '$driverPayments', as: 'payment', cond: { $eq: ['$$payment.isPeritsena', true] } } },
    'peritsenaStats': 1
  });

  if (!flight) {
    return res.status(404).json({ 
      success: false, 
      message: 'Reys topilmadi' 
    });
  }

  res.json({
    success: true,
    data: {
      payments: flight.driverPayments,
      stats: flight.peritsenaStats
    }
  });
}));

module.exports = router;
