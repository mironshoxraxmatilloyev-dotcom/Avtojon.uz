const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Payment = require('../models/Payment')
const User = require('../models/User')
const Businessman = require('../models/Businessman')
const Vehicle = require('../models/Vehicle')
const { protect } = require('../middleware/auth')

// ObjectId validatsiya
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// ============ NARXLAR ============
// Fleet users (oddiy mijozlar): 10,000 so'm / mashina / oy
// Biznesmenlar (korporativ): 30,000 so'm / mashina / oy
const PRICE_FLEET = 10000
const PRICE_BUSINESS = 30000

// ============ NARXNI HISOBLASH ============
router.get('/calculate', protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.businessman?._id
    const userType = req.businessman ? 'Businessman' : 'User'
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' })
    }
    
    // Ikkala user turi uchun ham mashina soniga qarab hisoblash
    const vehicleCount = await Vehicle.countDocuments({ user: userId, isActive: true })
    const pricePerVehicle = userType === 'Businessman' ? PRICE_BUSINESS : PRICE_FLEET
    const totalPrice = Math.max(1, vehicleCount) * pricePerVehicle
    
    res.json({
      success: true,
      data: {
        vehicleCount,
        pricePerVehicle,
        totalPrice,
        userType
      }
    })
  } catch (err) {
    console.error('Calculate error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ TO'LOV YARATISH ============
router.post('/create', protect, async (req, res) => {
  try {
    const { provider, type, unitCount = 1 } = req.body
    const userId = req.user?._id || req.businessman?._id
    const userType = req.businessman ? 'Businessman' : 'User'
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' })
    }
    
    if (provider !== 'payme') {
      return res.status(400).json({ success: false, message: 'Faqat Payme qo\'llab-quvvatlanadi' })
    }
    
    // Narxni user turiga qarab belgilash (ikkala turi uchun mashina soniga qarab)
    const pricePerUnit = userType === 'Businessman' ? PRICE_BUSINESS : PRICE_FLEET
    const totalPrice = Math.max(1, unitCount) * pricePerUnit
    
    // To'lov yaratish
    const payment = await Payment.create({
      amount: totalPrice * 100, // tiyinga o'tkazish
      state: 'created',
      user: userId,
      userType,
      type: type || 'fleet',
      unitCount,
      description: `Avtojon obunasi - ${unitCount} ta mashina`
    })
    
    // Payme URL yaratish
    const merchantId = process.env.PAYME_MERCHANT_ID
    const frontendUrl = process.env.FRONTEND_URL || 'https://avtojon.uz'
    
    // Payme checkout URL - _id ishlatamiz
    const params = Buffer.from(
      `m=${merchantId};ac.id=${payment._id};a=${payment.amount};c=${encodeURIComponent(frontendUrl + '/payment/success')}`
    ).toString('base64')
    
    // Sandbox uchun test.paycom.uz, production uchun checkout.paycom.uz
    const paymeHost = process.env.PAYME_SANDBOX === 'true' ? 'test.paycom.uz' : 'checkout.paycom.uz'
    const paymentUrl = `https://${paymeHost}/${params}`
    
    res.json({
      success: true,
      data: {
        id: payment._id,
        amount: totalPrice,
        unitCount,
        paymentUrl
      }
    })
  } catch (err) {
    console.error('Payment create error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ TO'LOV HOLATINI TEKSHIRISH ============
router.get('/status/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'To\'lov topilmadi' })
    }
    
    res.json({
      success: true,
      data: {
        id: payment._id,
        state: payment.state,
        amount: payment.amount / 100,
        performedAt: payment.performedAt
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ========================================================
// PAYME MERCHANT API
// URL: https://avtojon.uz/api/payments/payme
// ========================================================
router.post('/payme', async (req, res) => {
  const { method, params, id } = req.body
  
  console.log('📥 Payme:', method, JSON.stringify(params))
  
  // Basic Auth tekshirish
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Basic ')) {
    return sendPaymeError(res, id, -32504, 'Authorization invalid')
  }
  
  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
  const [login, password] = credentials.split(':')
  
  // Sandbox yoki production key
  const validKey = process.env.PAYME_SANDBOX === 'true' 
    ? process.env.PAYME_TEST_KEY 
    : process.env.PAYME_KEY
  
  if (login !== 'Paycom' || password !== validKey) {
    console.log('❌ Auth failed. Got:', login, password?.substring(0, 5) + '...')
    return sendPaymeError(res, id, -32504, 'Authorization invalid')
  }
  
  try {
    let result
    switch (method) {
      case 'CheckPerformTransaction':
        result = await checkPerform(params)
        break
      case 'CreateTransaction':
        result = await createTransaction(params)
        break
      case 'PerformTransaction':
        result = await performTransaction(params)
        break
      case 'CancelTransaction':
        result = await cancelTransaction(params)
        break
      case 'CheckTransaction':
        result = await checkTransaction(params)
        break
      case 'GetStatement':
        result = await getStatement(params)
        break
      default:
        return sendPaymeError(res, id, -32601, 'Method not found')
    }
    
    console.log('📤 Response:', JSON.stringify(result))
    
    // Agar result da error bor bo'lsa, uni to'g'ri formatda qaytarish
    if (result && result.error) {
      return res.json({ error: result.error, id })
    }
    
    res.json({ result, id })
    
  } catch (err) {
    console.error('❌ Payme error:', err)
    sendPaymeError(res, id, -32400, 'System error')
  }
})

// Payme xato javob
function sendPaymeError(res, id, code, message) {
  res.json({
    error: {
      code,
      message: { uz: message, ru: message, en: message }
    },
    id
  })
}

// CheckPerformTransaction
async function checkPerform(params) {
  const id = params.account?.id
  if (!id) {
    return { error: { code: -31050, message: { uz: 'ID topilmadi', ru: 'ID не найден', en: 'ID not found' } } }
  }
  
  if (!isValidObjectId(id)) {
    return { error: { code: -31050, message: { uz: 'Noto\'g\'ri ID formati', ru: 'Неверный формат ID', en: 'Invalid ID format' } } }
  }
  
  const payment = await Payment.findById(id)
  if (!payment) {
    return { error: { code: -31050, message: { uz: 'To\'lov topilmadi', ru: 'Платеж не найден', en: 'Payment not found' } } }
  }
  
  if (payment.state === 'performed') {
    return { error: { code: -31051, message: { uz: 'Allaqachon to\'langan', ru: 'Уже оплачено', en: 'Already paid' } } }
  }
  
  if (payment.state === 'cancelled') {
    return { error: { code: -31052, message: { uz: 'Bekor qilingan', ru: 'Отменено', en: 'Cancelled' } } }
  }
  
  if (payment.amount !== params.amount) {
    return { error: { code: -31001, message: { uz: 'Noto\'g\'ri summa', ru: 'Неверная сумма', en: 'Invalid amount' } } }
  }
  
  return { allow: true }
}

// CreateTransaction
async function createTransaction(params) {
  const id = params.account?.id
  const transactionId = params.id
  const time = params.time
  
  if (!isValidObjectId(id)) {
    return { error: { code: -31050, message: { uz: 'Noto\'g\'ri ID formati', ru: 'Неверный формат ID', en: 'Invalid ID format' } } }
  }
  
  const payment = await Payment.findById(id)
  if (!payment) {
    return { error: { code: -31050, message: { uz: 'To\'lov topilmadi', ru: 'Платеж не найден', en: 'Payment not found' } } }
  }
  
  // To'lov allaqachon bajarilgan bo'lsa
  if (payment.state === 'performed') {
    return { error: { code: -31051, message: { uz: 'Allaqachon to\'langan', ru: 'Уже оплачено', en: 'Already paid' } } }
  }
  
  // To'lov bekor qilingan bo'lsa
  if (payment.state === 'cancelled') {
    return { error: { code: -31052, message: { uz: 'Bekor qilingan', ru: 'Отменено', en: 'Cancelled' } } }
  }
  
  // Agar allaqachon tranzaksiya mavjud
  if (payment.paymeTransactionId) {
    if (payment.paymeTransactionId !== transactionId) {
      return { error: { code: -31008, message: { uz: 'Boshqa tranzaksiya mavjud', ru: 'Другая транзакция существует', en: 'Another transaction exists' } } }
    }
    // Mavjud tranzaksiyani qaytarish
    return {
      create_time: payment.paymeCreateTime,
      transaction: payment.paymeTransactionId,
      state: payment.state === 'created' ? 1 : payment.state === 'performed' ? 2 : -1
    }
  }
  
  if (payment.amount !== params.amount) {
    return { error: { code: -31001, message: { uz: 'Noto\'g\'ri summa', ru: 'Неверная сумма', en: 'Invalid amount' } } }
  }
  
  // Yangi tranzaksiya yaratish
  payment.paymeTransactionId = transactionId
  payment.paymeCreateTime = time
  payment.state = 'created' // State ni aniq belgilash
  await payment.save()
  
  return {
    create_time: time,
    transaction: transactionId,
    state: 1
  }
}

// PerformTransaction
async function performTransaction(params) {
  const payment = await Payment.findOne({ paymeTransactionId: params.id })
  if (!payment) {
    return { error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' } } }
  }
  
  if (payment.state === 'performed') {
    return {
      transaction: params.id,
      perform_time: payment.paymePerformTime,
      state: 2
    }
  }
  
  if (payment.state === 'cancelled') {
    return { error: { code: -31008, message: { uz: 'Tranzaksiya bekor qilingan', ru: 'Транзакция отменена', en: 'Transaction cancelled' } } }
  }
  
  const performTime = Date.now()
  payment.state = 'performed'
  payment.performedAt = new Date()
  payment.paymePerformTime = performTime
  await payment.save()
  
  // Obunani aktivlashtirish
  await activateSubscription(payment)
  
  console.log('✅ Payment performed:', payment._id)
  
  return {
    transaction: params.id,
    perform_time: performTime,
    state: 2
  }
}

// CancelTransaction
async function cancelTransaction(params) {
  const payment = await Payment.findOne({ paymeTransactionId: params.id })
  if (!payment) {
    return { error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' } } }
  }
  
  const cancelTime = Date.now()
  
  if (payment.state === 'performed') {
    // Refund - -2 state
    payment.state = 'cancelled'
    payment.reason = params.reason
    payment.cancelledAt = new Date()
    payment.paymeCancelTime = cancelTime
    await payment.save()
    
    return {
      transaction: params.id,
      cancel_time: cancelTime,
      state: -2
    }
  }
  
  // Created holatda bekor qilish - -1 state
  payment.state = 'cancelled'
  payment.reason = params.reason
  payment.cancelledAt = new Date()
  payment.paymeCancelTime = cancelTime
  await payment.save()
  
  console.log('❌ Payment cancelled:', payment._id, 'reason:', params.reason)
  
  return {
    transaction: params.id,
    cancel_time: cancelTime,
    state: -1
  }
}

// CheckTransaction
async function checkTransaction(params) {
  const payment = await Payment.findOne({ paymeTransactionId: params.id })
  if (!payment) {
    return { error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' } } }
  }
  
  let state = 1
  if (payment.state === 'performed') state = 2
  else if (payment.state === 'cancelled') state = payment.paymePerformTime ? -2 : -1
  
  return {
    create_time: payment.paymeCreateTime,
    perform_time: payment.paymePerformTime || 0,
    cancel_time: payment.paymeCancelTime || 0,
    transaction: params.id,
    state,
    reason: payment.reason
  }
}

// GetStatement
async function getStatement(params) {
  const payments = await Payment.find({
    paymeCreateTime: { $gte: params.from, $lte: params.to }
  }).lean()
  
  const transactions = payments.map(p => {
    let state = 1
    if (p.state === 'performed') state = 2
    else if (p.state === 'cancelled') state = p.paymePerformTime ? -2 : -1
    
    return {
      id: p.paymeTransactionId,
      time: p.paymeCreateTime,
      amount: p.amount,
      account: { id: p._id.toString() },
      create_time: p.paymeCreateTime,
      perform_time: p.paymePerformTime || 0,
      cancel_time: p.paymeCancelTime || 0,
      transaction: p.paymeTransactionId,
      state,
      reason: p.reason
    }
  })
  
  return { transactions }
}

// Obunani aktivlashtirish
async function activateSubscription(payment) {
  try {
    const Model = payment.userType === 'Businessman' ? Businessman : User
    const user = await Model.findById(payment.user)
    
    if (!user) {
      console.error('❌ User not found:', payment.user)
      return
    }
    
    const now = new Date()
    const currentEnd = user.subscription?.endDate ? new Date(user.subscription.endDate) : now
    const startDate = currentEnd > now ? currentEnd : now
    
    // 30 kun qo'shish (production) yoki TRIAL_MINUTES (test)
    const durationMs = process.env.TRIAL_MINUTES 
      ? parseInt(process.env.TRIAL_MINUTES) * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000
    
    const endDate = new Date(startDate.getTime() + durationMs)
    
    user.subscription = {
      plan: 'pro',
      startDate: now,
      endDate,
      isExpired: false
    }
    
    await user.save()
    console.log(`✅ Subscription activated until ${endDate.toISOString()}`)
    
  } catch (err) {
    console.error('❌ Subscription error:', err)
  }
}

module.exports = router
