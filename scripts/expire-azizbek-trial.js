/**
 * Azizbek nomli biznesmenning trial muddatini tugat script
 * Bu script Azizbek userining 7 kunlik tekin muddatini tugatadi
 */

require('dotenv').config({ path: 'apps/api/.env' })
const mongoose = require('mongoose')

// MongoDB ulanish
const MONGODB_URI = process.env.MONGODB_URI

async function expireAzizbekTrial() {
  try {
    console.log('🔌 MongoDB ga ulanish...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB ulandi')

    // Businessman modelini import qilish
    const Businessman = require('../apps/api/src/models/Businessman')

    // Azizbek nomli biznesmenni topish
    console.log('\n🔍 Azizbek nomli biznesmenni qidirish...')
    
    const azizbek = await Businessman.findOne({
      $or: [
        { fullName: /azizbek/i },
        { companyName: /azizbek/i },
        { phone: { $regex: /azizbek/i } }
      ]
    })

    if (!azizbek) {
      console.log('❌ Azizbek nomli biznesmen topilmadi!')
      console.log('   Mavjud biznesmenlar:')
      
      const allBusinessmen = await Businessman.find({}, 'fullName companyName phone createdAt').limit(10)
      allBusinessmen.forEach(b => {
        console.log(`   - ${b.fullName || 'N/A'} | ${b.companyName || 'N/A'} | ${b.phone || 'N/A'} | ${b.createdAt}`)
      })
      
      return
    }

    console.log(`✅ Topildi: ${azizbek.fullName || azizbek.companyName}`)
    console.log(`   ID: ${azizbek._id}`)
    console.log(`   Telefon: ${azizbek.phone}`)
    console.log(`   Yaratilgan: ${azizbek.createdAt}`)

    // Hozirgi subscription holatini ko'rsatish
    console.log('\n📊 Hozirgi subscription holati:')
    if (azizbek.subscription) {
      console.log(`   Plan: ${azizbek.subscription.plan || 'N/A'}`)
      console.log(`   Boshlanish: ${azizbek.subscription.startDate || 'N/A'}`)
      console.log(`   Tugash: ${azizbek.subscription.endDate || 'N/A'}`)
      console.log(`   Expired: ${azizbek.subscription.isExpired || false}`)
    } else {
      console.log('   Subscription ma\'lumoti yo\'q')
    }

    // Trial muddatini tugatish
    console.log('\n⏰ Trial muddatini tugatish...')
    
    const now = new Date()
    const expiredDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 kun oldin

    azizbek.subscription = {
      plan: 'trial',
      startDate: azizbek.createdAt,
      endDate: expiredDate, // O'tmishga o'rnatish
      isExpired: true
    }

    // Registration date ni ham 8 kun oldin qilish (7 kunlik trial tugashi uchun)
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
    azizbek.createdAt = eightDaysAgo
    azizbek.registrationDate = eightDaysAgo

    await azizbek.save()

    console.log('✅ Trial muddati tugatilib qo\'yildi!')
    console.log(`   Yangi registration date: ${azizbek.createdAt}`)
    console.log(`   Yangi subscription endDate: ${azizbek.subscription.endDate}`)
    console.log(`   isExpired: ${azizbek.subscription.isExpired}`)

    // Haydovchilar sonini ko'rsatish (to'lov summasi uchun)
    const Driver = require('../apps/api/src/models/Driver')
    const driverCount = await Driver.countDocuments({ businessman: azizbek._id })
    
    console.log(`\n👥 Haydovchilar soni: ${driverCount}`)
    console.log(`💰 To'lov summasi: ${driverCount * 30000} so'm (${driverCount} x 30,000)`)

    console.log('\n🎯 Test uchun tayyor!')
    console.log('   1. Web ga kiring: http://localhost:5173')
    console.log(`   2. Azizbek sifatida login qiling: ${azizbek.phone}`)
    console.log('   3. Subscription blocker ko\'rinishi kerak')
    console.log('   4. Payme tugmasini bosing va to\'lovni test qiling')

  } catch (error) {
    console.error('❌ Xatolik:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 MongoDB ulanish yopildi')
  }
}

// Script ishga tushirish
expireAzizbekTrial()