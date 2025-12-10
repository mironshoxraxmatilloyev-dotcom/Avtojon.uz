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
    unique: true,
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
