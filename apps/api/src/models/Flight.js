const mongoose = require('mongoose');

// ============ XALQARO MASHRUT UCHUN SXEMALAR ============

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
  fromCity: { type: String, required: true, trim: true },
  toCity: { type: String, required: true, trim: true },
  // Koordinatalar (xarita uchun) - ixtiyoriy
  fromCoords: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  toCoords: { 
    lat: { type: Number, default: null }, 
    lng: { type: Number, default: null } 
  },
  payment: { 
    type: Number, 
    default: 0,
    min: [0, 'To\'lov salbiy bo\'lishi mumkin emas']
  },
  givenBudget: { 
    type: Number, 
    default: 0,
    min: [0, 'Yo\'l puli salbiy bo\'lishi mumkin emas']
  },
  previousBalance: { type: Number, default: 0 },
  totalBudget: { type: Number, default: 0 },
  spentAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  distance: { 
    type: Number, 
    default: 0,
    min: [0, 'Masofa salbiy bo\'lishi mumkin emas']
  },
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
    enum: [
      // Yoqilg'i
      'fuel', 'fuel_benzin', 'fuel_diesel', 'fuel_gas', 'fuel_metan', 'fuel_propan',
      // Yengil xarajatlar
      'food', 'toll', 'wash', 'fine', 'repair_small',
      // Katta xarajatlar (shofyor oyligiga ta'sir qilmaydi)
      'repair_major', 'tire', 'accident', 'insurance', 'oil',
      // Chegara
      'border', 'border_customs', 'border_transit', 'border_insurance', 'border_other',
      // Eski turlar (backward compatibility)
      'repair', 'customs', 'transit', 'platon',
      // Boshqa
      'other'
    ],
    required: true
  },
  // Xarajat turi: 'light' = yengil (shofyor hisobidan), 'heavy' = katta (biznesmen hisobidan)
  expenseClass: {
    type: String,
    enum: ['light', 'heavy'],
    default: 'light'
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0, 'Xarajat salbiy bo\'lishi mumkin emas']
  },
  
  // Haydovchi tasdiqlashi
  confirmedByDriver: { type: Boolean, default: false },
  confirmedAt: { type: Date, default: null },
  
  // Valyuta ma'lumotlari (xalqaro mashrutlar uchun)
  currency: { 
    type: String, 
    enum: ['UZS', 'USD', 'RUB', 'KZT', 'EUR', 'TRY', 'CNY', 'TJS', 'KGS', 'TMT', 'AZN', 'GEL', 'BYN', 'UAH', 'PLN', 'AFN', 'IRR', 'AED'],
    default: 'UZS' 
  },
  amountInUSD: { type: Number, default: 0, min: 0 },
  amountInUZS: { type: Number, default: 0, min: 0 },
  exchangeRate: { type: Number, default: 1, min: 0 },
  
  // Qaysi davlatda sarflangan
  country: { 
    type: String, 
    enum: ['UZB', 'KZ', 'RU', 'TJ', 'KG', 'TM', 'AF', 'CN', 'TR', 'IR', 'AZ', 'GE', 'BY', 'UA', 'PL', 'DE', 'LT', 'LV', 'EE', 'FI', null],
    default: null 
  },
  
  // Yoqilg'i uchun batafsil ma'lumotlar
  quantity: { type: Number, default: null, min: 0 },
  quantityUnit: { type: String, enum: ['litr', 'kub', null], default: null },
  pricePerUnit: { type: Number, default: null, min: 0 },
  
  // Joylashuv ma'lumotlari
  location: {
    name: { type: String, default: null },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  
  // Odometr ma'lumotlari
  odometer: { type: Number, default: null, min: 0 },
  distanceSinceLast: { type: Number, default: null },
  fuelConsumption: { type: Number, default: null },
  
  // Shina raqamlari (shina xarajati uchun)
  tireNumber: { type: String, default: null },
  
  // Qo'shimcha
  stationName: { type: String, default: null },
  receiptImage: { type: String, default: null },
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

// Asosiy Flight (Mashrut) modeli
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
  
  // Mashrut nomi (avtomatik: birinchi va oxirgi shahar)
  name: String,
  
  // Mashrut turi: 'domestic' - O'zbekiston ichida, 'international' - Xalqaro
  flightType: {
    type: String,
    enum: ['domestic', 'international'],
    default: 'domestic'
  },
  
  // ============ XALQARO MASHRUT MAYDONLARI ============
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
  startOdometer: { 
    type: Number, 
    default: 0,
    min: [0, 'Odometr salbiy bo\'lishi mumkin emas']
  },
  startFuel: { 
    type: Number, 
    default: 0,
    min: [0, 'Yoqilg\'i salbiy bo\'lishi mumkin emas']
  },
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
  
  // Avvalgi mashrutdan qolgan pul (mashrut ochilganda haydovchidagi balans)
  previousBalance: {
    type: Number,
    default: 0
  },
  
  // Tugatish ma'lumotlari
  endOdometer: { 
    type: Number, 
    default: 0,
    min: [0, 'Odometr salbiy bo\'lishi mumkin emas']
  },
  endFuel: { 
    type: Number, 
    default: 0,
    min: [0, 'Yoqilg\'i salbiy bo\'lishi mumkin emas']
  },
  
  // buyurtmalar (cheksiz)
  legs: [legSchema],
  
  // Xarajatlar (biznesmen kiritadi)
  expenses: [expenseSchema],
  
  // Hisob-kitob
  totalPayment: { type: Number, default: 0 }, // Jami to'lov (mijozdan)
  totalGivenBudget: { type: Number, default: 0 }, // Jami berilgan yo'l xarajati
  totalExpenses: { type: Number, default: 0 }, // Jami sarflangan (xarajatlar) - so'm da
  totalExpensesUSD: { type: Number, default: 0 }, // Jami xarajatlar USD da
  // Yengil xarajatlar (shofyor hisobidan ayiriladi)
  lightExpenses: { type: Number, default: 0 },
  lightExpensesUSD: { type: Number, default: 0 },
  // Katta xarajatlar (biznesmen hisobidan)
  heavyExpenses: { type: Number, default: 0 },
  heavyExpensesUSD: { type: Number, default: 0 },
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
  
  // ============ XALQARO MASHRUT UCHUN USD MAYDONLARI ============
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
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  driverPaymentDate: { type: Date, default: null },
  
  // Qisman to'lov ma'lumotlari
  driverPaidAmount: { type: Number, default: 0 }, // Haydovchi bergan summa
  driverRemainingDebt: { type: Number, default: 0 }, // Qolgan qarz
  
  // To'lov tarixi
  driverPayments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],
  
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  notes: String
}, { timestamps: true });

// Saqlashdan oldin hisob-kitob va validatsiya
flightSchema.pre('save', function(next) {
  // ============ VALIDATSIYA ============
  
  // Odometr validatsiyasi - endOdometer >= startOdometer
  if (this.endOdometer > 0 && this.endOdometer < this.startOdometer) {
    return next(new Error('Tugatish odometri boshlang\'ich odometrdan kichik bo\'lishi mumkin emas'));
  }
  
  // driverProfitPercent 0-100 oralig'ida bo'lishi kerak
  if (this.driverProfitPercent < 0 || this.driverProfitPercent > 100) {
    return next(new Error('Shofyor foizi 0 dan 100 gacha bo\'lishi kerak'));
  }

  // ============ XALQARO MASHRUT HISOBLARI ============
  
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
  // Katta xarajat turlari - biznesmen hisobidan (shofyor oyligiga ta'sir qilmaydi)
  const HEAVY_EXPENSE_TYPES = ['repair_major', 'tire', 'accident', 'insurance', 'oil'];
  
  let totalExpensesUZS = 0;
  let totalExpensesUSD = 0;
  let lightExpensesUZS = 0; // Yengil xarajatlar (shofyor hisobidan)
  let lightExpensesUSD = 0;
  let heavyExpensesUZS = 0; // Katta xarajatlar (biznesmen hisobidan)
  let heavyExpensesUSD = 0;
  
  this.expenses.forEach(exp => {
    // Xarajat turini aniqlash
    const isHeavy = HEAVY_EXPENSE_TYPES.includes(exp.type) || exp.expenseClass === 'heavy';
    
    // Agar amountInUZS va amountInUSD mavjud bo'lsa
    const amountUZS = exp.amountInUZS || exp.amount || 0;
    const amountUSD = exp.amountInUSD || (exp.amount || 0) / 12800;
    
    totalExpensesUZS += amountUZS;
    totalExpensesUSD += amountUSD;
    
    if (isHeavy) {
      heavyExpensesUZS += amountUZS;
      heavyExpensesUSD += amountUSD;
    } else {
      lightExpensesUZS += amountUZS;
      lightExpensesUSD += amountUSD;
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
  
  // Yengil va katta xarajatlarni saqlash
  this.lightExpenses = Math.round(lightExpensesUZS);
  this.lightExpensesUSD = Math.round(lightExpensesUSD * 100) / 100;
  this.heavyExpenses = Math.round(heavyExpensesUZS);
  this.heavyExpensesUSD = Math.round(heavyExpensesUSD * 100) / 100;
  
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
  
  // 3. Shofyor ulushi va biznesmen foydasi
  // MUHIM: Bu qiymatlar faqat mashrut yopilganda (complete endpoint) hisoblanadi
  // Faol mashrutlar uchun shofyor ulushi hisoblanMAYDI - faqat sof foyda ko'rsatiladi
  if (this.status === 'active') {
    // Faol mashrutlar uchun - shofyor ulushi 0, chunki hali mashrut yopilmagan
    // Biznesmen mashrut yopganda foizni belgilaydi
    this.driverProfitAmount = 0;
    this.businessProfit = this.netProfit; // Hali shofyor ulushi ayirilmagan
    this.driverOwes = 0; // Mashrut yopilmaganda qarz yo'q
  }
  // Yopilgan mashrutlar uchun - driverProfitAmount, businessProfit, driverOwes 
  // complete endpoint da o'rnatilgan, ularni o'zgartirmaymiz
  
  // Mashrut nomi
  if (this.legs.length > 0) {
    const firstCity = this.legs[0].fromCity;
    const lastCity = this.legs[this.legs.length - 1].toCity;
    this.name = `${firstCity} - ${lastCity}`;
  }
  
  next();
});

// 🚀 Indexlar - tez qidiruv uchun
flightSchema.index({ user: 1, status: 1 }); // Biznesmen mashrutlari
flightSchema.index({ driver: 1, status: 1 }); // Shofyor mashrutlari
flightSchema.index({ user: 1, createdAt: -1 }); // Oxirgi mashrutlar
flightSchema.index({ status: 1, createdAt: -1 }); // Faol mashrutlar

module.exports = mongoose.model('Flight', flightSchema);
