q/**
 * VPS dagi .env konfiguratsiyasini tekshirish
 */

const API_URL = 'https://avtojon.uz/api'

async function checkVPSConfig() {
  console.log('🔍 VPS konfiguratsiyasini tekshirish...')
  console.log('')

  try {
    // 1. API health check
    console.log('1️⃣ API health check...')
    const healthRes = await fetch(`${API_URL}/health`)
    if (!healthRes.ok) throw new Error('API not responding')
    console.log('✅ API ishlayapti')

    // 2. Test endpoint yaratish (debug uchun)
    console.log('\n2️⃣ Environment variables tekshirish...')
    
    // Test so'rov - Payme auth bilan
    const testKeys = [
      's', // Eski key
      'Z#rMcx4CDrMXPN2k9q8#UPCFZEMZrm2nkgQw' // Yangi key
    ]

    for (const testKey of testKeys) {
      console.log(`\n   Test key: ${testKey.substring(0, 5)}...`)
      
      const auth = Buffer.from(`Paycom:${testKey}`).toString('base64')
      
      const res = await fetch(`${API_URL}/payments/payme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify({
          method: 'CheckPerformTransaction',
          params: {
            amount: 1000000, // Test summa
            account: { id: '507f1f77bcf86cd799439011' } // Test ObjectId
          },
          id: 1
        })
      })

      const data = await res.json()
      
      if (data.error && data.error.code === -32504) {
        console.log('   ❌ Authorization invalid - key noto\'g\'ri')
      } else if (data.error && data.error.code === -31050) {
        console.log('   ✅ Key to\'g\'ri - Payment topilmadi (kutilgan xatolik)')
      } else {
        console.log('   📦 Javob:', JSON.stringify(data, null, 2))
      }
    }

    // 3. VPS da qanday amallar bajarish kerakligini ko'rsatish
    console.log('\n📋 VPS da bajarish kerak bo\'lgan amallar:')
    console.log('')
    console.log('ssh root@avtojon.uz')
    console.log('cd /var/www/avtojon/apps/api')
    console.log('nano .env')
    console.log('')
    console.log('# Quyidagi qatorni topib o\'zgartiring:')
    console.log('PAYME_TEST_KEY=Z#rMcx4CDrMXPN2k9q8#UPCFZEMZrm2nkgQw')
    console.log('')
    console.log('# Keyin API ni restart qiling:')
    console.log('pm2 restart avtojon-api')
    console.log('')
    console.log('# Loglarni tekshiring:')
    console.log('pm2 logs avtojon-api --lines 10')

  } catch (error) {
    console.error('❌ Xatolik:', error.message)
  }
}

checkVPSConfig()