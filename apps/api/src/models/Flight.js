const mongoose = require('mongoose');

// ============ XALQARO REYS UCHUN SXEMALAR ============

// Yo'nalish nuqtasi (waypoint) sxemasi
const waypointSchema = new mongoose.Schema({
  country: {
    type: String,
    enum: ['UZB', 'KZ', 'RU'],
    required: true
  },
  city: {
    type: String,
    required: true
  },
  address: String,
  coords: {
    lat: Number,
    lng: Number
  },
  type: {
    type: String,
    enum: ['start', 'transit', 'end'],
    default: 'transit'
  },
  order: { type: Number, default: 0 },
  arrivedAt: Date,
  departedAt: Date
}, { _id: true });

// Chegara o'tish xarajati sxemasi
const borderCrossingSchema = new mongoose.Schema({
  fromCountry: {
    type: String,
    enum: ['UZB', 'KZ', 'RU'],
    required: true
  },
  toCountry: {
    type: String,
    enum: ['UZB', 'KZ', 'RU'],
    required: true
  },
  borderName: String,
  customsFee: { type: Number, default: 0 },
  transitFee: { type: Number, default: 0 },
  insuranceFee: { type: Number, default: 0 },
  otherFees: { type: Number, default: 0 },
  currency: {
    type: String,
    enum: ['UZS', 'KZT', 'RUB', 'USD'],
    default: 'USD'
  },
  totalInOriginal: { type: Number, default: 0 },
  totalInUSD: { type: Number, default: 0 },
  totalInUZS: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 1 },
  crossedAt: Date,
  note: String
}, { _id: true });

// Platon to'lovi sxemasi (Rossiya yo'l to'lovi)
const platonSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
  currency: {
    type: String,
    enum: ['RUB', 'USD'],
    default: 'RUB'
  },
  amountInUSD: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 1 },
  distanceKm: { type: Number, default: 0 },
  note: String
}, { _id: false });

// Davlat bo'yicha xarajatlar xulosasi
const countryExpenseSummarySchema = new mongoose.Schema({
  distanceKm: { type: Number, default: 0 },
  fuelLiters: { type: Number, default: 0 },
  fuelCostUSD: { type: Number, default: 0 },
  roadExpensesUSD: { type: Number, default: 0 },
  totalUSD: { type: Number, default: 0 }
}, { _id: false });

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
    enum: ['fuel', 'fuel_benzin', 'fuel_diesel', 'fuel_gas', 'fuel_metan', 'fuel_propan', 'food', 'repair', 'toll', 'fine', 'other'],
    required: true
  },
  amount: { type: Number, required: true }, // Jami summa (so'm)
  
  // Yoqilg'i uchun batafsil ma'lumotlar
  quantity: { type: Number, default: null }, // Miqdor (litr yoki kub)
  quantityUnit: { type: String, enum: ['litr', 'kub', null], default: null },
  pricePerUnit: { type: Number, default: null }, // 1 litr/kub narxi
  
  // Joylashuv ma'lumotlari
  location: {
    name: { type: String, default: null }, // Manzil nomi (shahar, AZS nomi)
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  
  // Odometr ma'lumotlari
  odometer: { type: Number, default: null }, // Xarajat paytidagi odometr
  distanceSinceLast: { type: Number, default: null }, // Oldingi yoqilg'idan beri yurgan km
  fuelConsumption: { type: Number, default: null }, // Sarflanish (litr/100km)
  
  // Qo'shimcha
  stationName: { type: String, default: null }, // AZS nomi
  receiptImage: { type: String, default: null }, // Chek rasmi URL
  description: String,
  
  // Qaysi bosqichga tegishli
  legId: { type: mongoose.Schema.Types.ObjectId, default: null },
  legIndex: { type: Number, default: null },
  
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
  
  // ============ XALQARO REYS MAYDONLARI ============
  // Yo'nalish nuqtalari
  waypoints: [waypointSchema],
  
  // Chegara o'tish xarajatlari
  borderCrossings: [borderCrossingSchema],
  borderCrossingsTotalUSD: { type: Number, default: 0 },
  borderCrossingsTotalUZS: { type: Number, default: 0 },
  
  // Platon (Rossiya yo'l to'lovi)
  platon: platonSchema,
  
  // Davlatlar bo'yicha xarajatlar xulosasi
  countryExpenses: {
    uzb: countryExpenseSummarySchema,
    kz: countryExpenseSummarySchema,
    ru: countryExpenseSummarySchema
  },

  // Qaysi davlatlardan o'tadi
  countriesInRoute: [{
    type: String,
    enum: ['UZB', 'KZ', 'RU']
  }],
  
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
  // ============ XALQARO REYS HISOBLARI ============
  
  // Chegara o'tish xarajatlari jami
  if (this.borderCrossings && this.borderCrossings.length > 0) {
    this.borderCrossingsTotalUSD = this.borderCrossings.reduce(
      (sum, bc) => sum + (bc.totalInUSD || 0), 0
    );
    // So'm da jami (1 USD = 12800 so'm)
    this.borderCrossingsTotalUZS = Math.round(this.borderCrossingsTotalUSD * 12800);
  }

  // Davlatlar ro'yxatini waypoints dan olish
  if (this.waypoints && this.waypoints.length > 0) {
    const countries = [...new Set(this.waypoints.map(w => w.country))];
    this.countriesInRoute = countries;
  }

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
  
  // Foyda = Mijozdan olgan - Sarflangan xarajatlar
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
