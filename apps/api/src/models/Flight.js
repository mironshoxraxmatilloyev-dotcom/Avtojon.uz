const mongoose = require('mongoose');

// ============ XALQARO REYS UCHUN SXEMALAR ============

// Qo'llab-quvvatlanadigan davlatlar
const SUPPORTED_COUNTRIES = ['UZB', 'KZ', 'RU', 'TJ', 'KG', 'TM', 'AF', 'CN', 'TR', 'IR', 'AZ', 'GE', 'BY', 'UA', 'PL', 'DE', 'LT', 'LV', 'EE', 'FI'];

// Yo'nalish nuqtasi (waypoint) sxemasi
const waypointSchema = new mongoose.Schema({
  country: {
    type: String,
    enum: SUPPORTED_COUNTRIES,
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
    enum: SUPPORTED_COUNTRIES,
    required: true
  },
  toCountry: {
    type: String,
    enum: SUPPORTED_COUNTRIES,
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

// buyurtma (leg) sxemasi - har bir yo'nalish uchun
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
  previousBalance: { type: Number, default: 0 }, // Oldingi buyurtmadan qoldiq
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
    enum: ['fuel', 'fuel_benzin', 'fuel_diesel', 'fuel_gas', 'fuel_metan', 'fuel_propan', 'food', 'repair', 'toll', 'fine', 'border', 'customs', 'transit', 'insurance', 'platon', 'other'],
    required: true
  },
  amount: { type: Number, required: true }, // Asl valyutadagi summa
  
  // Valyuta ma'lumotlari (xalqaro reyslar uchun)
  currency: { 
    type: String, 
    enum: ['UZS', 'USD', 'RUB', 'KZT', 'EUR', 'TRY', 'CNY', 'TJS', 'KGS', 'TMT', 'AZN', 'GEL', 'BYN', 'UAH', 'PLN', 'AFN', 'IRR', 'AED'],
    default: 'UZS' 
  },
  amountInUSD: { type: Number, default: 0 }, // USD da
  amountInUZS: { type: Number, default: 0 }, // So'm da
  exchangeRate: { type: Number, default: 1 }, // Valyuta kursi (USD ga nisbatan)
  
  // Qaysi davlatda sarflangan
  country: { 
    type: String, 
    enum: ['UZB', 'KZ', 'RU', 'TJ', 'KG', 'TM', 'AF', 'CN', 'TR', 'IR', 'AZ', 'GE', 'BY', 'UA', 'PL', 'DE', 'LT', 'LV', 'EE', 'FI', null],
    default: null 
  },
  
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
  
  // Chegara xarajatlari uchun (border, customs, transit, insurance)
  borderInfo: {
    fromCountry: { type: String, default: null },
    toCountry: { type: String, default: null },
    borderName: { type: String, default: null }
  },
  
  // Qaysi buyurtmaga tegishli
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
    enum: SUPPORTED_COUNTRIES
  }],
  
  // Boshlang'ich ma'lumotlar
  startOdometer: { type: Number, default: 0 }, // Boshlang'ich odometr (km)
  startFuel: { type: Number, default: 0 }, // Bakdagi yoqilg'i
  fuelType: { 
    type: String, 
    enum: ['benzin', 'diesel', 'gas', 'metan', 'propan'],
    default: 'benzin'
  },
  fuelUnit: {
    type: String,
    enum: ['litr', 'kub'],
    default: 'litr'
  },
  
  // Tugatish ma'lumotlari
  endOdometer: { type: Number, default: 0 },
  endFuel: { type: Number, default: 0 },
  
  // buyurtmalar (cheksiz)
  legs: [legSchema],
  
  // Xarajatlar (biznesmen kiritadi)
  expenses: [expenseSchema],
  
  // Hisob-kitob
  totalPayment: { type: Number, default: 0 }, // Jami to'lov (mijozdan)
  totalGivenBudget: { type: Number, default: 0 }, // Jami berilgan yo'l xarajati
  totalExpenses: { type: Number, default: 0 }, // Jami sarflangan (xarajatlar) - so'm da
  totalExpensesUSD: { type: Number, default: 0 }, // Jami xarajatlar USD da
  totalDistance: { type: Number, default: 0 }, // Jami masofa
  
  // Yo'l puli (biznesmen shofyorga bergan pul)
  roadMoney: { type: Number, default: 0 }, // Yo'l uchun berilgan pul (so'm)
  
  // YANGI HISOB-KITOB TIZIMI
  totalIncome: { type: Number, default: 0 }, // Jami kirim = mijozdan + yo'l uchun
  netProfit: { type: Number, default: 0 }, // Sof foyda = totalIncome - totalExpenses
  
  // Shofyor ulushi (sof foydadan %)
  driverProfitPercent: { type: Number, default: 0 }, // Foydadan necha % shofyorga
  driverProfitAmount: { type: Number, default: 0 }, // Shofyorga beriladigan summa (so'm)
  
  // Biznesmen foydasi va shofyor beradigan pul
  businessProfit: { type: Number, default: 0 }, // Biznesmen foydasi = netProfit - driverProfitAmount
  driverOwes: { type: Number, default: 0 }, // Shofyor beradigan pul = businessProfit (yoki totalIncome - totalExpenses - driverProfitAmount)
  
  // ============ XALQARO REYS UCHUN USD MAYDONLARI ============
  totalPaymentUSD: { type: Number, default: 0 }, // Jami to'lov USD da
  totalIncomeUSD: { type: Number, default: 0 }, // Jami kirim USD da
  netProfitUSD: { type: Number, default: 0 }, // Sof foyda USD da
  driverProfitAmountUSD: { type: Number, default: 0 }, // Shofyor ulushi USD da
  businessProfitUSD: { type: Number, default: 0 }, // Biznesmen foydasi USD da
  driverOwesUSD: { type: Number, default: 0 }, // Shofyor beradi USD da
  exchangeRateAtClose: { type: Number, default: 0 }, // Yopilgandagi kurs (1 USD = ? so'm)
  
  // Eski maydonlar (backward compatibility)
  finalBalance: { type: Number, default: 0 }, // Yo'l puli qoldig'i (eski)
  profit: { type: Number, default: 0 }, // Eski foyda (mijozdan - xarajat)
  
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Haydovchi tasdiqlagan yoki yo'qligini belgilash
  driverConfirmed: { type: Boolean, default: false },
  driverConfirmedAt: { type: Date, default: null },
  
  // Shofyor to'lov statusi (pul berdi/bermadi)
  driverPaymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  driverPaymentDate: { type: Date, default: null },
  
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

  // Har bir buyurtma uchun xarajatlar va balance hisoblash
  let previousBalance = 0;
  
  this.legs.forEach((leg, index) => {
    // Bu buyurtmaga tegishli xarajatlar
    const legExpenses = this.expenses.filter(exp => 
      exp.legIndex === index || (exp.legId && exp.legId.toString() === leg._id.toString())
    );
    const spentAmount = legExpenses.reduce((sum, exp) => sum + (exp.amountInUZS || exp.amount || 0), 0);
    
    // Oldingi qoldiq
    leg.previousBalance = previousBalance;
    
    // Jami budget = berilgan pul + oldingi qoldiq
    leg.totalBudget = (leg.givenBudget || 0) + previousBalance;
    
    // Sarflangan
    leg.spentAmount = spentAmount;
    
    // Qoldiq = jami budget - sarflangan
    leg.balance = leg.totalBudget - spentAmount;
    
    // Keyingi buyurtma uchun qoldiq
    previousBalance = leg.balance;
  });
  
  // Jami to'lov (mijozdan)
  this.totalPayment = this.legs.reduce((sum, leg) => sum + (leg.payment || 0), 0);
  
  // Jami berilgan budget
  this.totalGivenBudget = this.legs.reduce((sum, leg) => sum + (leg.givenBudget || 0), 0);
  
  // Yo'l puli = jami berilgan budget
  this.roadMoney = this.totalGivenBudget;
  
  // Jami masofa
  this.totalDistance = this.legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
  
  // ============ XARAJATLAR HISOBLASH (USD va UZS) ============
  let totalExpensesUZS = 0;
  let totalExpensesUSD = 0;
  
  this.expenses.forEach(exp => {
    // Agar amountInUZS va amountInUSD mavjud bo'lsa
    if (exp.amountInUZS) {
      totalExpensesUZS += exp.amountInUZS;
    } else {
      // Eski format - amount so'm da deb hisoblaymiz
      totalExpensesUZS += exp.amount || 0;
    }
    
    if (exp.amountInUSD) {
      totalExpensesUSD += exp.amountInUSD;
    } else {
      // Eski format - so'm dan USD ga konvertatsiya (1 USD = 12800 so'm)
      totalExpensesUSD += (exp.amount || 0) / 12800;
    }
  });
  
  // Chegara xarajatlarini ham qo'shish
  if (this.borderCrossings && this.borderCrossings.length > 0) {
    totalExpensesUSD += this.borderCrossingsTotalUSD || 0;
    totalExpensesUZS += this.borderCrossingsTotalUZS || 0;
  }
  
  // Platon xarajatini qo'shish
  if (this.platon && this.platon.amountInUSD) {
    totalExpensesUSD += this.platon.amountInUSD;
    totalExpensesUZS += Math.round(this.platon.amountInUSD * 12800);
  }
  
  this.totalExpenses = Math.round(totalExpensesUZS);
  this.totalExpensesUSD = Math.round(totalExpensesUSD * 100) / 100;
  
  // Oxirgi qoldiq (haydovchi qaytarishi kerak) - eski
  // finalBalance = Jami berilgan pul - Jami xarajatlar
  this.finalBalance = this.totalGivenBudget - this.totalExpenses;
  
  // Eski foyda (backward compatibility)
  this.profit = this.totalPayment - this.totalExpenses;
  
  // ============ YANGI HISOB-KITOB TIZIMI ============
  // 1. Jami kirim = Mijozdan olingan + Yo'l uchun berilgan
  this.totalIncome = this.totalPayment + this.totalGivenBudget;
  
  // 2. Sof foyda = Jami kirim - Jami xarajatlar
  this.netProfit = this.totalIncome - this.totalExpenses;
  
  // 3. Shofyor ulushi (faqat sof foyda musbat bo'lsa)
  const percent = this.driverProfitPercent || 0;
  if (this.netProfit > 0 && percent > 0) {
    this.driverProfitAmount = Math.round(this.netProfit * percent / 100);
  } else {
    this.driverProfitAmount = 0;
  }
  
  // 4. Biznesmen foydasi = Sof foyda - Shofyor ulushi
  this.businessProfit = this.netProfit - this.driverProfitAmount;
  
  // 5. Shofyor beradigan pul = Biznesmen foydasi
  // (Shofyor qo'lida: totalIncome, sarfladi: totalExpenses, o'ziga oldi: driverProfitAmount)
  // Qolgan pul = totalIncome - totalExpenses - driverProfitAmount = businessProfit
  this.driverOwes = this.businessProfit;
  
  // Reys nomi
  if (this.legs.length > 0) {
    const firstCity = this.legs[0].fromCity;
    const lastCity = this.legs[this.legs.length - 1].toCity;
    this.name = `${firstCity} - ${lastCity}`;
  }
  
  next();
});

// 🚀 Indexlar - tez qidiruv uchun
flightSchema.index({ user: 1, status: 1 }); // Biznesmen reyslari
flightSchema.index({ driver: 1, status: 1 }); // Shofyor reyslari
flightSchema.index({ user: 1, createdAt: -1 }); // Oxirgi reyslar
flightSchema.index({ status: 1, createdAt: -1 }); // Faol reyslar

module.exports = mongoose.model('Flight', flightSchema);
