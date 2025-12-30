const { MongoClient } = require('mongodb')

const uri = 'mongodb+srv://jovohirjabborov85_db_user:avfyEyEcz4TKTpa8@testjon.pndywhv.mongodb.net/avtojon?retryWrites=true&w=majority'

async function setupPaymeTest() {
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('✅ MongoDB ga ulandi')
    
    const db = client.db('avtojon')
    const payments = db.collection('payments')
    
    // Eski test buyurtmalarni o'chirish
    const deleted = await payments.deleteMany({ orderId: /^PAYME_TEST/ })
    console.log(`🗑️  ${deleted.deletedCount} ta eski test buyurtma o'chirildi`)
    
    // Test buyurtmalarni yaratish
    await payments.insertMany([
      {
        orderId: 'PAYME_TEST_001',
        amount: 100000,
        amountInSom: 1000,
        status: 'pending',
        provider: 'payme',
        plan: 'per_vehicle',
        planDuration: 30,
        vehicleCount: 1,
        pricePerVehicle: 1000,
        description: 'Payme test buyurtma 1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        orderId: 'PAYME_TEST_002',
        amount: 100000,
        amountInSom: 1000,
        status: 'pending',
        provider: 'payme',
        plan: 'per_vehicle',
        planDuration: 30,
        vehicleCount: 1,
        pricePerVehicle: 1000,
        description: 'Payme test buyurtma 2',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    ])
    
    console.log('✅ Test buyurtmalar yaratildi:')
    console.log('   1. PAYME_TEST_001 - amount: 100000, status: pending')
    console.log('   2. PAYME_TEST_002 - amount: 100000, status: pending')
    
  } catch (err) {
    console.error('❌ Xato:', err.message)
  } finally {
    await client.close()
    console.log('🔌 MongoDB dan uzildi')
  }
}

setupPaymeTest()
