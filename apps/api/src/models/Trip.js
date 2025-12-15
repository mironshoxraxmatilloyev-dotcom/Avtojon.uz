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
  borderName: String, // Masalan: "Yallama", "Oybek", "Troitsk"
  // Xarajatlar
  customsFee: { type: Number, default: 0 }, // Bojxona
  transitFee: { type: Number, default: 0 }, // Tranzit to'lov
  insuranceFee: { type: Number, default: 0 }, // Sug'urta
  otherFees: { type: Number, default: 0 }, // Boshqa
  currency: {
    type: String,
    enum: ['UZS', 'KZT', 'RUB', 'USD'],
    default: 'USD'
  },
  totalInOriginal: { type: Number, default: 0 },
  totalInUSD: { type: Number, default: 0 },
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
  distanceKm: { type: Number, default: 0 }, // Rossiyada yurgan km
  note: String
}, { _id: false });

// Davlat bo'yicha xarajatlar xulosasi
const countryExpenseSummarySchema = new mongoose.Schema({
  distanceKm: { type: Number, default: 0 }, // Shu davlatda yurgan km
  fuelLiters: { type: Number, default: 0 },
  fuelCostUSD: { type: Number, default: 0 },
  roadExpensesUSD: { type: Number, default: 0 },
  totalUSD: { type: Number, default: 0 }
}, { _id: false });

// Yoqilg'i yozuvi sxemasi
const fuelEntrySchema = new mongoose.Schema({
  country: {
    type: String,
    enum: ['UZB', 'KZ', 'RU', 'uzb', 'kz', 'ru'], // Katta va kichik harflar
    required: true
  },
  liters: {
    type: Number,
    required: true
  },
  pricePerLiter: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['UZS', 'KZT', 'RUB', 'USD'],
    required: true
  },
  totalInOriginal: Number, // Asl valyutada jami
  totalInUSD: Number, // USD ga aylantirilgan
  exchangeRate: Number, // Ayirboshlash kursi
  date: {
    type: Date,
    default: Date.now
  },
  note: String
}, { _id: true });

// Yo'l xarajatlari sxemasi (har davlat uchun)
const roadExpenseSchema = new mongoose.Schema({
  border: { type: Number, default: 0 }, // Chegara
  gai: { type: Number, default: 0 }, // GAI
  toll: { type: Number, default: 0 }, // Yo'l puli
  parking: { type: Number, default: 0 }, // Stoyanka
  currency: {
    type: String,
    enum: ['UZS', 'KZT', 'RUB', 'USD'],
    default: 'USD'
  },
  totalInOriginal: Number,
  totalInUSD: Number,
  exchangeRate: Number
}, { _id: false });

// Kutilmagan xarajat sxemasi
const unexpectedExpenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['tire', 'repair', 'fine', 'other'], // g'ildirak, remont, jarima, boshqa
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['UZS', 'KZT', 'RUB', 'USD'],
    default: 'USD'
  },
  amountInUSD: Number,
  exchangeRate: Number,
  description: String,
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const tripSchema = new mongoose.Schema({
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

  // ============ REYS TURI ============
  tripType: {
    type: String,
    enum: ['local', 'international'],
    default: 'local'
  },

  // ============ XALQARO REYS MAYDONLARI ============
  // Yo'nalish nuqtalari (xalqaro reyslar uchun)
  waypoints: [waypointSchema],
  
  // Chegara o'tish xarajatlari
  borderCrossings: [borderCrossingSchema],
  borderCrossingsTotalUSD: { type: Number, default: 0 },
  
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

  startAddress: String,
  endAddress: String,
  // Koordinatalar (xarita uchun)
  startCoords: {
    lat: Number,
    lng: Number
  },
  endCoords: {
    lat: Number,
    lng: Number
  },
  // Eski nomlar (orqaga moslik)
  startLocation: {
    lat: Number,
    lng: Number
  },
  endLocation: {
    lat: Number,
    lng: Number
  },
  estimatedDuration: String,
  estimatedDistance: Number,
  
  // ============ ODOMETR (KM) ============
  odometer: {
    start: { type: Number, default: 0 }, // Chiqishdagi km
    end: { type: Number, default: 0 }, // Kelgandagi km
    traveled: { type: Number, default: 0 } // Yurgan km (avtomatik)
  },

  // ============ YOQILG'I (DAVLATLAR BO'YICHA) ============
  fuelEntries: [fuelEntrySchema], // Barcha yoqilg'i yozuvlari
  fuelSummary: {
    uzb: { liters: { type: Number, default: 0 }, totalUSD: { type: Number, default: 0 } },
    kz: { liters: { type: Number, default: 0 }, totalUSD: { type: Number, default: 0 } },
    ru: { liters: { type: Number, default: 0 }, totalUSD: { type: Number, default: 0 } },
    remaining: { type: Number, default: 0 }, // Astatka (qoldiq litr)
    totalLiters: { type: Number, default: 0 }, // Jami quyilgan
    totalUsed: { type: Number, default: 0 }, // Jami yegan (totalLiters - remaining)
    totalUSD: { type: Number, default: 0 }, // Jami USD da
    consumption: { type: Number, default: 0 } // Rashod: litr/100km
  },

  // ============ YO'L XARAJATLARI (DAVLATLAR BO'YICHA) ============
  roadExpenses: {
    uzb: roadExpenseSchema,
    kz: roadExpenseSchema,
    ru: roadExpenseSchema,
    totalUSD: { type: Number, default: 0 }
  },

  // ============ PITANYA (OVQAT) ============
  food: {
    amount: { type: Number, default: 0 },
    currency: { type: String, enum: ['UZS', 'KZT', 'RUB', 'USD'], default: 'USD' },
    amountInUSD: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 1 }
  },

  // ============ KUTILMAGAN XARAJATLAR ============
  unexpectedExpenses: [unexpectedExpenseSchema],
  unexpectedTotalUSD: { type: Number, default: 0 },

  // ============ SHOFYOR OYLIGI ============
  driverSalary: {
    amount: { type: Number, default: 0 },
    currency: { type: String, enum: ['UZS', 'KZT', 'RUB', 'USD'], default: 'USD' },
    amountInUSD: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 1 }
  },

  // ============ DAROMAD VA FOYDA ============
  income: {
    amount: { type: Number, default: 0 }, // Reys uchun olingan pul
    currency: { type: String, enum: ['UZS', 'KZT', 'RUB', 'USD'], default: 'USD' },
    amountInUSD: { type: Number, default: 0 },
    exchangeRate: { type: Number, default: 1 }
  },

  // ============ ITOG HISOB (AVTOMATIK) ============
  totalExpensesUSD: { type: Number, default: 0 }, // Barcha xarajatlar USD da
  profitUSD: { type: Number, default: 0 }, // Sof foyda: income - totalExpenses

  // ============ ESKI MAYDONLAR (ORQAGA MOSLIK) ============
  tripBudget: { type: Number, default: 0 },
  tripPayment: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  remainingBudget: { type: Number, default: 0 },
  bonusAmount: { type: Number, default: 0 },
  penaltyAmount: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  notes: String,
  locations: [{
    lat: Number,
    lng: Number,
    speed: Number,
    recordedAt: Date
  }]
}, { timestamps: true });

// Saqlashdan oldin hisob-kitob
tripSchema.pre('save', function(next) {
  // Odometr traveled hisoblash
  // MUHIM: Agar traveled to'g'ridan-to'g'ri kiritilgan bo'lsa (0 dan katta), uni saqlaymiz
  // Faqat traveled 0 bo'lsa va start/end kiritilgan bo'lsa, hisoblaymiz
  if (this.odometer.traveled === 0 && this.odometer.start > 0 && this.odometer.end > this.odometer.start) {
    this.odometer.traveled = this.odometer.end - this.odometer.start;
  }

  // ============ XALQARO REYS HISOBLARI ============
  
  // Chegara o'tish xarajatlari jami
  if (this.borderCrossings && this.borderCrossings.length > 0) {
    this.borderCrossingsTotalUSD = this.borderCrossings.reduce(
      (sum, bc) => sum + (bc.totalInUSD || 0), 0
    );
  }

  // Davlatlar ro'yxatini waypoints dan olish
  if (this.waypoints && this.waypoints.length > 0) {
    const countries = [...new Set(this.waypoints.map(w => w.country))];
    this.countriesInRoute = countries;
  }

  // Yoqilg'i summary hisoblash
  if (this.fuelEntries && this.fuelEntries.length > 0) {
    const summary = { uzb: { liters: 0, totalUSD: 0 }, kz: { liters: 0, totalUSD: 0 }, ru: { liters: 0, totalUSD: 0 } };
    
    this.fuelEntries.forEach(entry => {
      const country = entry.country.toLowerCase();
      if (summary[country]) {
        summary[country].liters += entry.liters || 0;
        summary[country].totalUSD += entry.totalInUSD || 0;
      }
    });

    this.fuelSummary.uzb = summary.uzb;
    this.fuelSummary.kz = summary.kz;
    this.fuelSummary.ru = summary.ru;
    this.fuelSummary.totalLiters = summary.uzb.liters + summary.kz.liters + summary.ru.liters;
    this.fuelSummary.totalUSD = summary.uzb.totalUSD + summary.kz.totalUSD + summary.ru.totalUSD;
    this.fuelSummary.totalUsed = this.fuelSummary.totalLiters - (this.fuelSummary.remaining || 0);
    
    // Rashod hisoblash (litr/1km)
    if (this.odometer.traveled > 0 && this.fuelSummary.totalUsed > 0) {
      this.fuelSummary.consumption = Number((this.fuelSummary.totalUsed / this.odometer.traveled).toFixed(3));
    }
  }

  // Yo'l xarajatlari jami
  let roadTotal = 0;
  if (this.roadExpenses) {
    if (this.roadExpenses.uzb) {
      roadTotal += this.roadExpenses.uzb.totalInUSD || 0;
    }
    if (this.roadExpenses.kz) {
      roadTotal += this.roadExpenses.kz.totalInUSD || 0;
    }
    if (this.roadExpenses.ru) {
      roadTotal += this.roadExpenses.ru.totalInUSD || 0;
    }
    this.roadExpenses.totalUSD = roadTotal;
  }

  // Kutilmagan xarajatlar jami
  if (this.unexpectedExpenses && this.unexpectedExpenses.length > 0) {
    this.unexpectedTotalUSD = this.unexpectedExpenses.reduce((sum, exp) => sum + (exp.amountInUSD || 0), 0);
  }

  // JAMI XARAJATLAR (shofyor oyligi bundan tashqari - bu biznes xarajati)
  const tripExpenses = 
    (this.fuelSummary?.totalUSD || 0) +
    (this.roadExpenses?.totalUSD || 0) +
    (this.food?.amountInUSD || 0) +
    (this.unexpectedTotalUSD || 0) +
    (this.borderCrossingsTotalUSD || 0) + // Chegara xarajatlari
    (this.platon?.amountInUSD || 0); // Platon (Rossiya)

  this.totalExpensesUSD = tripExpenses + (this.driverSalary?.amountInUSD || 0);

  // Davlatlar bo'yicha xarajatlar xulosasini hisoblash
  if (this.tripType === 'international') {
    const countries = ['uzb', 'kz', 'ru'];
    countries.forEach(country => {
      if (!this.countryExpenses) this.countryExpenses = {};
      if (!this.countryExpenses[country]) {
        this.countryExpenses[country] = { distanceKm: 0, fuelLiters: 0, fuelCostUSD: 0, roadExpensesUSD: 0, totalUSD: 0 };
      }
      
      // Yoqilg'i
      const countryCode = country.toUpperCase();
      if (this.fuelSummary && this.fuelSummary[country]) {
        this.countryExpenses[country].fuelLiters = this.fuelSummary[country].liters || 0;
        this.countryExpenses[country].fuelCostUSD = this.fuelSummary[country].totalUSD || 0;
      }
      
      // Yo'l xarajatlari
      if (this.roadExpenses && this.roadExpenses[country]) {
        this.countryExpenses[country].roadExpensesUSD = this.roadExpenses[country].totalInUSD || 0;
      }
      
      // Jami
      this.countryExpenses[country].totalUSD = 
        (this.countryExpenses[country].fuelCostUSD || 0) +
        (this.countryExpenses[country].roadExpensesUSD || 0);
    });
  }

  // Eski tizim uchun (orqaga moslik) - USD da
  // totalExpenses UZS da yuqorida hisoblanadi (tripBudget bilan ishlash uchun)
  
  // tripBudget UZS da, tripExpenses USD da - UZS ga aylantirish kerak
  const UZS_RATE = 12800;
  const tripExpensesInUZS = tripExpenses * UZS_RATE;
  
  // Har doim totalExpenses ni hisoblash (tripBudget bo'lmasa ham)
  this.totalExpenses = tripExpensesInUZS; // UZS da saqlash
  this.remainingBudget = (this.tripBudget || 0) - tripExpensesInUZS;
  
  // BONUS / JARIMA HISOBLASH - faqat tripBudget bo'lganda va reys tugatilganda
  if (this.tripBudget > 0 && this.status === 'completed') {
    if (this.remainingBudget > 0) {
      // Pul ortib qoldi - BONUS shofyorga
      this.bonusAmount = this.remainingBudget;
      this.penaltyAmount = 0;
    } else if (this.remainingBudget < 0) {
      // Ortiqcha sarfladi - JARIMA
      this.bonusAmount = 0;
      this.penaltyAmount = Math.abs(this.remainingBudget);
    } else {
      this.bonusAmount = 0;
      this.penaltyAmount = 0;
    }
  }

  // SOF FOYDA
  this.profitUSD = (this.income?.amountInUSD || 0) - this.totalExpensesUSD;

  next();
});

module.exports = mongoose.model('Trip', tripSchema);
