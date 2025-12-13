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
  payment: { type: Number, default: 0 }, // Mijozdan olingan to'lov (so'm)
  givenBudget: { type: Number, default: 0 }, // Yo'l xarajatlari uchun berilgan pul
  previousBalance: { type: Number, default: 0 }, // Oldingi bosqichdan qoldiq
  totalBudget: { type: Number, default: 0 }, // Jami budget = givenBudget + previousBalance
  spentAmount: { type: Number, default: 0 }, // Sarflangan summa (xarajatlar)
  balance: { type: Number, default: 0 }, // Qoldiq = totalBudget - spentAmount
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
    enum: ['fuel', 'fuel_benzin', 'fuel_diesel', 'fuel_gas', 'food', 'repair', 'toll', 'fine', 'other'],
    required: true
  },
  amount: { type: Number, required: true },
  quantity: { type: Number, default: null }, // Yoqilg'i miqdori (litr yoki kub)
  quantityUnit: { type: String, enum: ['litr', 'kub', null], default: null }, // Birlik
  description: String,
  legId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Qaysi bosqichga tegishli
  legIndex: { type: Number, default: null }, // Bosqich indeksi (0, 1, 2...)
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
  totalPayment: { type: Number, default: 0 }, // Jami to'lov (mijozdan)
  totalGivenBudget: { type: Number, default: 0 }, // Jami berilgan yo'l xarajati
  totalExpenses: { type: Number, default: 0 }, // Jami sarflangan (xarajatlar)
  totalDistance: { type: Number, default: 0 }, // Jami masofa
  finalBalance: { type: Number, default: 0 }, // Oxirgi qoldiq (qaytarilishi kerak)
  profit: { type: Number, default: 0 }, // Foyda = totalPayment - totalGivenBudget
  
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
  // Har bir bosqich uchun xarajatlar va balance hisoblash
  let previousBalance = 0;
  
  this.legs.forEach((leg, index) => {
    // Bu bosqichga tegishli xarajatlar
    const legExpenses = this.expenses.filter(exp => 
      exp.legIndex === index || (exp.legId && exp.legId.toString() === leg._id.toString())
    );
    const spentAmount = legExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Oldingi qoldiq
    leg.previousBalance = previousBalance;
    
    // Jami budget = berilgan pul + oldingi qoldiq
    leg.totalBudget = (leg.givenBudget || 0) + previousBalance;
    
    // Sarflangan
    leg.spentAmount = spentAmount;
    
    // Qoldiq = jami budget - sarflangan
    leg.balance = leg.totalBudget - spentAmount;
    
    // Keyingi bosqich uchun qoldiq
    previousBalance = leg.balance;
  });
  
  // Jami to'lov (mijozdan)
  this.totalPayment = this.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);
  
  // Jami berilgan budget
  this.totalGivenBudget = this.legs.reduce((sum, leg) => sum + (leg.givenBudget || 0), 0);
  
  // Jami masofa
  this.totalDistance = this.legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
  
  // Jami xarajatlar
  this.totalExpenses = this.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  
  // Oxirgi qoldiq (haydovchi qaytarishi kerak)
  this.finalBalance = this.legs.length > 0 ? this.legs[this.legs.length - 1].balance : 0;
  
  // Foyda = Mijozdan olgan - Yo'l uchun bergan
  this.profit = this.totalPayment - this.totalGivenBudget;
  
  // Reys nomi
  if (this.legs.length > 0) {
    const firstCity = this.legs[0].fromCity;
    const lastCity = this.legs[this.legs.length - 1].toCity;
    this.name = `${firstCity} - ${lastCity}`;
  }
  
  next();
});

module.exports = mongoose.model('Flight', flightSchema);
