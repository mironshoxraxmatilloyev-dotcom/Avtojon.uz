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
    enum: ['diesel', 'petrol', 'gas'],
    default: 'diesel'
  },
  fuelTankCapacity: Number, // litr
  fuelConsumptionRate: Number, // litr/100km
  cargoCapacity: Number, // tonna
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Texnik ma'lumotlar
  vin: String,
  currentOdometer: { type: Number, default: 0 },
  lastGpsSignal: Date,
  gpsOnline: { type: Boolean, default: false },
  // Moy ma'lumotlari
  lastOilChangeDate: Date,
  lastOilChangeOdometer: Number,
  // Xizmat ma'lumotlari
  lastServiceDate: Date,
  lastFuelDate: Date,
  // Holat
  status: { type: String, enum: ['excellent', 'normal', 'attention', 'critical'], default: 'normal' }
}, { timestamps: true });

// Faqat aktiv mashinalar uchun plateNumber unique bo'lsin
vehicleSchema.index(
  { plateNumber: 1, user: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isActive: true } 
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
