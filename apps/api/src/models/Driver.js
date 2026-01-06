const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Login ma'lumotlari
  username: {
    type: String,
    required: [true, 'Username kiritilishi shart'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username kamida 3 ta belgidan iborat bo\'lishi kerak'],
    maxlength: [30, 'Username 30 ta belgidan oshmasligi kerak']
  },
  password: {
    type: String,
    required: [true, 'Parol kiritilishi shart'],
    minlength: [6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak']
  },
  // Shaxsiy ma'lumotlar
  fullName: {
    type: String,
    required: [true, 'To\'liq ism kiritilishi shart'],
    trim: true,
    minlength: [2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'],
    maxlength: [100, 'Ism 100 ta belgidan oshmasligi kerak']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Telefon raqam 20 ta belgidan oshmasligi kerak']
  },
  passport: {
    type: String,
    trim: true,
    maxlength: [20, 'Passport 20 ta belgidan oshmasligi kerak']
  },
  licenseNumber: {
    type: String,
    trim: true,
    maxlength: [30, 'Guvohnoma raqami 30 ta belgidan oshmasligi kerak']
  },
  // Ish ma'lumotlari
  hireDate: {
    type: Date,
    default: Date.now
  },
  // To'lov turi
  paymentType: {
    type: String,
    enum: ['monthly', 'per_trip'],
    default: 'monthly'
  },
  // Oylik maosh
  baseSalary: {
    type: Number,
    default: 0,
    min: [0, 'Maosh salbiy bo\'lishi mumkin emas']
  },
  // Har mashrut uchun foiz
  perTripRate: {
    type: Number,
    default: 0,
    min: [0, 'Foiz salbiy bo\'lishi mumkin emas'],
    max: [100, 'Foiz 100 dan oshishi mumkin emas']
  },
  // Daromadlar
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  currentMonthEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  earningsLastUpdated: {
    type: Date,
    default: null
  },
  // Haydovchidagi joriy pul (avvalgi mashrutlardan qolgan)
  currentBalance: {
    type: Number,
    default: 0
  },
  // To'lov tarixi
  salaryPayments: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'To\'lov salbiy bo\'lishi mumkin emas']
    },
    paidAt: { type: Date, default: Date.now },
    period: String,
    note: String
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['free', 'busy', 'offline'],
    default: 'free'
  },
  // GPS joylashuv
  lastLocation: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 },
    speed: { type: Number, min: 0 },
    heading: { type: Number, min: 0, max: 360 },
    updatedAt: Date,
    deviceTimestamp: Date
  },
  // Shofyor xarajatlari (reys boshlanishidan oldin, davomida, yopilgandan keyin)
  expenses: [{
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      default: null
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Xarajat salbiy bo\'lishi mumkin emas']
    },
    type: {
      type: String,
      // Barcha xarajat turlari - constants.js bilan bir xil
      enum: [
        // Yoqilg'i turlari
        'fuel', 'fuel_metan', 'fuel_propan', 'fuel_benzin', 'fuel_diesel',
        // Yengil xarajatlar
        'food', 'toll', 'wash', 'fine', 'repair_small', 'other',
        // Katta xarajatlar
        'repair_major', 'tire', 'accident', 'insurance', 'oil',
        // Filtr turlari
        'filter', 'filter_air', 'filter_oil', 'filter_cabin', 'filter_gas',
        // Chegara xarajatlari
        'border', 'border_customs', 'border_transit', 'border_insurance', 'border_other'
      ],
      default: 'other'
    },
    // Xarajat qo'shilgan vaqti
    timing: {
      type: String,
      enum: ['before', 'during', 'after'],
      default: 'during'
    },
    description: String,
    date: { type: Date, default: Date.now }
  }],
  // Jami xarajatlar (reys boshlanishidan oldin)
  totalExpensesBefore: {
    type: Number,
    default: 0,
    min: 0
  },
  // Jami xarajatlar (reys davomida)
  totalExpensesDuring: {
    type: Number,
    default: 0,
    min: 0
  },
  // Jami xarajatlar (reys yopilgandan keyin)
  totalExpensesAfter: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Hash password
driverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 8); // 8 rounds - tezroq
  next();
});

// Compare password
driverSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 🚀 Indexlar - tez qidiruv uchun
driverSchema.index({ user: 1, status: 1 }); // Biznesmen shofyorlari
driverSchema.index({ user: 1, isActive: 1 }); // Aktiv shofyorlar
// username uchun index allaqachon unique: true orqali yaratilgan
driverSchema.index({ 'lastLocation.updatedAt': -1 }); // GPS yangilanish

module.exports = mongoose.model('Driver', driverSchema);
