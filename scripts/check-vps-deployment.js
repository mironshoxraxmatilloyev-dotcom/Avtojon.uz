/**
 * VPS deployment holatini tekshirish
 */

const API_URL = 'https://avtojon.uz/api'

async function checkVPSDeployment() {
  console.log('🔍 VPS deployment holatini tekshirish...')
  console.log('')

  try {
    // 1. API health check
    console.log('1️⃣ API health check...')
    const healthRes = await fetch(`${API_URL}/health`)
    if (!healthRes.ok) throw new Error('API not responding')
    const healthData = await healthRes.json()
    console.log('✅ API ishlayapti:', healthData)

    // 2. Test login
    console.log('\n2️⃣ Test login...')
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+998901234567', // Test phone
        password: 'test123'
      })
    })
    
    const loginData = await loginRes.json()
    console.log('📱 Login response:', loginData.success ? '✅ Success' : '❌ Failed')

    // 3. Test flights endpoint (authentication kerak bo'lmagan)
    console.log('\n3️⃣ Test public endpoints...')
    
    // Test endpoint - public ma'lumotlar
    const testRes = await fetch(`${API_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (testRes.ok) {
      const testData = await testRes.json()
      console.log('🧪 Test endpoint:', testData)
    } else {
      console.log('⚠️  Test endpoint mavjud emas (normal)')
    }

    // 4. VPS deployment instructions
    console.log('\n📋 VPS da deployment qilish uchun:')
    console.log('')
    console.log('# 1. SSH orqali VPS ga kirish:')
    console.log('ssh root@avtojon.uz')
    console.log('')
    console.log('# 2. Loyihani yangilash:')
    console.log('cd /var/www/avtojon')
    console.log('git pull origin main')
    console.log('')
    console.log('# 3. Dependencies yangilash (agar kerak bo\'lsa):')
    console.log('npm install')
    console.log('')
    console.log('# 4. API ni restart qilish:')
    console.log('pm2 restart avtojon-api')
    console.log('')
    console.log('# 5. Loglarni tekshirish:')
    console.log('pm2 logs avtojon-api --lines 20')
    console.log('')
    console.log('# 6. PM2 holatini ko\'rish:')
    console.log('pm2 status')
    console.log('')
    console.log('# 7. Nginx holatini tekshirish:')
    console.log('systemctl status nginx')
    console.log('nginx -t  # konfiguratsiya tekshirish')

  } catch (error) {
    console.error('❌ Xatolik:', error.message)
    console.log('\n🔧 Muammolarni hal qilish:')
    console.log('')
    console.log('1. VPS da API ishlab turganini tekshiring:')
    console.log('   pm2 status')
    console.log('')
    console.log('2. API loglarini ko\'ring:')
    console.log('   pm2 logs avtojon-api')
    console.log('')
    console.log('3. Nginx konfiguratsiyasini tekshiring:')
    console.log('   nginx -t')
    console.log('   systemctl reload nginx')
    console.log('')
    console.log('4. Firewall holatini tekshiring:')
    console.log('   ufw status')
  }
}

checkVPSDeployment()