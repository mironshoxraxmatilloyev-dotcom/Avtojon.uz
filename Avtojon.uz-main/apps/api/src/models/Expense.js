const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  expenseType: {
    type: String,
    enum: ['fuel', 'toll', 'repair', 'parking', 'food', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  // Yoqilg'i uchun
  fuelLiters: Number,
  fuelPricePerLiter: Number,
  odometerReading: Number,
  receiptImage: String, // Chek rasmi URL
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
