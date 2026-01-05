const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plateNumber: {
    type: String,
    required: true,
    uppercase: true
  },
  brand: String,
  model: String,
  year: Number,
  fuelType: {
    type: String,
    enum: ['diesel', 'petrol', 'gas', 'metan', 'propan'],
    default: 'diesel'
  },
  fuelTankCapacity: Number, // litr
  expectedFuelConsumption: { type: Number, default: 25 }, // kutilgan L/100km
  cargoCapacity: Number, // tonna
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // === TEXNIK MA'LUMOTLAR ===
  vin: String,
  currentOdometer: { type: Number, default: 0 },
  purchaseDate: Date,
  purchasePrice: { type: Number, default: 0 }, // sotib olish narxi
  purchaseOdometer: { type: Number, default: 0 },
  
  // === MOY SOZLAMALARI ===
  oilChangeIntervalKm: { type: Number, default: 15000 }, // har necha km da almashtirish
  lastOilChangeDate: Date,
  lastOilChangeOdometer: { type: Number, default: 0 },
  
  // === SHINA SOZLAMALARI ===
  tireCount: { type: Number, default: 6 }, // shina soni (4, 6, 8...)
  tireLifeExpectedKm: { type: Number, default: 80000 }, // shina umri
  tireNumbers: [{
    position: {
      type: String,
      enum: ['front_left', 'front_right', 'rear_left_1', 'rear_left_2', 'rear_right_1', 'rear_right_2', 'rear_left_3', 'rear_right_3'],
      required: true
    },
    number: String, // shina raqami (masalan: 12345678)
    installDate: Date,
    installOdometer: { type: Number, default: 0 },
    lastReplacementDate: Date,
    lastReplacementOdometer: { type: Number, default: 0 }
  }],
  
  // === TEXNIK XIZMAT ===
  serviceIntervalKm: { type: Number, default: 30000 }, // TO oralig'i
  serviceIntervalMonths: { type: Number, default: 12 }, // yoki oyda
  lastServiceDate: Date,
  lastServiceOdometer: { type: Number, default: 0 },
  
  // === FILTRLAR ===
  airFilterIntervalKm: { type: Number, default: 30000 },
  lastAirFilterOdometer: { type: Number, default: 0 },
  fuelFilterIntervalKm: { type: Number, default: 30000 },
  lastFuelFilterOdometer: { type: Number, default: 0 },
  
  // === SUG'URTA VA SOLIQ ===
  insuranceExpiry: Date,
  insuranceCost: { type: Number, default: 0 },
  techInspectionExpiry: Date, // texosmotr
  
  // === GPS ===
  lastGpsSignal: Date,
  gpsOnline: { type: Boolean, default: false },
  lastFuelDate: Date,
  
  // === HOLAT ===
  status: { 
    type: String, 
    enum: ['excellent', 'normal', 'attention', 'critical'], 
    default: 'normal' 
  },
  
  // === HISOBLANGAN QIYMATLAR (cached) ===
  calculatedFuelConsumption: Number, // haqiqiy L/100km
  totalIncome: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  lastCalculatedAt: Date
}, { timestamps: true });

// Faqat aktiv mashinalar uchun plateNumber unique bo'lsin
vehicleSchema.index(
  { plateNumber: 1, user: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isActive: true } 
  }
);

// 🚀 Qo'shimcha indexlar - tez qidiruv uchun
vehicleSchema.index({ user: 1, isActive: 1 }); // Biznesmen mashinalari
vehicleSchema.index({ currentDriver: 1 }); // Shofyorga biriktirilgan mashina

module.exports = mongoose.model('Vehicle', vehicleSchema);
