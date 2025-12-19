const mongoose = require('mongoose')

// Yoqilg'i to'ldirish
const FuelRefillSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  date: { type: Date, default: Date.now },
  liters: { type: Number, required: true },
  cost: { type: Number, required: true },
  pricePerLiter: { type: Number },
  odometer: { type: Number, required: true },
  station: { type: String },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'gas', 'metan', 'propan'], default: 'diesel' },
  note: { type: String }
}, { timestamps: true })

// Moy almashtirish
const OilChangeSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  date: { type: Date, default: Date.now },
  odometer: { type: Number, required: true },
  oilType: { type: String, required: true },
  oilBrand: { type: String },
  liters: { type: Number },
  cost: { type: Number, required: true },
  nextChangeOdometer: { type: Number },
  nextChangeDate: { type: Date },
  note: { type: String }
}, { timestamps: true })

// Shina
const TireSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  position: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String },
  size: { type: String },
  cost: { type: Number, default: 0 },
  installDate: { type: Date, default: Date.now },
  installOdometer: { type: Number, required: true },
  expectedLifeKm: { type: Number, default: 50000 },
  status: { type: String, enum: ['new', 'used', 'worn'], default: 'new' },
  note: { type: String }
}, { timestamps: true })

// Texnik xizmat
const ServiceLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  type: { type: String, required: true }, // TO-1, TO-2, ta'mir, diagnostika
  date: { type: Date, default: Date.now },
  odometer: { type: Number, required: true },
  cost: { type: Number, required: true },
  description: { type: String },
  parts: [{ name: String, cost: Number }],
  serviceName: { type: String }, // Xizmat ko'rsatuvchi nomi
  note: { type: String }
}, { timestamps: true })

// Ogohlantirish/Alert
const VehicleAlertSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  type: { type: String, enum: ['oil', 'tire', 'service', 'gps', 'fuel', 'other'], required: true },
  severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false }
}, { timestamps: true })

const FuelRefill = mongoose.model('FuelRefill', FuelRefillSchema)
const OilChange = mongoose.model('OilChange', OilChangeSchema)
const Tire = mongoose.model('Tire', TireSchema)
const ServiceLog = mongoose.model('ServiceLog', ServiceLogSchema)
const VehicleAlert = mongoose.model('VehicleAlert', VehicleAlertSchema)

module.exports = { FuelRefill, OilChange, Tire, ServiceLog, VehicleAlert }
