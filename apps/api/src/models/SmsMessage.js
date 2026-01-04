/**
 * SMS Message Model
 * Android Gateway orqali yuboriladigan SMS'lar
 */

const mongoose = require('mongoose')

const smsMessageSchema = new mongoose.Schema({
  // Qabul qiluvchi
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // SMS matni
  message: {
    type: String,
    required: true
    // maxlength olib tashlandi - uzun SMS'lar uchun
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'queued', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  
  // Xatolik sababi
  errorMessage: String,
  
  // Retry
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  
  // Gateway ma'lumotlari
  gatewayId: String, // Qaysi gateway yubordi
  sentAt: Date,
  deliveredAt: Date,
  
  // Yuboruvchi
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Qabul qiluvchi user (agar mavjud bo'lsa)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // SMS turi
  type: {
    type: String,
    enum: ['notification', 'verification', 'marketing', 'system', 'bulk'],
    default: 'notification'
  },
  
  // Bulk SMS uchun
  bulkId: String,
  
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
})

// Indexlar
smsMessageSchema.index({ status: 1, createdAt: -1 })
smsMessageSchema.index({ phone: 1 })
smsMessageSchema.index({ sentBy: 1 })
smsMessageSchema.index({ bulkId: 1 })

module.exports = mongoose.model('SmsMessage', smsMessageSchema)
