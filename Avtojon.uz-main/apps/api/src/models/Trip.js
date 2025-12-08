const mongoose = require('mongoose');

// Yoqilg'i yozuvi sxemasi
const fuelEntrySchema = new mongoose.Schema({
  country: {
    type: String,
    enum: ['UZB', 'QZ', 'RU'],
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
  startAddress: String,
  endAddress: String,
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
    qz: { liters: { type: Number, default: 0 }, totalUSD: { type: Number, default: 0 } },
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
    qz: roadExpenseSchema,
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

  // Yoqilg'i summary hisoblash
  if (this.fuelEntries && this.fuelEntries.length > 0) {
    const summary = { uzb: { liters: 0, totalUSD: 0 }, qz: { liters: 0, totalUSD: 0 }, ru: { liters: 0, totalUSD: 0 } };
    
    this.fuelEntries.forEach(entry => {
      const country = entry.country.toLowerCase();
      if (summary[country]) {
        summary[country].liters += entry.liters || 0;
        summary[country].totalUSD += entry.totalInUSD || 0;
      }
    });

    this.fuelSummary.uzb = summary.uzb;
    this.fuelSummary.qz = summary.qz;
    this.fuelSummary.ru = summary.ru;
    this.fuelSummary.totalLiters = summary.uzb.liters + summary.qz.liters + summary.ru.liters;
    this.fuelSummary.totalUSD = summary.uzb.totalUSD + summary.qz.totalUSD + summary.ru.totalUSD;
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
    if (this.roadExpenses.qz) {
      roadTotal += this.roadExpenses.qz.totalInUSD || 0;
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

  // JAMI XARAJATLAR
  this.totalExpensesUSD = 
    (this.fuelSummary?.totalUSD || 0) +
    (this.roadExpenses?.totalUSD || 0) +
    (this.food?.amountInUSD || 0) +
    (this.unexpectedTotalUSD || 0) +
    (this.driverSalary?.amountInUSD || 0);

  // SOF FOYDA
  this.profitUSD = (this.income?.amountInUSD || 0) - this.totalExpensesUSD;

  next();
});

module.exports = mongoose.model('Trip', tripSchema);
