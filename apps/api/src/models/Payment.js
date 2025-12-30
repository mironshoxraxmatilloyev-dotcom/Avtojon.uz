const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema({
  // Foydalanuvchi
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userType: { type: String, enum: ['businessman', 'user'], default: 'user' },
  
  // To'lov ma'lumotlari
  amount: { type: Number, required: true }, // tiyinda (so'm * 100)
  amountInSom: { type: Number, required: true }, // so'mda
  
  // Mashina asosida narxlash
  vehicleCount: { type: Number }, // nechta mashina uchun to'langan
  pricePerVehicle: { type: Number }, // har bir mashina narxi
  
  // Tarif
  plan: { type: String, enum: ['pro_monthly', 'pro_yearly', 'enterprise', 'per_vehicle'], required: true },
  planDuration: { type: Number, default: 30 }, // kunlarda
  
  // To'lov tizimi
  provider: { type: String, enum: ['payme', 'click', 'manual'], required: true },
  
  // Tranzaksiya ID lari
  orderId: { type: String, unique: true, required: true }, // bizning order ID
  transactionId: { type: String }, // to'lov tizimi transaction ID
  
  // Holat
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Payme uchun
  paymeTransactionId: { type: String },
  paymeState: { type: Number }, // 1=created, 2=completed, -1=cancelled, -2=cancelled after complete
  paymeCreateTime: { type: Number },
  paymePerformTime: { type: Number },
  paymeCancelTime: { type: Number },
  paymeReason: { type: Number },
  
  // Click uchun
  clickTransactionId: { type: String },
  clickMerchantTransId: { type: String },
  clickPrepareId: { type: Number },
  
  // Qo'shimcha
  description: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Vaqtlar
  paidAt: { type: Date },
  cancelledAt: { type: Date },
  expiresAt: { type: Date } // to'lov muddati
  
}, { timestamps: true })

// Indexlar
PaymentSchema.index({ user: 1, status: 1 })
PaymentSchema.index({ orderId: 1 }, { unique: true })
PaymentSchema.index({ paymeTransactionId: 1 })
PaymentSchema.index({ clickTransactionId: 1 })
PaymentSchema.index({ status: 1, createdAt: -1 })

// Order ID generatsiya
PaymentSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `AVT-${timestamp}-${random}`.toUpperCase()
}

module.exports = mongoose.model('Payment', PaymentSchema)
