const mongoose = require('mongoose')

const PaymentSchema = new mongoose.Schema({
  // Bizning ichki ID - Payme uchun account.id sifatida ishlatiladi
  idd: { 
    type: String, 
    unique: true, 
    required: true,
    index: true
  },
  
  // Payme tranzaksiya ID si
  paymeTransactionId: { type: String, index: true },
  
  // Summa (tiyinda - so'm * 100)
  amount: { type: Number, required: true },
  
  // Holat: created | performed | cancelled
  state: { 
    type: String, 
    enum: ['created', 'performed', 'cancelled'],
    default: 'created'
  },
  
  // Bekor qilish sababi (Payme reason kodi)
  reason: { type: Number, default: null },
  
  // Vaqtlar
  createdAt: { type: Date, default: Date.now },
  performedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  
  // Payme vaqtlari (milliseconds)
  paymeCreateTime: { type: Number },
  paymePerformTime: { type: Number },
  paymeCancelTime: { type: Number },
  
  // Qo'shimcha ma'lumotlar
  user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType' },
  userType: { type: String, enum: ['User', 'Businessman'], default: 'User' },
  type: { type: String, enum: ['fleet', 'business'], default: 'fleet' },
  unitCount: { type: Number, default: 1 }, // mashina yoki haydovchi soni
  description: { type: String }
  
}, { 
  timestamps: false, // O'zimiz boshqaramiz
  versionKey: false 
})

// Indexlar
PaymentSchema.index({ state: 1 })
PaymentSchema.index({ user: 1, state: 1 })

// ID generatsiya - trip_XXXX formatida
PaymentSchema.statics.generateId = function() {
  const random = Math.floor(1000 + Math.random() * 9000)
  return `trip_${random}`
}

module.exports = mongoose.model('Payment', PaymentSchema)
