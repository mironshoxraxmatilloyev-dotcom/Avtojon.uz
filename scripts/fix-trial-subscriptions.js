/**
 * Fleet userlarning trial obuna muddatini 7 kunga tuzatish
 * 
 * Ishlatish:
 * node scripts/fix-trial-subscriptions.js
 */

require('dotenv').config({ path: 'apps/api/.env' })
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI

async function fixTrialSubscriptions() {
  try {
    console.log('🔌 MongoDB ga ulanmoqda...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ MongoDB ga ulandi\n')

    const db = mongoose.connection.db

    // Hozirgi vaqt
    const now = new Date()
    // 7 kun keyin
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // ========== USERS (FLEET) COLLECTION ==========
    console.log('📋 Fleet users collection ni tekshirmoqda...')
    
    // Trial userlarni topish (7 kundan ko'p qolgan)
    const usersToFix = await db.collection('users').find({
      'subscription.plan': 'trial',
      'subscription.endDate': { $gt: sevenDaysLater }
    }).toArray()

    console.log(`   Topildi: ${usersToFix.length} ta fleet user (7 kundan ko'p trial)`)

    if (usersToFix.length > 0) {
      // Har bir userni ko'rsatish
      for (const user of usersToFix) {
        const daysLeft = Math.ceil((new Date(user.subscription.endDate) - now) / (1000 * 60 * 60 * 24))
        console.log(`   - ${user.username}: ${daysLeft} kun qolgan`)
      }

      // Yangilash
      const userResult = await db.collection('users').updateMany(
        {
          'subscription.plan': 'trial',
          'subscription.endDate': { $gt: sevenDaysLater }
        },
        {
          $set: {
            'subscription.endDate': sevenDaysLater
          }
        }
      )
      console.log(`   ✅ ${userResult.modifiedCount} ta fleet user yangilandi`)
    } else {
      console.log('   ✅ Tuzatish kerak bo\'lgan fleet user yo\'q')
    }

    console.log('\n🎉 Fleet trial obunalar 7 kunga tuzatildi!')

  } catch (error) {
    console.error('❌ Xatolik:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 MongoDB dan uzildi')
    process.exit(0)
  }
}

fixTrialSubscriptions()
