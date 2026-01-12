/**
 * Payme Sandbox Test Script
 * Bu skript to'lov tizimini test qiladi
 */

require('dotenv').config({ path: 'apps/api/.env' })

const API_URL = 'http://localhost:3000/api'
const PAYME_TEST_KEY = process.env.PAYME_TEST_KEY

// Test foydalanuvchi tokeni (login qilib olish kerak)
let authToken = ''

async function login() {
    console.log('\n🔐 Login qilish...')

    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phone: '+998901234567',
            password: 'test123'
        })
    })

    const data = await res.json()
    if (data.success && data.token) {
        authToken = data.token
        console.log('✅ Login muvaffaqiyatli')
        return true
    }

    console.log('⚠️  Login xatosi, test user yaratish kerak')
    return false
}

async function createPayment() {
    console.log('\n💳 To\'lov yaratish...')

    const res = await fetch(`${API_URL}/payments/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            provider: 'payme',
            type: 'fleet',
            unitCount: 1
        })
    })

    const data = await res.json()
    console.log('📦 Javob:', JSON.stringify(data, null, 2))

    if (data.success) {
        console.log('✅ To\'lov yaratildi')
        console.log(`   ID: ${data.data.id}`)
        console.log(`   Summa: ${data.data.amount} so'm`)
        console.log(`   URL: ${data.data.paymentUrl}`)
        return data.data
    }

    return null
}

async function simulatePaymeCallback(paymentId, amount) {
    console.log('\n🔄 Payme callback simulyatsiya...')

    const auth = Buffer.from(`Paycom:${PAYME_TEST_KEY}`).toString('base64')
    const transactionId = 'test_' + Date.now()

    // 1. CheckPerformTransaction
    console.log('\n1️⃣ CheckPerformTransaction...')
    let res = await fetch(`${API_URL}/payments/payme`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
            method: 'CheckPerformTransaction',
            params: {
                amount: amount * 100, // tiyinga
                account: { id: paymentId }
            },
            id: 1
        })
    })
    let data = await res.json()
    console.log('📦', JSON.stringify(data, null, 2))

    if (data.error) {
        console.log('❌ CheckPerform xatosi')
        return false
    }

    // 2. CreateTransaction
    console.log('\n2️⃣ CreateTransaction...')
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
                amount: amount * 100,
                account: { id: paymentId }
            },
            id: 2
        })
    })
    data = await res.json()
    console.log('📦', JSON.stringify(data, null, 2))

    if (data.error) {
        console.log('❌ CreateTransaction xatosi')
        return false
    }

    // 3. PerformTransaction
    console.log('\n3️⃣ PerformTransaction...')
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
    console.log('📦', JSON.stringify(data, null, 2))

    if (data.result?.state === 2) {
        console.log('✅ To\'lov muvaffaqiyatli amalga oshirildi!')
        return true
    }

    return false
}

async function checkPaymentStatus(paymentId) {
    console.log('\n📊 To\'lov holatini tekshirish...')

    const res = await fetch(`${API_URL}/payments/status/${paymentId}`)
    const data = await res.json()

    console.log('📦 Holat:', JSON.stringify(data, null, 2))
    return data
}

// Direct test (login talab qilmaydi)
async function directTest() {
    console.log('\n🧪 Direct Payme API test...')

    // MongoDB ga to'g'ridan-to'g'ri test payment qo'shish
    const { MongoClient, ObjectId } = require('mongodb')
    const uri = 'mongodb+srv://jovohirjabborov85_db_user:avfyEyEcz4TKTpa8@testjon.pndywhv.mongodb.net/avtojon?retryWrites=true&w=majority'

    const client = new MongoClient(uri)
    await client.connect()

    const db = client.db('avtojon')
    const payments = db.collection('payments')

    // Test payment yaratish
    const testPayment = {
        _id: new ObjectId(),
        amount: 5000000, // 50,000 so'm = 5,000,000 tiyin
        state: 'created',
        type: 'fleet',
        unitCount: 1,
        description: 'Sandbox test payment',
        createdAt: new Date()
    }

    await payments.insertOne(testPayment)
    console.log(`✅ Test payment yaratildi: ${testPayment._id}`)

    await client.close()

    // Payme callback simulyatsiya
    const success = await simulatePaymeCallback(testPayment._id.toString(), 50000)

    if (success) {
        console.log('\n🎉 SANDBOX TEST MUVAFFAQIYATLI!')
    } else {
        console.log('\n❌ Test muvaffaqiyatsiz')
    }
}

// Main
async function main() {
    console.log('═══════════════════════════════════════')
    console.log('   PAYME SANDBOX TEST')
    console.log('═══════════════════════════════════════')

    // API server ishlaydimi tekshirish
    try {
        const res = await fetch(`${API_URL}/health`)
        if (!res.ok) throw new Error('Server not running')
    } catch (err) {
        console.log('❌ API server ishlamayapti!')
        console.log('   Avval: npm run dev (apps/api papkasida)')
        return
    }

    console.log('✅ API server ishlayapti')

    // Direct test
    await directTest()
}

main().catch(console.error)
