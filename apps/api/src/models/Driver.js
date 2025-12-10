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
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Shaxsiy ma'lumotlar
  fullName: {
    type: String,
    required: true
  },
  phone: String,
  passport: String, // AA1234567
  licenseNumber: String,
  // Ish ma'lumotlari
  hireDate: {
    type: Date,
    default: Date.now
  },
  // To'lov turi: 'monthly' - oylik maosh, 'per_trip' - har reys uchun
  paymentType: {
    type: String,
    enum: ['monthly', 'per_trip'],
    default: 'monthly'
  },
  // Oylik maosh (paymentType: 'monthly' bo'lganda)
  baseSalary: {
    type: Number,
    default: 0
  },
  // Har reys uchun to'lov (paymentType: 'per_trip' bo'lganda)
  perTripRate: {
    type: Number,
    default: 0
  },
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
  // GPS joylashuv - maksimal aniqlik
  lastLocation: {
    lat: Number,
    lng: Number,
    accuracy: Number,      // Aniqlik (metrda)
    speed: Number,         // Tezlik (m/s)
    heading: Number,       // Yo'nalish (gradusda)
    updatedAt: Date,
    deviceTimestamp: Date  // Qurilma vaqti
  }
}, { timestamps: true });

// Hash password
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
driverSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
