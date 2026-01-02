/**
 * SMS Routes
 * Admin panel va Gateway uchun API'lar
 */

const express = require('express')
const router = express.Router()
const SmsMessage = require('../models/SmsMessage')
const SmsGateway = require('../models/SmsGateway')
const User = require('../models/User')
const { protect, authorize } = require('../middleware/auth')

// ==========================================
// ADMIN PANEL API'LARI
// ==========================================

/**
 * SMS yuborish (bitta yoki bulk)
 * POST /api/sms/send
 */
router.post('/send', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { phone, phones, message, type = 'notification' } = req.body
    
    if (!message || message.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMS matni kiritilmagan' 
      })
    }
    
    const phoneList = phones || (phone ? [phone] : [])
    
    if (phoneList.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefon raqam kiritilmagan' 
      })
    }
    
    // Bulk ID yaratish
    const bulkId = phoneList.length > 1 ? `bulk_${Date.now()}` : null
    
    // SMS'larni yaratish - SuperAdmin uchun sentBy ni null qilamiz
    const smsMessages = phoneList.map(p => ({
      phone: formatPhone(p),
      message,
      type: bulkId ? 'bulk' : type,
      bulkId,
      sentBy: req.isSuperAdmin ? null : req.user._id,
      status: 'pending'
    }))
    
    const created = await SmsMessage.insertMany(smsMessages)
    
    res.status(201).json({
      success: true,
      data: {
        count: created.length,
        bulkId,
        messages: created
      },
      message: `${created.length} ta SMS navbatga qo'shildi`
    })
  } catch (err) {
    console.error('SMS send error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * Barcha userlarga SMS yuborish
 * POST /api/sms/send-all
 */
router.post('/send-all', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { message, userFilter = {} } = req.body
    
    if (!message || message.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMS matni kiritilmagan' 
      })
    }
    
    // Userlarni olish
    const users = await User.find({
      ...userFilter,
      phone: { $exists: true, $ne: '' }
    }).select('phone name')
    
    if (users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefon raqamli userlar topilmadi' 
      })
    }
    
    const bulkId = `bulk_all_${Date.now()}`
    
    const smsMessages = users.map(user => ({
      phone: formatPhone(user.phone),
      message,
      type: 'bulk',
      bulkId,
      sentBy: req.isSuperAdmin ? null : req.user._id,
      recipient: user._id,
      status: 'pending'
    }))
    
    await SmsMessage.insertMany(smsMessages)
    
    res.status(201).json({
      success: true,
      data: { count: users.length, bulkId },
      message: `${users.length} ta userga SMS navbatga qo'shildi`
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * SMS log'larni olish
 * GET /api/sms/logs
 */
router.get('/logs', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, status, phone, bulkId } = req.query
    
    const filter = {}
    if (status) filter.status = status
    if (phone) filter.phone = new RegExp(phone, 'i')
    if (bulkId) filter.bulkId = bulkId
    
    const [messages, total] = await Promise.all([
      SmsMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('sentBy', 'name')
        .populate('recipient', 'name phone')
        .lean(),
      SmsMessage.countDocuments(filter)
    ])
    
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * SMS statistika
 * GET /api/sms/stats
 */
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [total, pending, sent, failed, todayCount, gateways] = await Promise.all([
      SmsMessage.countDocuments(),
      SmsMessage.countDocuments({ status: 'pending' }),
      SmsMessage.countDocuments({ status: 'sent' }),
      SmsMessage.countDocuments({ status: 'failed' }),
      SmsMessage.countDocuments({ createdAt: { $gte: today } }),
      SmsGateway.find({ status: 'active' }).select('name isOnline lastSeen stats').lean()
    ])
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        sent,
        failed,
        todayCount,
        gateways
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ==========================================
// GATEWAY API'LARI (Android app uchun)
// ==========================================

/**
 * Gateway autentifikatsiya middleware
 */
const gatewayAuth = async (req, res, next) => {
  try {
    const token = req.headers['x-gateway-token']
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token kerak' })
    }
    
    const gateway = await SmsGateway.findOne({ token, status: 'active' })
    
    if (!gateway) {
      return res.status(401).json({ success: false, message: 'Noto\'g\'ri token' })
    }
    
    // IP tekshiruvi (agar sozlangan bo'lsa)
    if (gateway.allowedIPs?.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress
      if (!gateway.allowedIPs.includes(clientIP)) {
        return res.status(403).json({ success: false, message: 'IP ruxsat etilmagan' })
      }
    }
    
    // Kunlik statistikani reset qilish
    gateway.resetDailyStats()
    
    req.gateway = gateway
    next()
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

/**
 * Gateway heartbeat
 * POST /api/sms/gateway/heartbeat
 */
router.post('/gateway/heartbeat', gatewayAuth, async (req, res) => {
  try {
    const { deviceId } = req.body
    
    console.log('💓 Gateway heartbeat:', req.gateway.name)
    
    req.gateway.isOnline = true
    req.gateway.lastHeartbeat = new Date()
    req.gateway.lastSeen = new Date()
    if (deviceId) req.gateway.deviceId = deviceId
    
    await req.gateway.save()
    
    res.json({ success: true, message: 'OK' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * Navbatdagi SMS'larni olish
 * GET /api/sms/gateway/queue
 */
router.get('/gateway/queue', gatewayAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query
    
    console.log('📬 Gateway queue so\'rovi:', req.gateway.name)
    
    // Rate limit tekshiruvi
    const gateway = req.gateway
    if (gateway.stats.todaySent >= gateway.rateLimit.maxPerDay) {
      return res.json({ 
        success: true, 
        data: [], 
        message: 'Kunlik limit tugadi' 
      })
    }
    
    // Pending SMS'larni olish
    const messages = await SmsMessage.find({
      status: 'pending',
      retryCount: { $lt: 3 }
    })
      .sort({ createdAt: 1 })
      .limit(Number(limit))
      .select('_id phone message')
      .lean()
    
    // Status'ni queued ga o'zgartirish
    if (messages.length > 0) {
      await SmsMessage.updateMany(
        { _id: { $in: messages.map(m => m._id) } },
        { status: 'queued', gatewayId: gateway._id }
      )
    }
    
    res.json({
      success: true,
      data: messages.map(m => ({
        id: m._id,
        phone: m.phone,
        message: m.message
      }))
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * SMS status yangilash
 * POST /api/sms/gateway/status
 */
router.post('/gateway/status', gatewayAuth, async (req, res) => {
  try {
    const { id, status, errorMessage } = req.body
    
    if (!id || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'id va status kerak' 
      })
    }
    
    const updateData = { status }
    
    if (status === 'sent') {
      updateData.sentAt = new Date()
      req.gateway.stats.totalSent += 1
      req.gateway.stats.todaySent += 1
    } else if (status === 'failed') {
      updateData.errorMessage = errorMessage
      updateData.$inc = { retryCount: 1 }
      req.gateway.stats.totalFailed += 1
      
      // Retry uchun pending ga qaytarish
      const sms = await SmsMessage.findById(id)
      if (sms && sms.retryCount < sms.maxRetries) {
        updateData.status = 'pending'
      }
    }
    
    await SmsMessage.findByIdAndUpdate(id, updateData)
    await req.gateway.save()
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ==========================================
// GATEWAY MANAGEMENT (Admin)
// ==========================================

/**
 * Gateway'larni olish
 * GET /api/sms/gateways
 */
router.get('/gateways', protect, authorize('superadmin'), async (req, res) => {
  try {
    const gateways = await SmsGateway.find().lean()
    res.json({ success: true, data: gateways })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * Yangi gateway qo'shish
 * POST /api/sms/gateways
 */
router.post('/gateways', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, simNumber, operator } = req.body
    
    const token = SmsGateway.generateToken()
    
    const gateway = await SmsGateway.create({
      name,
      simNumber,
      operator,
      token
    })
    
    res.status(201).json({
      success: true,
      data: gateway,
      message: 'Gateway yaratildi. Token: ' + token
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * Gateway o'chirish
 * DELETE /api/sms/gateways/:id
 */
router.delete('/gateways/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    await SmsGateway.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Gateway o\'chirildi' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatPhone(phone) {
  // +998 formatiga keltirish
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('998')) {
    return '+' + cleaned
  }
  if (cleaned.startsWith('8') && cleaned.length === 9) {
    return '+998' + cleaned
  }
  if (cleaned.length === 9) {
    return '+998' + cleaned
  }
  return '+' + cleaned
}

module.exports = router
