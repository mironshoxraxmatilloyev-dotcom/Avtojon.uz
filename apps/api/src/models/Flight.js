const mongoose = require('mongoose');

// Bosqich (leg) sxemasi - har bir yo'nalish uchun
const legSchema = new mongoose.Schema({
  fromCity: { type: String, required: true },
  toCity: { type: String, required: true },
  // Koordinatalar (xarita uchun) - ixtiyoriy
  fromCoords: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  toCoords: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  payment: { type: Number, default: 0 }, // Bu bosqich uchun to'lov (so'm)
  distance: { type: Number, default: 0 }, // km
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  note: String
}, { _id: true, timestamps: true });

// Xarajat sxemasi
const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['fuel', 'food', 'repair', 'toll', 'fine', 'parking', 'other'],
    required: true
  },
  amount: { type: Number, required: true },
  description: String,
  currency: { type: String, default: 'UZS' }, // UZS, USD, KZT, RUB
  country: { type: String, default: 'UZB' }, // UZB, QZ, RU
  legIndex: Number, // Qaysi bosqichda bo'lgan (ixtiyoriy)
  date: { type: Date, default: Date.now }
}, { _id: true });

// Asosiy Flight (Reys) modeli
const flightSchema = new mongoose.Schema({
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
    ref: 'Vehicle',
    required: true
  },
  
  // Reys nomi (avtomatik: birinchi va oxirgi shahar)
  name: String,
  
  // Reys turi: 'domestic' - O'zbekiston ichida, 'international' - Xalqaro
  flightType: {
    type: String,
    enum: ['domestic', 'international'],
    default: 'domestic'
  },
  
  // Boshlang'ich ma'lumotlar
  startOdometer: { type: Number, default: 0 }, // Boshlang'ich odometr (km)
  startFuel: { type: Number, default: 0 }, // Bakdagi yoqilg'i (litr)
  
  // Tugatish ma'lumotlari
  endOdometer: { type: Number, default: 0 },
  endFuel: { type: Number, default: 0 },
  
  // Bosqichlar (cheksiz)
  legs: [legSchema],
  
  // Xarajatlar (biznesmen kiritadi)
  expenses: [expenseSchema],
  
  // Hisob-kitob
  totalPayment: { type: Number, default: 0 }, // Jami to'lov (barcha bosqichlar)
  totalExpenses: { type: Number, default: 0 }, // Jami xarajatlar
  totalDistance: { type: Number, default: 0 }, // Jami masofa
  profit: { type: Number, default: 0 }, // Foyda = totalPayment - totalExpenses
  
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  notes: String
}, { timestamps: true });

// Saqlashdan oldin hisob-kitob
flightSchema.pre('save', function(next) {
  // Jami to'lov
  this.totalPayment = this.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);
  
  // Jami masofa
  this.totalDistance = this.legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
  
  // Jami xarajatlar
  this.totalExpenses = this.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  // Foyda
  this.profit = this.totalPayment - this.totalExpenses;
  
  // Reys nomi
  if (this.legs.length > 0) {
    const firstCity = this.legs[0].fromCity;
    const lastCity = this.legs[this.legs.length - 1].toCity;
    this.name = `${firstCity} - ${lastCity}`;
  }
  
  next();
});

module.exports = mongoose.model('Flight', flightSchema);
