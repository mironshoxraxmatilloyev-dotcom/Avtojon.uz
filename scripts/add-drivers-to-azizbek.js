/**
 * Azizbek biznesmenga haydovchilar qo'shish script
 */

require('dotenv').config({ path: 'apps/api/.env' })
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI

async function addDriversToAzizbek() {
  try {
    console.log('🔌 MongoDB ga ulanish...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB ulandi')

    const Businessman = require('../apps/api/src/models/Businessman')
    const Driver = require('../apps/api/src/models/Driver')

    // Azizbek ni topish
    const azizbek = await Businessman.findOne({ fullName: /azizbek/i })
    if (!azizbek) {
      console.log('❌ Azizbek topilmadi!')
      return
    }

    console.log(`✅ Azizbek topildi: ${azizbek._id}`)

    // Test haydovchilar ma'lumotlari
    const testDrivers = [
      {
        fullName: 'Sardor Karimov',
        phone: '998901111111',
        licenseNumber: 'AA1234567',
        paymentType: 'per_trip',
        perTripRate: 150000,
        businessman: azizbek._id,
        isActive: true
      },
      {
        fullName: 'Bobur Toshmatov',
        phone: '998902222222', 
        licenseNumber: 'BB2345678',
        paymentType: 'salary',
        baseSalary: 3000000,
        businessman: azizbek._id,
        isActive: true
      },
      {
        fullName: 'Jasur Rahimov',
        phone: '998903333333',
        licenseNumber: 'CC3456789', 
        paymentType: 'per_trip',
        perTripRate: 200000,
        businessman: azizbek._id,
        isActive: true
      }
    ]

    console.log('\n👥 Haydovchilar qo\'shish...')

    // Mavjud haydovchilarni o'chirish (agar bor bo'lsa)
    await Driver.deleteMany({ businessman: azizbek._id })
    console.log('🗑️  Eski haydovchilar o\'chirildi')

    // Yangi haydovchilar qo'shish
    for (const driverData of testDrivers) {
      const driver = await Driver.create(driverData)
      console.log(`✅ Qo'shildi: ${driver.fullName} (${driver.phone})`)
    }

    // Jami haydovchilar sonini tekshirish
    const totalDrivers = await Driver.countDocuments({ businessman: azizbek._id })
    const totalPrice = totalDrivers * 30000

    console.log(`\n📊 Natija:`)
    console.log(`   Haydovchilar soni: ${totalDrivers}`)
    console.log(`   To'lov summasi: ${totalPrice.toLocaleString()} so'm`)
    console.log(`   (${totalDrivers} x 30,000 so'm/oy)`)

    console.log('\n🎯 Endi test qilishingiz mumkin!')
    console.log('   1. Web ga kiring va Azizbek sifatida login qiling')
    console.log('   2. Subscription blocker paydo bo\'ladi')
    console.log(`   3. To'lov summasi: ${totalPrice.toLocaleString()} so'm`)

  } catch (error) {
    console.error('❌ Xatolik:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 MongoDB ulanish yopildi')
  }
}

addDriversToAzizbek()