/**
 * Production Payme Test Script
 * Deploy qilingan serverda test qilish uchun
 */

const API_URL = 'https://avtojon.uz/api'
const PAYME_TEST_KEY = 'Z#rMcx4CDrMXPN2k9q8#UPCFZEMZrm2nkgQw' // Haqiqiy test key

async function testProductionPayme() {
  console.log('🧪 Production Payme Test')
  console.log('API URL:', API_URL)

  try {
    // 1. API health check
    console.log('\n1️⃣ API health check...')
    const healthRes = await fetch(`${API_URL}/health`)
    if (!healthRes.ok) throw new Error('API not responding')
    console.log('✅ API ishlayapti')

    // 2. Test payment yaratish (to'g'ridan-to'g'ri DB ga)
    console.log('\n2️⃣ Test payment yaratish...')
    
    // MongoDB ga ulanish (production DB)
    const { MongoClient, ObjectId } = require('mongodb')
    const uri = 'mongodb+srv://jovohirjabborov85_db_user:avfyEyEcz4TKTpa8@testjon.pndywhv.mongodb.net/avtojon?retryWrites=true&w=majority'
    
    const client = new MongoClient(uri)
    await client.connect()
    
    const db = client.db('avtojon')
    const payments = db.collection('payments')
    
    // Eski test paymentlarni o'chirish
    await payments.deleteMany({ description: /test/i })
    
    // Yangi test payment
    const testPayment = {
      _id: new ObjectId(),
      amount: 9000000, // 90,000 so'm = 9,000,000 tiyin (3 haydovchi x 30,000)
      state: 'created',
      type: 'business',
      unitCount: 3,
      description: 'Production test payment - 3 haydovchi',
      createdAt: new Date()
    }
    
    await payments.insertOne(testPayment)
    console.log(`✅ Test payment yaratildi: ${testPayment._id}`)
    console.log(`   Summa: ${testPayment.amount / 100} so'm`)
    
    await client.close()

    // 3. Payme webhook test
    console.log('\n3️⃣ Payme webhook test...')
    
    const auth = Buffer.from(`Paycom:${PAYME_TEST_KEY}`).toString('base64')
    const transactionId = 'prod_test_' + Date.now()
    
    // CheckPerformTransaction
    console.log('\n   CheckPerformTransaction...')
    let res = await fetch(`${API_URL}/payments/payme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        method: 'CheckPerformTransaction',
        params: {
          amount: testPayment.amount,
          account: { id: testPayment._id.toString() }
        },
        id: 1
      })
    })
    
    let data = await res.json()
    console.log('   📦', data.result ? '✅ Success' : '❌ Error:', JSON.stringify(data, null, 2))
    
    if (data.error) return
    
    // CreateTransaction
    console.log('\n   CreateTransaction...')
    res = await fetch(`${API_URL}/payments/payme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        method: 'CreateTransaction',
        params: {
          id: transactionId,
          time: Date.now(),
          amount: testPayment.amount,
          account: { id: testPayment._id.toString() }
        },
        id: 2
      })
    })
    
    data = await res.json()
    console.log('   📦', data.result ? '✅ Success' : '❌ Error:', JSON.stringify(data, null, 2))
    
    if (data.error) return
    
    // PerformTransaction
    console.log('\n   PerformTransaction...')
    res = await fetch(`${API_URL}/payments/payme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        method: 'PerformTransaction',
        params: { id: transactionId },
        id: 3
      })
    })
    
    data = await res.json()
    console.log('   📦', data.result ? '✅ Success' : '❌ Error:', JSON.stringify(data, null, 2))
    
    if (data.result?.state === 2) {
      console.log('\n🎉 PRODUCTION TEST MUVAFFAQIYATLI!')
      console.log('   To\'lov muvaffaqiyatli amalga oshirildi')
      console.log('   Endi real Payme sandbox orqali test qilishingiz mumkin')
    }
    
  } catch (error) {
    console.error('❌ Xatolik:', error.message)
  }
}

// Agar Node.js muhitida ishga tushirilsa
if (typeof require !== 'undefined') {
  testProductionPayme()
}