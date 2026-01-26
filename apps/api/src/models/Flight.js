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
  // To'lov turi:
  // 'cash' = naqd (haydovchi qo'lida)
  // 'transfer' = perevozka (kartadan, haydovchi qo'lida)
  // 'peritsena' = bank o'tkazmasi (haydovchi qo'lida EMAS, firma xarajatlari %)
  paymentType: {
    type: String,
    enum: ['cash', 'transfer', 'peritsena'],
    default: 'cash'
  },
  // Perevozka/Peritsena uchun firma xarajatlari foizi (masalan: 10%)
  transferFeePercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Firma xarajatlariga ketgan summa (avtomatik hisoblanadi)
  transferFeeAmount: {
    type: Number,
    default: 0
  },
  // USD da to'lov (xalqaro reyslar uchun)
  paymentUSD: {
    type: Number,
    default: 0,
    min: [0, 'USD to\'lov salbiy bo\'lishi mumkin emas']
  },
  // USD da firma xarajati (xalqaro reyslar uchun)
  transferFeeAmountUSD: {
    type: Number,
    default: 0
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
      // Kichik xarajatlar
      'food', 'toll', 'wash', 'fine', 'repair_small',
      // Katta xarajatlar (shofyor oyligiga ta'sir qilmaydi)
      'repair_major', 'tire', 'accident', 'insurance', 'oil',
      // Filtr turlari
      'filter', 'filter_oil', 'filter_air', 'filter_cabin', 'filter_gas',
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
  // Xarajat qo'shilgan vaqti: 'before' = reys boshlanishidan oldin, 'during' = davomida, 'after' = tugagandan keyin
  timing: {
    type: String,
    enum: ['before', 'during', 'after'],
    default: 'during'
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

  // Kim qo'shgani
  addedBy: {
    type: String,
    enum: ['businessman', 'driver', 'voice', 'system'],
    default: 'businessman'
  },

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
  totalCashPayment: { type: Number, default: 0 }, // Naqd to'lovlar (haydovchi qo'lida)
  totalPeritsenaPayment: { type: Number, default: 0 }, // Peritsena to'lovlar (haydovchi qo'lida emas)
  totalPeritsenaFee: { type: Number, default: 0 }, // Peritsena dan firma xarajatlari
  totalGivenBudget: { type: Number, default: 0 }, // Jami berilgan yo'l xarajati
  totalExpenses: { type: Number, default: 0 }, // Jami sarflangan (xarajatlar) - so'm da
  totalExpensesUSD: { type: Number, default: 0 }, // Jami xarajatlar USD da
  // Yengil va katta xarajatlarni saqlash
  lightExpenses: { type: Number, default: 0 },
  lightExpensesUSD: { type: Number, default: 0 },
  // Katta xarajatlar (biznesmen hisobidan)
  heavyExpenses: { type: Number, default: 0 },
  heavyExpensesUSD: { type: Number, default: 0 },
  // Xarajatlarni vaqti bo'yicha guruhlash (hisobotlar uchun)
  expensesByTiming: {
    before: { type: Number, default: 0 }, // Reys boshlanishidan oldin
    during: { type: Number, default: 0 }, // Reys davomida
    after: { type: Number, default: 0 }   // Reys tugagandan keyin
  },
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
  totalPeritsenaFeeUSD: { type: Number, default: 0 }, // Peritsena firma xarajatlari USD da
  exchangeRateAtClose: { type: Number, default: 0 }, // Yopilgandagi kurs (1 USD = ? so'm)

  // Eski maydonlar (backward compatibility)
  finalBalance: { type: Number, default: 0 }, // Yo'l puli qoldig'i (eski)
  profit: { type: Number, default: 0 }, // Eski foyda (mijozdan - xarajat)

  // Shofyor xarajatlari (reys yopilganda hisoblanadi)
  driverExpensesBefore: { type: Number, default: 0 }, // Reys boshlanishidan oldin
  driverExpensesDuring: { type: Number, default: 0 }, // Reys davomida
  driverExpensesAfter: { type: Number, default: 0 }, // Reys tugagandan keyin
  driverTotalExpenses: { type: Number, default: 0 }, // Jami xarajatlar

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
flightSchema.pre('save', function (next) {
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
    const spentAmount = legExpenses.reduce((sum, exp) => sum + (exp.amountInUZS || 0), 0);

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

  // Naqd to'lovlar (haydovchi qo'lida) - cash va transfer
  this.totalCashPayment = this.legs.reduce((sum, leg) => {
    if (leg.paymentType === 'cash' || leg.paymentType === 'transfer') {
      return sum + (leg.payment || 0);
    }
    return sum;
  }, 0);

  // Peritsena to'lovlar (haydovchi qo'lida emas)
  this.totalPeritsenaPayment = this.legs.reduce((sum, leg) => {
    if (leg.paymentType === 'peritsena') {
      return sum + (leg.payment || 0);
    }
    return sum;
  }, 0);

  // Peritsena dan firma xarajatlari (har bir leg uchun hisoblab qo'yish)
  let totalPeritsenaFee = 0;
  this.legs.forEach(leg => {
    if (leg.paymentType === 'peritsena' && leg.transferFeePercent > 0) {
      leg.transferFeeAmount = Math.round((leg.payment || 0) * leg.transferFeePercent / 100);
      totalPeritsenaFee += leg.transferFeeAmount;
    } else {
      leg.transferFeeAmount = 0;
    }
  });
  this.totalPeritsenaFee = totalPeritsenaFee;

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
    // MUHIM: Ba'zi xarajatlar har doim "katta" (heavy) hisoblanadi
    const isHeavyType = HEAVY_EXPENSE_TYPES.includes(exp.type) || (exp.type && exp.type.startsWith('filter_'));
    const isHeavy = isHeavyType || exp.expenseClass === 'heavy';

    // Faqat amountInUZS ishlatamiz (amount ishlatmayamiz)
    const amountUZS = exp.amountInUZS || 0;
    const amountUSD = exp.amountInUSD || 0;

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

  // Chegara xarajatlarini ham qo'shish (yengil xarajat)
  if (this.borderCrossings && this.borderCrossings.length > 0) {
    const borderUSD = this.borderCrossingsTotalUSD || 0;
    const borderUZS = this.borderCrossingsTotalUZS || 0;
    totalExpensesUSD += borderUSD;
    totalExpensesUZS += borderUZS;
    lightExpensesUSD += borderUSD;
    lightExpensesUZS += borderUZS;
  }

  // Platon xarajatini qo'shish (yengil xarajat)
  if (this.platon && this.platon.amountInUSD) {
    const platonUSD = this.platon.amountInUSD;
    const platonUZS = Math.round(platonUSD * 12800);
    totalExpensesUSD += platonUSD;
    totalExpensesUZS += platonUZS;
    lightExpensesUSD += platonUSD;
    lightExpensesUZS += platonUZS;
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
  // 1. Jami kirim = FAQAT mijozdan olingan to'lov (yo'l puli kirimga kirmaydi)
  // MUHIM: Yo'l puli (totalGivenBudget) shofyor oyligini hisoblashda qatnashmaydi
  this.totalIncome = this.totalPayment;

  // 2. Sof foyda = FAQAT mijozdan olingan to'lov - FAQAT YENGIL XARAJATLAR - Peritsena firma xarajatlari
  // MUHIM: Yo'l puli sof foydaga ham qo'shilmaydi
  // MUHIM: Katta xarajatlar (heavy) haydovchi foydasi hisobiga kirmaydi
  // MUHIM: Katta xarajatlar alohida ko'rsatiladi va biznesmen hisobidan to'lanadi
  // MUHIM: Peritsena dan firma xarajatlari ayiriladi
  // MUHIM: Reys boshlanmaganda (active) sof foyda zarar bo'lsa manfiy ko'rsatiladi
  // Reys davomida pul olinsa zarar yopiladi va foyda ortadi
  this.netProfit = this.totalIncome - lightExpensesUZS - this.totalPeritsenaFee;

  // 3. Shofyor ulushi va biznesmen foydasi
  // MUHIM: Faol reysda shofyor ulushi hisoblanMAYDI - faqat sof foyda ko'rsatiladi
  if (this.status === 'active') {
    // Faol mashrutlar uchun - shofyor ulushi 0, chunki hali mashrut yopilmagan
    this.driverProfitAmount = 0;
    this.businessProfit = this.netProfit; // Sof foyda = netProfit (zarar bo'lsa manfiy)
    this.driverOwes = 0; // Mashrut yopilmaganda qarz yo'q
  } else if (this.status === 'completed') {
    // YANGI LOGIKA: Haydovchi ulushi FAQAT mijozdan olingan to'lovlardan
    
    // 1. Haydovchi ulushi - FAQAT mijozdan olingan to'lovlardan
    const totalBasis = this.totalIncome; // Faqat mijozdan olingan
    const percent = this.driverProfitPercent || 0;
    
    if (totalBasis > 0 && percent > 0) {
      this.driverProfitAmount = Math.round(totalBasis * percent / 100);
    } else {
      this.driverProfitAmount = 0;
    }
    
    // 2. Haydovchi berishi kerak - naqd to'lovlardan hisoblanadi
    // Naqd to'lovlar (haydovchi qo'liga tushadigan)
    const cashPayments = this.legs.reduce((sum, leg) => {
      if (leg.paymentType === 'cash' || leg.paymentType === 'transfer') {
        return sum + (leg.payment || 0);
      }
      return sum;
    }, 0);
    
    // Naqd kirim = naqd to'lovlar + yo'l uchun berilgan + avvalgi qoldiq
    const cashIncome = cashPayments + this.totalGivenBudget + (this.previousBalance || 0);
    const cashNetProfit = cashIncome - this.totalExpenses;
    
    // Haydovchi berishi kerak = naqd sof foyda - haydovchi ulushi
    // Agar peritsena bo'lsa va naqd kam bo'lsa, 0 bo'lishi mumkin
    this.driverOwes = Math.max(0, cashNetProfit - this.driverProfitAmount);
    
    // Biznesmen foydasi = sof foyda - haydovchi ulushi
    this.businessProfit = this.netProfit - this.driverProfitAmount;
  }

  // Mashrut nomi
  if (this.legs.length > 0) {
    const firstCity = this.legs[0].fromCity;
    const lastCity = this.legs[this.legs.length - 1].toCity;
    this.name = `${firstCity} - ${lastCity}`;
  }

  // ============ XALQARO REYSLAR UCHUN USD HISOBLASH ============
  if (this.flightType === 'international') {
    // USD da jami to'lov
    this.totalPaymentUSD = this.legs.reduce((sum, leg) => sum + (leg.paymentUSD || 0), 0);
    
    // USD da jami kirim = FAQAT mijozdan olingan to'lov (yo'l puli kirmaydi)
    this.totalIncomeUSD = this.totalPaymentUSD;
    
    // USD da peritsena firma xarajatlari
    let totalPeritsenaFeeUSD = 0;
    this.legs.forEach(leg => {
      if (leg.paymentType === 'peritsena' && leg.transferFeePercent > 0 && leg.paymentUSD) {
        const feeUSD = (leg.paymentUSD * leg.transferFeePercent / 100);
        leg.transferFeeAmountUSD = Math.round(feeUSD * 100) / 100;
        totalPeritsenaFeeUSD += leg.transferFeeAmountUSD;
      } else {
        leg.transferFeeAmountUSD = 0;
      }
    });
    this.totalPeritsenaFeeUSD = Math.round(totalPeritsenaFeeUSD * 100) / 100;

    // USD da sof foyda (peritsena xarajatlari ayirilgan)
    this.netProfitUSD = this.totalIncomeUSD - this.totalExpensesUSD - this.totalPeritsenaFeeUSD;

    // USD da shofyor ulushi va biznesmen foydasi
    if (this.status === 'active') {
      this.driverProfitAmountUSD = 0;
      this.businessProfitUSD = this.netProfitUSD;
      this.driverOwesUSD = 0;
    } else if (this.status === 'completed') {
      // YANGI LOGIKA USD da: Haydovchi ulushi FAQAT mijozdan olingan to'lovlardan
      
      // 1. Haydovchi ulushi - FAQAT mijozdan olingan to'lovlardan USD da
      const totalBasisUSD = this.totalIncomeUSD; // Faqat mijozdan olingan
      const percent = this.driverProfitPercent || 0;
      
      if (totalBasisUSD > 0 && percent > 0) {
        this.driverProfitAmountUSD = Math.round(totalBasisUSD * percent / 100 * 100) / 100;
      } else {
        this.driverProfitAmountUSD = 0;
      }
      
      // 2. Haydovchi berishi kerak - naqd to'lovlardan USD da
      // Naqd to'lovlar USD da
      const cashPaymentsUSD = this.legs.reduce((sum, leg) => {
        if (leg.paymentType === 'cash' || leg.paymentType === 'transfer') {
          return sum + (leg.paymentUSD || 0);
        }
        return sum;
      }, 0);
      
      const cashIncomeUSD = cashPaymentsUSD + (this.totalGivenBudgetUSD || 0) + ((this.previousBalance || 0) / 12800);
      const cashNetProfitUSD = cashIncomeUSD - this.totalExpensesUSD;
      
      // Haydovchi berishi kerak USD da = naqd sof foyda - haydovchi ulushi
      this.driverOwesUSD = Math.max(0, Math.round((cashNetProfitUSD - this.driverProfitAmountUSD) * 100) / 100);
      
      // Biznesmen foydasi USD da
      this.businessProfitUSD = Math.round((this.netProfitUSD - this.driverProfitAmountUSD) * 100) / 100;
    }
  }

  next();
});

// 🚀 Indexlar - tez qidiruv uchun
flightSchema.index({ user: 1, status: 1 }); // Biznesmen mashrutlari
flightSchema.index({ driver: 1, status: 1 }); // Shofyor mashrutlari
flightSchema.index({ user: 1, createdAt: -1 }); // Oxirgi mashrutlar
flightSchema.index({ status: 1, createdAt: -1 }); // Faol mashrutlar

// 🚀 Virtual field - Haydovchining qo'lidagi pul
// Bu summa real-time hisoblanadi va frontendda ko'rsatiladi
flightSchema.virtual('driverCashInHand').get(function() {
  // Naqd to'lovlar (haydovchi qo'liga tushadigan)
  const cashPayments = (this.legs || []).reduce((sum, leg) => {
    if (leg.paymentType === 'cash' || leg.paymentType === 'transfer') {
      return sum + (leg.payment || 0);
    }
    return sum;
  }, 0);
  
  // Avvalgi qoldiq + Naqd to'lovlar + Yo'l uchun berilgan - Xarajatlar - Shofyor oyligi
  const previousBalance = this.previousBalance || 0;
  const totalGivenBudget = this.totalGivenBudget || 0;
  const totalExpenses = this.totalExpenses || 0;
  const driverProfitAmount = this.driverProfitAmount || 0;
  
  // TUZATILDI: Shofyor oyligi ham ayiriladi, chunki u haydovchining haqi
  return previousBalance + cashPayments + totalGivenBudget - totalExpenses - driverProfitAmount;
});

// Virtual fieldlarni JSON ga qo'shish
flightSchema.set('toJSON', { virtuals: true });
flightSchema.set('toObject', { virtuals: true });

// Virtual field: Haydovchi berishi kerak + avvalgi qarz
flightSchema.virtual('totalDriverOwes').get(function() {
  // SIZNING TIZIMINGIZ BO'YICHA:
  // totalDriverOwes = driverOwes (joriy reys) + driver.previousDebt (avvalgi qarzlar)
  const currentOwes = this.driverOwes || 0;
  const previousDebt = this.driver?.previousDebt || 0;
  return currentOwes + previousDebt;
});

module.exports = mongoose.model('Flight', flightSchema);
