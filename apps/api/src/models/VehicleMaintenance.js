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
  previousOdometer: { type: Number }, // oldingi to'ldirishdagi odometer
  station: { type: String },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'gas', 'metan', 'propan'], default: 'diesel' },
  // Hisoblangan qiymatlar
  distanceTraveled: { type: Number }, // km
  fuelConsumption: { type: Number }, // L/100km
  note: { type: String }
}, { timestamps: true })

// Avtomatik yoqilg'i sarfini hisoblash
FuelRefillSchema.pre('save', async function(next) {
  if (this.previousOdometer && this.odometer > this.previousOdometer) {
    this.distanceTraveled = this.odometer - this.previousOdometer
    if (this.distanceTraveled > 0 && this.liters > 0) {
      this.fuelConsumption = (this.liters / this.distanceTraveled) * 100
    }
  }
  if (this.liters && this.cost && !this.pricePerLiter) {
    this.pricePerLiter = this.cost / this.liters
  }
  next()
})

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
  // Moy filtri
  oilFilterCost: { type: Number, default: 0 },
  // Havo filtri
  airFilterCost: { type: Number, default: 0 },
  // Salarka filtri
  cabinFilterCost: { type: Number, default: 0 },
  // Gaz filtri
  gasFilterCost: { type: Number, default: 0 },
  note: { type: String }
}, { timestamps: true })

// Shina
const TireSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  position: { type: String, required: true }, // FL, FR, RL, RR
  brand: { type: String, required: true }, // Michelin, Bridgestone, Continental, etc.
  model: { type: String }, // Pilot Sport, Turanza, etc.
  // Shina raqamlari - maxsus format: 205/55R16, 195/65R15, etc.
  // Format: width/aspectRatio R diameter
  // Misol: 205 (kenglik mm), 55 (balandlik %), R (radial), 16 (diametr inches)
  size: { 
    type: String
  },
  // DOT raqami - shina ishlab chiqarish sanasi va joyi
  // Format: XXXX (masalan: 1520 = 15-chi hafta, 2020-yil)
  dotNumber: { type: String }, // DOT raqami
  // Shina seriya raqami (opsional)
  serialNumber: { type: String },
  cost: { type: Number, default: 0 },
  installDate: { type: Date, default: Date.now },
  installOdometer: { type: Number, default: 0 },
  expectedLifeKm: { type: Number, default: 80000 },
  status: { type: String, enum: ['new', 'used', 'worn', 'replaced'], default: 'new' },
  replacedDate: Date,
  replacedOdometer: Number,
  note: { type: String }
}, { timestamps: true })

// Texnik xizmat
const ServiceLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  type: { 
    type: String, 
    required: true,
    enum: [
      // Inglizcha (eski)
      'TO-1', 'TO-2', 'repair', 'diagnostic', 'air_filter', 'fuel_filter', 'brake', 'suspension', 'electrical', 'body', 'other',
      // O'zbekcha (yangi)
      'Moy almashtirish', 'Tormoz', 'Shina', 'Dvigatel', 'Uzatmalar qutisi', 'Elektrika', 'Kuzov', 'Boshqa'
    ]
  },
  date: { type: Date, default: Date.now },
  odometer: { type: Number },
  cost: { type: Number, required: true },
  laborCost: { type: Number, default: 0 }, // ish haqi
  partsCost: { type: Number, default: 0 }, // ehtiyot qismlar
  description: { type: String },
  parts: [{ name: String, cost: Number, quantity: Number }],
  serviceName: { type: String },
  nextServiceOdometer: { type: Number },
  nextServiceDate: { type: Date },
  note: { type: String }
}, { timestamps: true })

// === YANGI: Daromad (Income) ===
const VehicleIncomeSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  type: { 
    type: String, 
    enum: ['trip', 'rental', 'contract', 'other'],
    default: 'trip'
  },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  description: { type: String },
  // Mashrut uchun
  fromCity: { type: String },
  toCity: { type: String },
  distance: { type: Number }, // km
  cargoWeight: { type: Number }, // tonna
  clientName: { type: String },
  // Ijara uchun
  rentalDays: { type: Number },
  rentalRate: { type: Number }, // kunlik narx
  note: { type: String }
}, { timestamps: true })

// === YANGI: Boshqa xarajatlar ===
const OtherExpenseSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  type: { 
    type: String, 
    enum: ['insurance', 'tax', 'parking', 'toll', 'fine', 'wash', 'other'],
    required: true
  },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  description: { type: String },
  // Sug'urta uchun
  insuranceCompany: { type: String },
  policyNumber: { type: String },
  expiryDate: { type: Date },
  note: { type: String }
}, { timestamps: true })

// Ogohlantirish/Alert
const VehicleAlertSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  businessman: { type: mongoose.Schema.Types.ObjectId },
  type: { 
    type: String, 
    enum: ['oil', 'tire', 'service', 'fuel', 'insurance', 'tech_inspection', 'filter', 'profit_warning', 'other'], 
    required: true 
  },
  severity: { type: String, enum: ['info', 'warning', 'danger'], default: 'info' },
  message: { type: String, required: true },
  threshold: { type: Number }, // qolgan km yoki kun
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedAt: Date
}, { timestamps: true })

// Indexlar
FuelRefillSchema.index({ vehicle: 1, date: -1 })
OilChangeSchema.index({ vehicle: 1, date: -1 })
TireSchema.index({ vehicle: 1, status: 1 })
ServiceLogSchema.index({ vehicle: 1, date: -1 })
VehicleIncomeSchema.index({ vehicle: 1, date: -1 })
OtherExpenseSchema.index({ vehicle: 1, date: -1 })
VehicleAlertSchema.index({ vehicle: 1, isResolved: 1 })

const FuelRefill = mongoose.model('FuelRefill', FuelRefillSchema)
const OilChange = mongoose.model('OilChange', OilChangeSchema)
const Tire = mongoose.model('Tire', TireSchema)
const ServiceLog = mongoose.model('ServiceLog', ServiceLogSchema)
const VehicleIncome = mongoose.model('VehicleIncome', VehicleIncomeSchema)
const OtherExpense = mongoose.model('OtherExpense', OtherExpenseSchema)
const VehicleAlert = mongoose.model('VehicleAlert', VehicleAlertSchema)

module.exports = { 
  FuelRefill, OilChange, Tire, ServiceLog, 
  VehicleIncome, OtherExpense, VehicleAlert 
}
