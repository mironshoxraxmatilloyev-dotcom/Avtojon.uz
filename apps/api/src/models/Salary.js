const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
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
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  baseSalary: {
    type: Number,
    default: 0
  },
  tripsCount: {
    type: Number,
    default: 0
  },
  tripsPayment: {
    type: Number,
    default: 0
  },
  totalBonus: {
    type: Number,
    default: 0
  },
  totalPenalty: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'calculated', 'approved', 'paid'],
    default: 'pending'
  },
  calculatedAt: Date,
  approvedAt: Date,
  paidAt: Date,
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Salary', salarySchema);
