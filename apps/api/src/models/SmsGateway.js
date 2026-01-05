/**
 * SMS Gateway Model
 * Android telefonlar ro'yxati
 */

const mongoose = require('mongoose')
const crypto = require('crypto')

const smsGatewaySchema = new mongoose.Schema({
  // Gateway nomi
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Unikal token (autentifikatsiya uchun)
  token: {
    type: String,
    required: true,
    unique: true
  },
  
  // Device ID (Android)
  deviceId: String,
  
  // SIM karta raqami
  simNumber: String,
  
  // Operator
  operator: {
    type: String,
    enum: ['mobiuz', 'beeline', 'ucell', 'uzmobile', 'other'],
    default: 'mobiuz'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  
  // Online status
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: Date,
  lastHeartbeat: Date,
  
  // Statistika
  stats: {
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    todaySent: { type: Number, default: 0 },
    lastResetDate: Date
  },
  
  // Rate limit
  rateLimit: {
    maxPerMinute: { type: Number, default: 60 },
    maxPerDay: { type: Number, default: 2000 }
  },
  
  // IP whitelist (ixtiyoriy)
  allowedIPs: [String]
}, {
  timestamps: true
})

// Token generatsiya
smsGatewaySchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex')
}

// Kunlik statistikani reset qilish
smsGatewaySchema.methods.resetDailyStats = function() {
  const today = new Date().toDateString()
  const lastReset = this.stats.lastResetDate?.toDateString()
  
  if (today !== lastReset) {
    this.stats.todaySent = 0
    this.stats.lastResetDate = new Date()
  }
}

module.exports = mongoose.model('SmsGateway', smsGatewaySchema)
