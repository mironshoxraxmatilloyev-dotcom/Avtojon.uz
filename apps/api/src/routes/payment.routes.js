const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const Payment = require('../models/Payment')
const User = require('../models/User')
const Businessman = require('../models/Businessman')
const Vehicle = require('../models/Vehicle')
const { protect } = require('../middleware/auth')

// ============ NARXLAR ============
const PRICE_PER_VEHICLE = 50000 // 50,000 so'm / mashina / oy
const FREE_TRIAL_DAYS = 30 // 1 oy bepul sinov

// ============ NARX HISOBLASH ============
router.get('/calculate', protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.businessman?._id
    
    // Foydalanuvchi mashinalarini sanash
    const vehicleCount = await Vehicle.countDocuments({ 
      $or: [
        { owner: userId },
        { businessman: userId }
      ]
    })
    
    const totalPrice = vehicleCount * PRICE_PER_VEHICLE
    
    res.json({
      success: true,
      data: {
        vehicleCount,
        pricePerVehicle: PRICE_PER_VEHICLE,
        totalPrice,
        duration: 30, // kun
        freeTrialDays: FREE_TRIAL_DAYS
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ TO'LOV YARATISH ============
router.post('/create', protect, async (req, res) => {
  try {
    const { provider } = req.body
    const userId = req.user?._id || req.businessman?._id
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Foydalanuvchi topilmadi' })
    }
    
    if (!['payme', 'click'].includes(provider)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri to\'lov tizimi' })
    }
    
    // Mashina sonini hisoblash
    const vehicleCount = await Vehicle.countDocuments({ 
      $or: [
        { owner: userId },
        { businessman: userId }
      ]
    })
    
    if (vehicleCount === 0) {
      return res.status(400).json({ success: false, message: 'Sizda hali mashina yo\'q' })
    }
    
    const totalPrice = vehicleCount * PRICE_PER_VEHICLE
    const orderId = Payment.generateOrderId()
    
    // To'lov yaratish
    const payment = await Payment.create({
      user: userId,
      userType: req.businessman ? 'businessman' : 'user',
      amount: totalPrice * 100, // tiyinga o'tkazish (Payme uchun)
      amountInSom: totalPrice,
      vehicleCount,
      pricePerVehicle: PRICE_PER_VEHICLE,
      plan: 'per_vehicle',
      planDuration: 30,
      provider,
      orderId,
      status: 'pending',
      description: `Avtojon obunasi - ${vehicleCount} ta mashina`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 daqiqa
    })
    
    // To'lov URL yaratish
    let paymentUrl = ''
    const frontendUrl = process.env.FRONTEND_URL || 'https://avtojon.uz'
    
    if (provider === 'payme') {
      const merchantId = process.env.PAYME_MERCHANT_ID
      
      const params = Buffer.from(
        `m=${merchantId};` +
        `ac.id=${orderId};` +
        `a=${payment.amount};` +
        `c=${encodeURIComponent(frontendUrl + '/payment?status=success&order_id=' + orderId)}`
      ).toString('base64')
      
      paymentUrl = `https://checkout.paycom.uz/${params}`
    } else if (provider === 'click') {
      const merchantId = process.env.CLICK_MERCHANT_ID
      const serviceId = process.env.CLICK_SERVICE_ID
      
      paymentUrl = `https://my.click.uz/services/pay?` +
        `service_id=${serviceId}&` +
        `merchant_id=${merchantId}&` +
        `amount=${totalPrice}&` +
        `transaction_param=${orderId}&` +
        `return_url=${encodeURIComponent(frontendUrl + '/payment?status=success&order_id=' + orderId)}&` +
        `card_type=humo,uzcard,visa,mastercard`
    }
    
    res.json({
      success: true,
      data: {
        orderId,
        vehicleCount,
        pricePerVehicle: PRICE_PER_VEHICLE,
        amount: totalPrice,
        provider,
        paymentUrl,
        expiresAt: payment.expiresAt
      }
    })
  } catch (err) {
    console.error('Payment create error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ TO'LOV HOLATINI TEKSHIRISH ============
router.get('/status/:orderId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId })
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'To\'lov topilmadi' })
    }
    
    res.json({
      success: true,
      data: {
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amountInSom,
        plan: payment.plan,
        provider: payment.provider,
        paidAt: payment.paidAt
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ============ TO'LOVLAR TARIXI ============
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.businessman?._id
    
    const payments = await Payment.find({ user: userId })
      .select('orderId amount amountInSom plan provider status createdAt paidAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
    
    res.json({ success: true, data: payments })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ========================================================
// PAYME MERCHANT API
// Payme sizning serveringizga POST so'rov yuboradi
// URL: https://avtojon.uz/api/payments/payme
// ========================================================
router.post('/payme', async (req, res) => {
  try {
    const { method, params, id } = req.body
    
    console.log('📥 Payme request:', method, JSON.stringify(params))
    
    // Basic Auth tekshirish
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.log('❌ Payme auth failed: no header')
      return res.json({
        error: { code: -32504, message: { uz: 'Avtorizatsiya xatosi' } },
        id
      })
    }
    
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [login, password] = credentials.split(':')
    
    // Payme login: "Paycom", password: sizning PAYME_KEY
    if (login !== 'Paycom' || password !== process.env.PAYME_KEY) {
      console.log('❌ Payme auth failed: wrong credentials')
      return res.json({
        error: { code: -32504, message: { uz: 'Avtorizatsiya xatosi' } },
        id
      })
    }
    
    // Metodlarni qayta ishlash
    let result
    switch (method) {
      case 'CheckPerformTransaction':
        result = await paymeCheckPerform(params)
        break
      case 'CreateTransaction':
        result = await paymeCreate(params)
        break
      case 'PerformTransaction':
        result = await paymePerform(params)
        break
      case 'CancelTransaction':
        result = await paymeCancel(params)
        break
      case 'CheckTransaction':
        result = await paymeCheck(params)
        break
      case 'GetStatement':
        result = await paymeStatement(params)
        break
      default:
        result = { error: { code: -32601, message: { uz: 'Metod topilmadi' } } }
    }
    
    console.log('📤 Payme response:', JSON.stringify(result))
    res.json({ ...result, id })
    
  } catch (err) {
    console.error('❌ Payme error:', err)
    res.json({
      error: { code: -32400, message: { uz: 'Tizim xatosi' } },
      id: req.body?.id
    })
  }
})

// Payme: CheckPerformTransaction - to'lov qilish mumkinmi tekshirish
async function paymeCheckPerform(params) {
  // order_id yoki id - ikkalasini ham qabul qilish
  const orderId = params.account?.order_id || params.account?.id
  
  if (!orderId) {
    return { error: { code: -31050, message: { uz: 'Buyurtma raqami topilmadi' } } }
  }
  
  const payment = await Payment.findOne({ orderId })
  
  if (!payment) {
    return { error: { code: -31050, message: { uz: 'Buyurtma topilmadi' } } }
  }
  
  if (payment.status === 'completed') {
    return { error: { code: -31051, message: { uz: 'Buyurtma allaqachon to\'langan' } } }
  }
  
  if (payment.status === 'cancelled') {
    return { error: { code: -31052, message: { uz: 'Buyurtma bekor qilingan' } } }
  }
  
  // Summa tekshirish (tiyinda)
  if (payment.amount !== params.amount) {
    return { error: { code: -31001, message: { uz: 'Noto\'g\'ri summa' } } }
  }
  
  return { result: { allow: true } }
}

// Payme: CreateTransaction - tranzaksiya yaratish
async function paymeCreate(params) {
  // order_id yoki id - ikkalasini ham qabul qilish
  const orderId = params.account?.order_id || params.account?.id
  const payment = await Payment.findOne({ orderId })
  
  if (!payment) {
    return { error: { code: -31050, message: { uz: 'Buyurtma topilmadi' } } }
  }
  
  // Agar bu tranzaksiya allaqachon mavjud bo'lsa
  if (payment.paymeTransactionId) {
    // Boshqa tranzaksiya ID bilan kelsa - xato
    if (payment.paymeTransactionId !== params.id) {
      return { error: { code: -31051, message: { uz: 'Boshqa tranzaksiya mavjud' } } }
    }
    // Bir xil ID bilan kelsa - mavjud ma'lumotlarni qaytarish
    return {
      result: {
        create_time: payment.paymeCreateTime,
        transaction: payment.paymeTransactionId,
        state: payment.paymeState
      }
    }
  }
  
  // Summa tekshirish
  if (payment.amount !== params.amount) {
    return { error: { code: -31001, message: { uz: 'Noto\'g\'ri summa' } } }
  }
  
  // Yangi tranzaksiya yaratish
  const createTime = Date.now()
  payment.paymeTransactionId = params.id
  payment.paymeCreateTime = createTime
  payment.paymeState = 1 // created
  payment.status = 'processing'
  await payment.save()
  
  return {
    result: {
      create_time: createTime,
      transaction: params.id,
      state: 1
    }
  }
}

// Payme: PerformTransaction - to'lovni amalga oshirish
async function paymePerform(params) {
  const payment = await Payment.findOne({ paymeTransactionId: params.id })
  
  if (!payment) {
    return { error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi' } } }
  }
  
  // Agar allaqachon bajarilgan bo'lsa
  if (payment.paymeState === 2) {
    return {
      result: {
        transaction: params.id,
        perform_time: payment.paymePerformTime,
        state: 2
      }
    }
  }
  
  // Faqat state=1 (created) bo'lganda bajarish mumkin
  if (payment.paymeState !== 1) {
    return { error: { code: -31008, message: { uz: 'Tranzaksiyani bajarib bo\'lmaydi' } } }
  }
  
  // To'lovni tasdiqlash
  const performTime = Date.now()
  payment.paymePerformTime = performTime
  payment.paymeState = 2 // completed
  payment.status = 'completed'
  payment.paidAt = new Date()
  await payment.save()
  
  // Obunani aktivlashtirish
  await activateSubscription(payment)
  
  console.log('✅ Payment completed:', payment.orderId)
  
  return {
    result: {
      transaction: params.id,
      perform_time: performTime,
      state: 2
    }
  }
}

// Payme: CancelTransaction - tranzaksiyani bekor qilish
async function paymeCancel(params) {
  const payment = await Payment.findOne({ paymeTransactionId: params.id })
  
  if (!payment) {
    return { error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi' } } }
  }
  
  const cancelTime = Date.now()
  
  if (payment.paymeState === 1) {
    // Created holatda bekor qilish
    payment.paymeState = -1
    payment.paymeCancelTime = cancelTime
    payment.paymeReason = params.reason
    payment.status = 'cancelled'
    payment.cancelledAt = new Date()
  } else if (payment.paymeState === 2) {
    // Completed holatda bekor qilish (refund)
    payment.paymeState = -2
    payment.paymeCancelTime = cancelTime
    payment.paymeReason = params.reason
    payment.status = 'refunded'
    // TODO: Obunani bekor qilish logikasi
  }
  
  await payment.save()
  console.log('❌ Payment cancelled:', payment.orderId, 'reason:', params.reason)
  
  return {
    result: {
      transaction: params.id,
      cancel_time: cancelTime,
      state: payment.paymeState
    }
  }
}

// Payme: CheckTransaction - tranzaksiya holatini tekshirish
async function paymeCheck(params) {
  const payment = await Payment.findOne({ paymeTransactionId: params.id })
  
  if (!payment) {
    return { error: { code: -31003, message: { uz: 'Tranzaksiya topilmadi' } } }
  }
  
  return {
    result: {
      create_time: payment.paymeCreateTime,
      perform_time: payment.paymePerformTime || 0,
      cancel_time: payment.paymeCancelTime || 0,
      transaction: params.id,
      state: payment.paymeState,
      reason: payment.paymeReason || null
    }
  }
}

// Payme: GetStatement - hisobot olish
async function paymeStatement(params) {
  const payments = await Payment.find({
    provider: 'payme',
    paymeCreateTime: { $gte: params.from, $lte: params.to }
  }).lean()
  
  const transactions = payments.map(p => ({
    id: p.paymeTransactionId,
    time: p.paymeCreateTime,
    amount: p.amount,
    account: { id: p.orderId },
    create_time: p.paymeCreateTime,
    perform_time: p.paymePerformTime || 0,
    cancel_time: p.paymeCancelTime || 0,
    transaction: p.paymeTransactionId,
    state: p.paymeState,
    reason: p.paymeReason || null
  }))
  
  return { result: { transactions } }
}

// ========================================================
// CLICK MERCHANT API
// Click 2 ta endpoint ishlatadi: prepare va complete
// ========================================================

// Click: Prepare - to'lovni tayyorlash
router.post('/click/prepare', async (req, res) => {
  try {
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id, // bizning order_id
      amount,
      action,
      error: clickError,
      error_note,
      sign_time,
      sign_string
    } = req.body
    
    console.log('📥 Click prepare:', JSON.stringify(req.body))
    
    // Sign tekshirish
    const signCheck = crypto.createHash('md5')
      .update(
        click_trans_id +
        service_id +
        process.env.CLICK_SECRET_KEY +
        merchant_trans_id +
        amount +
        action +
        sign_time
      )
      .digest('hex')
    
    if (signCheck !== sign_string) {
      console.log('❌ Click sign check failed')
      return res.json({
        error: -1,
        error_note: 'SIGN CHECK FAILED!'
      })
    }
    
    // Buyurtmani topish
    const payment = await Payment.findOne({ orderId: merchant_trans_id })
    
    if (!payment) {
      return res.json({
        error: -5,
        error_note: 'User does not exist'
      })
    }
    
    if (payment.status === 'completed') {
      return res.json({
        error: -4,
        error_note: 'Already paid'
      })
    }
    
    if (payment.status === 'cancelled') {
      return res.json({
        error: -9,
        error_note: 'Transaction cancelled'
      })
    }
    
    // Summa tekshirish
    if (payment.amountInSom !== Number(amount)) {
      return res.json({
        error: -2,
        error_note: 'Incorrect parameter amount'
      })
    }
    
    // Prepare saqlash
    payment.clickTransactionId = String(click_trans_id)
    payment.clickMerchantTransId = merchant_trans_id
    payment.clickPrepareId = Date.now()
    payment.status = 'processing'
    await payment.save()
    
    console.log('✅ Click prepare success:', merchant_trans_id)
    
    res.json({
      click_trans_id: click_trans_id,
      merchant_trans_id: merchant_trans_id,
      merchant_prepare_id: payment.clickPrepareId,
      error: 0,
      error_note: 'Success'
    })
    
  } catch (err) {
    console.error('❌ Click prepare error:', err)
    res.json({
      error: -8,
      error_note: 'Error in request from click'
    })
  }
})

// Click: Complete - to'lovni yakunlash
router.post('/click/complete', async (req, res) => {
  try {
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      error: clickError,
      error_note,
      sign_time,
      sign_string
    } = req.body
    
    console.log('📥 Click complete:', JSON.stringify(req.body))
    
    // Sign tekshirish
    const signCheck = crypto.createHash('md5')
      .update(
        click_trans_id +
        service_id +
        process.env.CLICK_SECRET_KEY +
        merchant_trans_id +
        merchant_prepare_id +
        amount +
        action +
        sign_time
      )
      .digest('hex')
    
    if (signCheck !== sign_string) {
      console.log('❌ Click sign check failed')
      return res.json({
        error: -1,
        error_note: 'SIGN CHECK FAILED!'
      })
    }
    
    // Buyurtmani topish
    const payment = await Payment.findOne({ orderId: merchant_trans_id })
    
    if (!payment) {
      return res.json({
        error: -5,
        error_note: 'User does not exist'
      })
    }
    
    // Agar Click xato qaytarsa
    if (clickError && clickError < 0) {
      payment.status = 'failed'
      await payment.save()
      return res.json({
        error: -9,
        error_note: 'Transaction cancelled'
      })
    }
    
    // Agar allaqachon to'langan bo'lsa
    if (payment.status === 'completed') {
      return res.json({
        click_trans_id: click_trans_id,
        merchant_trans_id: merchant_trans_id,
        merchant_confirm_id: payment.clickPrepareId,
        error: 0,
        error_note: 'Already paid'
      })
    }
    
    // To'lovni tasdiqlash
    payment.status = 'completed'
    payment.paidAt = new Date()
    await payment.save()
    
    // Obunani aktivlashtirish
    await activateSubscription(payment)
    
    console.log('✅ Click complete success:', merchant_trans_id)
    
    res.json({
      click_trans_id: click_trans_id,
      merchant_trans_id: merchant_trans_id,
      merchant_confirm_id: payment.clickPrepareId,
      error: 0,
      error_note: 'Success'
    })
    
  } catch (err) {
    console.error('❌ Click complete error:', err)
    res.json({
      error: -8,
      error_note: 'Error in request from click'
    })
  }
})

// ========================================================
// OBUNANI AKTIVLASHTIRISH
// ========================================================
async function activateSubscription(payment) {
  try {
    const Model = payment.userType === 'businessman' ? Businessman : User
    const user = await Model.findById(payment.user)
    
    if (!user) {
      console.error('❌ User not found for subscription:', payment.user)
      return
    }
    
    const now = new Date()
    // Agar mavjud obuna bo'lsa va hali tugamagan bo'lsa, unga qo'shish
    const currentEnd = user.subscription?.endDate ? new Date(user.subscription.endDate) : now
    const startDate = currentEnd > now ? currentEnd : now
    const endDate = new Date(startDate.getTime() + payment.planDuration * 24 * 60 * 60 * 1000)
    
    user.subscription = {
      plan: 'pro',
      startDate: now,
      endDate,
      paymentId: payment._id
    }
    
    await user.save()
    console.log(`✅ Subscription activated for ${payment.user} until ${endDate.toISOString()}`)
    
  } catch (err) {
    console.error('❌ Subscription activation error:', err)
  }
}

// ========================================================
// WEBHOOK TEST (development uchun)
// ========================================================
if (process.env.NODE_ENV !== 'production') {
  // Test: to'lovni qo'lda tasdiqlash
  router.post('/test/complete/:orderId', protect, async (req, res) => {
    try {
      const payment = await Payment.findOne({ orderId: req.params.orderId })
      
      if (!payment) {
        return res.status(404).json({ success: false, message: 'To\'lov topilmadi' })
      }
      
      payment.status = 'completed'
      payment.paidAt = new Date()
      await payment.save()
      
      await activateSubscription(payment)
      
      res.json({ success: true, message: 'To\'lov tasdiqlandi' })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  })
}

module.exports = router
